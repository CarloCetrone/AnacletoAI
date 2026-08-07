// Supabase Edge Function: Real-Time ReAct Tool-Calling Agent Protocol
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

// Robust Multi-Provider Web Search (DuckDuckGo Lite POST + DuckDuckGo HTML)
async function performWebSearch(query: string): Promise<{ searchSummary: string; sources: string[] }> {
  try {
    const snippets: string[] = [];
    const sources: string[] = [];

    // Provider 1: DuckDuckGo Lite (POST form-urlencoded)
    const liteUrl = `https://lite.duckduckgo.com/lite/`;
    const bodyParams = new URLSearchParams({ q: query });
    const liteRes = await fetch(liteUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: bodyParams.toString()
    });

    if (liteRes.ok) {
      const liteHtml = await liteRes.text();
      const snippetMatches = liteHtml.match(/<td class="result-snippet">([\s\S]*?)<\/td>/g) || [];
      const linkMatches = liteHtml.match(/<a class="result-link"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g) || [];

      for (let i = 0; i < Math.min(5, snippetMatches.length); i++) {
        const cleanSnippet = snippetMatches[i].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        let cleanUrl = "";
        if (linkMatches[i]) {
          const hrefMatch = linkMatches[i].match(/href="([^"]+)"/);
          cleanUrl = hrefMatch ? hrefMatch[1] : "";
        }

        if (cleanSnippet) {
          snippets.push(`[Source ${i + 1} (${cleanUrl || "web"})]: ${cleanSnippet}`);
          sources.push(cleanUrl || `Search Result ${i + 1}`);
        }
      }
    }

    // Provider 2 Fallback: DuckDuckGo HTML GET
    if (snippets.length === 0) {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const res = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept-Language": "en-US,en;q=0.9,it;q=0.8"
        }
      });
      if (res.ok) {
        const htmlText = await res.text();
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
      }
    }

    return { searchSummary: snippets.join("\n\n"), sources };
  } catch (e) {
    console.error("Web Search Error:", e);
    return { searchSummary: "", sources: [] };
  }
}

