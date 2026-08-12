import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.28.0";

const NVIDIA_API_KEY = Deno.env.get("NVIDIA_API_KEY") || "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";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
// Reverted back to Nemotron as requested
const MODEL_NAME = "nvidia/nemotron-3.5-lightning-30b-a3b"; 

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Tool Helper Functions ---

async function executeTavilySearch(query: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, query, search_depth: "basic", max_results: 3 })
    });
    if (!res.ok) throw new Error(`Tavily API Error: ${await res.text()}`);
    const data = await res.json();
    return JSON.stringify(data.results || []);
  } catch (e) {
    console.error("Web Search Error:", e);
    return JSON.stringify({ error: String(e) });
  }
}

async function executeGenerateImage(prompt: string, apiKey: string): Promise<any> {
  const invokeUrl = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b";
  try {
    const res = await fetch(invokeUrl, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        width: 1024,
        height: 1024,
        seed: Math.floor(Math.random() * 100000),
        steps: 4
      })
    });
    if (!res.ok) throw new Error(`Image Gen Error: ${await res.text()}`);
    return await res.json();
  } catch (e) {
    console.error("Image Gen Error:", e);
    return { error: String(e) };
  }
}

async function executeGenerate3DModel(prompt: string, apiKey: string): Promise<any> {
  const invokeUrl = "https://ai.api.nvidia.com/v1/genai/microsoft/trellis";
  try {
    const res = await fetch(invokeUrl, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt
      })
    });
    if (!res.ok) throw new Error(`3D Gen Error: ${await res.text()}`);
    return await res.json();
  } catch (e) {
    console.error("3D Gen Error:", e);
    return { error: String(e) };
  }
}

