/**
 * ANACLETO AI - Enterprise Inquiry Handler
 * Google Apps Script Web App Endpoint
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    var params = {};

    // Support both GET query parameters and POST JSON/Form bodies
    if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        params = e.parameter || {};
      }
    } else if (e && e.parameter) {
      params = e.parameter;
    }

    var fullName = params.fullName || params.nome || "Unspecified";
    var workEmail = params.workEmail || params.email || "";
    var company = params.company || params.azienda || "N/A";
    var projectDetails = params.projectDetails || params.messaggio || "N/A";

    if (!workEmail) {
      return responseJSON({ status: "error", message: "Work email is required." });
    }

    var senderAlias = "info@anacletoai.com";
    var recipientEmail = "info@anacletoai.com";

    var emailSubject = "[Anacleto AI Inquiry] " + company + " - " + fullName;
    var emailBody = "New inquiry received from the website:\n\n" +
                    "Full Name: " + fullName + "\n" +
                    "Company: " + company + "\n" +
                    "Work Email: " + workEmail + "\n" +
                    "Project / Research Scope:\n" + projectDetails + "\n\n" +
                    "Reply directly to this email to contact the user.";

    try {
      GmailApp.sendEmail(recipientEmail, emailSubject, emailBody, {
        from: senderAlias,
        replyTo: workEmail,
        name: "Anacleto AI Website"
      });
    } catch (err) {
      MailApp.sendEmail(recipientEmail, emailSubject, emailBody, {
        replyTo: workEmail
      });
    }

    return responseJSON({ status: "success", message: "Inquiry sent successfully." });

  } catch (globalErr) {
    return responseJSON({ status: "error", message: globalErr.toString() });
  }
}

function responseJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkAlias() {
  var aliases = GmailApp.getAliases();
  Logger.log("Registered Aliases:");
  Logger.log(aliases);
  if (aliases.indexOf("info@anacletoai.com") !== -1) {
    Logger.log("Alias info@anacletoai.com is active.");
  } else {
    Logger.log("Alias info@anacletoai.com not found.");
  }
}
