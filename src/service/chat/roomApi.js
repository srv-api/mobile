// src/services/roomApi.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://103.150.227.223:2388';
const API_REFRESH_URL = 'http://103.150.227.223:2356/auth/refresh';
const API_KEY = '3f=Pr#g1@RU-nw=30';

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
  console.log('Tokens saved - Access Token:', accessToken ? 'Yes' : 'No', 'Refresh Token:', refreshToken ? 'Yes' : 'No');
};

/**
 * Clear all tokens (for logout)
 */
export const clearTokens = async () => {
  try {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    console.log('Tokens cleared successfully');
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

export const refreshAccessToken = async () => {
  try {
    const refresh_token = await AsyncStorage.getItem('refresh_token');
    if (!refresh_token) throw new Error('Refresh token tidak ditemukan');

    const response = await axios.post('http://103.150.227.223:2356/auth/refresh', {}, {
      headers: {
        'Authorization': `Bearer ${refresh_token}`,
        'Content-Type': 'application/json',
        'x-api-key': '3f=Pr#g1@RU-nw=30'
      }
    });

    if (response.data?.status === true && response.data?.data?.access_token) {
      const newAccessToken = response.data.data.access_token;
      await AsyncStorage.setItem('access_token', newAccessToken);
      return newAccessToken;
    }
    
    throw new Error('Gagal refresh token');
  } catch (error) {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_data']);
    throw error;
  }
};

/**
 * Mendapatkan user data dari storage
 */
export const getUserData = async () => {
  try {
    const userDataString = await AsyncStorage.getItem('user_data');
    if (userDataString) {
      return JSON.parse(userDataString);
    }
  } catch (error) {
    console.error('Error getting user data:', error);
  }
  return null;
};

/**
 * Save user data to storage
 */
export const saveUserData = async (userData) => {
  try {
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    console.log('User data saved successfully');
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

/**
 * Helper function untuk format timestamp
 */
export const formatTimestamp = (dateString) => {
  if (!dateString || dateString === '0001-01-01T00:00:00Z') return 'New';
  
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 86400000) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diff < 604800000) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

/**
 * Format last message time
 */
export const formatLastMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 86400000) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diff < 604800000) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

/**
 * Get initials from full name
 */
export const getAvatarInitials = (fullName) => {
  if (!fullName) return '👤';
  const names = fullName.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

/**
 * Get auth headers for API requests
 */
export const getAuthHeaders = async () => {
  try {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();
    
    return {
      'Authorization': `Bearer ${accessToken}`,
      'X-Refresh-Token': refreshToken || '',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-api-key': API_KEY,
    };
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return {};
  }
};

// roomApi.js - tambahkan parameter searchQuery pada fetchUsers

export const fetchUsers = async (pageNum = 1, limit = 20, searchQuery = '') => {
  // Build URL dengan parameter pencarian jika ada
  let url = `${API_BASE_URL}/merchant/user/pagination?page=${pageNum}&limit=${limit}&sort=created_at desc`;
  if (searchQuery && searchQuery.trim() !== '') {
    // Gunakan full_name.contains untuk pencarian
    url += `&full_name.contains=${encodeURIComponent(searchQuery.trim())}`;
  }

  const makeRequest = async (token) => {
    return await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': API_KEY
      }
    });
  };

  try {
    let token = await getAccessToken();
    if (!token) throw new Error('Token tidak ditemukan');

    let response = await makeRequest(token);

    if (response.data && response.data.success && response.data.data) {
      const users = response.data.data.data.map((user) => ({
        id: user.id,
        name: user.full_name,
        email: user.email,
        whatsapp: user.whatsapp,
        lastMessage: '',
        lastMessageTime: null,
        timestamp: formatTimestamp(user.created_at),
        unreadCount: 0,
        avatar: getAvatarInitials(user.full_name),
        verified: user.verified?.verified || false,
        status: user.status || 'offline',
        detail_id: user.detail_id,
      }));
      
      return {
        success: true,
        users: users,
        pagination: {
          currentPage: response.data.data.page,
          totalPage: response.data.data.total_page,
          totalRows: response.data.data.total_rows,
          hasMore: response.data.data.page < response.data.data.total_page
        }
      };
    } else {
      return { success: false, error: response.data?.message || 'Gagal mengambil data user' };
    }
  } catch (error) {
    // Handle error dan refresh token (sama seperti kode lama)
    // ... (pertahankan kode existing untuk handle error)
    if (error.response && error.response.status === 401) {
      console.log('Token expired, attempting to refresh...');
      try {
        const newToken = await refreshAccessToken();
        let response = await makeRequest(newToken);
        if (response.data && response.data.success && response.data.data) {
          const users = response.data.data.data.map((user) => ({
            id: user.id,
            name: user.full_name,
            email: user.email,
            whatsapp: user.whatsapp,
            lastMessage: '',
            lastMessageTime: null,
            timestamp: formatTimestamp(user.created_at),
            unreadCount: 0,
            avatar: getAvatarInitials(user.full_name),
            verified: user.verified?.verified || false,
            status: user.status || 'offline',
            detail_id: user.detail_id,
          }));
          return {
            success: true,
            users: users,
            pagination: {
              currentPage: response.data.data.page,
              totalPage: response.data.data.total_page,
              totalRows: response.data.data.total_rows,
              hasMore: response.data.data.page < response.data.data.total_page
            }
          };
        } else {
          return { success: false, error: response.data?.message || 'Gagal mengambil data user setelah refresh' };
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        return { success: false, error: 'Session expired. Please login again.' };
      }
    } else {
      console.error('Error fetching users:', error);
      return { success: false, error: error.message || 'Network error occurred' };
    }
  }
};

