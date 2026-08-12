import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NVIDIA_API_KEY = Deno.env.get("NVIDIA_API_KEY") || "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";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const MODEL_NAME = "nvidia/nemotron-3.5-lightning-30b-a3b";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, history, attachment, fileContent, deepReasoning } = await req.json();

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
    currentMessages.push({ role: "user", content: finalUserMessage });

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        const startTime = Date.now();
        sendEvent("status", { message: "Thinking..." });

        try {
          const requestBody: any = {
            model: MODEL_NAME,
            messages: currentMessages,
            temperature: 1,
            top_p: 0.95,
            max_tokens: 16384,
            stream: true,
          };

          if (deepReasoning) {
             requestBody.extra_body = {
                chat_template_kwargs: { enable_thinking: true },
                reasoning_budget: 16384
             };
          } else {
             requestBody.extra_body = {
                chat_template_kwargs: { enable_thinking: false }
             };
          }

          const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${NVIDIA_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Nvidia API Error: ${response.status} ${errText}`);
          }
          if (!response.body) throw new Error("No response body from Nvidia API");

          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let buffer = "";
          
          let reasoningStarted = false;
          let reasoningEnded = false;
          
          let finalInputTokens = 0;
          let finalOutputTokens = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith("data: ") && trimmedLine !== "data: [DONE]") {
                try {
                  const parsed = JSON.parse(trimmedLine.slice(6));
                  
                  // Capture token usage if available in stream
                  if (parsed.usage) {
                     finalInputTokens = parsed.usage.prompt_tokens || finalInputTokens;
                     finalOutputTokens = parsed.usage.completion_tokens || finalOutputTokens;
                  }

                  const delta = parsed.choices?.[0]?.delta || {};
                  
                  // Handle Reasoning Stream via extra_body format
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
                  
                } catch (e) {
                   // ignore partial json
                }
              }
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