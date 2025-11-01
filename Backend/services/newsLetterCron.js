const cron = require("node-cron");
const mongoose = require("mongoose");
const { getTopHeadlines } = require("./newsService.js");
const { sendEmail } = require("./emailService.js");
const User = require("../models/User.js");
require("dotenv").config();
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected for cron"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

function startNewsletterCron() {
  cron.schedule("0 * * * *", async () => {
    const now = new Date().toLocaleString();
    console.log(`[${now}] Cron started`);

    try {
      const articles = await getTopHeadlines();
      if (!articles.length) {
        console.log(`[${now}] No articles found`);
        return;
      }

      const subscribedUsers = await User.find({ isSubscribed: true }).select("email username");
      if (!subscribedUsers.length) {
        console.log(`[${now}] No subscribed users`);
        return;
      }

      const html = `
        <h2>Latest Headlines from NewsPulse</h2>
        <ul>
          ${articles
            .map(
              (a) =>
                `<li><a href="${a.url}" target="_blank">${a.title}</a>
                 <small>${a.source.name}</small></li>`
            )
            .join("")}
        </ul>
        <p>Have a great day!</p>
      `;

      for (const user of subscribedUsers) {
        try {
          await sendEmail(`Hello ${user.username}, Your NewsPulse Update`, html, user.email);
          console.log(`[${now}] Newsletter sent to ${user.email}`);
        } catch (err) {
          console.error(`[${now}] Failed to send to ${user.email}:`, err);
        }
      }
    } catch (err) {
      console.error(`[${now}] Cron failed:`, err);
    }
  });
}

module.exports = { startNewsletterCron };
