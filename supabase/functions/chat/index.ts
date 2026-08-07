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

// High-Precision Real-Time Web Search Tool (DuckDuckGo Engine)
async function performWebSearch(query: string): Promise<{ searchSummary: string; sources: string[] }> {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,it;q=0.8"
      }
    });

    if (!res.ok) return { searchSummary: "", sources: [] };
    const htmlText = await res.text();

    const snippets: string[] = [];
    const sources: string[] = [];
    const snippetMatches = htmlText.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g) || [];
    const urlMatches = htmlText.match(/<a class="result__url[^>]*>([\s\S]*?)<\/a>/g) || [];

    for (let i = 0; i < Math.min(5, snippetMatches.length); i++) {
      const cleanSnippet = snippetMatches[i].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const cleanUrl = urlMatches[i] ? urlMatches[i].replace(/<[^>]+>/g, "").trim() : "";

      if (cleanSnippet) {
        snippets.push(`[Source ${i + 1} (${cleanUrl})]: ${cleanSnippet}`);
        sources.push(cleanUrl || `Search Result ${i + 1}`);
      }
    }

    return { searchSummary: snippets.join("\n\n"), sources };
  } catch (e) {
    console.error("Web Search Error:", e);
    return { searchSummary: "", sources: [] };
  }
}

// Intent Classifier: Checks if a prompt actually requires real-time web search or live information
function requiresWebSearch(prompt: string): boolean {
  if (!prompt) return false;
  
  // Real-time signals: dates, news, weather, sports, stock prices, current events, locations, "who is", "what is the price of"
  const realTimePatterns = [
    /\b(today|now|current|latest|news|weather|price|stock|market|score|match|winner|where is|who is|when is)\b/i,
    /\b(search|google|find online|check web|look up|info about)\b/i,
    /\b(2025|2026|2027)\b/
  ];

  return realTimePatterns.some((pattern) => pattern.test(prompt));
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
      systemPrompt += " Web Search capability is ENABLED. If real-time search context is provided, use it to accurately ground your response and cite sources. If no search context is provided or needed, answer using your internal knowledge.";
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
    let searchData: { searchSummary: string; sources: string[] } = { searchSummary: "", sources: [] };

    // CONDITIONAL TOOL EXECUTION:
    // When Web Search is enabled, ONLY execute web search if the prompt actually requires live/external info
    const shouldSearch = webSearch && requiresWebSearch(userPromptText);

    if (shouldSearch && userPromptText) {
      searchData = await performWebSearch(userPromptText);
      if (searchData.searchSummary) {
        finalUserMessage = `[REAL-TIME LIVE WEB SEARCH RESULTS (Current Date: ${currentDateStr}, Time: ${currentTimeStr})]\n${searchData.searchSummary}\n\n[USER QUESTION]: ${userPromptText}\n\n[INSTRUCTION]: Answer the user's question accurately using the live web search results above.`;
      }
    }

    // Document Context Injection
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
              searchSummary: searchData.searchSummary,
              sources: searchData.sources,
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
          searchSummary: searchData.searchSummary,
          sources: searchData.sources,
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