// Robust Helper to execute LLM API call with Sync & Async Stream Fallback
async function invokeModel(messages: any[], maxTokens = 1536, temperature = 0.5): Promise<string> {
  const payload = {
    input: {
      messages,
      sampling_params: { max_tokens: maxTokens, temperature }
    }
  };

  try {
    // 1. Try Sync RunPod Endpoint
    const res = await fetch(RUNPOD_RUN_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RUNPOD_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === "COMPLETED" && data.output) {
        let outputText = "";
        if (typeof data.output === "string") {
          outputText = data.output;
        } else if (Array.isArray(data.output)) {
          for (const item of data.output) {
            if (typeof item === "string") outputText += item;
            else if (item.choices?.[0]?.message?.content) outputText += item.choices[0].message.content;
            else if (item.choices?.[0]?.tokens) outputText += item.choices[0].tokens.join("");
          }
        } else if (data.output.choices?.[0]?.message?.content) {
          outputText = data.output.choices[0].message.content;
        } else if (data.output.choices?.[0]?.tokens) {
          outputText = data.output.choices[0].tokens.join("");
        }

        if (outputText.trim()) return outputText;
      }
    }

    // 2. Fallback to Async Stream Polling Endpoint
    const asyncRes = await fetch(RUNPOD_RUN_ASYNC_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RUNPOD_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: {
          messages,
          stream: true,
          sampling_params: { max_tokens: maxTokens, temperature }
        }
      })
    });

    if (asyncRes.ok) {
      const asyncData = await asyncRes.json();
      const jobId = asyncData.id;
      if (jobId) {
        let collectedText = "";
        let isCompleted = false;
        let retries = 0;
        while (!isCompleted && retries < 40) {
          retries++;
          const streamRes = await fetch(`${RUNPOD_STREAM_URL_BASE}/${jobId}`, {
            headers: { "Authorization": `Bearer ${RUNPOD_API_KEY}` }
          });
          if (streamRes.ok) {
            const streamData = await streamRes.json();
            const streamItems = streamData.stream || [];
            for (const item of streamItems) {
              const output = item.output;
              if (typeof output === "string") collectedText += output;
              else if (Array.isArray(output)) {
                for (const entry of output) {
                  if (entry.choices?.[0]?.tokens) collectedText += entry.choices[0].tokens.join("");
                  else if (typeof entry === "string") collectedText += entry;
                }
              } else if (output?.choices?.[0]?.tokens) {
                collectedText += output.choices[0].tokens.join("");
              }
            }
            if (streamData.status === "COMPLETED" || streamData.status === "FAILED") {
              isCompleted = true;
              break;
            }
          }
          await new Promise((r) => setTimeout(r, 200));
        }
        if (collectedText.trim()) return collectedText;
      }
    }
  } catch (e) {
    console.error("invokeModel error:", e);
  }

  return "";
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

    // Agent System Prompt defining available tools and tool-call syntax
    let systemPrompt = `You are Anacleto AI, a sovereign enterprise foundation model (Anacleto-120B-Omni). Today's current date is ${currentDateStr} and time is ${currentTimeStr} (CEST/UTC+2).`;

    if (webSearch) {
      systemPrompt += `
TOOLS AVAILABLE:
- web_search(query): You can call this search tool to look up real-time news, current events, locations, weather, or real-world facts.

TOOL CALL INSTRUCTIONS:
If you need external information to answer the user's prompt accurately, output ONLY the tool call in this exact format:
\`\`\`tool_call
web_search("your search query here")
\`\`\`
If no search tool call is needed, answer the user directly using your knowledge without writing a tool_call.`;
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

    if (fileContent) {
      finalUserMessage = `[ATTACHED DOCUMENT CONTEXT: "${attachment || "document"}"]\n--- BEGIN ATTACHMENT ---\n${fileContent}\n--- END ATTACHMENT ---\n\n${finalUserMessage}`;
    }

    apiMessages.push({ role: "user", content: finalUserMessage });

    const startTime = Date.now();
    let searchData: { searchSummary: string; sources: string[] } = { searchSummary: "", sources: [] };

    // STEP 1: Turn 1 - Execute First Model Turn
    let firstTurnOutput = await invokeModel(apiMessages, deepReasoning ? 2048 : 1024, deepReasoning ? 0.3 : 0.5);

    // Check if the agent decided to issue a tool_call
    const toolCallMatch = firstTurnOutput.match(/```tool_call\s*\n?\s*web_search\("([^"]+)"\)\s*\n?\s*```/i) 
                       || firstTurnOutput.match(/web_search\("([^"]+)"\)/i);

    if (webSearch && toolCallMatch) {
      const searchQuery = toolCallMatch[1];
      console.log(`Agent issued tool call: web_search("${searchQuery}")`);

      // STEP 2: Execute Web Search Tool requested by the agent
      searchData = await performWebSearch(searchQuery);

      // Construct explicit Turn 2 trajectory:
      const turn2Messages = [
        ...apiMessages,
        { role: "assistant", content: `\`\`\`tool_call\nweb_search("${searchQuery}")\n\`\`\`` },
        {
          role: "user",
          content: `[SYSTEM OBSERVATION / TOOL RESPONSE FOR web_search("${searchQuery}")]:\n${searchData.searchSummary || "No results found."}\n\n[INSTRUCTION]: Read the search results above carefully and answer the user's question with full detail.`
        }
      ];

      // STEP 3: Turn 2 - Model generates final response informed by tool output
      let finalAgentResponse = await invokeModel(turn2Messages, deepReasoning ? 2048 : 1536, deepReasoning ? 0.3 : 0.6);

      const latencyMs = Date.now() - startTime;
      return new Response(
        JSON.stringify({
          status: "success",
          response: finalAgentResponse || `Based on the search for "${searchQuery}":\n\n${searchData.searchSummary}`,
          searchSummary: `[Agent Tool Call]: web_search("${searchQuery}")\n\n${searchData.searchSummary}`,
          sources: searchData.sources,
          model: "Anacleto-120B-Omni",
          latency: `${latencyMs}ms`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // If no tool call was issued, return direct first-turn answer (cleaning any raw tool_call tags)
    const cleanOutput = firstTurnOutput.replace(/```tool_call[\s\S]*?```/g, "").trim() || "I am Anacleto AI. How can I assist you with your project today?";
    const totalLatency = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        status: "success",
        response: cleanOutput,
        searchSummary: "",
        sources: [],
        model: "Anacleto-120B-Omni",
        latency: `${totalLatency}ms`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", response: `Edge Stream Error: ${String(err)}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
