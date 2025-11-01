const nodemailer = require("nodemailer");
 async function sendEmail(subject, html) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "muneer.abbas9595@gmail.com",
      pass: "dkaf pcpv celd aomb", 
    },
  });

  await transporter.sendMail({
    from: `"Daily News" <muneer.abbas9595@gmail.com>`,
    to: "manaskhairnar1511@gmail.com",
    subject,
    html,
  });

  console.log("✅ Email sent successfully!");
}
module.exports = { sendEmail };

