// src/api/recommendService.js
import axiosInstance from './axiosInstance';

export const getRecommendations = async (payload) => {
  try {
    const response = await axiosInstance.post('/recommend', payload);
    if (__DEV__) console.log('Recommendations:', response.data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get recommendations');
  }
};

export const getSimilarArticles = async (articleId, topK = 20) => {
  try {
    const response = await axiosInstance.post('/recommend/similar', { articleId, topK });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to find similar articles');
  }
};

export const getClosestArticles = async (query, topK = 20) => {
  try {
    const response = await axiosInstance.post('/recommend/closest', { query, topK });
    // console.log(response.data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to find closest articles');
  }
};
