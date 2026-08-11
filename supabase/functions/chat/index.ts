import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RUNPOD_API_KEY = Deno.env.get("RUNPOD_API_KEY") || "";
const ENDPOINT_LARGE = Deno.env.get("RUNPOD_ENDPOINT_ID_LARGE") || "";
const ENDPOINT_MEDIUM = Deno.env.get("RUNPOD_ENDPOINT_ID_MEDIUM") || "";
const ENDPOINT_SMALL = Deno.env.get("RUNPOD_ENDPOINT_ID_SMALL") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool: Clean Search Query
function cleanSearchQuery(rawQuery: string): string {
  const cleaned = rawQuery
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\b(population|inhabitants|people|how many|how much|number of|who is|what is|when was|where is|popolazione|abitanti|quanti|live|living|inhabit|inhabits|location|find|info|search|map|coordinates|details|place|region|italy|country|city|town|village|a|the|in|of|about)\b/gi, "")
    .replace(/[,;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 1 ? cleaned : rawQuery.replace(/^["'\s]+|["'\s]+$/g, "").trim();
}

// Tool: Wikipedia Search Fallback
async function searchWikipedia(query: string) {
  const sources: string[] = [];
  const search_results: string[] = [];
  try {
    const wikiUrl = `https://it.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const wikiRes = await fetch(wikiUrl);
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const results = wikiData.query?.search || [];
      const topTitles = results.slice(0, 3).map((r: any) => r.title);
      
      if (topTitles.length > 0) {
        const extractUrl = `https://it.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(topTitles.join("|"))}&format=json&origin=*`;
        const extractRes = await fetch(extractUrl);
        if (extractRes.ok) {
          const extractData = await extractRes.json();
          const pagesObj = extractData.query?.pages || {};
          
          for (const pageId in pagesObj) {
            const page = pagesObj[pageId];
            if (page.title && page.extract) {
              const cleanExtract = page.extract.replace(/\s+/g, " ").trim();
              const pageUrl = `https://it.wikipedia.org/wiki/${encodeURIComponent(page.title)}`;
              if (cleanExtract.length > 20) {
                search_results.push(`Title: ${page.title}\nSnippet: ${cleanExtract.slice(0, 1000)}\nLink: ${pageUrl}`);
                sources.push(pageUrl);
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("Wiki Error:", e);
  }
  return { searchSummary: search_results.join("\n\n"), sources };
}

// Main Web Search Executor
async function executeWebSearch(rawQuery: string): Promise<{ searchSummary: string; sources: string[] }> {
  try {
    const search_results: string[] = [];
    const sources: string[] = [];
    const cleanQuery = cleanSearchQuery(rawQuery) || rawQuery;

    // Try DuckDuckGo first
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery).replace(/%20/g, "+")}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      }
    });

    if (res.ok) {
      const htmlText = await res.text();
      const snippetMatches = htmlText.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g) || [];
      const titleMatches = htmlText.match(/<a class="result__a[^>]*>([\s\S]*?)<\/a>/g) || [];

      for (let i = 0; i < Math.min(3, snippetMatches.length); i++) {
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
        if (cleanSnippet && cleanUrl) {
          search_results.push(`Title: ${cleanTitle || cleanQuery}\nSnippet: ${cleanSnippet}\nLink: ${cleanUrl}`);
          sources.push(cleanUrl);
        }
      }
    }

    if (search_results.length === 0) {
      return await searchWikipedia(cleanQuery);
    }
    return { searchSummary: search_results.join("\n\n"), sources };
  } catch (e) {
    return { searchSummary: `Search error: ${String(e)}`, sources: [] };
  }
}

// Generate an OpenAI API Chat Completion stream
async function callOpenAI(endpoint: string, apiKey: string, messages: any[], maxTokens: number, temperature: number) {
  const url = `https://api.runpod.ai/v2/${endpoint}/openai/v1/chat/completions`;
  return await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "",
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
      stream_options: { include_usage: true }
    })
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, history, attachment, fileContent, webSearch, deepReasoning, model } = await req.json();

    const targetApiKey = RUNPOD_API_KEY;
    let targetEndpoint = ENDPOINT_LARGE;
    let modelDisplayName = "Anacleto-Large";

    if (model === "anacleto-small" || model === "small") {
      targetEndpoint = ENDPOINT_SMALL;
      modelDisplayName = "Anacleto-Small";
    } else if (model === "anacleto-medium" || model === "medium" || model === "anacleto-7b" || model === "7b") {
      targetEndpoint = ENDPOINT_MEDIUM;
      modelDisplayName = "Anacleto-Medium";
    }

    // Protect against unconfigured endpoints
    if (!targetEndpoint) {
       throw new Error(`Endpoint for ${modelDisplayName} is not configured on Supabase Secrets.`);
    }

    // Authenticate user via Supabase JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized: " + (userError?.message || "User not found"));
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const currentDateStr = now.toISOString().split("T")[0];
    const currentTimeStr = now.toLocaleTimeString("en-US", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });

    // Modern System Prompt Architecture
    let systemPrompt = `You are ${modelDisplayName}, an advanced sovereign AI developed by Anacleto. 
Current Date: ${currentDateStr}
Current Time: ${currentTimeStr} (CEST/UTC+2)
Identity: You are highly intelligent, factual, and strictly follow user instructions. Always answer naturally and completely. Use beautiful markdown formatting when relevant.`;

    if (deepReasoning) {
      systemPrompt += `\n[REASONING MODE ENABLED]: You must first think step-by-step internally before answering. Output all your thoughts enclosed in <think> ... </think> tags. Do not skip the thinking phase.`;
    }

    if (webSearch) {
      systemPrompt += `\n[WEB SEARCH ENABLED]: You have access to real-time information via the tool: \`web_search("query")\`. 
To use it, reply EXACTLY with:
\`\`\`tool_call
web_search("your query here")
\`\`\`
Only use this tool if the user is asking about current events, facts, or information you don't know natively. Wait for the SYSTEM observation after making the call. Base your final response strictly on the retrieved observation.`;
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
      finalUserMessage = `[ATTACHMENT: ${attachment}]\n${fileContent}\n\n${finalUserMessage}`;
    }
    currentMessages.push({ role: "user", content: finalUserMessage });

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        const startTime = Date.now();
        sendEvent("status", { message: "Thinking..." });

        try {
          let turnCount = 0;
          const maxTurns = 3;
          let finalAnswerComplete = false;
          let allSources: string[] = [];

          while (turnCount < maxTurns && !finalAnswerComplete) {
            turnCount++;
            const response = await callOpenAI(
              targetEndpoint,
              targetApiKey,
              currentMessages,
              deepReasoning ? 2048 : 1024,
              deepReasoning ? 0.3 : 0.6
            );

            if (!response.ok) {
              const errText = await response.text();
              throw new Error(`Upstream API Error: ${response.status} ${errText}`);
            }

            if (!response.body) throw new Error("No response body from Upstream API");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";
            let fullTurnOutput = "";
            let toolCallDetected = false;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith("data: ") && trimmedLine !== "data: [DONE]") {
                  try {
                    const parsed = JSON.parse(trimmedLine.slice(6));
                    const token = parsed.choices?.[0]?.delta?.content || "";
                    if (token) {
                      fullTurnOutput += token;
                      
                      // Check if the stream starts generating a tool call
                      if (webSearch && (fullTurnOutput.includes("```tool_call") || fullTurnOutput.includes("web_search"))) {
                        toolCallDetected = true;
                      }

                      // If we are definitely not outputting a tool call, forward directly to client
                      if (!toolCallDetected) {
                        sendEvent("text", { chunk: token });
                      }
                    }
                  } catch (e) {
                     // ignore partial json
                  }
                }
              }
            }

            // After stream completion for the turn, process tool calls if detected
            if (toolCallDetected && fullTurnOutput.includes("web_search")) {
              const match = fullTurnOutput.match(/web_search\("([^"]+)"\)/i);
              if (match) {
                const query = match[1];
                sendEvent("status", { message: `Executing web_search("${query}")...` });
                
                const searchData = await executeWebSearch(query);
                allSources.push(...searchData.sources);
                
                sendEvent("searchSummary", {
                  summary: searchData.searchSummary,
                  sources: Array.from(new Set(allSources))
                });

                currentMessages.push({ role: "assistant", content: `\`\`\`tool_call\nweb_search("${query}")\n\`\`\`` });
                currentMessages.push({
                  role: "user",
                  content: `[SYSTEM OBSERVATION FOR web_search("${query}")]:\n${searchData.searchSummary || "No results."}\n\n[INSTRUCTION]: Answer the user based on the observation.`
                });
                
                sendEvent("status", { message: "Synthesizing answer..." });
              } else {
                // False alarm, send it directly
                sendEvent("text", { chunk: fullTurnOutput });
                finalAnswerComplete = true;
              }
            } else {
              finalAnswerComplete = true;
            }
            
            // Re-check for final usage token in OpenAI stream
            // In stream_options: { include_usage: true }, the last chunk contains a usage object
          }

          let finalInputTokens = 0;
          let finalOutputTokens = 0;

          const latencyMs = Date.now() - startTime;
          sendEvent("done", { model: modelDisplayName, latency: `${latencyMs}ms` });

          // Approximate tokens if usage isn't explicitly returned (fallback)
          finalInputTokens = Math.ceil(JSON.stringify(currentMessages).length / 4);
          const aiResponseText = currentMessages.filter(m => m.role === 'assistant').map(m => m.content).join(' ');
          finalOutputTokens = Math.ceil(aiResponseText.length / 4) + 150; // Add some base for reasoning overhead

          // Save Token Usage to Database asynchronously
          adminSupabase.from("token_usage").insert({
            user_id: user.id,
            model_name: modelDisplayName,
            input_tokens: finalInputTokens,
            output_tokens: finalOutputTokens
          }).then(({ error }) => {
            if (error) console.error("Failed to log token usage:", error);
          });

        } catch (err) {
          sendEvent("error", { message: String(err) });
        } finally {
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