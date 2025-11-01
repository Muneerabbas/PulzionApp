// src/api/statsService.js
import axiosInstance from './axiosInstance';

/**
 * Gets the trending stats data from the backend.
 * Corresponds to GET /api/stats
 */
export const getStats = async () => {
  try {
    const response = await axiosInstance.get('/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to get stats' };
  }
};