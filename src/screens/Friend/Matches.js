// src/screens/Matches.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Footer from '../components/Footer';

const API_BASE_URL = 'http://103.150.227.223:2388';
const PICT_URL = 'http://103.150.227.223:2356';

const Match = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // Tambahkan state untuk current user

  const getToken = async () => {
    return await AsyncStorage.getItem('access_token');
  };

  // Ambil data user yang sedang login
  const getCurrentUser = async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const userName = await AsyncStorage.getItem('full_name');
      return { id: userId, name: userName };
    } catch (error) {
      console.log('Error getting current user:', error);
      return null;
    }
  };

  const fetchMatches = async () => {
    try {
      setError(null);
      const token = await getToken();
      
      // Ambil current user
      const currentUserData = await getCurrentUser();
      setCurrentUser(currentUserData);

      const res = await axios.get(`${API_BASE_URL}/api/account/matches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.status) {
        const formatted = res.data.data.map(item => ({
          id: item.user_id,
          full_name: item.full_name,
          age: item.age,
          last_message: item.last_message || '',
          last_message_time: item.last_message_time || '',
          profile_picture: item.profile_picture
            ? `${PICT_URL}/profile/${item.profile_picture}`
            : 'https://via.placeholder.com/100',
        }));
        setMatches(formatted);
      } else {
        setError(res.data.message || 'Failed to fetch matches');
      }
    } catch (err) {
      console.log('Error fetch matches:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches();
  }, []);

  const handleChatPress = (item) => {
    // ✅ Perbaikan: Kirim currentUserId yang benar (user yang login)
    navigation.navigate('ChatRoom', {
      receiverId: item.id,
      receiverName: item.full_name,
      receiverEmail: item.email,
      receiverWhatsapp: item.whatsapp,
      currentUserId: currentUser?.id,      // ✅ ID user yang LOGIN
      currentUserName: currentUser?.name,  // ✅ Nama user yang LOGIN
    });
  };

  const renderMatchItem = ({ item }) => (
    <TouchableOpacity
      style={styles.matchItem}
      onPress={() => handleChatPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.profile_picture }} style={styles.avatar} />
        <View style={styles.onlineBadge} />
      </View>
      
      <View style={styles.matchInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{item.full_name}</Text>
          {item.age && (
            <Text style={styles.ageText}>{item.age}</Text>
          )}
        </View>
        {item.last_message ? (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message}
          </Text>
        ) : (
          <Text style={styles.matchDate}>New match! 💖</Text>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.chatButton}
        onPress={() => handleChatPress(item)}
      >
        <Icon name="chatbubble-ellipses-outline" size={24} color="#ff6b6b" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Loading state
  if (loading && matches.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Matches</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('Home')}>
              <Icon name="create-outline" size={24} color="#075E54" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#075E54" />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
        <Footer navigation={navigation} active="match" />
      </SafeAreaView>
    );
  }

  // Error state
  if (error && matches.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Matches</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('Home')}>
              <Icon name="create-outline" size={24} color="#075E54" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <Icon name="alert-circle-outline" size={50} color="#075E54" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMatches}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <Footer navigation={navigation} active="match" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Matches</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('LikedYou')}>
            <Icon name="create-outline" size={24} color="#075E54" />
          </TouchableOpacity>
        </View>
      </View>      
      {matches.length > 0 ? (
        <FlatList
          data={matches}
          renderItem={renderMatchItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.matchesList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#ff6b6b"
              colors={['#ff6b6b']}
            />
          }
        />
      ) : (
        <View style={styles.centerContainer}>
          <Icon name="heart-dislike-circle-outline" size={80} color="#ddd" />
          <Text style={styles.emptyTitle}>No Matches Yet 😢</Text>
          <Text style={styles.emptyText}>
            Start swiping right to find your perfect match!
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.exploreButtonText}>Explore People</Text>
            <Icon name="arrow-forward-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      
      <Footer navigation={navigation} active="match" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#075E54',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButton: {
    padding: 8,
  },
  matchesList: {
    paddingHorizontal: 20,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4cd964',
    borderWidth: 2,
    borderColor: '#fff',
  },
  matchInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  ageText: {
    fontSize: 14,
    color: '#999',
  },
  lastMessage: {
    fontSize: 13,
    color: '#666',
  },
  matchDate: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ff6b6b',
    borderRadius: 30,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default Match;