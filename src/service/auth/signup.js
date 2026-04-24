// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URLs
const BASE_URL = 'http://103.150.227.223:2356';
const API_SIGNUP_URL = `${BASE_URL}/auth/signup`;
const API_PROFILE_URL = `${BASE_URL}/auth/profile`;
const API_REFRESH_URL = `${BASE_URL}/auth/refresh`;
const API_UPDATE_PROFILE_URL = `${BASE_URL}/auth/profile/update`;
const API_KEY = '3f=Pr#g1@RU-nw=30';
// Get access token dari storage
const getAccessToken = async () => {
  return await AsyncStorage.getItem('access_token');
};

// Refresh token function
const refreshToken = async () => {
  try {
    const refresh_token = await AsyncStorage.getItem('refresh_token');
    if (!refresh_token) throw new Error('Refresh token tidak ditemukan');

    console.log('Refreshing token...');
    const response = await axios.post(API_REFRESH_URL, {}, {
      headers: { Authorization: `Bearer ${refresh_token}` }
    });

    if (response.data && response.data.data.access_token) {
      const newAccessToken = response.data.data.access_token;
      await AsyncStorage.setItem('access_token', newAccessToken);
      return newAccessToken;
    } else {
      throw new Error('Gagal mendapatkan token baru');
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

// ============ API Auth ============

// Sign Up
export const signUp = async (userData) => {
  try {
    const response = await axios.post(API_SIGNUP_URL, {
      full_name: userData.full_name,
      whatsapp: userData.whatsapp,
      gender: userData.gender,
      email: userData.email,
      password: userData.password,
      birthdate: userData.birthdate,
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error signing up:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

// Login (sesuaikan dengan endpoint login Anda)
export const login = async (credentials) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: credentials.email,
      password: credentials.password,
    });
    
    if (response.data.status && response.data.data) {
      if (response.data.data.access_token) {
        await AsyncStorage.setItem('access_token', response.data.data.access_token);
      }
      if (response.data.data.refresh_token) {
        await AsyncStorage.setItem('refresh_token', response.data.data.refresh_token);
      }
      if (response.data.data.user) {
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
      }
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ============ API Profile ============

// Fetch profile data
export const fetchProfileData = async () => {
  try {
    let token = await getAccessToken();
    let response = await axios.get(API_PROFILE_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('Token expired, mencoba refresh...');
      try {
        const newToken = await refreshToken();
        let response = await axios.get(API_PROFILE_URL, {
          headers: { Authorization: `Bearer ${newToken}` }
        });
        return response.data.data;
      } catch (refreshError) {
        console.error('Gagal mengambil profil setelah refresh:', refreshError);
        throw refreshError;
      }
    } else {
      console.error('Error mengambil profil:', error);
      throw error;
    }
  }
};

// Update profile (full_name, email, whatsapp, password)
export const updateProfile = async (accountData) => {
  try {
    const token = await getAccessToken();
    if (!accountData.id) throw new Error('Account ID is missing');

    const updateUrl = `${API_UPDATE_PROFILE_URL}?id=${accountData.id}`;

    const updateData = {};
    if (accountData.full_name !== undefined) updateData.full_name = accountData.full_name;
    if (accountData.email !== undefined) updateData.email = accountData.email;
    if (accountData.whatsapp !== undefined) updateData.whatsapp = accountData.whatsapp;
    if (accountData.password !== undefined) updateData.password = accountData.password;

    const response = await axios.put(updateUrl, updateData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      try {
        const newToken = await refreshToken();
        const retryUrl = `${API_UPDATE_PROFILE_URL}?id=${accountData.id}`;
        
        const updateData = {};
        if (accountData.full_name !== undefined) updateData.full_name = accountData.full_name;
        if (accountData.email !== undefined) updateData.email = accountData.email;
        if (accountData.whatsapp !== undefined) updateData.whatsapp = accountData.whatsapp;
        if (accountData.password !== undefined) updateData.password = accountData.password;

        const response = await axios.put(retryUrl, updateData, {
          headers: {
            Authorization: `Bearer ${newToken}`,
            'Content-Type': 'application/json',
          },
        });
        return response.data;
      } catch (refreshError) {
        throw refreshError;
      }
    } else {
      console.error('Error updating profile:', error.response?.data || error.message);
      throw error;
    }
  }
};

// Update full name only
export const updateFullName = async (accountData) => {
  return updateProfile(accountData);
};

// Update email only
export const updateEmail = async (accountData) => {
  return updateProfile(accountData);
};

// Update whatsapp only
export const updateWhatsapp = async (accountData) => {
  return updateProfile(accountData);
};

// Update password only
export const updatePassword = async (accountData) => {
  return updateProfile(accountData);
};

// Logout function
export const logout = async () => {
  try {
    await AsyncStorage.multiRemove(['token', 'refresh_token', 'userData']);
    return { status: true, message: 'Logout berhasil' };
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// Save user data to storage
export const saveUserData = async (userData) => {
  try {
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};