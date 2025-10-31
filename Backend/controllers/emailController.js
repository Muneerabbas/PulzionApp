const { sendEmail } = require("../services/emailService.js");

const sendCustomEmail = async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    if (!to) {
      return res.status(400).json({ success: false, message: "Recipient email required" });
    }

    const html = `
      <h2>${subject || "Message from NewsPulse"}</h2>
      <p>${message || "No message provided."}</p>
      <p style="margin-top: 20px;">Best regards,<br/>The NewsPulse Team</p>
    `;

    await sendEmail(subject || "NewsPulse Update", html, to);

    res.status(200).json({ success: true, message: "Email sent successfully!" });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ success: false, message: "Failed to send email." });
  }
};

module.exports = {
  sendCustomEmail,
};
