const SibApiV3Sdk = require("sib-api-v3-sdk");
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (options) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = options.subject;
  sendSmtpEmail.htmlContent = options.message;
  sendSmtpEmail.sender = {
    name: process.env.BREVO_SENDER_NAME || "CodeArena",
    email: process.env.BREVO_SENDER_EMAIL || "noreply@codearena.com",
  };
  sendSmtpEmail.to = [{ email: options.email }];

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent. Message ID: " + data.messageId);
    return data;
  } catch (error) {
    console.error(
      "Brevo Email Error:",
      error.response ? error.response.body : error.message,
    );
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
