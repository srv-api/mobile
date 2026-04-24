// screens/SplashScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Animated,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_REFRESH_URL = 'https://api.cashpay.co.id/auth/refresh';

export default function SplashScreen() {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const [displayText, setDisplayText] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);
  const fullText = 'MiSee';

  // Efek typing: muncul satu per satu
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsTypingDone(true); // typing selesai
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Animasi container
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 10,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Navigasi setelah typing selesai + cek token
  useEffect(() => {
    if (!isTypingDone) return;

    const init = async () => {
      // Beri jeda 500ms agar user melihat teks lengkap + loading sebentar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let token = await AsyncStorage.getItem('access_token');
      if (!token) {
        token = await refreshAccessToken();
      }
      
      if (!token) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        );
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'RoomList' }],
          })
        );
      }
    };

    init();
  }, [isTypingDone, navigation]);

  const refreshAccessToken = async () => {
    try {
      const refresh_token = await AsyncStorage.getItem('refresh_token');
      if (!refresh_token) return null;
      const response = await axios.post(API_REFRESH_URL, {}, {
        headers: { Authorization: `Bearer ${refresh_token}` }
      });
      if (response.data?.data?.access_token) {
        const newToken = response.data.data.access_token;
        await AsyncStorage.setItem('access_token', newToken);
        return newToken;
      }
      return null;
    } catch (error) {
      console.error('Refresh token error:', error);
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.appName}>{displayText}</Text>
        {isTypingDone && (
          <ActivityIndicator size="small" color="#999" style={styles.loader} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2de',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#075E54',
    letterSpacing: 1,
    marginBottom: 40,
    minWidth: 120,
    textAlign: 'center',
  },
  loader: {
    marginTop: 8,
  },
});