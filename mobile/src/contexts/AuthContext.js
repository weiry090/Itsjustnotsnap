import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import socketService from '../services/socketService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('authToken');
      const savedUser = await AsyncStorage.getItem('userData');
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Connect socket
        await socketService.connect();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const authToken = response.data.access_token;
      
      // Save token
      await AsyncStorage.setItem('authToken', authToken);
      setToken(authToken);
      
      // Get user data
      const userResponse = await authAPI.getMe();
      const userData = userResponse.data;
      
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
      
      // Connect socket
      await socketService.connect();
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await authAPI.register({ username, email, password });
      const authToken = response.data.access_token;
      
      // Save token
      await AsyncStorage.setItem('authToken', authToken);
      setToken(authToken);
      
      // Get user data
      const userResponse = await authAPI.getMe();
      const userData = userResponse.data;
      
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
      
      // Connect socket
      await socketService.connect();
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      // Disconnect socket
      socketService.disconnect();
      
      // Clear storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (updates) => {
    try {
      const response = await authAPI.updateProfile(updates);
      const updatedUser = response.data;
      
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Update failed',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
