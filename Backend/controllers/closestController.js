// controllers/closestController.js
const ClosestService = require('../services/closestService');

const getClosestArticles = async (req, res) => {
  const { query, topK, recencyDays } = req.body;

  try {
    const results = await ClosestService.getClosestArticles({
      query,
      topK: topK ? parseInt(topK) : 5,
      recencyDays: recencyDays ? parseInt(recencyDays) : 60,
    });

    res.json({
      success: true,
      query,
      topK: results.length,
      results,
      count: results.length,
    });
  } catch (err) {
    console.error('Closest search failed:', err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

module.exports = { getClosestArticles };