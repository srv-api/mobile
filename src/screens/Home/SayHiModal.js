import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './config.js';

const { width, height } = Dimensions.get('window');

const SayHiModal = ({ visible, onClose, onSend, targetUserId, userName, userAvatar }) => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const MESSAGE = 'Yuhuu! 👋';

  // Fetch user data untuk dapetin foto terbaru
  useEffect(() => {
    if (visible && targetUserId) {
      fetchUserData();
    }
  }, [visible, targetUserId]);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      const response = await axios.get(`${API_CONFIG.API_BASE_URL}/api/account/user/${targetUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.status) {
        setUserData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSend = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No token');

      const response = await axios.post(
        `${API_CONFIG.API_BASE_URL}/api/account/send-message`,
        {
          target_user_id: targetUserId,
          message: MESSAGE,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status) {
        onSend(MESSAGE);
        onClose();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ambil foto dari userData atau props
  const getAvatarUrl = () => {
    if (userData?.profile_picture?.file_path) {
      return userData.profile_picture.file_path;
    }
    if (userData?.photos && userData.photos.length > 0) {
      return userData.photos[0];
    }
    if (userAvatar) return userAvatar;
    return `https://ui-avatars.com/api/?background=6366f1&color=fff&size=200&name=${encodeURIComponent(userName || 'User')}`;
  };

  const displayName = userData?.full_name || userData?.name || userName || 'User';
  const displayAge = userData?.age ? `, ${userData.age}` : '';

  return (
    <Modal visible={visible} transparent animationType="none">
      <StatusBar barStyle="dark-content" backgroundColor="#000" />
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Say Hi!</Text>
            <View style={styles.headerRight} />
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: getAvatarUrl() }} 
                style={styles.avatar}
                resizeMode="cover"
                onError={(e) => console.log('Image error:', e.nativeEvent.error)}
              />
            </View>
            <Text style={styles.userName}>
              {displayName}{displayAge}
            </Text>
            <Text style={styles.hintText}>
              Send a wave to start chatting
            </Text>
          </View>

          {/* Tombol Yuhuu */}
          <KeyboardAvoidingView 
            style={styles.buttonArea} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.yuhuuButton, loading && styles.yuhuuButtonDisabled]}
                onPress={handleSend}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Entypo name="hand" size={28} color="#fff" />
                    <Text style={styles.yuhuuButtonText}>Yuhuu!</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.buttonHint}>
                Send a friendly wave ✨
              </Text>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5ea',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    width: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: '#f2f2f6',
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  hintText: {
    fontSize: 14,
    color: '#8e8e93',
  },
  buttonArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  buttonContainer: {
    padding: 24,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#e5e5ea',
    alignItems: 'center',
  },
  yuhuuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 40,
    width: '100%',
  },
  yuhuuButtonDisabled: {
    backgroundColor: '#c6c6c8',
  },
  yuhuuButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 20,
  },
  buttonHint: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 12,
  },
});

export default SayHiModal;