
// controllers/recommendController.js
const { getRecommendations } = require('../services/recommendService');

const getRecommendationsHandler = async (req, res) => {
  try {
    const {
      articleId,
      topK = 5,
      similarK = 3,
      diverseK = 2,
      userHistory = [],
      recencyDays = 60,
      sentiment,
      topic = [],
      userProfile = {},
    } = req.body;


  

    if (topK < 1 || topK > 50) {
      return res.status(400).json({
        success: false,
        message: 'topK must be between 1 and 50',
      });
    }

    const recs = await getRecommendations({
      articleId,
      topK,
      similarK,
      diverseK,
      userHistory: Array.isArray(userHistory) ? userHistory : [],
      recencyDays,
      sentiment: sentiment === 'any' ? undefined : sentiment,
      topic: Array.isArray(topic) ? topic : [],
      userProfile: userProfile || {},
    });

    res.json({
      success: true,
      data: {
        recommendations: recs,
        count: recs.length,
      },
    });
  } catch (err) {
    console.error('Recommendation Error:', err.message);

    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

module.exports = { getRecommendations: getRecommendationsHandler };