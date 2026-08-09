// Supabase Edge Function: Sovereign ReAct Agent Protocol (Genuine Real-Time Token SSE Streaming)
// Location: supabase/functions/chat/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RUNPOD_API_KEY_32B = Deno.env.get("RUNPOD_API_KEY_32B") || Deno.env.get("RUNPOD_API_KEY") || "";
const RUNPOD_API_KEY_7B = Deno.env.get("RUNPOD_API_KEY_7B") || Deno.env.get("RUNPOD_API_KEY") || "";
const ENDPOINT_32B = Deno.env.get("RUNPOD_ENDPOINT_ID_32B") || Deno.env.get("RUNPOD_ENDPOINT_ID") || "ywhi6e5t9yof38";
const ENDPOINT_7B = Deno.env.get("RUNPOD_ENDPOINT_ID_7B") || "g1cdki7dv7wb07";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function cleanSearchQuery(rawQuery: string): string {
  const cleaned = rawQuery
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\b(population|inhabitants|people|how many|how much|number of|who is|what is|when was|where is|popolazione|abitanti|quanti|live|living|inhabit|inhabits|location|find|info|search|map|coordinates|details|place|region|italy|country|city|town|village|a|the|in|of|about)\b/gi, "")
    .replace(/[,;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > 1 ? cleaned : rawQuery.replace(/^["'\s]+|["'\s]+$/g, "").trim();
}

function filterRelevantPages(pages: { title: string; extract: string; url: string }[], cleanQuery: string): { title: string; extract: string; url: string }[] {
  if (pages.length === 0) return [];
  const qLower = cleanQuery.toLowerCase();
  const qTokens = qLower.split(/\s+/).filter(t => t.length > 2);

  const matched = pages.filter(p => {
    const tLower = p.title.toLowerCase();
    return tLower === qLower || qTokens.some(tok => tLower.includes(tok) || tok.includes(tLower));
  });

  return matched.length > 0 ? matched.slice(0, 3) : pages.slice(0, 3);
}

// ============================================================================
// TOOL 1: web_search(query: string)
// Returns top search results formatted with Title, Snippet, Link.
// ============================================================================
async function executeWebSearch(rawQuery: string): Promise<{ searchSummary: string; sources: string[] }> {
  try {
    const search_results: string[] = [];
    const sources: string[] = [];
    const cleanQuery = cleanSearchQuery(rawQuery) || rawQuery;

    // 1. DuckDuckGo HTML GET Engine
    try {
      const formattedQuery = encodeURIComponent(cleanQuery).replace(/%20/g, "+");
      const searchUrl = `https://html.duckduckgo.com/html/?q=${formattedQuery}`;
      const res = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
          "Referer": "https://html.duckduckgo.com/"
        }
      });

      if (res.ok) {
        const htmlText = await res.text();
        const snippetMatches = htmlText.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g) || [];
        const titleMatches = htmlText.match(/<a class="result__a[^>]*>([\s\S]*?)<\/a>/g) || [];

        for (let i = 0; i < Math.min(5, snippetMatches.length); i++) {
          const cleanSnippet = snippetMatches[i].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
          let cleanTitle = titleMatches[i] ? titleMatches[i].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";
          
          let cleanUrl = "";
          if (titleMatches[i]) {
            const hrefMatch = titleMatches[i].match(/href="([^"]+)"/i);
            if (hrefMatch && hrefMatch[1]) {
              cleanUrl = hrefMatch[1];
              if (cleanUrl.includes("uddg=")) {
                const rawUddg = cleanUrl.split("uddg=")[1]?.split("&")[0];
                if (rawUddg) cleanUrl = decodeURIComponent(rawUddg);
              }
            }
          }

          if (!cleanTitle || cleanTitle.toLowerCase() === "result") {
            try {
              if (cleanUrl) {
                const hostname = new URL(cleanUrl).hostname.replace(/^www\./, "");
                cleanTitle = `${cleanQuery} (${hostname})`;
              } else {
                cleanTitle = `${cleanQuery} - Web Result`;
              }
            } catch {
              cleanTitle = `${cleanQuery} - Web Result`;
            }
          }

          if (cleanSnippet) {
            search_results.push(
              `Title: ${cleanTitle}\n` +
              `Snippet: ${cleanSnippet}\n` +
              `Link: ${cleanUrl}`
            );
            if (cleanUrl) sources.push(cleanUrl);
          }
        }
      }
    } catch (e) {
      console.error("DDG HTML search error:", e);
    }

    // 2. Wikipedia API Fallback (with Robust Relevance Filtering)
    if (search_results.length === 0) {
      try {
        const wikiUrl = `https://it.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&format=json&origin=*`;
        const wikiRes = await fetch(wikiUrl);
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          const results = wikiData.query?.search || [];
          const topTitles = results
            .slice(0, 5)
            .map((r: any) => r.title)
            .filter((t: string) => !t.includes("disambigua") && !t.includes("disambiguation"));

          if (topTitles.length > 0) {
            const extractUrl = `https://it.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(topTitles.join("|"))}&format=json&origin=*`;
            const extractRes = await fetch(extractUrl);
            if (extractRes.ok) {
              const extractData = await extractRes.json();
              const pagesObj = extractData.query?.pages || {};
              const fetchedPages: { title: string; extract: string; url: string }[] = [];

              for (const pageId in pagesObj) {
                const page = pagesObj[pageId];
                if (page.title && page.extract) {
                  const cleanExtract = page.extract.replace(/\s+/g, " ").trim();
                  const pageUrl = `https://it.wikipedia.org/wiki/${encodeURIComponent(page.title)}`;
                  if (cleanExtract.length > 20) {
                    fetchedPages.push({ title: page.title, extract: cleanExtract, url: pageUrl });
                  }
                }
              }

              const relevantPages = filterRelevantPages(fetchedPages, cleanQuery);
              for (const p of relevantPages) {
                search_results.push(
                  `Title: ${p.title}\n` +
                  `Snippet: ${p.extract.slice(0, 1000)}\n` +
                  `Link: ${p.url}`
                );
                sources.push(p.url);
              }
            }
          }
        }
      } catch (e) {
        console.error("Wikipedia API search error:", e);
      }
    }

    return {
      searchSummary: search_results.join("\n\n") || "No results found.",
      sources
    };
  } catch (e) {
    return { searchSummary: `Search failed: ${String(e)}`, sources: [] };
  }
}

