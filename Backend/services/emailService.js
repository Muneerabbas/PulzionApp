import nodemailer from "nodemailer";

export async function sendEmail(subject, html) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "muneer.abbas9595@gmail.com",
      pass: "passwordNotWorking",
    },
  });

  await transporter.sendMail({
    from: `"Daily News" <muneer.abbas9595@gmail.com>`,
    to: "muneerisnoob@gmail.com",
    subject,
    html,
  });

  console.log("Email sent successfully!");
}