// --- OpenAI Tools Definition ---
const chatTools: any[] = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for up-to-date information.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "The search query." } },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "Generate an image using Flux based on a detailed prompt.",
      parameters: {
        type: "object",
        properties: { prompt: { type: "string", description: "Detailed visual description of the image." } },
        required: ["prompt"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_3d_model",
      description: "Generate a 3D model asset (GLB/GLTF) based on a description.",
      parameters: {
        type: "object",
        properties: { prompt: { type: "string", description: "Description of the 3D object to generate." } },
        required: ["prompt"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_latex",
      description: "Generate raw LaTeX code for a document or Beamer slideshow. Returns the LaTeX string that will be compiled on the client side.",
      parameters: {
        type: "object",
        properties: { 
          latex_code: { type: "string", description: "The complete, raw LaTeX code." },
          is_slideshow: { type: "boolean", description: "Whether this is a Beamer presentation." }
        },
        required: ["latex_code", "is_slideshow"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { message, history, attachment, fileContent, deepReasoning, webSearch, imageGen, model3D, pdfGen, slideshowGen, model } = await req.json();

    // Authenticate user via Supabase JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const tavilyKey = Deno.env.get("TAVILY_API_KEY") || "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";

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    let userId = "";

    if (authHeader.startsWith("Bearer sk-proj-")) {
      const apiKey = authHeader.replace("Bearer ", "");
      const { data: keyData, error: keyError } = await adminSupabase.from("api_keys").select("user_id").eq("key_value", apiKey).single();
      if (keyError || !keyData) throw new Error("Unauthorized: Invalid API Key");
      userId = keyData.user_id;
      adminSupabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("key_value", apiKey).then();
    } else {
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: { user }, error: userError } = await userSupabase.auth.getUser();
      if (userError || !user) throw new Error("Unauthorized: " + (userError?.message || "User not found"));
      userId = user.id;
    }

    // Verify Credits
    const { data: profile } = await adminSupabase.from("profiles").select("credit_balance, enterprise_id").eq("id", userId).single();
    if (!profile) throw new Error("User profile not found");
    if (profile.credit_balance <= 0 && !profile.enterprise_id) throw new Error("Payment Required: Wallet empty.");

    const currentMessages: any[] = [];
    
    let baseSystemPrompt = "You are an advanced AI assistant.";
    if (webSearch) baseSystemPrompt += "\n- You have a 'web_search' tool to search the internet.";
    if (imageGen) baseSystemPrompt += "\n- You have a 'generate_image' tool to create images.";
    if (model3D) baseSystemPrompt += "\n- You have a 'generate_3d_model' tool to create 3D assets.";
    if (pdfGen) baseSystemPrompt += "\n- You have a 'generate_latex' tool to write LaTeX code for documents.";
    if (slideshowGen) baseSystemPrompt += "\n- You have a 'generate_latex' tool to write Beamer slideshows.";
    if (deepReasoning) baseSystemPrompt += "\n- You MUST think step by step before answering. Wrap your reasoning in <thought>...</thought> XML tags.";
    
    currentMessages.push({ role: "system", content: baseSystemPrompt });

    if (Array.isArray(history)) {
      for (const item of history) {
        if (item.sender === "user") currentMessages.push({ role: "user", content: item.text });
        else if (item.sender === "ai" && item.id !== "welcome-msg") currentMessages.push({ role: "assistant", content: item.text });
      }
    }

    let finalUserMessage = message || "";
    if (fileContent) {
      finalUserMessage = `[ATTACHED FILE CONTENT: ${attachment}]\n${fileContent}\n\n[USER MESSAGE]\n${finalUserMessage}`;
    }
    currentMessages.push({ role: "user", content: finalUserMessage });

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        const startTime = Date.now();
        const openai = new OpenAI({ apiKey: NVIDIA_API_KEY, baseURL: NVIDIA_BASE_URL });

        try {
          let runComplete = false;
          let finalInputTokens = 0;
          let finalOutputTokens = 0;
          
          while (!runComplete) {
            const activeTools = chatTools.filter(t => {
              if (t.function.name === "web_search" && webSearch) return true;
              if (t.function.name === "generate_image" && imageGen) return true;
              if (t.function.name === "generate_3d_model" && model3D) return true;
              if (t.function.name === "generate_latex" && (pdfGen || slideshowGen)) return true;
              return false;
            });

            const streamOptions: any = {
              model: MODEL_NAME,
              messages: currentMessages,
              temperature: 0.7,
              max_tokens: 4096,
              tools: activeTools.length > 0 ? activeTools : undefined,
              tool_choice: activeTools.length > 0 ? "auto" : undefined,
              stream: false, // For simpler tool loop, we do non-streaming rounds until final response
            };

            const response = await openai.chat.completions.create(streamOptions);
            const message = response.choices[0].message;
            
            if (response.usage) {
              finalInputTokens += response.usage.prompt_tokens;
              finalOutputTokens += response.usage.completion_tokens;
            }

            if (message.tool_calls && message.tool_calls.length > 0) {
              currentMessages.push(message); // append assistant message with tool_calls
              
              for (const toolCall of message.tool_calls) {
                const args = JSON.parse(toolCall.function.arguments);
                let toolResultStr = "";

                sendEvent("tool_start", { name: toolCall.function.name, args });

                if (toolCall.function.name === "web_search") {
                  toolResultStr = await executeTavilySearch(args.query, tavilyKey);
                  sendEvent("searchSummary", { summary: `Web search executed for "${args.query}"`, sources: [] });
                } else if (toolCall.function.name === "generate_image") {
                  const res = await executeGenerateImage(args.prompt, NVIDIA_API_KEY);
                  toolResultStr = JSON.stringify(res);
                  
                  const b64 = res.artifacts?.[0]?.base64 || res.image || (res.data && res.data[0] && res.data[0].b64_json);
                  if (b64) {
                     sendEvent("image_generated", { base64: b64 });
                  }
                } else if (toolCall.function.name === "generate_3d_model") {
                  const res = await executeGenerate3DModel(args.prompt, NVIDIA_API_KEY);
                  toolResultStr = JSON.stringify(res);
                  
                  const b64 = res.artifacts?.[0]?.base64;
                  sendEvent("model_3d_generated", { result: b64 || res });
                } else if (toolCall.function.name === "generate_latex") {
                  toolResultStr = "LaTeX generated successfully. It will be compiled by the client.";
                  sendEvent("latex_generated", { code: args.latex_code, isSlideshow: args.is_slideshow });
                }

                currentMessages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  name: toolCall.function.name,
                  content: toolResultStr,
                });
                
                sendEvent("tool_end", { name: toolCall.function.name });
              }
            } else {
              // No more tool calls, stream final response
              runComplete = true;
              
              // We could do a final streaming call here to stream the text to the user,
              // but since we already got the message in this non-streaming chunk, we'll just send it.
              // A better UX would be to switch back to stream: true for the final response.
              
              // Let's do a final streaming call for the actual text response if it was empty, 
              // but if the model already responded with text, we stream it directly.
              if (message.content) {
                 sendEvent("text", { chunk: message.content });
              }
            }
          }

          const latencyMs = Date.now() - startTime;
          sendEvent("done", { model: MODEL_NAME, latency: `${latencyMs}ms` });

          const totalCost = (finalInputTokens * 1 + finalOutputTokens * 2) / 1000000;
          adminSupabase.rpc('log_token_usage', {
            p_user_id: userId,
            p_model: MODEL_NAME,
            p_input_tokens: finalInputTokens,
            p_output_tokens: finalOutputTokens,
            p_cost: totalCost,
            p_enterprise_id: profile.enterprise_id
          }).catch(console.error);

        } catch (err) {
           console.error("OpenAI Error", err);
           sendEvent("error", { message: String(err) });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (err) {
    return new Response(JSON.stringify({ status: "error", response: `Edge Error: ${String(err)}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});