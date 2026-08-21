import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.28.0";

const NVIDIA_API_KEY = Deno.env.get("NVIDIA_API_KEY") || "";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const MODEL_NAME = "nvidia/nemotron-3.5-lightning-30b-a3b";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const lessonTools: any[] = [];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { message, history, materialContent, educatorPrompt, currentLatex, title } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized: " + (userError?.message || "User not found"));

    const currentMessages: any[] = [];

    let baseSystemPrompt = `You are Anacleto AI, acting as an elite Pedagogy and Curriculum Designer.
Your task is to help the educator create a beautifully structured, comprehensive lesson plan formatted as a LaTeX document.

CRITICAL INSTRUCTIONS FOR RELIABILITY:
1. OUTPUT ONLY RAW LATEX CODE enclosed in \`\`\`latex and \`\`\` blocks. NO reasoning, NO thinking, NO preambles.
2. The lesson plan should be detailed and comprehensive. Do not cut corners.
3. You MUST start your document EXACTLY with this preamble to avoid compilation errors:
\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{margin=1in}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{calc}
\\begin{document}
4. DO NOT use any dynamic length calculations or macros that are not defined. Escape all LaTeX special characters (e.g. %, &, $, #, _, {, }).
5. You MUST close every single environment (e.g. \\begin{itemize} MUST have \\end{itemize}).
6. The document MUST ALWAYS conclude with exactly \\end{document}.
7. For ANY revisions or edits requested by the user, you MUST output the ENTIRE updated LaTeX document from start to finish.`;

    currentMessages.push({ role: "system", content: baseSystemPrompt });

    if (materialContent || educatorPrompt || title) {
      currentMessages.push({
        role: "user",
        content: `[LESSON TITLE]\n${title || 'Untitled'}\n\n[SOURCE MATERIAL]\n${materialContent || 'None provided.'}\n\n[EDUCATOR INSTRUCTIONS]\n${educatorPrompt || 'Please create a lesson plan.'}`
      });
    }

    if (Array.isArray(history)) {
      for (const item of history) {
        if (item.sender === "user") currentMessages.push({ role: "user", content: item.text });
        else if (item.sender === "ai") currentMessages.push({ role: "assistant", content: item.text });
      }
    }

    if (message) {
      currentMessages.push({ role: "user", content: message });
    }

    let activeLatex = currentLatex || "";

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        const openai = new OpenAI({ apiKey: NVIDIA_API_KEY, baseURL: NVIDIA_BASE_URL });

        try {
          let runComplete = false;
          let usedTools = new Set<string>();

          while (!runComplete) {
            const streamOptions: any = {
              model: MODEL_NAME,
              messages: currentMessages,
              temperature: 0.2,
              max_tokens: 16384,
              tools: lessonTools,
              tool_choice: "auto",
              reasoning_budget: 0,
              chat_template_kwargs: { "enable_thinking": false },
              stream: true,
            };

            const responseStream = await openai.chat.completions.create(streamOptions) as any;

            let fullContent = "";
            let toolCallsMap: Record<number, any> = {};

            for await (const chunk of responseStream) {
              const delta = chunk.choices?.[0]?.delta as any;
              if (!delta) continue;

              if (delta.content) {
                fullContent += delta.content;
                sendEvent("text", { chunk: delta.content });
              }

              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  if (!toolCallsMap[tc.index]) {
                    toolCallsMap[tc.index] = { id: tc.id, type: "function", function: { name: tc.function?.name || "", arguments: "" } };
                    sendEvent("tool_start", { name: tc.function?.name || "tool" });
                  }
                  if (tc.function?.arguments) {
                    toolCallsMap[tc.index].function.arguments += tc.function.arguments;
                  }
                }
              }
            }

            const assembledToolCalls: any[] = Object.values(toolCallsMap);

            if (assembledToolCalls.length > 0) {
              currentMessages.push({ role: "assistant", content: fullContent || null, tool_calls: assembledToolCalls });
              
              for (const toolCall of assembledToolCalls as any[]) {
                sendEvent("tool_end", { name: toolCall.function.name });
              }
            } else {
              runComplete = true;
            }
          }

          sendEvent("done", { finalLatex: activeLatex });
          controller.close();

        } catch (err) {
          console.error("OpenAI Error", err);
          sendEvent("error", { message: String(err) });
          controller.close();
        }
      }
    });

    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (err) {
    return new Response(JSON.stringify({ status: "error", response: `Edge Error: ${String(err)}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
