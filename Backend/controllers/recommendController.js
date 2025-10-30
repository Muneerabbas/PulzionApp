// controllers/recommendController.js
const { getRecommendations } = require('../services/recommendService');

const getRecommendationsHandler = async (req, res) => {
  try {
    const {
      articleId,
      topK,
      similarK,
      diverseK,
      userHistory,
      recencyDays,
      sentiment,
      topic,
      userProfile,
    } = req.body;

    const recs = await getRecommendations({
      articleId,
      topK,
      similarK,
      diverseK,
      userHistory,
      recencyDays,
      sentiment,
      topic,
      userProfile,
    });

    res.json({
      success: true,
      data: { recommendations: recs, count: recs.length },
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getRecommendations: getRecommendationsHandler };