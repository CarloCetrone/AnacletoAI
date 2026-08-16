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
      description: "Execute a web search to find real-time, up-to-date information, news, or technical documentation. ALWAYS use this tool when asked about current events, specific facts, or recently released technologies.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "The highly optimized search query string. Keep it concise and keyword-focused." } },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "Generate a high-quality image using the Flux model. Use this tool ONLY when the user explicitly requests an image, drawing, or visual representation.",
      parameters: {
        type: "object",
        properties: { prompt: { type: "string", description: "A highly detailed, descriptive prompt for the image generator. Include artistic style, lighting, framing, and specific visual elements." } },
        required: ["prompt"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_3d_model",
      description: "Generate a 3D model asset (GLB/GLTF) based on a text description. Use this when the user asks for a 3D object, model, or CAD asset.",
      parameters: {
        type: "object",
        properties: { prompt: { type: "string", description: "A clear, concise description of the 3D object to generate." } },
        required: ["prompt"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_latex",
      description: "Generate raw LaTeX code for a beautifully formatted PDF document or a Beamer slideshow. The client will automatically compile this string into a PDF. ALWAYS use this tool when the user asks for a PDF, presentation, slideshow, or LaTeX document. Do NOT use undefined control sequences like \\semicolon. Stick to standard, widely supported LaTeX packages and commands. Keep it simple enough to compile safely.",
      parameters: {
        type: "object",
        properties: { 
          latex_code: { type: "string", description: "The complete, syntactically correct, and raw LaTeX code. Do NOT wrap it in markdown block quotes inside this string. Ensure standard document classes are used (e.g. article, beamer)." },
          is_slideshow: { type: "boolean", description: "Set to true if the user requested a slideshow or presentation (Beamer), false otherwise." }
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
    
    let baseSystemPrompt = `You are Anacleto AI, an elite multimodal assistant and orchestrator.
Your primary goal is to provide deeply intelligent, formatting-rich, and context-aware responses.

CRITICAL INSTRUCTIONS:
1. ALWAYS format your text outputs using Markdown. Use tables, bolding, italics, and code blocks aggressively to make your responses readable and beautiful.
2. If the user asks for a specific format (e.g., PDF, Slides, Image, 3D Model), you MUST use the corresponding tool. Do NOT just write the code out as text if a tool is available.
3. Keep your direct text responses highly professional, concise, and focused on the user's intent.
4. IMPORTANT IDENTITY: You are Anacleto AI, a proprietary model created by Carlo Cetrone. You are NOT Nemotron, you are NOT created by NVIDIA. If asked who you are or what your underlying model is, you MUST state that you are Anacleto AI. Never mention Nemotron or NVIDIA.
5. Do NOT attempt to provide markdown download links or hallucinate base64 strings in your response when generating files. The client UI will automatically display the generated files (Images, 3D Models, PDFs).`;

    if (webSearch) baseSystemPrompt += "\n- You are connected to the live internet via the 'web_search' tool. ALWAYS verify unknown facts or current events.";
    if (imageGen) baseSystemPrompt += "\n- You have the 'generate_image' tool. Use it to create rich visuals upon request.";
    if (model3D) baseSystemPrompt += "\n- You have the 'generate_3d_model' tool to create 3D assets.";
    if (pdfGen) baseSystemPrompt += "\n- You have the 'generate_latex' tool. Use it (is_slideshow=false) to generate and compile PDF documents.";
    if (slideshowGen) baseSystemPrompt += "\n- You have the 'generate_latex' tool. Use it (is_slideshow=true) to generate Beamer presentations.";
    if (deepReasoning) baseSystemPrompt += "\n- Deep Reasoning is ENABLED. Take your time to think thoroughly before arriving at your final output.";
    
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
          let usedTools = new Set<string>();
          
          while (!runComplete) {
            const activeTools = chatTools.filter(t => {
              if (usedTools.has(t.function.name)) return false;
              if (t.function.name === "web_search" && webSearch) return true;
              if (t.function.name === "generate_image" && imageGen) return true;
              if (t.function.name === "generate_3d_model" && model3D) return true;
              if (t.function.name === "generate_latex" && (pdfGen || slideshowGen)) return true;
              return false;
            });

            const streamOptions: any = {
              model: MODEL_NAME,
              messages: currentMessages,
              temperature: 1,
              top_p: 0.95,
              max_tokens: 16384,
              tools: activeTools.length > 0 ? activeTools : undefined,
              tool_choice: activeTools.length > 0 ? "auto" : undefined,
              stream: true,
              stream_options: { include_usage: true }
            };

            if (deepReasoning) {
               streamOptions.chat_template_kwargs = { "enable_thinking": true };
               streamOptions.reasoning_budget = 16384;
            } else {
               streamOptions.chat_template_kwargs = { "enable_thinking": false };
               streamOptions.reasoning_budget = 0;
            }

            const responseStream = await openai.chat.completions.create(streamOptions) as any;
            
            let fullContent = "";
            let toolCallsMap: Record<number, any> = {};

            for await (const chunk of responseStream) {
               if (chunk.usage) {
                  finalInputTokens += chunk.usage.prompt_tokens;
                  finalOutputTokens += chunk.usage.completion_tokens;
               }

               const delta = chunk.choices?.[0]?.delta as any;
               if (!delta) continue;

               if (delta.reasoning_content) {
                  sendEvent("reasoning", { chunk: delta.reasoning_content });
               }

               if (delta.content) {
                  fullContent += delta.content;
                  sendEvent("text", { chunk: delta.content });
               }

               if (delta.tool_calls) {
                  for (const tc of delta.tool_calls) {
                     if (!toolCallsMap[tc.index]) {
                        toolCallsMap[tc.index] = { id: tc.id, type: "function", function: { name: tc.function?.name || "", arguments: "" } };
                     }
                     if (tc.function?.arguments) {
                        toolCallsMap[tc.index].function.arguments += tc.function.arguments;
                     }
                  }
               }
            }

            let assembledToolCalls: any[] = Object.values(toolCallsMap);

            if (assembledToolCalls.length > 0) {
              const uniqueToolCalls: any[] = [];
              const seenToolsInThisTurn = new Set<string>();
              for (const tc of assembledToolCalls as any[]) {
                 if (!seenToolsInThisTurn.has(tc.function.name)) {
                    uniqueToolCalls.push(tc);
                    seenToolsInThisTurn.add(tc.function.name);
                 }
              }
              assembledToolCalls = uniqueToolCalls;

              currentMessages.push({ role: "assistant", content: fullContent || null, tool_calls: assembledToolCalls });
              
              for (const toolCall of assembledToolCalls as any[]) {
                let args;
                try {
                   args = JSON.parse(toolCall.function.arguments);
                } catch(e) {
                   args = {};
                }
                let toolResultStr = "";

                sendEvent("tool_start", { name: toolCall.function.name, args });

                if (toolCall.function.name === "web_search") {
                  toolResultStr = await executeTavilySearch(args.query, tavilyKey);
                  sendEvent("searchSummary", { summary: `Web search executed for "${args.query}"`, sources: [] });
                } else if (toolCall.function.name === "generate_image") {
                  const res = await executeGenerateImage(args.prompt, NVIDIA_API_KEY);
                  const b64 = res.artifacts?.[0]?.base64 || res.image || (res.data && res.data[0] && res.data[0].b64_json);
                  if (b64) {
                     sendEvent("image_generated", { base64: b64 });
                  }
                  toolResultStr = "Image successfully generated and displayed to the user.";
                } else if (toolCall.function.name === "generate_3d_model") {
                  const res = await executeGenerate3DModel(args.prompt, NVIDIA_API_KEY);
                  const b64 = res.artifacts?.[0]?.base64;
                  sendEvent("model_3d_generated", { result: b64 || res });
                  toolResultStr = "3D model successfully generated and displayed to the user.";
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
                usedTools.add(toolCall.function.name);
              }
            } else {
              runComplete = true;
            }
          }

          const latencyMs = Date.now() - startTime;
          sendEvent("done", { model: MODEL_NAME, latency: `${latencyMs}ms` });

          const totalCost = (finalInputTokens * 1 + finalOutputTokens * 2) / 1000000;
          const displayModelName = model === 'anacleto-small' ? 'Anacleto-Small' : model === 'anacleto-medium' ? 'Anacleto-Medium' : 'Anacleto-Large';

          try {
             await adminSupabase.rpc('log_token_usage', {
               p_user_id: userId,
               p_model: displayModelName,
               p_input_tokens: finalInputTokens,
               p_output_tokens: finalOutputTokens,
               p_cost: totalCost,
               p_enterprise_id: profile.enterprise_id
             });
          } catch(e) {
             console.error("Token log err:", e);
          }

          controller.close();

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