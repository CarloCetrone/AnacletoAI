/**
 * ANACLETO AI - Sovereign Session & Multi-Turn Chat Backend
 * Google Apps Script Web App Endpoint
 */

var DEEPSEEK_API_KEY = "DEEPSEEK_API_KEY_HERE";
var PRIMARY_MODEL = "deepseek-chat";
var ANACLETO_BRAND_MODEL = "Anacleto-120B-Omni";
var DEEPSEEK_BASE_URL = "https://api.deepseek.com/chat/completions";

function doGet(e) {
  return handleChatRequest(e);
}

function doPost(e) {
  return handleChatRequest(e);
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

    // Parse full conversation history sent from frontend for multi-turn follow up
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

    // Construct multi-turn messages array with full context memory
    var apiMessages = [
      {
        role: "system",
        content: "You are Anacleto AI, a sovereign enterprise foundation model (Anacleto-120B-Omni). Provide concise, highly technical, intelligent, and accurate responses. Maintain context across user follow-up questions."
      }
    ];

    // Append prior message history for this active chat session
    for (var i = 0; i < conversationHistory.length; i++) {
      var item = conversationHistory[i];
      if (item.sender === "user") {
        apiMessages.push({ role: "user", content: item.text });
      } else if (item.sender === "ai" && item.id !== "welcome-msg") {
        apiMessages.push({ role: "assistant", content: item.text });
      }
    }

    // Append current user message if not already included
    if (userContent && (apiMessages.length === 1 || apiMessages[apiMessages.length - 1].content !== userContent)) {
      apiMessages.push({ role: "user", content: userContent });
    }

    var payload = {
      model: PRIMARY_MODEL,
      messages: apiMessages,
      stream: false,
      temperature: 0.7,
      max_tokens: 2048
    };

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "Authorization": "Bearer " + DEEPSEEK_API_KEY,
        "Accept": "application/json"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(DEEPSEEK_BASE_URL, options);
    var endTime = new Date().getTime();
    var latencyMs = endTime - startTime;
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();

    if (responseCode === 200) {
      var json = JSON.parse(responseText);
      if (json.choices && json.choices.length > 0 && json.choices[0].message) {
        return responseJSON({
          status: "success",
          response: json.choices[0].message.content,
          model: ANACLETO_BRAND_MODEL,
          latency: latencyMs + "ms"
        });
      }
    }

    Logger.log("API Error (" + responseCode + "): " + responseText);

    return responseJSON({
      status: "error",
      response: "Inference Error (" + responseCode + "): " + responseText,
      model: ANACLETO_BRAND_MODEL,
      latency: latencyMs + "ms"
    });

  } catch (err) {
    Logger.log("Execution Error: " + err.toString());
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
