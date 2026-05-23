// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://103.150.227.223:2349';
const API_REFRESH_URL = 'http://103.150.227.223:2356';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Mendapatkan access token dari storage
 */
const getAccessToken = async () => {
  return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Mendapatkan refresh token dari storage
 */
const getRefreshToken = async () => {
  return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Menyimpan access token dan refresh token ke storage
 */
const saveTokens = async (accessToken, refreshToken) => {
  if (accessToken) await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Memperbarui access token menggunakan refresh token
 */
const refreshToken = async () => {
  try {
    const refresh_token = await getRefreshToken();
    if (!refresh_token) throw new Error('Refresh token tidak ditemukan');

    console.log('Refreshing token...');

    const response = await axios.post(`${API_REFRESH_URL}/auth/refresh`, {}, {
      headers: { Authorization: `Bearer ${refresh_token}` }
    });

    console.log('Refresh token response:', response.data);

    if (response.data && response.data.access_token) {
      const newAccessToken = response.data.access_token;
      const newRefreshToken = response.data.refresh_token || refresh_token;

      await saveTokens(newAccessToken, newRefreshToken);
      return newAccessToken;
    } else {
      throw new Error('Gagal mendapatkan token baru');
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

/**
 * Fetch posts dengan mekanisme auto-refresh token
 */
export const fetchPosts = async (navigation = null) => {
  try {
    let token = await getAccessToken();
    
    const response = await axios.get(`${BASE_URL}/medsos/get`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      const newToken = await refreshToken();
      
      const response = await axios.get(`${BASE_URL}/medsos/get`, {
        headers: { Authorization: `Bearer ${newToken}` }
      });

      return response.data;
    } else {
      throw error;
    }
  }
};

export const createPost = async (caption, imageFile) => {
  try {
    let token = await getAccessToken();
    
    const formData = new FormData();
    formData.append('caption', caption);
    
    if (imageFile) {
      formData.append('image', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.fileName || `photo_${Date.now()}.jpg`,
      });
    }
    
    const response = await axios.post(`${BASE_URL}/medsos/create`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      const newToken = await refreshToken();
      
      const formData = new FormData();
      formData.append('caption', caption);
      
      if (imageFile) {
        formData.append('image', {
          uri: imageFile.uri,
          type: imageFile.type || 'image/jpeg',
          name: imageFile.fileName || `photo_${Date.now()}.jpg`,
        });
      }
      
      const response = await axios.post(`${BASE_URL}/medsos/create`, formData, {
        headers: {
          Authorization: `Bearer ${newToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } else {
      throw error;
    }
  }
};
