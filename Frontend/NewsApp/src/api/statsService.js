import axiosInstance from './axiosInstance';
export const getStats = async () => {
  try {
    const response = await axiosInstance.get('/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to get stats' };
  }
};