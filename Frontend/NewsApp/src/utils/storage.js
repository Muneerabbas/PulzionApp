import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@app_token',
  HAS_SEEN_INTRO: '@has_seen_intro',
};

/**
 * Check if user has seen intro
 */
export const hasSeenIntro = async () => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_INTRO);
    return value === 'true';
  } catch (error) {
    console.error('Error checking intro status:', error);
    return false;
  }
};

/**
 * Mark intro as seen
 */
export const setIntroSeen = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_INTRO, 'true');
  } catch (error) {
    console.error('Error setting intro status:', error);
  }
};

/**
 * Reset intro (for testing - shows intro again)
 */
export const resetIntro = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.HAS_SEEN_INTRO);
    console.log('Intro reset - will show on next launch');
  } catch (error) {
    console.error('Error resetting intro:', error);
  }
};

/**
 * Get auth token
 */
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Clear all app data (for testing)
 */
export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    console.log('All app data cleared');
  } catch (error) {
    console.error('Error clearing app data:', error);
  }
};
