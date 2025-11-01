// src/api/newsService.js
import axiosInstance from './axiosInstance';

/**
 * Fetches top headlines.
 * Corresponds to your backend's GET /api/news/headlines
 * @param {string} category - e.g., 'general', 'business', 'sports'
 */
export const getHeadlines = async (category = 'general') => {
  try {
    // This calls https://pulzionapp.onrender.com/api/news/headlines
    const response = await axiosInstance.get('/news/headlines', {
      params: {
        category,
        country: 'us', // Your backend can handle the defaults
      },
    });
    // Return the data from your backend's response
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: `Failed to fetch ${category} news` };
  }
};

/**
 * Searches for news.
 * Corresponds to your backend's GET /api/news/search
 * @param {string} query - The search term, e.g., "trending"
 */
export const searchNews = async (query) => {
  try {
    // This calls https://pulzionapp.onrender.com/api/news/search
    const response = await axiosInstance.get('/news/search', {
      params: {
        q: query,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search news' };
  }
};

/**
 * Fetches the available categories from your backend.
 * Corresponds to your backend's GET /api/news/categories
 */
export const getCategories = async () => {
  try {
    const response = await axiosInstance.get('/news/categories');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch categories' };
  }
};