// src/services/chatApi.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_AUTH = 'http://103.150.227.223:2356';
const API_BASE_CHAT = 'http://103.150.227.223:2369';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Mendapatkan access token dari storage
 */
export const getAccessToken = async () => {
  return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Mendapatkan refresh token dari storage
 */
export const getRefreshToken = async () => {
  return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Menyimpan access token dan refresh token ke storage
 */
export const saveTokens = async (accessToken, refreshToken) => {
  if (accessToken) await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  console.log('Tokens saved successfully');
};

/**
 * Menghapus tokens dari storage
 */
export const clearTokens = async () => {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  console.log('Tokens cleared');
};

/**
 * Memperbarui access token menggunakan refresh token
 * Menggunakan API Auth (port 2356)
 */
export const refreshAccessToken = async () => {
  try {
    const refresh_token = await getRefreshToken();
    if (!refresh_token) {
      throw new Error('Refresh token tidak ditemukan');
    }

    console.log('Refreshing token using auth API...');
    console.log('Auth URL:', `${API_BASE_AUTH}/auth/refresh`);

    const response = await fetch(`${API_BASE_AUTH}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refresh_token}`,
      },
    });

    console.log('Refresh token response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Refresh token error:', errorText);
      throw new Error(`Refresh token failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Refresh token response:', data);

    // Sesuaikan dengan struktur response API Auth Anda
    let newAccessToken = null;
    let newRefreshToken = null;

    // Coba beberapa format response yang mungkin
    if (data.access_token) {
      newAccessToken = data.access_token;
      newRefreshToken = data.refresh_token || refresh_token;
    } else if (data.data && data.data.access_token) {
      newAccessToken = data.data.access_token;
      newRefreshToken = data.data.refresh_token || refresh_token;
    } else if (data.token) {
      newAccessToken = data.token;
      newRefreshToken = data.refreshToken || refresh_token;
    } else {
      throw new Error('Gagal mendapatkan token baru: format response tidak dikenal');
    }

    await saveTokens(newAccessToken, newRefreshToken);
    console.log('Token refreshed successfully');
    
    return newAccessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    await clearTokens();
    throw error;
  }
};

/**
 * Mendapatkan headers untuk request ke Chat API (port 2369)
 */
export const getChatHeaders = async () => {
  try {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();
    
    return {
      'Authorization': `Bearer ${accessToken}`,
      'X-Refresh-Token': refreshToken || '',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-api-key': '3f=Pr#g1@RU-nw=30',
    };
  } catch (error) {
    console.error('Error getting headers:', error);
    return {};
  }
};

/**
 * Wrapper untuk fetch dengan auto refresh token
 * Khusus untuk Chat API (port 2369)
 */
export const fetchWithAuth = async (url, options = {}, retryCount = 0) => {
  try {
    const headers = await getChatHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    // Jika 401 dan belum pernah retry
    if (response.status === 401 && retryCount === 0) {
      console.log('Token expired, attempting to refresh...');
      
      try {
        const newAccessToken = await refreshAccessToken();
        
        const newHeaders = {
          ...headers,
          'Authorization': `Bearer ${newAccessToken}`,
        };
        
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...newHeaders,
            ...options.headers,
          },
        });
        
        return retryResponse;
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return response;
      }
    }
    
    return response;
  } catch (error) {
    console.error('Fetch with auth error:', error);
    throw error;
  }
};

/**
 * Fetch chat history dari Chat API (port 2369)
 */
export const fetchChatHistory = async (receiverId, currentUserId, pageNum = 1, limit = 20) => {
  try {
    const url = `${API_BASE_CHAT}/c/history?receiver_id=${receiverId}&page=${pageNum}&limit=${limit}`;
    console.log('Fetching chat history from:', url);
    
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });

    console.log('Response status:', response.status);

    if (response.status === 401) {
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    console.log('Chat history response type:', typeof result);
    console.log('Is array:', Array.isArray(result));
    
    if (!Array.isArray(result)) {
      console.warn('Response is not an array, returning empty array');
      return [];
    }

    return result.map(msg => ({
      id: msg.ID?.toString() || Date.now().toString(),
      text: msg.Message || msg.message || '',
      timestamp: formatTimestamp(msg.CreatedAt || msg.created_at),
      isOwn: (msg.SenderID || msg.sender_id) === currentUserId,
      senderId: msg.SenderID || msg.sender_id,
      receiverId: msg.ReceiverID || msg.receiver_id,
      createdAt: msg.CreatedAt || msg.created_at || new Date().toISOString(),
      status: 'sent',
    }));
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};
/**
 * Send message via HTTP (fallback) ke Chat API (port 2369)
 */
export const sendMessageViaHttp = async (senderId, receiverId, message) => {
  try {
    const url = `${API_BASE_CHAT}/c/message`;
    console.log('Sending message via HTTP to:', url);
    
    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_id: senderId,
        receiver_id: receiverId,
        message: message,
      }),
    });

    if (response.status === 401) {
      throw new Error('Session expired');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('HTTP send message response:', result);
    return result;
  } catch (error) {
    console.error('Error sending message via HTTP:', error);
    throw error;
  }
};

/**
 * Create WebSocket connection ke Chat API (port 2369)
 */
export const createWebSocketConnection = (currentUserId, onMessage, onOpen, onError, onClose) => {
  const wsUrl = `${API_BASE_CHAT.replace('http', 'ws')}/ws?user_id=${currentUserId}`;
  console.log('Creating WebSocket connection to:', wsUrl);
  
  const ws = new WebSocket(wsUrl);
  let connectionTimeout = setTimeout(() => {
    if (ws.readyState !== WebSocket.OPEN) {
      console.log('WebSocket connection timeout');
      ws.close();
      if (onError) onError(new Error('Connection timeout'));
    }
  }, 5000);
  
  ws.onopen = () => {
    clearTimeout(connectionTimeout);
    console.log('WebSocket connected successfully');
    if (onOpen) onOpen();
  };
  
  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
       console.log('📨 WebSocket RAW message:', event.data);
      console.log('WebSocket message received:', message);
      if (onMessage) onMessage(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      console.error('Raw message:', event.data);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error);
  };
  
  ws.onclose = (event) => {
    clearTimeout(connectionTimeout);
    console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
    if (onClose) onClose(event);
  };
  
  return ws;
};

/**
 * Send message via WebSocket
 */
export const sendWebSocketMessage = (ws, message) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    throw new Error('WebSocket is not connected');
  }
  
  const messageStr = JSON.stringify(message);
  ws.send(messageStr);
  console.log('WebSocket message sent:', message);
};

export const formatTimestamp = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('formatTimestamp error:', error);
    return '';
  }
};

/**
 * Format date header untuk display
 */
export const formatDateHeader = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  } catch (error) {
    console.error('formatDateHeader error:', error);
    return '';
  }
};

/**
 * Login function menggunakan Auth API (port 2356)
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_AUTH}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Login failed');
    }

    const data = await response.json();
    console.log('Login response:', data);

    // Sesuaikan dengan response API login Anda
    let accessToken, refreshToken;
    
    if (data.access_token) {
      accessToken = data.access_token;
      refreshToken = data.refresh_token;
    } else if (data.data && data.data.access_token) {
      accessToken = data.data.access_token;
      refreshToken = data.data.refresh_token;
    } else {
      throw new Error('Invalid login response format');
    }

    await saveTokens(accessToken, refreshToken);
    return { accessToken, refreshToken, user: data.user || data.data?.user };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Register function menggunakan Auth API (port 2356)
 */
export const register = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_AUTH}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Registration failed');
    }

    const data = await response.json();
    console.log('Register response:', data);
    return data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

/**
 * Logout function - clear all tokens
 */
export const logout = async () => {
  await clearTokens();
};