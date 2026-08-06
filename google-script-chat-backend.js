/**
 * ANACLETO AI - Sovereign Session & Multi-Turn Chat Backend
 * RunPod Serverless API Integration
 * Google Apps Script Web App Endpoint
 */

var RUNPOD_API_KEY = "YOUR_RUNPOD_API_KEY_HERE";
var RUNPOD_ENDPOINT_ID = "ywhi6e5t9yof38";
var RUNPOD_RUNSYNC_URL = "https://api.runpod.ai/v2/" + RUNPOD_ENDPOINT_ID + "/runsync";
var ANACLETO_BRAND_MODEL = "Anacleto-120B-Omni (RunPod)";

function doGet(e) {
  return handleChatRequest(e);
}

function doPost(e) {
  return handleChatRequest(e);
}

function parseRunpodOutput(output) {
  if (!output) return "";
  if (typeof output === "string") return output;

  var target = Array.isArray(output) ? output[0] : output;
  if (!target) return "";

  if (target.choices && Array.isArray(target.choices) && target.choices.length > 0) {
    var choice = target.choices[0];
    if (choice.message && choice.message.content) {
      return choice.message.content;
    }
    if (Array.isArray(choice.tokens)) {
      return choice.tokens.join("");
    }
    if (typeof choice.text === "string") {
      return choice.text;
    }
  }

  if (Array.isArray(target.tokens)) {
    return target.tokens.join("");
  }

  return "";
}

function handleChatRequest(e) {
  try {
    var params = {};

    if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        params = e.parameter || {};
      }
    } else if (e && e.parameter) {
      params = e.parameter;
    }

    var prompt = params.message || params.prompt || "";
    var attachmentName = params.attachment || "";
    var conversationHistory = [];

    if (params.history) {
      try {
        conversationHistory = typeof params.history === "string" ? JSON.parse(params.history) : params.history;
      } catch (hErr) {
        conversationHistory = [];
      }
    }

    if (!prompt && !attachmentName && conversationHistory.length === 0) {
      return responseJSON({
        status: "error",
        response: "Please enter a valid message."
      });
    }

    var userContent = prompt;
    if (attachmentName) {
      userContent = "[Attached File: " + attachmentName + "]\n" + prompt;
    }

    var startTime = new Date().getTime();

    var apiMessages = [
      {
        role: "system",
        content: "You are a helpful, smart, concise AI assistant."
      }
    ];

    for (var i = 0; i < conversationHistory.length; i++) {
      var item = conversationHistory[i];
      if (item.sender === "user") {
        apiMessages.push({ role: "user", content: item.text });
      } else if (item.sender === "ai" && item.id !== "welcome-msg") {
        apiMessages.push({ role: "assistant", content: item.text });
      }
    }

    if (userContent && (apiMessages.length === 1 || apiMessages[apiMessages.length - 1].content !== userContent)) {
      apiMessages.push({ role: "user", content: userContent });
    }

    var payload = {
      input: {
        messages: apiMessages,
        stream: false,
        sampling_params: {
          max_tokens: 512,
          temperature: 0.7
        }
      }
    };

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "Authorization": "Bearer " + RUNPOD_API_KEY,
        "Accept": "application/json"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(RUNPOD_RUNSYNC_URL, options);
    var endTime = new Date().getTime();
    var latencyMs = endTime - startTime;
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();

    if (responseCode === 200) {
      var json = JSON.parse(responseText);
      var replyText = parseRunpodOutput(json.output);

      if (replyText) {
        return responseJSON({
          status: "success",
          response: replyText,
          model: ANACLETO_BRAND_MODEL,
          latency: latencyMs + "ms"
        });
      }
    }

    return responseJSON({
      status: "error",
      response: "RunPod Inference Error (" + responseCode + "): " + responseText,
      model: ANACLETO_BRAND_MODEL,
      latency: latencyMs + "ms"
    });

  } catch (err) {
    return responseJSON({
      status: "error",
      response: "Execution error: " + err.toString()
    });
  }
}

function responseJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