// ============================================================================
// TOOL 2: read_webpage(url: string, query?: string)
// Fetches webpage URL, extracts clean article text, and feeds it into an LLM call
// to get a focused recap of the content.
// ============================================================================
async function executeReadWebpage(
  url: string,
  query?: string,
  endpointId?: string,
  apiKey?: string
): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    if (!res.ok) return `Failed to download webpage at ${url}. Status code: ${res.status}`;

    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!text) return "Successfully loaded page, but could not find main article text.";

    const pageContent = text.slice(0, 10000);

    if (endpointId && apiKey) {
      const promptMessages = [
        {
          role: "system",
          content: "You are a precise research assistant. Summarize and extract key factual information from the provided webpage text."
        },
        {
          role: "user",
          content: `[WEBPAGE SOURCE URL]: ${url}\n${query ? `[SPECIFIC SEARCH QUERY FOCUS]: "${query}"\n` : ""}\n--- WEBPAGE EXTRACTED TEXT ---\n${pageContent}\n--- END WEBPAGE EXTRACTED TEXT ---\n\n[INSTRUCTION]: Provide a clear, factual, and detailed recap of the webpage content above${query ? `, focusing specifically on answering or addressing "${query}"` : ""}. Highlight essential facts, services, locations, prices, contact details, or specifications.`
        }
      ];

      const llmRecap = await invokeModel(endpointId, apiKey, promptMessages, 1024, 0.3);
      if (llmRecap.trim()) {
        return `[LLM RECAP OF WEBPAGE: ${url}${query ? ` | FOCUS: "${query}"` : ""}]\n\n${llmRecap.trim()}`;
      }
    }

    return `[RAW WEBPAGE EXTRACT: ${url}]\n\n${pageContent.slice(0, 4000)}`;

  } catch (e) {
    return `Error reading webpage ${url}: ${String(e)}`;
  }
}

function extractOutputText(outputData: any): string {
  if (!outputData) return "";
  if (typeof outputData === "string") return outputData;
  if (Array.isArray(outputData)) {
    if (outputData.every(item => typeof item === "string")) {
      return outputData.join("");
    }
    return outputData.map(extractOutputText).join("");
  }

  if (typeof outputData === "object") {
    if (outputData.code && typeof outputData.code === "number" && outputData.code >= 400) {
      console.error("RunPod Output Error:", outputData);
      return "";
    }

    if (outputData.text) {
      if (typeof outputData.text === "string") return outputData.text;
      if (Array.isArray(outputData.text)) return outputData.text.join("");
    }

    if (Array.isArray(outputData.tokens)) {
      return outputData.tokens.join("");
    }

    if (typeof outputData.content === "string") return outputData.content;

    if (Array.isArray(outputData.choices) && outputData.choices.length > 0) {
      const choice = outputData.choices[0];
      if (choice.message?.content) return String(choice.message.content);
      if (typeof choice.text === "string") return choice.text;
      if (Array.isArray(choice.text)) return choice.text.join("");
      if (Array.isArray(choice.tokens)) return choice.tokens.join("");
    }

    if (outputData.choice) {
      return extractOutputText(outputData.choice);
    }
  }

  return "";
}

