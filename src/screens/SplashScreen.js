// screens/SplashScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Animated,
  Image,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_REFRESH_URL = 'https://api.cashpay.co.id/auth/refresh';

export default function SplashScreen() {
  const navigation = useNavigation();
  const [isReady, setIsReady] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const [displayText, setDisplayText] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);

  const fullText = 'Yuhuu!';

  // ✨ Typing effect
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsTypingDone(true);
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  // ✨ Animasi logo
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Check if navigation is ready
  useEffect(() => {
    if (navigation.isReady()) {
      setIsReady(true);
    }
  }, [navigation]);

  // 🚀 Navigasi + cek token
  useEffect(() => {
    if (!isTypingDone || !isReady) return;

    const init = async () => {
      await new Promise(resolve => setTimeout(resolve, 700));

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
  }, [isTypingDone, isReady, navigation]);

  // 🔄 Refresh token
  const refreshAccessToken = async () => {
    try {
      const refresh_token = await AsyncStorage.getItem('refresh_token');
      if (!refresh_token) return null;

      const response = await axios.post(
        API_REFRESH_URL,
        {},
        {
          headers: {
            Authorization: `Bearer ${refresh_token}`,
          },
        }
      );

      if (response.data?.data?.access_token) {
        const newToken = response.data.data.access_token;
        await AsyncStorage.setItem('access_token', newToken);
        return newToken;
      }

      return null;
    } catch (error) {
      console.log('Refresh token error:', error);
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
        {/* 🔥 LOGO */}
        <Animated.Image
          source={require('../assets/yuhuu.png')} // pastikan path benar
          style={styles.logo}
          resizeMode="contain"
        />

        {/* ✨ TEXT */}
        <Text style={styles.appName}>{displayText}</Text>

        {/* ⏳ LOADING */}
        {isTypingDone && (
          <ActivityIndicator size="small" color="#000" style={styles.loader} />
        )}
      </Animated.View>
    </View>
  );
}

// 🎨 STYLE
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Fixed: was 'fff' (missing #)
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 130,
    height: 130,
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1.5,
    marginBottom: 30,
  },
  loader: {
    marginTop: 10,
  },
});