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
const { startNewsletterCron } = require('./services/newsLetterCron');
dotenv.config();
connectDB();

const app = express();

const corsOptions = {
  origin: process.env.CLIENT_URL || "*",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "NewsPulse Backend API is running",
    timestamp: new Date().toISOString(),
  });
});
const emailRoutes = require("./routes/emailRoutes.js");

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/recommend", recommendRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/email", emailRoutes);
startNewsletterCron();

// Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  server.close(() => process.exit(1));
});
