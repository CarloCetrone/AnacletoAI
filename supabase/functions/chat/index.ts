// Supabase Edge Function: Real-Time ReAct Tool-Calling Agent Protocol (Multi-Model Support)
// Location: supabase/functions/chat/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RUNPOD_API_KEY = Deno.env.get("RUNPOD_API_KEY") || "";

// RunPod Endpoint IDs
const ENDPOINT_32B = Deno.env.get("RUNPOD_ENDPOINT_ID_32B") || Deno.env.get("RUNPOD_ENDPOINT_ID") || "ywhi6e5t9yof38";
const ENDPOINT_7B = Deno.env.get("RUNPOD_ENDPOINT_ID_7B") || "g1cdki7dv7wb07";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// High-Reliability Multi-Engine Web Search Parser
async function performWebSearch(query: string): Promise<{ searchSummary: string; sources: string[] }> {
  try {
    const snippets: string[] = [];
    const sources: string[] = [];

    // 1. DuckDuckGo HTML GET Engine
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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

    // 2. Wikipedia Search API Fallback
    if (snippets.length === 0) {
      const wikiUrl = `https://it.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const wikiRes = await fetch(wikiUrl);
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const results = wikiData.query?.search || [];
        for (let i = 0; i < Math.min(3, results.length); i++) {
          const cleanSnippet = results[i].snippet.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').trim();
          snippets.push(`[Wikipedia: ${results[i].title}]: ${cleanSnippet}`);
          sources.push(`https://it.wikipedia.org/wiki/${encodeURIComponent(results[i].title)}`);
        }
      }
    }

    return { searchSummary: snippets.join("\n\n"), sources };
  } catch (e) {
    console.error("Web Search Error:", e);
    return { searchSummary: "", sources: [] };
  }
}

// Extract clean text from arbitrary vLLM / OpenAI / RunPod output formats
function extractOutputText(outputData: any): string {
  if (!outputData) return "";
  if (typeof outputData === "string") return outputData;

  if (Array.isArray(outputData)) {
    let combined = "";
    for (const item of outputData) {
      combined += extractOutputText(item);
    }
    return combined;
  }

  if (typeof outputData === "object") {
    if (outputData.text && typeof outputData.text === "string") return outputData.text;
    if (outputData.content && typeof outputData.content === "string") return outputData.content;
    if (outputData.choices?.[0]?.message?.content) return outputData.choices[0].message.content;
    if (outputData.choices?.[0]?.text) return outputData.choices[0].text;
    if (outputData.choices?.[0]?.tokens) {
      return Array.isArray(outputData.choices[0].tokens) ? outputData.choices[0].tokens.join("") : String(outputData.choices[0].tokens);
    }
  }

  return "";
}

// Robust Helper to execute LLM API call for dynamic endpoint
async function invokeModel(endpointId: string, messages: any[], maxTokens = 1536, temperature = 0.5): Promise<string> {
  const runUrl = `https://api.runpod.ai/v2/${endpointId}/runsync`;
  const asyncUrl = `https://api.runpod.ai/v2/${endpointId}/run`;
  const streamUrlBase = `https://api.runpod.ai/v2/${endpointId}/stream`;

  const payload = {
    input: {
      messages,
      sampling_params: { max_tokens: maxTokens, temperature }
    }
  };

  try {
    // 1. Try Sync RunPod Endpoint
    const res = await fetch(runUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RUNPOD_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`[RunPod ${endpointId}] Sync Status: ${data.status}`);
      if (data.status === "COMPLETED" && data.output) {
        const text = extractOutputText(data.output);
        if (text.trim()) return text;
      }
    }

    // 2. Fallback to Async Stream Polling Endpoint
    const asyncRes = await fetch(asyncUrl, {
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
          const streamRes = await fetch(`${streamUrlBase}/${jobId}`, {
            headers: { "Authorization": `Bearer ${RUNPOD_API_KEY}` }
          });
          if (streamRes.ok) {
            const streamData = await streamRes.json();
            const streamItems = streamData.stream || [];
            for (const item of streamItems) {
              collectedText += extractOutputText(item.output);
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
    console.error(`invokeModel error for ${endpointId}:`, e);
  }

  return "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, history, attachment, fileContent, webSearch, deepReasoning, model } = await req.json();

    if (!message && !fileContent && (!history || history.length === 0)) {
      return new Response(
        JSON.stringify({ status: "error", response: "Please enter a valid message or upload a document." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Determine target RunPod Endpoint & Model Display Name
    const is7b = model === "anacleto-7b" || model === "7b";
    const targetEndpoint = is7b ? ENDPOINT_7B : ENDPOINT_32B;
    const modelDisplayName = is7b ? "Anacleto-7B-Turbo" : "Anacleto-32B-Omni";

    const now = new Date();
    const currentDateStr = now.toISOString().split("T")[0];
    const currentTimeStr = now.toLocaleTimeString("en-US", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });

    // Agent System Prompt defining available tools and tool-call syntax
    let systemPrompt = `You are ${modelDisplayName}, a sovereign enterprise foundation model. Today's current date is ${currentDateStr} and time is ${currentTimeStr} (CEST/UTC+2). Provide helpful, detailed, unique, and natural answers to every question.`;

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
    let firstTurnOutput = await invokeModel(targetEndpoint, apiMessages, deepReasoning ? 2048 : 1024, deepReasoning ? 0.3 : 0.6);

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
      let finalAgentResponse = await invokeModel(targetEndpoint, turn2Messages, deepReasoning ? 2048 : 1536, deepReasoning ? 0.3 : 0.7);

      const latencyMs = Date.now() - startTime;
      return new Response(
        JSON.stringify({
          status: "success",
          response: finalAgentResponse || `Based on the search for "${searchQuery}":\n\n${searchData.searchSummary}`,
          searchSummary: `[Agent Tool Call]: web_search("${searchQuery}")\n\n${searchData.searchSummary}`,
          sources: searchData.sources,
          model: modelDisplayName,
          latency: `${latencyMs}ms`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // If no tool call was issued, return direct first-turn answer (cleaning any raw tool_call tags)
    const cleanOutput = firstTurnOutput.replace(/```tool_call[\s\S]*?```/g, "").trim();
    const totalLatency = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        status: "success",
        response: cleanOutput || `Hello! I am ${modelDisplayName}. How can I assist you with your project today?`,
        searchSummary: "",
        sources: [],
        model: modelDisplayName,
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
