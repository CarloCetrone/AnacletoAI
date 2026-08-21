import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const MODEL_NAME = "nvidia/nemotron-3.5-lightning-30b-a3b"; 

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, lessonId, studentUsername } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    // Note: since this is in NextJS and we need admin access, we assume NEXT_PUBLIC_SUPABASE_ANON_KEY is used or we define SUPABASE_SERVICE_ROLE_KEY
    // The previous code used Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), we'll use process.env.SUPABASE_SERVICE_ROLE_KEY or anon if not available
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the lesson plan
    const { data: lesson, error: lessonError } = await adminSupabase
      .from("lessons")
      .select("generated_plan, title, status")
      .eq("id", lessonId)
      .single();

    if (lessonError || !lesson) throw new Error("Lesson not found");
    if (lesson.status !== "published") throw new Error("Lesson is not published yet");

    // Fetch or create the student session
    let sessionData = null;
    if (sessionId) {
      const { data } = await adminSupabase.from("student_sessions").select("*").eq("id", sessionId).single();
      sessionData = data;
    }

    let chatHistory = sessionData ? (sessionData.chat_history || []) : [];
    
    const currentMessages: any[] = [];
    
    let baseSystemPrompt = `You are Anacleto AI, acting as a strict but encouraging pedagogical tutor.
Your task is to guide the student (${studentUsername}) through the lesson plan provided below.

CRITICAL INSTRUCTIONS:
1. NEVER give direct answers to questions that the student should solve. Use the Socratic method to guide them.
2. Follow the sequence of the provided lesson plan. Do not dump all the information at once. Take it step-by-step.
3. Be encouraging and adapt your tone to a tutoring context.
4. Use markdown formatting for clarity.

[LESSON PLAN (STRICTLY ADHERE TO THIS STRUCTURE)]
${lesson.generated_plan}
`;

    currentMessages.push({ role: "system", content: baseSystemPrompt });

    for (const item of chatHistory) {
      if (item.sender === "student") currentMessages.push({ role: "user", content: item.text });
      else if (item.sender === "tutor") currentMessages.push({ role: "assistant", content: item.text });
    }

    if (message) {
       currentMessages.push({ role: "user", content: message });
    }

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
          const streamOptions: any = {
            model: MODEL_NAME,
            messages: currentMessages,
            temperature: 0.5,
            max_tokens: 4096,
            stream: true,
          };

          const responseStream = await openai.chat.completions.create(streamOptions) as any;
          
          let fullContent = "";

          for await (const chunk of responseStream) {
             const delta = chunk.choices?.[0]?.delta as any;
             if (!delta) continue;

             if (delta.content) {
                fullContent += delta.content;
                sendEvent("text", { chunk: delta.content });
             }
          }

          // Save to database
          if (sessionId && message) {
             chatHistory.push({ sender: "student", text: message });
             chatHistory.push({ sender: "tutor", text: fullContent });
             await adminSupabase.from("student_sessions").update({ chat_history: chatHistory }).eq("id", sessionId);
          }

          sendEvent("done", { complete: true });
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
