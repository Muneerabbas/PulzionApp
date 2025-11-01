import axiosInstance from './axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';


export const register = async (formData) => {
  try {
    const response = await axiosInstance.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (response.data.success && response.data.token) {
      await setAuthToken(response.data.token);
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Registration failed' };
  }
};

/**
 * Login user
 * @param {Object} credentials - { email, password }
 * @returns {Promise} - Response with token and user data
 */
export const login = async (credentials) => {
  try {
    const response = await axiosInstance.post('/auth/login', credentials);
    
    if (response.data.success && response.data.token) {
      await setAuthToken(response.data.token);
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

/**
 * Get user profile
 * @returns {Promise} - User profile data
 */
export const getProfile = async () => {
  try {
    const response = await axiosInstance.get('/auth/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch profile' };
  }
};

/**
 * Update user preferences
 * @param {Object} preferences - { categories, emailNotifications }
 * @returns {Promise} - Updated user data
 */
export const updatePreferences = async (preferences) => {
  try {
    const response = await axiosInstance.put('/auth/preferences', preferences);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update preferences' };
  }
};
export const getBookmarks = async () => {
  try {
    const res = await axiosInstance.get('/api/auth/bookmarks');
    return res.data.bookmarks; 
  } catch (err) {
    throw err.response?.data || { message: 'Failed to fetch bookmarks' };
  }
};

export const getSubscription = async () => {
  try {
    const res = await axiosInstance.get('/auth/subscribe');
    return res.data.isSubscribed;
  } catch (err) {
    throw err.response?.data || { message: 'Failed to fetch subscription status' };
  }
};

export const toggleSubscription = async (subscribe) => {
  try {
    const res = await axiosInstance.patch('/auth/subscribe', { subscribe });
    return res.data.isSubscribed;
  } catch (err) {
    throw err.response?.data || { message: 'Failed to update subscription' };
  }
};
export const addBookmark = async (articleId) => {
  try {
    const res = await axiosInstance.post('/auth/bookmarks', { articleId });
    return res.data.bookmarks; // updated bookmarks array
  } catch (err) {
    throw err.response?.data || { message: 'Failed to add bookmark' };
  }
};




/**
 * Set authentication token
 * @param {string} token - JWT token
 */
export const setAuthToken = async (token) => {
  if (token) {
    await AsyncStorage.setItem('@app_token', token);
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    await AsyncStorage.removeItem('@app_token');
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

/**
 * Get stored token
 * @returns {Promise<string|null>} - Stored token or null
 */
export const getStoredToken = async () => {
  try {
    return await AsyncStorage.getItem('@app_token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Logout user
 */
export const logout = async () => {
  await setAuthToken(null);
};
