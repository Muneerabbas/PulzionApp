import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredToken, setAuthToken as setToken, logout as logoutApi, getProfile } from '../api/authApi';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await getStoredToken();
      if (token) {
        // Set token in axios headers
        await setToken(token);
        // Try to fetch user profile
        try {
          const response = await getProfile();
          if (response.success) {
            setUser(response.user);
            setIsAuthenticated(true);
          }
        } catch (error) {
          // Token might be invalid, clear it
          await logout();
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData, token, APIKEY) => {
    await setToken(token);
    await AsyncStorage.setItem('APIKEY', APIKEY);
    console.log("Stored API Key:", await AsyncStorage.getItem('APIKEY'));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const register = async (userData, token) => {
    await setToken(token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
    AsyncStorage.removeItem('APIKEY');

    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
