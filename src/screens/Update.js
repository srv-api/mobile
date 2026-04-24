// src/screens/Update.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Footer from '../screens/components/Footer';

const STORAGE_KEY = '@feed_posts';
const CURRENT_USER = {
  id: '1',
  name: 'You',
  avatar: 'https://ui-avatars.com/api/?background=075E54&color=fff&name=You',
};

const Update = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);

  // Load posts from storage or initialize with mock data
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPosts(JSON.parse(stored));
      } else {
        // Mock data for demo
        const mockPosts = [
          {
            id: '2',
            userId: '2',
            userName: 'Maharanni Nugraha',
            userAvatar: 'https://ui-avatars.com/api/?background=4CAF50&color=fff&name=MN',
            content: 'Selamat pagi semua! Semoga harimu menyenangkan 🌞',
            image: null,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            likes: 5,
            comments: 2,
            liked: false,
          },
          {
            id: '1',
            userId: '3',
            userName: 'Asep Rayana',
            userAvatar: 'https://ui-avatars.com/api/?background=2196F3&color=fff&name=AR',
            content: 'Just finished a great project! 🚀',
            image: 'https://picsum.photos/400/300',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            likes: 12,
            comments: 3,
            liked: true,
          },
        ];
        setPosts(mockPosts);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockPosts));
      }
    } catch (error) {
      console.error('Load posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePosts = async (newPosts) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPosts));
      setPosts(newPosts);
    } catch (error) {
      console.error('Save posts error:', error);
    }
  };

  const handlePost = async () => {
    if (!postText.trim()) {
      Alert.alert('Error', 'Please enter something to post.');
      return;
    }

    setPosting(true);
    const newPost = {
      id: Date.now().toString(),
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
      userAvatar: CURRENT_USER.avatar,
      content: postText.trim(),
      image: null,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      liked: false,
    };
    const updatedPosts = [newPost, ...posts];
    await savePosts(updatedPosts);
    setPostText('');
    setPosting(false);
  };

  const handleLike = async (postId) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const newLiked = !post.liked;
        return {
          ...post,
          liked: newLiked,
          likes: newLiked ? post.likes + 1 : post.likes - 1,
        };
      }
      return post;
    });
    await savePosts(updatedPosts);
  };

  const handleComment = (postId) => {
    Alert.alert('Comment', 'Comment feature coming soon!');
  };

  const handleShare = (postId) => {
    Alert.alert('Share', 'Share feature coming soon!');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
        <View style={styles.postHeaderInfo}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
        </View>
        <TouchableOpacity>
          <Icon name="ellipsis-horizontal" size={20} color="#999" />
        </TouchableOpacity>
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" />
      )}
      <View style={styles.postStats}>
        <Text style={styles.statText}>{item.likes} likes</Text>
        <Text style={styles.statText}>{item.comments} comments</Text>
      </View>
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item.id)}>
          <Icon
            name={item.liked ? 'heart' : 'heart-outline'}
            size={24}
            color={item.liked ? '#f44336' : '#666'}
          />
          <Text style={[styles.actionText, item.liked && styles.actionTextActive]}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleComment(item.id)}>
          <Icon name="chatbubble-outline" size={22} color="#666" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item.id)}>
          <Icon name="share-outline" size={22} color="#666" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="newspaper-outline" size={60} color="#ccc" />
      <Text style={styles.emptyText}>No posts yet</Text>
      <Text style={styles.emptySubText}>Be the first to share something!</Text>
    </View>
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#075E54" />
        </View>
        <Footer navigation={navigation} active="update" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Updates</Text>
        <TouchableOpacity>
          <Icon name="notifications-outline" size={24} color="#075E54" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContainer}
          ListEmptyComponent={renderEmpty}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />

        <View style={styles.inputContainer}>
          <Image source={{ uri: CURRENT_USER.avatar }} style={styles.inputAvatar} />
          <TextInput
            style={styles.input}
            placeholder="What's on your mind?"
            placeholderTextColor="#999"
            value={postText}
            onChangeText={setPostText}
            multiline
          />
          <TouchableOpacity
            style={[styles.postButton, !postText.trim() && styles.postButtonDisabled]}
            onPress={handlePost}
            disabled={posting || !postText.trim()}
          >
            {posting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Footer navigation={navigation} active="update" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#075E54',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  postHeaderInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#111',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 8,
  },
  statText: {
    fontSize: 13,
    color: '#666',
    marginRight: 16,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  actionTextActive: {
    color: '#f44336',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  postButton: {
    backgroundColor: '#075E54',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
  },
});

export default Update;