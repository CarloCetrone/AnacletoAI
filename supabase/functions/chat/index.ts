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

// High-Precision Real-Time Search Engine (Wikipedia API + DuckDuckGo JSON API)
async function performWebSearch(query: string): Promise<string> {
  try {
    const snippets: string[] = [];

    // 1. Query Wikipedia API
    const wikiUrl = `https://it.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const wikiRes = await fetch(wikiUrl);
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const results = wikiData.query?.search || [];
      for (let i = 0; i < Math.min(2, results.length); i++) {
        const cleanSnippet = results[i].snippet.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').trim();
        snippets.push(`[Wikipedia: ${results[i].title}]: ${cleanSnippet}`);
      }
    }

    // 2. Query DuckDuckGo Instant Answer API
    const ddgApiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
    const ddgRes = await fetch(ddgApiUrl);
    if (ddgRes.ok) {
      const ddgJson = await ddgRes.json();
      if (ddgJson.AbstractText) {
        snippets.push(`[Web Result]: ${ddgJson.AbstractText}`);
      } else if (ddgJson.RelatedTopics && Array.isArray(ddgJson.RelatedTopics)) {
        for (let i = 0; i < Math.min(3, ddgJson.RelatedTopics.length); i++) {
          if (ddgJson.RelatedTopics[i].Text) {
            snippets.push(`[Web Source ${i + 1}]: ${ddgJson.RelatedTopics[i].Text}`);
          }
        }
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

    const now = new Date();
    const currentDateStr = now.toISOString().split("T")[0];
    const currentTimeStr = now.toLocaleTimeString("en-US", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });

    let systemPrompt = `You are Anacleto AI, a sovereign enterprise foundation model (Anacleto-120B-Omni). Today's real-world current date is ${currentDateStr} and the current time is ${currentTimeStr} (CEST/UTC+2). Provide concise, highly technical, intelligent, and accurate responses.`;

    if (webSearch) {
      systemPrompt += " Real-Time Web Search is ENABLED. You MUST base your answer directly on the provided search results context and cite the sources.";
    }

    if (deepReasoning) {
      systemPrompt += " Output your step-by-step reasoning inside `<think>`...`</think>` tags before giving your final answer.";
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

    let userPromptText = message || "";
    let finalUserMessage = userPromptText;

    // 1. Web Search Context Injection
    if (webSearch && userPromptText) {
      const webResults = await performWebSearch(userPromptText);
      if (webResults) {
        finalUserMessage = `[REAL-TIME LIVE WEB SEARCH RESULTS (Current Date: ${currentDateStr}, Time: ${currentTimeStr})]\n${webResults}\n\n[USER QUESTION]: ${userPromptText}\n\n[INSTRUCTION]: Answer the user's question accurately using the live web search results above.`;
      } else {
        finalUserMessage = `[REAL-TIME CLOCK: ${currentDateStr} ${currentTimeStr}]\n\n[USER QUESTION]: ${userPromptText}`;
      }
    }

    // 2. Document Context Injection
    if (fileContent) {
      finalUserMessage = `[ATTACHED DOCUMENT CONTEXT: "${attachment || "document"}"]\n--- BEGIN ATTACHMENT ---\n${fileContent}\n--- END ATTACHMENT ---\n\n${finalUserMessage}`;
    }

    apiMessages.push({ role: "user", content: finalUserMessage });

    const startTime = Date.now();

    // Synchronous RunPod Call
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

    // Async Fallback
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
