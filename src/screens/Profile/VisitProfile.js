// src/screens/VisitProfile.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Base URL
const BASE_URL = 'http://103.150.227.223:2356';
const API_VISIT_PROFILE_URL = `${BASE_URL}/auth/profile/visit`;

const VisitProfile = ({ route }) => {
  const { userId, id } = route.params || {};
  const profileId = userId || id;

  const [profile, setProfile] = useState(null);
  const [pictures, setPictures] = useState(Array(6).fill(null));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get auth token
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      if (!profileId) {
        console.log('❌ No user ID provided');
        Alert.alert('Error', 'User ID tidak ditemukan');
        setLoading(false);
        return;
      }

      const token = await getAuthToken();
      
      if (!token) {
        console.log('❌ No auth token found');
        Alert.alert('Error', 'Silakan login kembali');
        setLoading(false);
        return;
      }

      console.log(`📡 Fetching profile for ID: ${profileId}`);
      
      const response = await axios.get(`${API_VISIT_PROFILE_URL}/${profileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Profile response:', response.data);

      if (response.data.status && response.data.data) {
        const userData = response.data.data;
        setProfile(userData);

        // Process gallery images
        if (userData.gallery && userData.gallery.length > 0) {
          const galleryPictures = Array(6).fill(null);
          userData.gallery.forEach((item, index) => {
            if (index < 6) {
              // Fix image URL
              let imageUrl = item.file_path;
              if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = `${BASE_URL}${imageUrl}`;
              }
              galleryPictures[index] = imageUrl;
            }
          });
          setPictures(galleryPictures);
        }
      } else {
        console.log('Failed to fetch profile:', response.data.message);
        Alert.alert('Info', response.data.message || 'Gagal mengambil data profil');
      }
    } catch (err) {
      console.error('❌ Visit profile error:', err);
      
      if (err.response) {
        if (err.response.status === 401) {
          Alert.alert('Session Expired', 'Silakan login kembali');
        } else if (err.response.status === 404) {
          Alert.alert('Error', 'Profil tidak ditemukan');
        } else {
          Alert.alert('Error', err.response.data?.message || 'Gagal memuat profil');
        }
      } else if (err.request) {
        Alert.alert('Error', 'Tidak dapat terhubung ke server');
      } else {
        Alert.alert('Error', 'Terjadi kesalahan');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const renderPictureItem = ({ item }) => (
    <View style={styles.pictureItem}>
      {item ? (
        <Image source={{ uri: item }} style={styles.pictureImage} />
      ) : (
        <View style={styles.picturePlaceholder}>
          <Icon name="image-outline" size={25} color="#bbb" />
        </View>
      )}
    </View>
  );

  useEffect(() => {
    fetchProfile();
  }, [profileId]);

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#075E54" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="person-outline" size={50} color="#ccc" />
        <Text style={styles.loadingText}>User not found</Text>
      </View>
    );
  }

  // Fix profile picture URL
  const profilePictureUrl = profile.profile_picture?.startsWith('http')
    ? profile.profile_picture
    : `${BASE_URL}${profile.profile_picture || ''}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Image
            source={{ uri: profilePictureUrl || 'https://via.placeholder.com/120' }}
            style={styles.profileImage}
          />

          <Text style={styles.name}>
            {profile.full_name || 'User'}
          </Text>

          <Text style={styles.bio}>
            {profile.gender === 'man'
              ? 'Male'
              : profile.gender === 'woman'
              ? 'Female'
              : ''}
          </Text>
        </View>

        {/* STATS */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.gallery?.length || 0}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* GALLERY */}
        <View style={styles.picturesContainer}>
          <Text style={styles.picturesTitle}>Gallery</Text>

          <FlatList
            data={pictures}
            renderItem={renderPictureItem}
            keyExtractor={(_, index) => index.toString()}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.picturesGrid}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default VisitProfile;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },

  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },

  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },

  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#075E54',
    marginBottom: 10,
  },

  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },

  bio: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 15,
    paddingVertical: 15,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#075E54',
  },

  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  statDivider: {
    width: 1,
    backgroundColor: '#eee',
  },

  picturesContainer: {
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 15,
    paddingVertical: 15,
    marginBottom: 20,
  },

  picturesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#075E54',
    marginLeft: 15,
    marginBottom: 10,
  },

  picturesGrid: {
    paddingHorizontal: 10,
  },

  pictureItem: {
    flex: 1,
    margin: 5,
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },

  pictureImage: {
    width: '100%',
    height: '100%',
  },

  picturePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});