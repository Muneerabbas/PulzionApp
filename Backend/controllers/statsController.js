// controllers/statsController.js
const { getStatsData } = require('../services/statsService');

const getStats = async (req, res) => {
  try {
    const stats = await getStatsData();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { getStats };
