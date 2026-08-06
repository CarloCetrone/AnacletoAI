// Supabase Edge Function: Real-Time Streaming RunPod Chat Proxy
// Location: supabase/functions/chat/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RUNPOD_API_KEY = Deno.env.get("RUNPOD_API_KEY") || "";
const RUNPOD_ENDPOINT_ID = Deno.env.get("RUNPOD_ENDPOINT_ID") || "ywhi6e5t9yof38";
const RUNPOD_RUN_URL = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/run`;
const RUNPOD_STREAM_URL_BASE = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/stream`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, history, attachment } = await req.json();

    if (!message && (!history || history.length === 0)) {
      return new Response(
        JSON.stringify({ status: "error", response: "Please enter a valid message." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const apiMessages = [
      {
        role: "system",
        content: "You are a helpful, smart, and concise AI assistant.",
      },
    ];

    if (Array.isArray(history)) {
      for (const item of history) {
        if (item.sender === "user") {
          apiMessages.push({ role: "user", content: item.text });
        } else if (item.sender === "ai" && item.id !== "welcome-msg") {
          apiMessages.push({ role: "assistant", content: item.text });
        }
      }
    }

    let userContent = message || "";
    if (attachment) {
      userContent = `[Attached File: ${attachment}]\n${userContent}`;
    }

    if (userContent && (apiMessages.length === 1 || apiMessages[apiMessages.length - 1].content !== userContent)) {
      apiMessages.push({ role: "user", content: userContent });
    }

    // Initiate streaming request to RunPod
    const runpodPayload = {
      input: {
        messages: apiMessages,
        stream: true,
        sampling_params: {
          max_tokens: 512,
          temperature: 0.7,
        },
      },
    };

    const startRes = await fetch(RUNPOD_RUN_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RUNPOD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(runpodPayload),
    });

    const startData = await startRes.json();
    const jobId = startData.id;

    if (!jobId) {
      return new Response(
        JSON.stringify({ status: "error", response: `Failed to initiate RunPod stream job: ${JSON.stringify(startData)}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Create ReadableStream to proxy SSE tokens to client in real-time
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let isCompleted = false;
        let retries = 0;
        const maxRetries = 100; // max ~30 seconds of polling

        while (!isCompleted && retries < maxRetries) {
          retries++;
          try {
            const streamRes = await fetch(`${RUNPOD_STREAM_URL_BASE}/${jobId}`, {
              headers: {
                "Authorization": `Bearer ${RUNPOD_API_KEY}`,
              },
            });

            if (streamRes.ok) {
              const streamData = await streamRes.json();
              const status = streamData.status;
              const streamItems = streamData.stream || [];

              for (const item of streamItems) {
                let tokenChunk = "";
                const output = item.output;

                if (typeof output === "string") {
                  tokenChunk = output;
                } else if (Array.isArray(output)) {
                  for (const entry of output) {
                    if (entry.choices?.[0]?.tokens) {
                      tokenChunk += entry.choices[0].tokens.join("");
                    }
                  }
                } else if (output?.choices?.[0]?.tokens) {
                  tokenChunk = output.choices[0].tokens.join("");
                }

                if (tokenChunk) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: tokenChunk })}\n\n`));
                }
              }

              if (status === "COMPLETED") {
                isCompleted = true;
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                controller.close();
                break;
              } else if (status === "FAILED") {
                isCompleted = true;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "RunPod job failed" })}\n\n`));
                controller.close();
                break;
              }
            }
          } catch (e) {
            console.error("Stream polling error:", e);
          }

          // Wait 150ms before polling next stream batch
          await new Promise((r) => setTimeout(r, 150));
        }

        if (!isCompleted) {
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", response: `Edge Stream Error: ${String(err)}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
