// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { webSocketService } from '../WebSocketServices';

// Base URLs
const API_PROFILE_URL = 'http://103.150.227.223:2356/auth/profile';
const API_REFRESH_URL = 'http://103.150.227.223:2356/auth/refresh';
const API_UPDATE_PROFILE_URL = 'http://103.150.227.223:2356/auth/profile/update';
const API_UPLOAD_PROFILE_PHOTO_URL = 'http://103.150.227.223:2356/auth/profile/upload';

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

// Upload profile photo
// Fix the uploadProfilePhoto function signature and implementation
export const uploadProfilePhoto = async (userId, imageUri, imageType, imageName) => {
  try {
    // Add validation
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    if (!imageUri) throw new Error('Image URI is missing');

    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: imageType || 'image/jpeg',
      name: imageName || `profile_${Date.now()}.jpg`,
    });

    const uploadUrl = `${API_UPLOAD_PROFILE_PHOTO_URL}/${userId}`;
console.info(uploadUrl)
    const response = await axios.put(uploadUrl, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    // Coba refresh token jika token expired
    if (error.response && error.response.status === 401) {
      try {
        const newToken = await refreshToken();
        
        const formData = new FormData();
        formData.append('image', {
          uri: imageUri,
          type: imageType || 'image/jpeg',
          name: imageName || `profile_${Date.now()}.jpg`,
        });

        const uploadUrl = `${API_UPLOAD_PROFILE_PHOTO_URL}/${userId}`;

        const response = await axios.put(uploadUrl, formData, {
          headers: {
            Authorization: `Bearer ${newToken}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } catch (refreshError) {
        console.error('Error after token refresh:', refreshError);
        throw refreshError;
      }
    } else {
      console.error('Error uploading profile photo:', error.response?.data || error.message);
      throw error;
    }
  }
};


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

    // Siapkan data yang akan diupdate (hanya field yang dikirim)
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
    // Coba refresh token jika token expired
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

// Tambahkan fungsi-fungsi ini ke file api.js Anda

// Upload multiple gallery images
export const uploadGalleryImages = async (images) => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    
    images.forEach((image, index) => {
      formData.append('images', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || `gallery_${Date.now()}_${index}.jpg`,
      });
    });

    const response = await axios.post(
      `http://103.150.227.223:2356/gallery/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Upload gallery error:', error);
    throw error;
  }
};

// Delete gallery image
export const deleteGalleryImage = async (imageId) => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.delete(
      `http://103.150.227.223:2356/gallery/${imageId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Delete gallery error:', error);
    throw error;
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
    // 1. Disconnect WebSocket
    webSocketService.disconnect();
    console.log('✅ WebSocket disconnected');
    
    // 2. Clear all AsyncStorage data
    const keysToRemove = [
      'access_token',
      'refresh_token',
      'token',
      'user_id',
      'detail_id',
      'user_data',
      'fcm_token',
      'userData'
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('✅ All storage cleared');
    
    return { status: true, message: 'Logout berhasil' };
  } catch (error) {
    console.error('Error logging out:', error);
    // Tetap balikin success meskipun error, yang penting storage dibersihkan
    return { status: true, message: 'Logout berhasil' };
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