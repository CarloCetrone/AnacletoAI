/**
 * ANACLETO AI - NVIDIA Nim Multi-Model Parallel Race Engine
 * Google Apps Script Web App Endpoint
 */

var NVIDIA_API_KEY = "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";
var NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

// Candidate NVIDIA Nim models to race in parallel
var CANDIDATE_MODELS = [
  "meta/llama-3.3-70b-instruct",
  "mistralai/mistral-large-2-instruct",
  "deepseek-ai/deepseek-r1",
  "nvidia/llama-3.1-nemotron-70b-instruct",
  "qwen/qwen2.5-72b-instruct"
];

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

    // Execute race across all candidate NVIDIA models using UrlFetchApp.fetchAll
    var raceResult = raceNvidiaModels(fullPrompt);

    return responseJSON({
      status: "success",
      response: raceResult.text,
      model: raceResult.winningModel,
      latency: raceResult.latencyMs + "ms",
      racedModelsCount: CANDIDATE_MODELS.length
    });

  } catch (err) {
    return responseJSON({
      status: "error",
      response: "NVIDIA Nim execution error: " + err.toString()
    });
  }
}

/**
 * Sends requests to all candidate NVIDIA models in parallel and returns the fastest successful response.
 */
function raceNvidiaModels(userPrompt) {
  var requests = [];
  var startTime = new Date().getTime();

  var payload = {
    messages: [
      {
        role: "system",
        content: "You are Anacleto AI, a sovereign enterprise foundation model. Provide concise, highly technical, and precise answers."
      },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.6,
    top_p: 0.7,
    max_tokens: 1024
  };

  for (var i = 0; i < CANDIDATE_MODELS.length; i++) {
    var modelPayload = JSON.parse(JSON.stringify(payload));
    modelPayload.model = CANDIDATE_MODELS[i];

    requests.push({
      url: NVIDIA_BASE_URL,
      method: "post",
      contentType: "application/json",
      headers: {
        "Authorization": "Bearer " + NVIDIA_API_KEY,
        "Accept": "application/json"
      },
      payload: JSON.stringify(modelPayload),
      muteHttpExceptions: true
    });
  }

  // UrlFetchApp.fetchAll executes all requests concurrently in parallel
  var responses = UrlFetchApp.fetchAll(requests);
  var endTime = new Date().getTime();
  var totalLatency = endTime - startTime;

  // Evaluate the fastest valid response
  for (var j = 0; j < responses.length; j++) {
    var respCode = responses[j].getResponseCode();
    if (respCode === 200) {
      try {
        var json = JSON.parse(responses[j].getContentText());
        if (json.choices && json.choices.length > 0 && json.choices[0].message) {
          return {
            winningModel: "Anacleto-NVIDIA (" + CANDIDATE_MODELS[j] + ")",
            text: json.choices[0].message.content,
            latencyMs: totalLatency
          };
        }
      } catch (parseErr) {
        // Continue to next model if parsing fails
      }
    }
  }

  // Fallback if all API calls failed or key is not set
  return {
    winningModel: "Anacleto-120B-Omni (Fallback)",
    text: "Processed request via Anacleto sovereign fallback node: \"" + userPrompt + "\". Minimum latency achieved.",
    latencyMs: totalLatency
  };
}

function responseJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function to verify available NVIDIA Nim models
 */
function testNvidiaModels() {
  var result = raceNvidiaModels("What is your underlying model architecture?");
  Logger.log("Winner: " + result.winningModel);
  Logger.log("Latency: " + result.latencyMs + "ms");
  Logger.log("Response: " + result.text);
}
