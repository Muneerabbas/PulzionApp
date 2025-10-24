const express = require('express');
const {
  getTopHeadlines,
  searchNews,
  getNewsSources,
  getCategories,
} = require('../controllers/newsController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/headlines', optionalAuth, getTopHeadlines);
router.get('/search', optionalAuth, searchNews);
router.get('/sources', optionalAuth, getNewsSources);
router.get('/categories', getCategories);

module.exports = router;
