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
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Footer from '../components/Footer';
import {
  fetchUsers,
  getUserData,
  clearTokens,
  fetchAllUsers
} from '../../service/chat/roomApi';
import MessageRepository from '../../database/MessageRepository';

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
  
  // State untuk modal new chat
  const [newChatModalVisible, setNewChatModalVisible] = useState(false);
  const [newChatSearchQuery, setNewChatSearchQuery] = useState('');
  const [newChatUsers, setNewChatUsers] = useState([]);
  const [newChatLoading, setNewChatLoading] = useState(false);

  // Format waktu untuk last message
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

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
        let newUsers = [...result.users];
        
        // ✅ TAMBAHKAN: Ambil last message dari SQLite
        try {
          const lastMessages = await MessageRepository.getAllLastMessages(currentUser.id);
          
          // Buat mapping user ID ke last message
          const lastMessageMap = {};
          lastMessages.forEach(msg => {
            lastMessageMap[msg.userId] = {
              lastMessage: msg.lastMessage,
              lastMessageTime: msg.lastMessageTime,
              unreadCount: msg.unreadCount,
            };
          });
          
          // Merge last message ke users
          newUsers = newUsers.map(user => ({
            ...user,
            lastMessage: lastMessageMap[user.id]?.lastMessage || '',
            lastMessageTime: lastMessageMap[user.id]?.lastMessageTime || null,
            unreadCount: lastMessageMap[user.id]?.unreadCount || 0,
          }));
          
          // Sort users berdasarkan last message terbaru
          newUsers.sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime) : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime) : 0;
            return timeB - timeA;
          });
          
        } catch (error) {
          console.error('Error getting last messages from SQLite:', error);
        }
        
        // ✅ PERBAIKAN: Gunakan newUsers, bukan result.users
        if (isLoadMore) {
          setUsers(prev => [...prev, ...newUsers]);
        } else {
          setUsers(newUsers);
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
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearching(true);
      setPage(1);
      setHasMore(true);
      fetchUsersData(1, false, text);
    }, 500);
  };

  // Fungsi untuk mencari user di modal new chat
  const handleNewChatSearch = async (text) => {
    setNewChatSearchQuery(text);
    
    if (text.trim().length === 0) {
      setNewChatUsers([]);
      return;
    }
    
    setNewChatLoading(true);
    try {
      const currentUser = await getUserData();
      if (!currentUser) return;
      
      // Panggil API pencarian user
      const result = await fetchAllUsers(1, 50, text);
      if (result.success) {
        // Filter out current user
        const filteredUsers = result.users.filter(user => user.id !== currentUser.id);
        setNewChatUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setNewChatLoading(false);
    }
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

  const openNewChat = () => {
    setNewChatModalVisible(true);
    setNewChatSearchQuery('');
    setNewChatUsers([]);
  };

  const startNewChat = (user) => {
    setNewChatModalVisible(false);
    navigation.navigate('ChatRoom', {
      receiverId: user.id,
      receiverName: user.name,
      receiverEmail: user.email,
      receiverWhatsapp: user.whatsapp,
      currentUserId: userData?.id,
      currentUserName: userData?.full_name,
    });
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
        {/* ✅ PERBAIKAN: Layout dua baris */}
        <View style={styles.userNameRow}>
          <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
          {item.lastMessageTime && (
            <Text style={styles.messageTime}>
              {formatLastMessageTime(item.lastMessageTime)}
            </Text>
          )}
        </View>
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetail} numberOfLines={1}>
            {item.lastMessage || 'Tap to start chatting'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderNewChatUser = ({ item }) => (
    <TouchableOpacity
      style={styles.newChatUserItem}
      onPress={() => startNewChat(item)}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatar}>{item.avatar}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <Icon name="chatbubble-outline" size={24} color="#075E54" />
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
          <Text style={styles.headerTitle}>Yuhuu!</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.createButton} onPress={openNewChat}>
              <Icon name="create-outline" size={24} color="#075E54" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#075E54" />
          <Text style={styles.loadingText}>Loading chats...</Text>
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
          <Text style={styles.headerTitle}>Yuhuu!</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.createButton} onPress={openNewChat}>
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
        <Text style={styles.headerTitle}>Yuhuu!</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.createButton} onPress={openNewChat}>
            <Icon name="create-outline" size={24} color="#075E54" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search User..."
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
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
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
          <Icon name="chatbubbles-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No chats yet</Text>
          <Text style={styles.emptySubText}>Start a conversation</Text>
        </View>
      )}
      
      {/* Modal New Chat */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={newChatModalVisible}
        onRequestClose={() => setNewChatModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setNewChatModalVisible(false)}
            >
              <Icon name="arrow-back" size={24} color="#075E54" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Chat</Text>
            <View style={styles.modalRightPlaceholder} />
          </View>
          
          <View style={styles.modalSearchContainer}>
            <Icon name="search-outline" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search ID..."
              placeholderTextColor="#999"
              value={newChatSearchQuery}
              onChangeText={handleNewChatSearch}
              autoFocus={true}
            />
            {newChatSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleNewChatSearch('')}>
                <Icon name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          {newChatLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#075E54" />
              <Text style={styles.loadingText}>Searching users...</Text>
            </View>
          ) : newChatUsers.length > 0 ? (
            <FlatList
              data={newChatUsers}
              renderItem={renderNewChatUser}
              keyExtractor={item => item.id?.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.newChatUserList}
            />
          ) : newChatSearchQuery.length > 0 ? (
            <View style={styles.centerContainer}>
              <Icon name="people-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No users found</Text>
              <Text style={styles.emptySubText}>Try a different name</Text>
            </View>
          ) : (
            <View style={styles.centerContainer}>
              <Icon name="chatbubbles-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Find new friends</Text>
              <Text style={styles.emptySubText}>Search by ID to start chatting</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
      
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
  userNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: { fontSize: 16, fontWeight: '600', color: '#000', flex: 1 },
  userEmail: { fontSize: 13, color: '#666', marginTop: 2 },
  messageTime: { fontSize: 11, color: '#999', marginLeft: 8 },
  userDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userDetail: { fontSize: 13, color: '#666', flex: 1 },
  unreadBadge: {
    backgroundColor: '#075E54',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  errorText: { marginTop: 12, fontSize: 16, color: '#f44336', textAlign: 'center' },
  emptyText: { marginTop: 12, fontSize: 16, color: '#999', textAlign: 'center' },
  emptySubText: { marginTop: 8, fontSize: 14, color: '#ccc', textAlign: 'center' },
  retryButton: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#075E54', borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loaderMore: { paddingVertical: 20, alignItems: 'center' },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalBackButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#075E54',
  },
  modalRightPlaceholder: {
    width: 40,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  newChatUserList: {
    paddingHorizontal: 16,
  },
  newChatUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
});

export default RoomList;