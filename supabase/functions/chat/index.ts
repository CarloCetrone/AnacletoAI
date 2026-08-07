// Supabase Edge Function: Real-Time Document Analysis & RunPod Chat Proxy
// Location: supabase/functions/chat/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RUNPOD_API_KEY = Deno.env.get("RUNPOD_API_KEY") || "";
const RUNPOD_ENDPOINT_ID = Deno.env.get("RUNPOD_ENDPOINT_ID") || "ywhi6e5t9yof38";
const RUNPOD_RUN_URL = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/runsync`;
const RUNPOD_RUN_ASYNC_URL = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/run`;
const RUNPOD_STREAM_URL_BASE = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/stream`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simulated Real-Time Web Search Tool (DuckDuckGo / Tavily fallback)
async function performWebSearch(query: string): Promise<string> {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    
    if (!res.ok) return "";
    const htmlText = await res.text();
    
    // Extract title & snippet matches
    const snippets: string[] = [];
    const regex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    let count = 0;
    while ((match = regex.exec(htmlText)) !== null && count < 3) {
      const cleanSnippet = match[1].replace(/<[^>]+>/g, "").trim();
      if (cleanSnippet) {
        snippets.push(`[Source ${count + 1}]: ${cleanSnippet}`);
        count++;
      }
    }

    return snippets.join("\n\n");
  } catch (e) {
    console.error("Web Search Error:", e);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, history, attachment, fileContent, webSearch, deepReasoning } = await req.json();

    if (!message && !fileContent && (!history || history.length === 0)) {
      return new Response(
        JSON.stringify({ status: "error", response: "Please enter a valid message or upload a document." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    let systemPrompt = "You are Anacleto AI, a sovereign enterprise foundation model (Anacleto-120B-Omni). Provide concise, highly technical, intelligent, and accurate responses.";

    if (deepReasoning) {
      systemPrompt += " Activate deep step-by-step reasoning. Output your internal chain-of-thought enclosed inside `<think>`...`</think>` tags before giving your final answer.";
    }

    if (fileContent) {
      systemPrompt += " When analyzing attached files, reference specific data lines and code blocks in your answer.";
    }

    const apiMessages = [{ role: "system", content: systemPrompt }];

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

    // Execute Live Web Search if enabled by user
    if (webSearch && userContent) {
      const webResults = await performWebSearch(userContent);
      if (webResults) {
        userContent = `[LIVE WEB SEARCH RESULTS FOR: "${userContent}"]\n${webResults}\n\nUser Question: ${userContent}`;
      }
    }

    // Inject document text context
    if (fileContent) {
      userContent = `[ATTACHED FILE CONTEXT: "${attachment || "document"}"]\n--- BEGIN FILE CONTENT ---\n${fileContent}\n--- END FILE CONTENT ---\n\nUser Question/Instruction: ${userContent || "Please analyze the attached document."}`;
    } else if (attachment && !webSearch) {
      userContent = `[Attached File: ${attachment}]\n${userContent}`;
    }

    if (userContent && (apiMessages.length === 1 || apiMessages[apiMessages.length - 1].content !== userContent)) {
      apiMessages.push({ role: "user", content: userContent });
    }

    const startTime = Date.now();

    // 1. Synchronous RunPod Call
    const runpodPayload = {
      input: {
        messages: apiMessages,
        sampling_params: {
          max_tokens: deepReasoning ? 2048 : 1536,
          temperature: deepReasoning ? 0.4 : 0.6,
        },
      },
    };

    const syncRes = await fetch(RUNPOD_RUN_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RUNPOD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(runpodPayload),
    });

    const latencyMs = Date.now() - startTime;

    if (syncRes.ok) {
      const syncData = await syncRes.json();
      
      if (syncData.status === "COMPLETED" && syncData.output) {
        let textOutput = "";

        if (typeof syncData.output === "string") {
          textOutput = syncData.output;
        } else if (Array.isArray(syncData.output)) {
          for (const item of syncData.output) {
            if (typeof item === "string") {
              textOutput += item;
            } else if (item.choices?.[0]?.message?.content) {
              textOutput += item.choices[0].message.content;
            } else if (item.choices?.[0]?.tokens) {
              textOutput += item.choices[0].tokens.join("");
            }
          }
        } else if (syncData.output.choices?.[0]?.message?.content) {
          textOutput = syncData.output.choices[0].message.content;
        } else if (syncData.output.choices?.[0]?.tokens) {
          textOutput = syncData.output.choices[0].tokens.join("");
        }

        if (textOutput) {
          return new Response(
            JSON.stringify({
              status: "success",
              response: textOutput,
              model: "Anacleto-120B-Omni",
              latency: `${latencyMs}ms`,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
      }
    }

    // 2. Async Fallback
    const asyncRes = await fetch(RUNPOD_RUN_ASYNC_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RUNPOD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          messages: apiMessages,
          stream: true,
          sampling_params: {
            max_tokens: deepReasoning ? 2048 : 1536,
            temperature: deepReasoning ? 0.4 : 0.6,
          },
        },
      }),
    });

    const asyncData = await asyncRes.json();
    const jobId = asyncData.id;

    if (!jobId) {
      return new Response(
        JSON.stringify({ status: "error", response: "Failed to schedule inference job." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    let collectedText = "";
    let isCompleted = false;
    let retries = 0;
    const maxRetries = 60;

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
            const output = item.output;
            if (typeof output === "string") {
              collectedText += output;
            } else if (Array.isArray(output)) {
              for (const entry of output) {
                if (entry.choices?.[0]?.tokens) {
                  collectedText += entry.choices[0].tokens.join("");
                } else if (typeof entry === "string") {
                  collectedText += entry;
                }
              }
            } else if (output?.choices?.[0]?.tokens) {
              collectedText += output.choices[0].tokens.join("");
            }
          }

          if (status === "COMPLETED" || status === "FAILED") {
            isCompleted = true;
            break;
          }
        }
      } catch (e) {
        console.error("Stream polling error:", e);
      }

      await new Promise((r) => setTimeout(r, 200));
    }

    const finalLatency = Date.now() - startTime;

    if (collectedText) {
      return new Response(
        JSON.stringify({
          status: "success",
          response: collectedText,
          model: "Anacleto-120B-Omni",
          latency: `${finalLatency}ms`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ status: "error", response: "Inference engine returned empty response." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", response: `Edge Stream Error: ${String(err)}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
