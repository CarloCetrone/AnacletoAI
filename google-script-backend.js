/**
 * ANACLETO AI - Enterprise Contact & Demo Request Handler
 * Google Apps Script Web App Endpoint
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // Setup CORS Headers
  var output = ContentService.createTextOutput();
  
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

    var nome = params.nome || params.fullName || "Non specificato";
    var emailUtente = params.email || params.workEmail || "";
    var azienda = params.azienda || params.company || "";
    var messaggio = params.messaggio || params.projectDetails || "";
    var tipoRichiesta = params.type || (azienda ? "DEMO" : "CONTATTO");

    if (!emailUtente) {
      return responseJSON({ status: "error", message: "Email obbligatoria" });
    }

    var mioAlias = "info@anacletoai.com";
    var destinatario = "info@anacletoai.com";
    var oggettoEmail = "";
    var corpoEmail = "";

    if (tipoRichiesta === "DEMO" || azienda) {
      oggettoEmail = "🚀 [Anacleto AI Demo Request] " + (azienda ? azienda : nome);
      corpoEmail = "Hai ricevuto una nuova richiesta DEMO dal sito web Anacleto AI!\n\n" +
                   "═══════════════════════════════════════════\n" +
                   "👤 Nome: " + nome + "\n" +
                   "🏢 Azienda/Ente: " + (azienda || "N/D") + "\n" +
                   "✉️ Email Lavoro: " + emailUtente + "\n" +
                   "📝 Dettagli Progetto: " + messaggio + "\n" +
                   "═══════════════════════════════════════════\n\n" +
                   "--> Clicca su 'Rispondi' per rispondere direttamente a: " + emailUtente;
    } else {
      oggettoEmail = "📩 [Anacleto AI Contatto] Da " + nome;
      corpoEmail = "Hai ricevuto un nuovo messaggio dal form CONTATTI!\n\n" +
                   "═══════════════════════════════════════════\n" +
                   "👤 Nome: " + nome + "\n" +
                   "🏢 Azienda/Ente: " + (azienda || "N/D") + "\n" +
                   "✉️ Email: " + emailUtente + "\n" +
                   "💬 Messaggio: " + messaggio + "\n" +
                   "═══════════════════════════════════════════\n\n" +
                   "--> Clicca su 'Rispondi' per rispondere direttamente a: " + emailUtente;
    }

    // Attempt sending via alias, fallback to standard MailApp
    try {
      GmailApp.sendEmail(destinatario, oggettoEmail, corpoEmail, {
        from: mioAlias,
        replyTo: emailUtente,
        name: "Anacleto AI Enterprise Web"
      });
    } catch (err) {
      MailApp.sendEmail(destinatario, oggettoEmail, corpoEmail, {
        replyTo: emailUtente
      });
    }

    return responseJSON({ status: "success", message: "Email inviata con successo" });

  } catch (globalErr) {
    return responseJSON({ status: "error", message: globalErr.toString() });
  }
}

function responseJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function controllaAlias() {
  var aliases = GmailApp.getAliases();
  Logger.log("I tuoi alias registrati:");
  Logger.log(aliases);
  if (aliases.indexOf("info@anacletoai.com") !== -1) {
    Logger.log("✅ L'alias 'info@anacletoai.com' è attivo!");
  } else {
    Logger.log("❌ L'alias 'info@anacletoai.com' non è configurato.");
  }
}
