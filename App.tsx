// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/RootNavigation';
import AppNavigator from './src/navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupDatabase } from './src/database/setup';
import './src/config/firebase';
import { webSocketService } from './src/service/WebSocketServices'; // ✅ Import WebSocket
import { AppState, AppStateStatus } from 'react-native'; // ✅ Import AppStateStatus

export default function App() {
  
  useEffect(() => {
    const init = async () => {
      try {
        // Setup database
        await setupDatabase();
        console.log('✅ Database initialized');
        
        // ✅ Cek login status dan reconnect WebSocket
        const accessToken = await AsyncStorage.getItem('access_token');
        const userId = await AsyncStorage.getItem('user_id');
        
        if (accessToken && userId) {
          console.log('🔄 User already logged in, reconnecting WebSocket...');
          webSocketService.connect(userId);
        } else {
          console.log('ℹ️ No active session found');
        }
        
      } catch (error) {
        console.error('❌ Init error:', error);
      }
    };
    
    init();
  }, []);

  // ✅ Listen untuk app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App kembali ke foreground
        console.log('📱 App is active, checking WebSocket connection...');
        
        const accessToken = await AsyncStorage.getItem('access_token');
        const userId = await AsyncStorage.getItem('user_id');
        
        if (accessToken && userId) {
          const status = webSocketService.getStatus();
          
          if (status !== 'connected') {
            console.log('🔄 WebSocket not connected, reconnecting...');
            webSocketService.connect(userId);
          } else {
            console.log('✅ WebSocket already connected');
          }
        }
      } else if (nextAppState === 'background') {
        console.log('📱 App in background');
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator />
    </NavigationContainer>
  );
}