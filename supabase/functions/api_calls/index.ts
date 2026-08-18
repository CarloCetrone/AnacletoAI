import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NVIDIA_API_KEY = Deno.env.get("NVIDIA_API_KEY") || "";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

// All Anacleto model variants map to Nemotron Lightning
const MODEL_NAME = "nvidia/nemotron-3.5-lightning-30b-a3b";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, x-api-key, api-key, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const xApiKey = req.headers.get("x-api-key") || req.headers.get("api-key") || "";
    
    let apiKey = xApiKey.trim();
    if (!apiKey && authHeader) {
      apiKey = authHeader.replace("Bearer ", "").trim();
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: { 
            message: "Missing API Key header. Pass 'Authorization: Bearer anc_live_...' or 'x-api-key: anc_live_...'",
            type: "invalid_request_error",
            code: "missing_api_key"
          } 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Setup Supabase Admin Client for database authentication & usage logging
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    let userId: string | null = null;
    let enterpriseId: string | null = null;

    // Verify key in public.api_keys table
    if (apiKey.startsWith("anc_live_") || apiKey.startsWith("sk-proj-")) {
      let { data: keyData } = await adminSupabase
        .from("api_keys")
        .select("user_id, status")
        .eq("key_value", apiKey)
        .maybeSingle();

      if (!keyData) {
        const fallback = await adminSupabase
          .from("api_keys")
          .select("user_id, status")
          .eq("key", apiKey)
          .maybeSingle();
        if (fallback.data) {
          keyData = fallback.data;
        }
      }

      if (keyData && keyData.status === "disabled") {
        return new Response(
          JSON.stringify({ 
            error: { 
              message: "Unauthorized: This API Key has been disabled.", 
              type: "invalid_request_error",
              code: "api_key_disabled"
            } 
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (keyData && keyData.user_id) {
        userId = keyData.user_id;
      }

      // Update last_used_at timestamp asynchronously if key exists
      if (keyData) {
        adminSupabase
          .from("api_keys")
          .update({ last_used_at: new Date().toISOString() })
          .eq("key_value", apiKey)
          .then();
      }

      if (userId) {
        const { data: userProf } = await adminSupabase
          .from("profiles")
          .select("enterprise_id")
          .eq("id", userId)
          .maybeSingle();
        if (userProf?.enterprise_id) {
          enterpriseId = userProf.enterprise_id;
        }
      }
    } else {
      // Fallback check JWT if passed directly by authenticated client session
      const token = apiKey;
      const { data: { user }, error: userError } = await adminSupabase.auth.getUser(token);
      if (userError || !user) {
        return new Response(
          JSON.stringify({ 
            error: { 
              message: "Unauthorized: Invalid token or API key", 
              type: "invalid_request_error",
              code: "invalid_api_key"
            } 
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = user.id;

      const { data: userProf } = await adminSupabase
        .from("profiles")
        .select("enterprise_id")
        .eq("id", userId)
        .maybeSingle();
      if (userProf?.enterprise_id) {
        enterpriseId = userProf.enterprise_id;
      }
    }

    // Parse incoming request payload
    const body = await req.json();
    const { 
      messages, 
      stream = false, 
      temperature = 0.7, 
      max_tokens = 1024, 
      model = "Anacleto Medium",
      tools,
      tool_choice,
      enable_thinking = false,
      reasoning_budget = 0
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ 
          error: { 
            message: "Missing 'messages' array in request body.", 
            type: "invalid_request_error", 
            code: "bad_request" 
          } 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isStreaming = Boolean(stream);

    // Build the dynamic payload
    const nvidiaPayload: any = {
      model: MODEL_NAME,
      messages: messages,
      temperature: temperature,
      max_tokens: max_tokens,
      stream: isStreaming,
      chat_template_kwargs: { "enable_thinking": Boolean(enable_thinking) },
      reasoning_budget: Number(reasoning_budget) || 0
    };

    if (tools) nvidiaPayload.tools = tools;
    if (tool_choice) nvidiaPayload.tool_choice = tool_choice;

    // Call NVIDIA API directly with raw stream forwarding for true 0-latency streaming
    const nvidiaResponse = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": isStreaming ? "text/event-stream" : "application/json",
      },
      body: JSON.stringify(nvidiaPayload),
    });

    if (!nvidiaResponse.ok) {
      const errText = await nvidiaResponse.text();
      return new Response(errText, { 
        status: nvidiaResponse.status, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Format model_name with (API) tag for channel source analytics
    const formattedModelName = typeof model === 'string' && model.toLowerCase().includes('small') 
      ? 'Anacleto Small (API)' 
      : typeof model === 'string' && model.toLowerCase().includes('large') 
      ? 'Anacleto Large (API)' 
      : 'Anacleto Medium (API)';

    const estInput = Math.ceil(JSON.stringify(messages).length / 4);
    const estOutput = 200;

    // Calculate cost based on model rate per 1M tokens
    const isLargeModel = formattedModelName.includes('Large');
    const isSmallModel = formattedModelName.includes('Small');
    const inRate = isLargeModel ? 2.50 : isSmallModel ? 0.15 : 0.70;
    const outRate = isLargeModel ? 10.00 : isSmallModel ? 0.60 : 2.80;
    const computedCost = (estInput * inRate + estOutput * outRate) / 1000000;

    const logUsage = async () => {
      if (!userId) return;
      try {
        await adminSupabase.from("token_usage").insert({
          user_id: userId,
          model_name: formattedModelName,
          input_tokens: estInput,
          output_tokens: estOutput,
          enterprise_id: enterpriseId
        });

        const targetBilledUserId = enterpriseId || userId;
        const { data } = await adminSupabase
          .from("profiles")
          .select("credit_balance")
          .eq("id", targetBilledUserId)
          .maybeSingle();

        if (data && data.credit_balance !== null && data.credit_balance !== undefined) {
          const currentBal = Number(data.credit_balance);
          const updatedBal = Math.max(0, currentBal - computedCost);
          await adminSupabase
            .from("profiles")
            .update({ credit_balance: updatedBal })
            .eq("id", targetBilledUserId);
        }
      } catch (err) {
        console.error("Error logging usage:", err);
      }
    };

    if (isStreaming) {
      const stream = new ReadableStream({
        async start(controller) {
          if (!nvidiaResponse.body) {
            controller.close();
            return;
          }
          const reader = nvidiaResponse.body.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } catch (e) {
            console.error("Streaming error:", e);
            controller.error(e);
          } finally {
            // Await DB updates before closing the stream controller 
            // to ensure the edge function isolate doesn't terminate prematurely
            await logUsage();
            
            controller.close();
            reader.releaseLock();
          }
        }
      });

      return new Response(stream, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    } else {
      const responseData = await nvidiaResponse.json();
      
      // Update database before returning response
      await logUsage();

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error: any) {
    console.error("API Calls Function Error:", error);
    return new Response(
      JSON.stringify({ 
        error: { 
          message: error.message || "Internal Server Error", 
          type: "api_error",
          code: "internal_error"
        } 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
