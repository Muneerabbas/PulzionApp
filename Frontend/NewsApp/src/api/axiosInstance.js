import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for your backend API
// Change this to your actual backend URL
const BASE_URL = 'https://pulzionapp.onrender.com/api';
const NEWS_API_URL='https://newsapi.org/v2'

// Create axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add token to headers
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@app_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage
      await AsyncStorage.removeItem('@app_token');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { BASE_URL,NEWS_API_URL };