function formatPrompt(messages: any[]): string {
  let prompt = "";
  for (const m of messages) {
    const role = m.role || (m.sender === "user" ? "user" : "assistant");
    const content = m.content || m.text || "";
    if (content) {
      prompt += `<|im_start|>${role}\n${content}<|im_end|>\n`;
    }
  }
  prompt += `<|im_start|>assistant\n`;
  return prompt;
}

async function invokeModel(
  endpointId: string,
  apiKey: string,
  messages: any[],
  maxTokens = 1536,
  temperature = 0.5,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const openaiUrl = `https://api.runpod.ai/v2/${endpointId}/openai/v1/chat/completions`;
  const runsyncUrl = `https://api.runpod.ai/v2/${endpointId}/runsync`;
  const asyncUrl = `https://api.runpod.ai/v2/${endpointId}/run`;
  const streamUrlBase = `https://api.runpod.ai/v2/${endpointId}/stream`;

  // 1. Primary Path: Native OpenAI SSE Streaming HTTP API (Zero Polling)
  if (onChunk) {
    try {
      const res = await fetch(openaiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: endpointId,
          messages,
          max_tokens: maxTokens,
          temperature,
          stream: true
        })
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let collectedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const dataStr = trimmed.slice(6).trim();
              if (dataStr === "[DONE]") break;

              try {
                const json = JSON.parse(dataStr);
                const token = json.choices?.[0]?.delta?.content || json.choices?.[0]?.text || "";
                if (token) {
                  collectedText += token;
                  onChunk(token);
                }
              } catch {
                // Ignore incomplete JSON chunks
              }
            }
          }
        }

        if (collectedText.trim()) return collectedText;
      }
    } catch (e) {
      console.warn(`OpenAI streaming API route unavailable for ${endpointId}, using fallback:`, e);
    }

    // 2. Fallback Path: RunPod /run + /stream Async Polling
    try {
      const formattedPrompt = formatPrompt(messages);
      const asyncRes = await fetch(asyncUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          input: {
            prompt: formattedPrompt,
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
          const maxRetries = 2000;

          while (!isCompleted && retries < maxRetries) {
            retries++;
            const streamRes = await fetch(`${streamUrlBase}/${jobId}`, {
              headers: { "Authorization": `Bearer ${apiKey}` }
            });

            if (streamRes.ok) {
              const streamData = await streamRes.json();
              const streamItems = streamData.stream || [];

              for (const item of streamItems) {
                const chunk = extractOutputText(item.output);
                if (chunk) {
                  collectedText += chunk;
                  onChunk(chunk);
                }
              }

              if (streamData.status === "COMPLETED" || streamData.status === "FAILED") {
                isCompleted = true;

                if (streamData.output) {
                  const finalFullText = extractOutputText(streamData.output);
                  if (finalFullText.startsWith(collectedText) && finalFullText.length > collectedText.length) {
                    const remainingChunk = finalFullText.slice(collectedText.length);
                    collectedText += remainingChunk;
                    onChunk(remainingChunk);
                  }
                }
                break;
              }
            }
            await new Promise((r) => setTimeout(r, 40));
          }

          if (collectedText.trim()) return collectedText;
        }
      }
    } catch (e) {
      console.error(`RunPod stream fallback error for ${endpointId}:`, e);
    }
  }

  // 3. Fast path for non-streamed evaluation using runsync
  try {
    const formattedPrompt = formatPrompt(messages);
    const res = await fetch(runsyncUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: {
          prompt: formattedPrompt,
          messages,
          sampling_params: { max_tokens: maxTokens, temperature }
        }
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === "COMPLETED" && data.output) {
        const text = extractOutputText(data.output);
        if (text.trim()) return text;
      }
    }
  } catch (e) {
    console.error(`runsync error for ${endpointId}:`, e);
  }

  return "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, history, attachment, fileContent, webSearch, deepReasoning, model } = await req.json();

    const is7b = model === "anacleto-7b" || model === "7b";
    const targetEndpoint = is7b ? ENDPOINT_7B : ENDPOINT_32B;
    const targetApiKey = is7b ? RUNPOD_API_KEY_7B : RUNPOD_API_KEY_32B;
    const modelDisplayName = is7b ? "Anacleto-7B-Turbo" : "Anacleto-32B-Omni";

    const now = new Date();
    const currentDateStr = now.toISOString().split("T")[0];
    const currentTimeStr = now.toLocaleTimeString("en-US", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });

    let systemPrompt = `You are ${modelDisplayName}, a sovereign enterprise foundation model. Today's current date is ${currentDateStr} and time is ${currentTimeStr} (CEST/UTC+2). Provide helpful, detailed, unique, and natural answers to every question.`;

    if (webSearch) {
      systemPrompt += `

RESEARCH TOOLS & PROTOCOL:
You have access to real-time web search and deep webpage reading tools:

1. web_search("search query")
   - Executes a web search returning top matching titles, snippets, and links.
   - Exact Format:
\`\`\`tool_call
web_search("your query here")
\`\`\`

2. read_webpage("https://example.com/page", "optional query")
   - Fetches a webpage, extracts its text, and feeds it into an LLM API call to get an in-depth recap of the webpage content.
   - Formats:
\`\`\`tool_call
read_webpage("https://example.com/page", "specific query to look for")
\`\`\`

WHEN TO USE TOOLS VS ANSWER DIRECTLY:
- Issue a web_search tool call ONLY when the user is explicitly requesting new external facts, real-time news, specific locations, or online information.
- Do NOT issue any tool call if the user is asking a conversational follow-up, meta-question about your capabilities (e.g. "do you have a tool to search deeply?", "how does this work?"), or chatting naturally. In those cases, answer directly without calling tools.

STRICT ANTI-HALLUCINATION & GROUNDING RULES:
- Base your factual answers STRICTLY on the evidence present in the provided web search snippets and webpage LLM recaps.
- Do NOT guess or invent facts if they are not explicitly stated in the observations.`;
    }

    if (deepReasoning) {
      systemPrompt += " Output your step-by-step reasoning inside `<think>`...`</think>` tags before giving your final answer.";
    }

    const currentMessages: any[] = [{ role: "system", content: systemPrompt }];

    if (Array.isArray(history)) {
      for (const item of history) {
        if (item.sender === "user") {
          currentMessages.push({ role: "user", content: item.text });
        } else if (item.sender === "ai" && item.id !== "welcome-msg") {
          currentMessages.push({ role: "assistant", content: item.text });
        }
      }
    }

    let finalUserMessage = message || "";
    if (fileContent) {
      finalUserMessage = `[ATTACHED DOCUMENT CONTEXT: "${attachment || "document"}"]\n--- BEGIN ATTACHMENT ---\n${fileContent}\n--- END ATTACHMENT ---\n\n${finalUserMessage}`;
    }
    currentMessages.push({ role: "user", content: finalUserMessage });

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          const startTime = Date.now();
          sendEvent("status", { message: "Thinking..." });

          let turnCount = 0;
          const maxTurns = 3;
          let finalAnswer = "";
          let combinedSearchSummary = "";
          let allSources: string[] = [];

          // Multi-Turn ReAct Agent Loop
          while (turnCount < maxTurns) {
            turnCount++;

            let isToolCallDetected = false;
            let textBuffer = "";
            let flushedToClient = false;

            const turnOutput = await invokeModel(
              targetEndpoint,
              targetApiKey,
              currentMessages,
              deepReasoning ? 2048 : 1024,
              deepReasoning ? 0.3 : 0.6,
              (chunkText) => {
                if (!webSearch) {
                  // Standard direct response: stream tokens to client in real time as RunPod generates them
                  sendEvent("text", { chunk: chunkText });
                } else {
                  // Web search mode: buffer initial tokens to inspect if this turn outputs a tool_call
                  textBuffer += chunkText;
                  if (!flushedToClient) {
                    if (textBuffer.includes("web_search") || textBuffer.includes("read_webpage") || textBuffer.includes("tool_call")) {
                      isToolCallDetected = true;
                    } else if ((textBuffer.length >= 15 || textBuffer.includes(" ")) && !isToolCallDetected) {
                      flushedToClient = true;
                      sendEvent("text", { chunk: textBuffer });
                    }
                  } else {
                    sendEvent("text", { chunk: chunkText });
                  }
                }
              }
            );

            const searchMatch = turnOutput.match(/web_search\("([^"]+)"\)/i);
            const readMatch = turnOutput.match(/read_webpage\(\s*"([^"]+)"(?:\s*,\s*"([^"]+)")?\s*\)/i);

            if (webSearch && (searchMatch || readMatch)) {
              let toolName = "";
              let toolInput = "";
              let observation = "";

              if (searchMatch) {
                toolName = "web_search";
                toolInput = searchMatch[1];
                sendEvent("status", { message: `Executing web_search("${toolInput}")...` });
                const searchData = await executeWebSearch(toolInput);
                observation = searchData.searchSummary;
                allSources.push(...searchData.sources);

                // AUTOMATIC DEEP WEBPAGE EXPLORATION & LLM RECAP:
                if (searchData.sources.length > 0) {
                  const bestUrl = searchData.sources[0];
                  sendEvent("status", { message: `Deep reading & summarizing top website (${bestUrl}) with LLM...` });
                  const pageRecap = await executeReadWebpage(bestUrl, toolInput || message, targetEndpoint, targetApiKey);
                  observation += `\n\n---\n\n[DEEP WEBPAGE EXPLORATION & LLM RECAP OF TOP SOURCE: ${bestUrl}]\n${pageRecap}`;
                }
              } else if (readMatch) {
                toolName = "read_webpage";
                const targetUrl = readMatch[1];
                const specificQuery = readMatch[2] || "";
                toolInput = specificQuery ? `"${targetUrl}", "${specificQuery}"` : `"${targetUrl}"`;

                sendEvent("status", { message: `Reading and summarizing webpage "${targetUrl}" with LLM...` });
                observation = await executeReadWebpage(targetUrl, specificQuery, targetEndpoint, targetApiKey);
                allSources.push(targetUrl);
              }

              const newSummary = `[Agent Tool Call ${turnCount}]: ${toolName}(${toolInput})\n\n${observation}`;
              combinedSearchSummary = combinedSearchSummary ? `${combinedSearchSummary}\n\n---\n\n${newSummary}` : newSummary;

              sendEvent("searchSummary", {
                summary: combinedSearchSummary,
                sources: Array.from(new Set(allSources))
              });

              // Append agent tool call and system observation turn to messages trajectory
              currentMessages.push({ role: "assistant", content: `\`\`\`tool_call\n${toolName}(${toolInput})\n\`\`\`` });
              currentMessages.push({
                role: "user",
                content: `[SYSTEM OBSERVATION / TOOL RESPONSE FOR ${toolName}(${toolInput})]:\n${observation || "No content returned."}\n\n[INSTRUCTION]: Read the content above carefully and answer the user's question with full detail.`
              });

            } else {
              // Direct answer reached!
              finalAnswer = turnOutput.replace(/```tool_call[\s\S]*?```/g, "").trim();

              if (!finalAnswer) {
                finalAnswer = `Hello! I am ${modelDisplayName}. How can I assist you today?`;
                sendEvent("text", { chunk: finalAnswer });
              } else if (webSearch && !flushedToClient) {
                // If web search was on but no tool call occurred and buffer wasn't flushed yet
                sendEvent("text", { chunk: finalAnswer });
              }

              break;
            }
          }

          // If research was performed, stream the final synthesized answer in REAL-TIME during generation!
          if (!finalAnswer && combinedSearchSummary) {
            sendEvent("status", { message: "Synthesizing final answer from research..." });
            currentMessages.push({
              role: "user",
              content: "[INSTRUCTION]: Research phase complete. Synthesize a complete, detailed, and highly accurate final answer now based on the search observations above."
            });

            const synthesizedOutput = await invokeModel(
              targetEndpoint,
              targetApiKey,
              currentMessages,
              deepReasoning ? 2048 : 1536,
              deepReasoning ? 0.3 : 0.7,
              (chunkText) => {
                // Genuine Real-Time SSE Stream Forwarding to UI during RunPod generation
                if (!chunkText.includes("tool_call") && !chunkText.includes("web_search") && !chunkText.includes("read_webpage")) {
                  sendEvent("text", { chunk: chunkText });
                }
              }
            );

            finalAnswer = synthesizedOutput.replace(/```tool_call[\s\S]*?```/g, "").trim();
          }

          const latencyMs = Date.now() - startTime;
          sendEvent("done", { model: modelDisplayName, latency: `${latencyMs}ms` });

          controller.close();
        } catch (err) {
          sendEvent("error", { message: String(err) });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", response: `Edge Error: ${String(err)}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});