export const fetchUserById = async (userId) => {
  const url = `${API_BASE_URL}/merchant/user/${userId}`;
  
  const makeRequest = async (token) => {
    return await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': API_KEY
      }
    });
  };

  try {
    let token = await getAccessToken();
    if (!token) {
      throw new Error('Token tidak ditemukan');
    }

    let response = await makeRequest(token);

    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data?.message || 'Gagal mengambil data user');
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('Token expired, attempting to refresh...');
      try {
        const newToken = await refreshAccessToken();
        
        let response = await makeRequest(newToken);
        
        if (response.data && response.data.success) {
          return response.data.data;
        } else {
          throw new Error(response.data?.message || 'Gagal mengambil data user setelah refresh');
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        throw new Error('Session expired. Please login again.');
      }
    } else {
      console.error('Error fetching user by id:', error);
      throw error;
    }
  }
};

/**
 * Update user status dengan mekanisme auto-refresh token
 */
export const updateUserStatus = async (userId, status) => {
  const url = `${API_BASE_URL}/merchant/user/${userId}/status`;
  
  const makeRequest = async (token) => {
    return await axios.put(url, { status: status }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': API_KEY
      }
    });
  };

  try {
    let token = await getAccessToken();
    if (!token) {
      throw new Error('Token tidak ditemukan');
    }

    let response = await makeRequest(token);

    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data?.message || 'Gagal update status user');
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('Token expired, attempting to refresh...');
      try {
        const newToken = await refreshAccessToken();
        
        let response = await makeRequest(newToken);
        
        if (response.data && response.data.success) {
          return response.data.data;
        } else {
          throw new Error(response.data?.message || 'Gagal update status user setelah refresh');
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        throw new Error('Session expired. Please login again.');
      }
    } else {
      console.error('Error updating user status:', error);
      throw error;
    }
  }
};

export const isAuthenticated = async () => {
  try {
    const token = await getAccessToken();
    const userData = await getUserData();
    return !!(token && userData);
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Set auth data after successful login
 */
export const setAuthData = async (accessToken, refreshToken, userData) => {
  try {
    await saveTokens(accessToken, refreshToken);
    await saveUserData(userData);
    console.log('Auth data saved successfully');
  } catch (error) {
    console.error('Error saving auth data:', error);
    throw error;
  }
};