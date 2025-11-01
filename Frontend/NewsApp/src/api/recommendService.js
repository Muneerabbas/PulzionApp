// src/api/recommendService.js
import axiosInstance from './axiosInstance';


export const getRecommendations = async (payload) => {
  try {
    const response = await axiosInstance.post('/recommend', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to get recommendations' };
  }
};

export const getSimilarArticles = async (articleId) => {
  try {
    const response = await axiosInstance.post('/recommend/similar', {
      articleId,
      topK: 20,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to find similar articles' };
  }
};


export const getClosestArticles = async (query) => {
  try {
    const response = await axiosInstance.post('/recommend/closest', {
      query,
      topK: 20,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to find closest articles' };
  }
};