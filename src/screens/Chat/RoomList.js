// src/screens/RoomList.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Footer from '../components/Footer';
import {
  fetchUsers,
  getUserData,
  clearTokens
} from '../../service/chat/roomApi';

const RoomList = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Fetch users dari API (dengan dukungan pencarian)
  const fetchUsersData = async (pageNum = 1, isLoadMore = false, query = '') => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setSearching(false);
        setRefreshing(false);
      }
      setError(null);
      console.log(`Fetching users: page=${pageNum}, query="${query}", loadMore=${isLoadMore}`);

      const currentUser = await getUserData();
      if (!currentUser) throw new Error('User data not found');
      setUserData(currentUser);

      // Panggil fetchUsers dengan query pencarian
      const result = await fetchUsers(pageNum, 20, query);
      
      if (result.success) {
        if (isLoadMore) {
          setUsers(prev => [...prev, ...result.users]);
        } else {
          setUsers(result.users);
        }
        setHasMore(result.pagination.hasMore);
        setPage(pageNum);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      if (err.message === 'Session expired' || err.message === 'Token tidak ditemukan') {
        Alert.alert('Session Expired', 'Please login again', [
          { text: 'OK', onPress: async () => {
            await clearTokens();
            navigation.replace('Login');
          }}
        ]);
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      setSearching(false);
    }
  };

  // Pencarian dengan debounce
  const handleSearch = (text) => {
    setSearchQuery(text);
    
    // Clear timeout sebelumnya
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce: tunggu 500ms setelah user berhenti mengetik
    searchTimeoutRef.current = setTimeout(() => {
      // Reset ke halaman 1 dan cari dengan query baru
      setSearching(true);
      setPage(1);
      setHasMore(true);
      fetchUsersData(1, false, text);
    }, 500);
  };

  // Load data awal
  useEffect(() => {
    fetchUsersData(1, false, '');
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore && !searching && !refreshing) {
      fetchUsersData(page + 1, true, searchQuery);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Reset ke halaman 1
    setPage(1);
    setHasMore(true);
    fetchUsersData(1, false, searchQuery);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearching(true);
    setPage(1);
    setHasMore(true);
    fetchUsersData(1, false, '');
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigation.navigate('ChatRoom', {
        receiverId: item.id,
        receiverName: item.name,
        receiverEmail: item.email,
        receiverWhatsapp: item.whatsapp,
        currentUserId: userData?.id,
        currentUserName: userData?.full_name,
      })}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatar}>{item.avatar}</Text>
        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Icon name="checkmark-circle" size={16} color="#4CAF50" />
          </View>
        )}
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userDetail}>{item.email || item.whatsapp}</Text>
      </View>
      
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loaderMore}>
        <ActivityIndicator size="small" color="#075E54" />
      </View>
    );
  };

  // Loading state
  if (loading && users.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MiSee</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.debugButton} onPress={() => navigation.navigate('Debug')}>
              <Icon name="bug-outline" size={24} color="#075E54" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton}>
              <Icon name="create-outline" size={24} color="#075E54" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#075E54" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
        <Footer navigation={navigation} active="chat" />
      </SafeAreaView>
    );
  }

  // Error state
  if (error && users.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MiSee</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.debugButton} onPress={() => navigation.navigate('Debug')}>
              <Icon name="bug-outline" size={24} color="#075E54" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton}>
              <Icon name="create-outline" size={24} color="#075E54" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <Icon name="alert-circle-outline" size={50} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchUsersData(1, false, searchQuery)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <Footer navigation={navigation} active="chat" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top','bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MiSee</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.debugButton} onPress={() => navigation.navigate('Debug')}>
            <Icon name="bug-outline" size={24} color="#075E54" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.createButton}>
            <Icon name="create-outline" size={24} color="#075E54" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari user..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Icon name="close-circle" size={20} color="#000" />
          </TouchableOpacity>
        )}
      </View>
      
      {searching && users.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#075E54" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : users.length > 0 ? (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.userList}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Icon name="people-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      )}
      
      <Footer navigation={navigation} active="chat" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#075E54' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  debugButton: { padding: 8, marginRight: 8 },
  createButton: { padding: 8 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  userList: { paddingHorizontal: 20 },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: { fontSize: 28 },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: '#000' },
  userDetail: { fontSize: 13, color: '#666', marginTop: 2 },
  unreadBadge: {
    backgroundColor: '#075E54',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  errorText: { marginTop: 12, fontSize: 16, color: '#f44336', textAlign: 'center' },
  emptyText: { marginTop: 12, fontSize: 16, color: '#999' },
  retryButton: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#075E54', borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loaderMore: { paddingVertical: 20, alignItems: 'center' },
});

export default RoomList;