const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const newsRoutes = require('./routes/newsRoutes');
const cors = require('cors');
const path = require('path');
const recommendRoutes = require('./routes/recommendRoutes'); 
const statsRoutes = require('./routes/StatRoute'); 
const cron = require('node-cron');


dotenv.config();
connectDB();

const app = express();

const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NewsPulse Backend API is running',
    timestamp: new Date().toISOString(),
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/recommend', recommendRoutes); 
app.use('/api/stats', statsRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size is 5MB',
    });
  }

  if (err.message && err.message.includes('Only image files')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});


async function sendDailyNewsletter() {
  const articles = await getTopHeadlines();

  if (!articles.length) return console.log("No news to send!");

  const html = `
    <h2>Today's Headlines from NewsPulse</h2>
    <ul>
      ${articles
        .map(
          (a) =>
            `<li><a href="${a.url}" target="_blank">${a.title}</a><br/><small>${a.source.name}</small></li>`
        )
        .join("")}
    </ul>
    <p>Have a great day!</p>`;

  await sendEmail("Daily Newsletter", html);
}
cron.schedule("0 8 * * *", () => {
  sendDailyNewsletter();
});
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});