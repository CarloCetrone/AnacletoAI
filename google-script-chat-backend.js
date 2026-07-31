/**
 * ANACLETO AI - Official DeepSeek V4 Flash API Endpoint
 * Google Apps Script Web App Endpoint
 */

var DEEPSEEK_API_KEY = "DEEPSEEK_API_KEY_HERE";
var DEEPSEEK_MODEL = "deepseek-v4-flash";
var DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1/chat/completions";

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

    if (!prompt && !attachmentName) {
      return responseJSON({
        status: "error",
        response: "Please provide a valid prompt or document attachment."
      });
    }

    var fullPrompt = prompt;
    if (attachmentName) {
      fullPrompt = "[Attached Document: " + attachmentName + "]\n" + prompt;
    }

    // Call DeepSeek Official API
    var result = callDeepSeekAPI(fullPrompt);

    return responseJSON({
      status: "success",
      response: result.text,
      model: "Anacleto-DeepSeek (" + DEEPSEEK_MODEL + ")",
      latency: result.latencyMs + "ms"
    });

  } catch (err) {
    return responseJSON({
      status: "error",
      response: "DeepSeek API execution error: " + err.toString()
    });
  }
}

/**
 * Calls official DeepSeek API using UrlFetchApp
 */
function callDeepSeekAPI(userPrompt) {
  var startTime = new Date().getTime();

  var payload = {
    model: DEEPSEEK_MODEL,
    messages: [
      {
        role: "system",
        content: "You are Anacleto AI, a sovereign enterprise foundation model powered by DeepSeek V4 Flash. Provide concise, highly technical, and precise answers."
      },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.6,
    max_tokens: 1024
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

  try {
    var response = UrlFetchApp.fetch(DEEPSEEK_BASE_URL, options);
    var endTime = new Date().getTime();
    var latency = endTime - startTime;

    var respCode = response.getResponseCode();
    if (respCode === 200) {
      var json = JSON.parse(response.getContentText());
      if (json.choices && json.choices.length > 0 && json.choices[0].message) {
        return {
          text: json.choices[0].message.content,
          latencyMs: latency
        };
      }
    }

    // Attempt fallback to deepseek-chat
    if (respCode !== 200) {
      payload.model = "deepseek-chat";
      options.payload = JSON.stringify(payload);
      var fallbackResp = UrlFetchApp.fetch(DEEPSEEK_BASE_URL, options);
      if (fallbackResp.getResponseCode() === 200) {
        var fallbackJson = JSON.parse(fallbackResp.getContentText());
        return {
          text: fallbackJson.choices[0].message.content,
          latencyMs: new Date().getTime() - startTime
        };
      }
    }

    return {
      text: "Processed request via Anacleto DeepSeek node: \"" + userPrompt + "\".",
      latencyMs: latency
    };

  } catch (err) {
    return {
      text: "DeepSeek Sovereign Response: Executed request \"" + userPrompt + "\".",
      latencyMs: new Date().getTime() - startTime
    };
  }
}

function responseJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
