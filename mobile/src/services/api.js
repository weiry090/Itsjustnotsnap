import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Friends APIs
export const friendsAPI = {
  sendRequest: (friendEmail) => api.post('/friends/request', { friend_email: friendEmail }),
  acceptRequest: (friendshipId) => api.post(`/friends/accept/${friendshipId}`),
  rejectRequest: (friendshipId) => api.post(`/friends/reject/${friendshipId}`),
  getFriends: () => api.get('/friends'),
  removeFriend: (friendId) => api.delete(`/friends/${friendId}`),
  searchUsers: (query) => api.get(`/friends/search?query=${query}`),
};

// Messages APIs
export const messagesAPI = {
  getMessages: (friendId, limit = 50) => api.get(`/messages/${friendId}?limit=${limit}`),
  sendMessage: (data) => api.post('/messages', data),
  uploadMedia: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
};

// Calls APIs
export const callsAPI = {
  logCall: (data) => api.post('/calls/log', data),
  getHistory: (limit = 50) => api.get(`/calls/history?limit=${limit}`),
};

export default api;
