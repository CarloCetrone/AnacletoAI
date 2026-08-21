import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const MODEL_NAME = "nvidia/nemotron-3.5-lightning-30b-a3b"; 

const lessonTools = [
  {
    type: "function",
    function: {
      name: "generate_lesson_latex",
      description: "Generate the initial full LaTeX code for a structured lesson document. Use this to create the first draft of the lesson. Use standard packages (article). Ensure all math blocks and environments are valid and closed.",
      parameters: {
        type: "object",
        properties: { 
          latex_code: { type: "string", description: "The complete, syntactically correct, and raw LaTeX code." }
        },
        required: ["latex_code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "modify_latex_section",
      description: "Apply a modification to the existing LaTeX code by replacing a specific string (target_text) with a new string (new_text). Use this instead of rewriting the entire document to fix mistakes, add content, or refine sections based on educator feedback.",
      parameters: {
        type: "object",
        properties: { 
          target_text: { type: "string", description: "The exact existing text or code block in the current LaTeX document that needs to be replaced. Must match exactly." },
          new_text: { type: "string", description: "The new text or code block that will replace the target_text." }
        },
        required: ["target_text", "new_text"]
      }
    }
  }
];

export async function POST(req: NextRequest) {
  try {
    const { message, history, materialContent, educatorPrompt, currentLatex } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized: " + (userError?.message || "User not found"));

    const currentMessages: any[] = [];
    
    // Improved System Prompt to reduce broken latex and increase speed
    let baseSystemPrompt = `You are Anacleto AI, acting as an elite Pedagogy and Curriculum Designer.
Your task is to help the educator create a beautifully structured, comprehensive lesson plan formatted as a LaTeX document.

INSTRUCTIONS:
1. Review the provided source material and the educator's prompt.
2. Use the 'generate_lesson_latex' tool to create the initial LaTeX document. It must be an 'article' class and include theory sections, examples, and practice questions. ALWAYS escape special characters properly in LaTeX. Keep it relatively short and well-formatted to avoid generation timeouts.
3. If the educator asks for revisions, DO NOT use 'generate_lesson_latex' again. Instead, use the 'modify_latex_section' tool to surgically replace the specific text or section they want changed.
4. Keep your conversational responses very short and concise (1-2 sentences). Do NOT output LaTeX in your conversational text, ONLY via the tools.`;

    currentMessages.push({ role: "system", content: baseSystemPrompt });

    if (materialContent || educatorPrompt) {
       currentMessages.push({ 
           role: "user", 
           content: `[SOURCE MATERIAL]\n${materialContent || 'None provided.'}\n\n[EDUCATOR INSTRUCTIONS]\n${educatorPrompt || 'Please create a lesson plan.'}` 
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

        try {
          if (!NVIDIA_API_KEY) {
             throw new Error("NVIDIA_API_KEY is missing from environment variables. Please add it to .env.local to use the AI generation.");
          }
          const openai = new OpenAI({ apiKey: NVIDIA_API_KEY, baseURL: NVIDIA_BASE_URL });
          let runComplete = false;
          
          while (!runComplete) {
            const streamOptions: any = {
              model: MODEL_NAME,
              messages: currentMessages,
              temperature: 0.3, // Lower temp for more stable LaTeX
              max_tokens: 2048, // Limit max tokens to make it faster and prevent timeouts
              tools: lessonTools,
              tool_choice: "auto",
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
                let args;
                try {
                   args = JSON.parse(toolCall.function.arguments);
                } catch(e) {
                   args = {};
                }
                
                let toolResultStr = "";
                sendEvent("tool_start", { name: toolCall.function.name, args });

                if (toolCall.function.name === "generate_lesson_latex") {
                  activeLatex = args.latex_code;
                  toolResultStr = "LaTeX document generated successfully.";
                  sendEvent("latex_updated", { latex: activeLatex });
                } else if (toolCall.function.name === "modify_latex_section") {
                  if (!activeLatex) {
                     toolResultStr = "Error: There is no existing LaTeX document to modify. Please generate it first.";
                  } else if (args.target_text && activeLatex.includes(args.target_text)) {
                     activeLatex = activeLatex.replace(args.target_text, args.new_text);
                     toolResultStr = "Modification applied successfully.";
                     sendEvent("latex_updated", { latex: activeLatex });
                  } else {
                     toolResultStr = "Error: 'target_text' was not found exactly in the current LaTeX document. Please try again with a more precise target_text.";
                  }
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

    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" } });
  } catch (err) {
    return new Response(JSON.stringify({ status: "error", response: `API Error: ${String(err)}` }), { headers: { "Content-Type": "application/json" }, status: 500 });
  }
}
