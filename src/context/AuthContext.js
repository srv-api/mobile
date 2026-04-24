import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../service/NotificationService';
import { webSocketService } from '../service/WebSocketServices';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Fungsi untuk setup services setelah login
  const setupPostLoginServices = async (userId) => {
    try {
      console.log('🔧 Setting up notifications and WebSocket...');
      await NotificationService.setupChannels();
      const granted = await NotificationService.requestPermission();
      if (granted) {
        NotificationService.setupFCMListeners();
        await NotificationService.getFCMToken();
      }
      await webSocketService.connect(userId);
      return true;
    } catch (error) {
      console.error('Error setting up services:', error);
      return false;
    }
  };

  // Fungsi login (dipanggil dari form)
  const login = async (responseData) => {
    try {
      setIsLoading(true);
      
      // Simpan data user
      await AsyncStorage.setItem('access_token', responseData.token);
      await AsyncStorage.setItem('refresh_token', responseData.refresh_token);
    //   await AsyncStorage.setItem('user_id', responseData.id);
    //   await AsyncStorage.setItem('detail_id', responseData.detail_id);
    //   await AsyncStorage.setItem('user_data', JSON.stringify({
    //     id: responseData.id,
    //     detail_id: responseData.detail_id,
    //     full_name: responseData.full_name,
    //     email: responseData.email,
    //     whatsapp: responseData.whatsapp,
    //   }));
      
      setUserToken(responseData.token);
      setUserData(responseData);
      setIsLoggedIn(true);
      
      // Setup services
      await setupPostLoginServices(responseData.id);
      
      return { success: true };
    } catch (error) {
      console.error('Login context error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi logout
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Disconnect WebSocket
      webSocketService.disconnect();
      
      // Hapus semua data
      await AsyncStorage.multiRemove([
        'access_token',
        'refresh_token',
        'user_id',
        'detail_id',
        'user_data'
      ]);
      
      setUserToken(null);
      setUserData(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cek status login saat aplikasi pertama kali dibuka
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        setIsLoading(true);
        
        // Ambil token dan data user dari storage
        const token = await AsyncStorage.getItem('access_token');
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        const userId = await AsyncStorage.getItem('user_id');
        const userDataString = await AsyncStorage.getItem('user_data');
        
        if (token && refreshToken && userId && userDataString) {
          const userDataParsed = JSON.parse(userDataString);
          
          console.log('✅ Found existing session:', userDataParsed.full_name);
          
          setUserToken(token);
          setUserData(userDataParsed);
          setIsLoggedIn(true);
          
          // Setup services untuk user yang sudah login
          await setupPostLoginServices(userId);
        } else {
          console.log('❌ No existing session found');
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Check login status error:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkLoginStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userToken,
        userData,
        isLoggedIn,
        login,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};