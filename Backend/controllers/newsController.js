const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const NEWS_API_KEY = process.env.NEWS_API;
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

const getTopHeadlines = async (req, res) => {
  try {
    const { category = 'general', country = 'us', pageSize = 20, page = 1 } = req.query;

    if (!NEWS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'News API key not configured',
      });
    }

    const response = await axios.get(`${NEWS_API_BASE_URL}/top-headlines`, {
      params: {
        apiKey: NEWS_API_KEY,
        category,
        country,
        pageSize,
        page,
      },
    });

    res.json({
      success: true,
      totalResults: response.data.totalResults,
      articles: response.data.articles,
      category,
      country,
    });
  } catch (err) {
    console.error('Get headlines error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.message || 'Failed to fetch headlines',
    });
  }
};

const searchNews = async (req, res) => {
  try {
    const { q, sortBy = 'publishedAt', pageSize = 20, page = 1, language = 'en' } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    if (!NEWS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'News API key not configured',
      });
    }

    const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
      params: {
        apiKey: NEWS_API_KEY,
        q,
        sortBy,
        pageSize,
        page,
        language,
      },
    });

    res.json({
      success: true,
      totalResults: response.data.totalResults,
      articles: response.data.articles,
      query: q,
    });
  } catch (err) {
    console.error('Search news error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.message || 'Failed to search news',
    });
  }
};

const getNewsSources = async (req, res) => {
  try {
    const { category, language = 'en', country } = req.query;

    if (!NEWS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'News API key not configured',
      });
    }

    const params = {
      apiKey: NEWS_API_KEY,
      language,
    };

    if (category) params.category = category;
    if (country) params.country = country;

    const response = await axios.get(`${NEWS_API_BASE_URL}/sources`, {
      params,
    });

    res.json({
      success: true,
      sources: response.data.sources,
    });
  } catch (err) {
    console.error('Get sources error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.message || 'Failed to fetch sources',
    });
  }
};

const getCategories = (req, res) => {
  const categories = [
    { id: 'general', name: 'General' },
    { id: 'business', name: 'Business' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'health', name: 'Health' },
    { id: 'science', name: 'Science' },
    { id: 'sports', name: 'Sports' },
    { id: 'technology', name: 'Technology' },
  ];

  res.json({
    success: true,
    categories,
  });
};

module.exports = {
  getTopHeadlines,
  searchNews,
  getNewsSources,
  getCategories,
};
