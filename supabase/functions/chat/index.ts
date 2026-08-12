import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.28.0";

const NVIDIA_API_KEY = Deno.env.get("NVIDIA_API_KEY") || "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";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const MODEL_NAME = "nvidia/nemotron-3.5-lightning-30b-a3b";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Eager Web Search Function ---
async function executeTavilySearch(query: string, apiKey: string): Promise<{ searchSummary: string; sources: string[] }> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        max_results: 3
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Tavily API Error: ${err}`);
    }

    const data = await res.json();
    const sources: string[] = [];
    const search_results: string[] = [];
    
    if (data.results && data.results.length > 0) {
      for (const result of data.results) {
        search_results.push(`Title: ${result.title}\nURL: ${result.url}\nContent: ${result.content}`);
        sources.push(result.url);
      }
    }
    
    return {
      searchSummary: search_results.join("\n\n"),
      sources
    };
  } catch (e) {
    console.error("Web Search Error:", e);
    return { searchSummary: "", sources: [] };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, history, attachment, fileContent, deepReasoning, webSearch, model } = await req.json();

    // Authenticate user via Supabase JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    let userId = "";

    if (authHeader.startsWith("Bearer sk-proj-")) {
      const apiKey = authHeader.replace("Bearer ", "");
      const { data: keyData, error: keyError } = await adminSupabase
        .from("api_keys")
        .select("user_id")
        .eq("key_value", apiKey)
        .single();
        
      if (keyError || !keyData) throw new Error("Unauthorized: Invalid API Key");
      userId = keyData.user_id;
      adminSupabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("key_value", apiKey).then();
    } else {
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userError } = await userSupabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Unauthorized: " + (userError?.message || "User not found"));
      }
      userId = user.id;
    }

    // Fetch profile to check wallets
    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("credit_balance, credit_limit, enterprise_id")
      .eq("id", userId)
      .single();

    if (profileError || !profile) throw new Error("User profile not found");

    let activeEnterpriseId = profile.enterprise_id;
    let payingWalletBalance = profile.credit_balance;

    if (activeEnterpriseId) {
      const { data: entProfile } = await adminSupabase
        .from("profiles")
        .select("credit_balance")
        .eq("id", activeEnterpriseId)
        .single();
      if (entProfile) payingWalletBalance = entProfile.credit_balance;

      if (payingWalletBalance <= 0) {
        throw new Error("Payment Required: Enterprise wallet balance is empty.");
      }

      const { data: withinLimit, error: limitError } = await adminSupabase.rpc('check_member_limit', {
        p_user_id: userId,
        p_enterprise_id: activeEnterpriseId
      });

      if (limitError) console.error("Failed to check member limit:", limitError);
      if (withinLimit === false) {
        throw new Error("Payment Required: You have exceeded the monthly credit limit allocated by your Enterprise.");
      }
    } else {
      if (payingWalletBalance <= 0) {
        throw new Error("Payment Required: Your wallet balance is empty. Please top-up.");
      }
    }

    const currentMessages: any[] = [];
    
    // Nemotron requires strict message formatting (usually a system prompt first)
    const systemPrompt = `You are a highly intelligent and fast AI assistant. Answer completely and naturally.`;
    currentMessages.push({ role: "system", content: systemPrompt });

    if (Array.isArray(history)) {
      for (const item of history) {
        if (item.sender === "user") {
          currentMessages.push({ role: "user", content: item.text });
        } else if (item.sender === "ai" && item.id !== "welcome-msg") {
          currentMessages.push({ role: "assistant", content: item.text });
        }
      }
    }

    let finalUserMessage = message || "";
    if (fileContent) {
      finalUserMessage = `[ATTACHMENT: ${attachment}]\n${fileContent}\n\n${finalUserMessage}`;
    }

    // --- Eager Web Search Injection ---
    let searchContext = "";
    let searchSources: string[] = [];
    const tavilyKey = Deno.env.get("TAVILY_API_KEY") || "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";
    
    if (webSearch) {
      const searchRes = await executeTavilySearch(message || "", tavilyKey);
      if (searchRes.sources.length > 0) {
        searchContext = `\n\n[REAL-TIME WEB SEARCH CONTEXT]\nThe following is up-to-date information retrieved from the web to help you answer the user's query. Base your answer strictly on this information if it is relevant:\n\n${searchRes.searchSummary}\n\n[END OF WEB SEARCH CONTEXT]`;
        searchSources = searchRes.sources;
        finalUserMessage += searchContext;
      }
    }

    currentMessages.push({ role: "user", content: finalUserMessage });

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        const startTime = Date.now();
        sendEvent("status", { message: "Thinking..." });

        if (searchSources.length > 0) {
           sendEvent("searchSummary", { summary: "Retrieved real-time web sources via Tavily.", sources: searchSources });
        }

        try {
          const openai = new OpenAI({
            apiKey: NVIDIA_API_KEY,
            baseURL: NVIDIA_BASE_URL,
          });

          const streamOptions: any = {
            model: MODEL_NAME,
            messages: currentMessages,
            temperature: 1,
            top_p: 0.95,
            max_tokens: 16384,
            stream: true,
          };

          if (deepReasoning) {
             streamOptions.chat_template_kwargs = { enable_thinking: true };
             streamOptions.reasoning_budget = 16384;
          } else {
             streamOptions.chat_template_kwargs = { enable_thinking: false };
          }

          const completion = await openai.chat.completions.create(streamOptions);

          let reasoningStarted = false;
          let reasoningEnded = false;
          let finalInputTokens = 0;
          let finalOutputTokens = 0;

          for await (const chunk of completion) {
            // Capture usage if available
            if (chunk.usage) {
              finalInputTokens = chunk.usage.prompt_tokens || finalInputTokens;
              finalOutputTokens = chunk.usage.completion_tokens || finalOutputTokens;
            }

            const delta = chunk.choices?.[0]?.delta as any || {};

            // Handle Reasoning Stream
            if (delta.reasoning_content) {
              if (!reasoningStarted) {
                reasoningStarted = true;
                sendEvent("text", { chunk: "<think>\n" });
              }
              sendEvent("text", { chunk: delta.reasoning_content });
            } else if (reasoningStarted && !reasoningEnded && delta.content) {
              // Reasoning has ended, text has begun
              reasoningEnded = true;
              sendEvent("text", { chunk: "\n</think>\n\n" });
            }

            // Handle Standard Text Stream
            if (delta.content) {
              sendEvent("text", { chunk: delta.content });
            }
          }

          if (reasoningStarted && !reasoningEnded) {
             sendEvent("text", { chunk: "\n</think>\n\n" });
          }

          const latencyMs = Date.now() - startTime;
          sendEvent("done", { model: "Nemotron-3.5-30B", latency: `${latencyMs}ms` });

          if (finalInputTokens === 0) {
            finalInputTokens = Math.ceil(JSON.stringify(currentMessages).length / 4);
          }
          if (finalOutputTokens === 0) {
            finalOutputTokens = Math.ceil((Date.now() - startTime) / 20); 
          }

          // Use the Anacleto-Small pricing structure for this fast model (1€ / 2€ per M)
          const totalCost = (finalInputTokens * 1 + finalOutputTokens * 2) / 1000000;

          adminSupabase.rpc('log_token_usage', {
            p_user_id: userId,
            p_model: "Nemotron-3.5-30B",
            p_input_tokens: finalInputTokens,
            p_output_tokens: finalOutputTokens,
            p_cost: totalCost,
            p_enterprise_id: activeEnterpriseId
          }).then(({ error }) => {
            if (error) console.error("Failed to log token usage:", error);
          });

        } catch (err) {
          sendEvent("error", { message: String(err) });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", response: `Edge Error: ${String(err)}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});