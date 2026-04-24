import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './config.js';

export const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const updateUserLocation = async (latitude, longitude) => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      console.log('❌ No token found, cannot update location');
      return false;
    }

    const userId = await AsyncStorage.getItem('detail_id');
    
    if (!userId) {
      console.log('❌ No user ID found, cannot update location');
      return false;
    }

    const url = `${API_CONFIG.UPDATE_LOCATION_ENDPOINT}?id=${userId}`;
    
    console.log('📍 Updating location to server:', { latitude, longitude });
    
    const response = await axios.put(
      url,
      {
        latitude: latitude,
        longitude: longitude,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status || response.status === 200) {
      console.log('✅ Location updated successfully');
      return true;
    } else {
      console.log('❌ Failed to update location:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating location:', error.response?.data || error.message);
    return false;
  }
};

export const fetchExploreData = async () => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Token tidak ditemukan. Silakan login kembali.');
    }
    
    const response = await axios.get(API_CONFIG.API_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.status && response.data.data.users) {
      return response.data.data.users;
    } else {
      console.log('No users found');
      return [];
    }
  } catch (error) {
    console.error('Error fetching explore data:', error);
    throw error;
  }
};

export const sendLike = async (targetUserId, isSuperLike = false) => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Token tidak ditemukan');
    }

    // Sesuaikan URL dengan backend Anda
    const url = `${API_CONFIG.API_BASE_URL}/api/account/like`;
    
    console.log(`📤 Sending like to: ${targetUserId}, super: ${isSuperLike}`);
    
    const response = await axios.post(
      url,
      {
        target_user_id: targetUserId,
        is_super_like: isSuperLike,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Like response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending like:', error.response?.data || error.message);
    throw error;
  }
};
