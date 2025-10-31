const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendController');
const { getSimilarArticles } = require('../controllers/similarController');
const { getClosestArticles } = require('../controllers/closestController');

router.post('/', getRecommendations);
router.post('/similar', getSimilarArticles);
router.post('/closest', getClosestArticles);

module.exports = router;