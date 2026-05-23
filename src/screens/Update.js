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
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Footer from '../screens/components/Footer';
import { fetchPosts, createPost, BASE_URL } from '../service/update/api';
import * as ImagePicker from 'react-native-image-picker'; // Install: npm install react-native-image-picker
import { launchImageLibrary } from 'react-native-image-picker';

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
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      
      const result = await fetchPosts(navigation);

      if (!result) {
        return;
      }

      let postsData = [];
      if (result.data && Array.isArray(result.data)) {
        postsData = result.data;
      }

      const mappedPosts = postsData
        .filter(item => item.id)
        .map(item => ({
          id: item.id,
          userId: item.user_id,
          userName: item.created_by || `User_${item.user_id?.substring(0, 6)}`,
          userAvatar: `https://ui-avatars.com/api/?background=075E54&color=fff&name=${encodeURIComponent(item.created_by || 'User')}`,
          content: item.caption || 'No caption',
          image: item.image_url && item.image_url !== '' 
            ? `http://103.150.227.223:2349/picture${item.image_url}` 
            : null,
          timestamp: new Date().toISOString(),
          likes: 0,
          comments: 0,
          liked: false,
        }));

      setPosts(mappedPosts);
    } catch (error) {
      console.error('Load posts error:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const selectImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedImage({
          uri: asset.uri,
          type: asset.type,
          fileName: asset.fileName,
        });
        setShowImagePickerModal(false);
      }
    });
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const handlePost = async () => {
    if (!postText.trim() && !selectedImage) {
      Alert.alert('Error', 'Please enter something or select an image to post');
      return;
    }

    setPosting(true);

    try {
      // Upload ke server
      const response = await createPost(postText.trim(), selectedImage);
      
      if (response && response.status === 'success') {
        // Reset form
        setPostText('');
        setSelectedImage(null);
        
        // Reload posts
        await loadPosts();
        
        Alert.alert('Success', 'Post created successfully!');
      } else {
        Alert.alert('Error', response?.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Create post error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = (postId) => {
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
    setPosts(updatedPosts);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
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

  const renderImagePickerModal = () => (
    <Modal
      visible={showImagePickerModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowImagePickerModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowImagePickerModal(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Image</Text>
          <TouchableOpacity style={styles.modalOption} onPress={selectImage}>
            <Icon name="images-outline" size={24} color="#075E54" />
            <Text style={styles.modalOptionText}>Choose from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modalOption, styles.modalCancel]} 
            onPress={() => setShowImagePickerModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Updates</Text>
        <TouchableOpacity>
          <Icon name="notifications-outline" size={24} color="#075E54" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContainer}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />

        <View style={styles.inputContainer}>
          <Image source={{ uri: CURRENT_USER.avatar }} style={styles.inputAvatar} />
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="What's on your mind?"
              placeholderTextColor="#999"
              value={postText}
              onChangeText={setPostText}
              multiline
            />
            {selectedImage && (
              <View style={styles.selectedImageContainer}>
                <Image source={{ uri: selectedImage.uri }} style={styles.selectedImagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                  <Icon name="close-circle" size={24} color="#f44336" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.imagePickerButton} 
              onPress={() => setShowImagePickerModal(true)}
            >
              <Icon name="image-outline" size={24} color="#075E54" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.postButton, (!postText.trim() && !selectedImage) && styles.postButtonDisabled]}
              onPress={handlePost}
              disabled={posting || (!postText.trim() && !selectedImage)}
            >
              {posting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Footer navigation={navigation} active="update" />
      {renderImagePickerModal()}
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
    alignItems: 'flex-start',
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
  inputWrapper: {
    flex: 1,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  selectedImageContainer: {
    marginTop: 8,
    position: 'relative',
  },
  selectedImagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  imagePickerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  postButton: {
    backgroundColor: '#075E54',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#111',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#111',
  },
  modalCancel: {
    justifyContent: 'center',
    marginTop: 10,
    borderBottomWidth: 0,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
  },
});

export default Update;