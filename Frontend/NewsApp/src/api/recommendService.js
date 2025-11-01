// src/api/recommendService.js
import axiosInstance from './axiosInstance';

/**
 * Gets personalized recommendations based on user activity.
 * Corresponds to POST /api/recommend
 * @param {object} payload
 * @param {string} [payload.articleId] - Recommend based on a single article
 * @param {string[]} [payload.likedArticleIds] - Recommend based on liked articles
 * @param {string[]} [payload.userHistory] - Articles to exclude
 * @param {object} [payload.userProfile] - { categories: [...] }
 */
export const getRecommendations = async (payload) => {
  try {
    const response = await axiosInstance.post('/recommend', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to get recommendations' };
  }
};

/**
 * Finds articles similar to a specific one.
 * Corresponds to POST /api/recommend/similar
 * @param {string} articleId - The ID of the article to base similarity on
 */
export const getSimilarArticles = async (articleId) => {
  try {
    const response = await axiosInstance.post('/recommend/similar', {
      articleId,
      topK: 5,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to find similar articles' };
  }
};

/**
 * Finds articles semantically closest to a text query.
 * Corresponds to POST /api/recommend/closest
 * @param {string} query - The text query (e.g., "latest on AI regulation")
 */
export const getClosestArticles = async (query) => {
  try {
    const response = await axiosInstance.post('/recommend/closest', {
      query,
      topK: 5,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to find closest articles' };
  }
};