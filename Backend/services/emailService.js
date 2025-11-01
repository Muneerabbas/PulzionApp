const nodemailer = require('nodemailer');

const sendEmail = async (subject, html, toEmail) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"NewsPulse" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html,
    });

    console.log(`📧 Email sent to ${toEmail}`);
  } catch (err) {
    console.error("❌ Email send error:", err.message);
    throw err; 
  }
}

module.exports = sendEmail;

