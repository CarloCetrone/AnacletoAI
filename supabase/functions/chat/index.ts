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

// High-Precision Real-Time Web Search Tool (Wikipedia + DDG HTML Parser)
async function performWebSearch(query: string): Promise<string> {
  try {
    const snippets: string[] = [];

    // 1. Query Wikipedia API for geographic places & factual topics
    const wikiUrl = `https://it.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const wikiRes = await fetch(wikiUrl);
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const results = wikiData.query?.search || [];
      for (let i = 0; i < Math.min(2, results.length); i++) {
        const snippetText = results[i].snippet.replace(/<[^>]+>/g, "").trim();
        snippets.push(`[Wikipedia Source ${i + 1}: ${results[i].title}]: ${snippetText}`);
      }
    }

    // 2. Query DuckDuckGo Lite for live web search
    const searchUrl = `https://lite.duckduckgo.com/lite/`;
    const bodyParams = new URLSearchParams({ q: query });
    const ddgRes = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      body: bodyParams.toString()
    });

    if (ddgRes.ok) {
      const htmlText = await ddgRes.text();
      const resultRegex = /<td class="result-snippet">([\s\S]*?)<\/td>/g;
      let match;
      let count = snippets.length + 1;

      while ((match = resultRegex.exec(htmlText)) !== null && count <= 5) {
        const cleanText = match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        if (cleanText) {
          snippets.push(`[Web Source ${count}]: ${cleanText}`);
          count++;
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
    const currentTimeStr = now.toLocaleTimeString("en-US", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const currentDayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });

    let systemPrompt = `You are Anacleto AI, a sovereign enterprise foundation model (Anacleto-120B-Omni). Today is ${currentDayOfWeek}, ${currentDateStr}, and the current real-time timestamp is ${currentTimeStr} (CEST/UTC+2). Provide concise, highly technical, intelligent, and accurate responses.`;

    if (webSearch) {
      systemPrompt += " Web Search mode is active. Use the provided web search context to answer current date, real-time news, or geographic search queries accurately.";
    }

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

    // Execute Live Web Search if enabled OR if prompt asks for places, current date, news, or time
    const isSearchQuery = webSearch || (userContent && /search|marotta|fano|where|where is|latest|news|weather|who is/i.test(userContent));

    if (isSearchQuery && userContent) {
      const webResults = await performWebSearch(userContent);
      if (webResults) {
        userContent = `[REAL-TIME LIVE SEARCH CONTEXT (Date: ${currentDateStr}, Time: ${currentTimeStr})]\n${webResults}\n\nUser Question: ${userContent}`;
      } else {
        userContent = `[SYSTEM TIME CONTEXT: ${currentDayOfWeek}, ${currentDateStr} at ${currentTimeStr}]\n${userContent}`;
      }
    } else if (userContent && /time|clock|hour|che ora è/i.test(userContent)) {
      userContent = `[SYSTEM REAL-TIME TIMESTAMP: ${currentTimeStr} (CEST/UTC+2), Date: ${currentDayOfWeek}, ${currentDateStr}]\nUser Question: ${userContent}`;
    }

    // Inject document text context
    if (fileContent) {
      userContent = `[ATTACHED FILE CONTEXT: "${attachment || "document"}"]\n--- BEGIN FILE CONTENT ---\n${fileContent}\n--- END FILE CONTENT ---\n\nUser Question/Instruction: ${userContent || "Please analyze the attached document."}`;
    } else if (attachment && !isSearchQuery) {
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
