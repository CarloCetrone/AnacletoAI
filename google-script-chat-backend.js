/**
 * ANACLETO AI - Robust Official DeepSeek API Backend
 * Google Apps Script Web App Endpoint
 */

var DEEPSEEK_API_KEY = "DEEPSEEK_API_KEY_HERE";
var PRIMARY_MODEL = "deepseek-chat"; // Official DeepSeek V3/V4 chat endpoint
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

    if (!prompt && !attachmentName) {
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

    // Official DeepSeek API Request Format
    var payload = {
      model: PRIMARY_MODEL,
      messages: [
        {
          role: "system",
          content: "You are Anacleto AI, a sovereign enterprise foundation model powered by DeepSeek. Provide concise, highly technical, intelligent, and accurate responses."
        },
        {
          role: "user",
          content: userContent
        }
      ],
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
          model: "Anacleto-DeepSeek (" + PRIMARY_MODEL + ")",
          latency: latencyMs + "ms"
        });
      }
    }

    // Logging detailed error message if DeepSeek API fails
    Logger.log("DeepSeek API Error (" + responseCode + "): " + responseText);

    return responseJSON({
      status: "error",
      response: "DeepSeek API Error (" + responseCode + "): " + responseText,
      model: "Anacleto-DeepSeek",
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

/**
 * Run this function inside Google Apps Script editor to test DeepSeek API directly
 */
function testDeepSeekDirectly() {
  var testEvent = {
    parameter: {
      message: "What is Anacleto AI?"
    }
  };
  var res = handleChatRequest(testEvent);
  Logger.log(res.getContent());
}
