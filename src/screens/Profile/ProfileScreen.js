// src/screens/Profile.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Footer from '../components/Footer';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchProfileData,
  updateProfile,
  logout,
  uploadProfilePhoto,
  saveUserData,
  uploadGalleryImages,
  deleteGalleryImage
} from '../../service/profile/api';
import { launchImageLibrary } from 'react-native-image-picker';

const Profile = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // State untuk 6 picture inputs
  const [pictures, setPictures] = useState(Array(6).fill(null));
  const [galleryIds, setGalleryIds] = useState(Array(6).fill(null));

  const [modalVisible, setModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    full_name: '',
    email: '',
    whatsapp: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const profileData = await fetchProfileData();

      if (profileData) {
        setProfile(profileData);
        await saveUserData(profileData);
        
        // Load gallery pictures jika ada
        if (profileData.gallery && profileData.gallery.length > 0) {
          const galleryPictures = Array(6).fill(null);
          const galleryIdArray = Array(6).fill(null);
          
          profileData.gallery.forEach((item, index) => {
            if (index < 6) {
              galleryPictures[index] = item.file_path;
              galleryIdArray[index] = item.id;
            }
          });
          setPictures(galleryPictures);
          setGalleryIds(galleryIdArray);
        } else {
          setPictures(Array(6).fill(null));
          setGalleryIds(Array(6).fill(null));
        }
      } else {
        setError('Failed to load profile');
        Alert.alert('Error', 'Failed to load profile');
      }
    } catch (err) {
      console.log('Fetch profile error:', err);

      if (err.response?.status === 401 || err.message?.includes('token')) {
        Alert.alert('Session Expired', 'Please login again', [
          { text: 'OK', onPress: () => navigation.replace('Login') },
        ]);
      } else {
        const errorMsg = err.message || 'An error occurred while loading profile';
        setError(errorMsg);
        Alert.alert('Error', errorMsg);
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

  const handleEditProfile = async () => {
    if (!editForm.full_name || !editForm.email) {
      Alert.alert('Warning', 'Full name and email are required');
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        id: editForm.id,
        full_name: editForm.full_name,
        email: editForm.email,
        whatsapp: editForm.whatsapp,
      };

      const response = await updateProfile(updateData);

      if (response.status) {
        const updatedProfile = {
          ...profile,
          full_name: editForm.full_name,
          email: editForm.email,
          whatsapp: editForm.whatsapp,
        };
        setProfile(updatedProfile);
        await saveUserData(updatedProfile);

        Alert.alert('Success', 'Profile updated successfully');
        setModalVisible(false);
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'An error occurred while updating profile');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    if (profile) {
      setEditForm({
        id: profile.id || '',
        full_name: profile.full_name || '',
        email: profile.email || '',
        whatsapp: profile.whatsapp || '',
      });
      setModalVisible(true);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.replace('Login');
            } catch (error) {
              console.log('Logout error:', error);
              navigation.replace('Login');
            }
          },
        },
      ]
    );
  };

  const pickImage = (index) => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 500,
      maxWidth: 500,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to pick image');
      } else if (response.assets && response.assets[0]) {
        const newPictures = [...pictures];
        const newGalleryIds = [...galleryIds];
        
        newPictures[index] = response.assets[0].uri;
        newGalleryIds[index] = null; // Image baru tidak punya ID
        setPictures(newPictures);
        setGalleryIds(newGalleryIds);
      }
    });
  };

  const removeImage = (index) => {
    const imageId = galleryIds[index];
    
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (imageId) {
                // Delete from server
                await deleteGalleryImage(imageId);
                Alert.alert('Success', 'Image removed from gallery');
                await fetchProfile(); // Refresh gallery
              } else {
                // Just remove from local state
                const newPictures = [...pictures];
                const newGalleryIds = [...galleryIds];
                newPictures[index] = null;
                newGalleryIds[index] = null;
                setPictures(newPictures);
                setGalleryIds(newGalleryIds);
              }
            } catch (error) {
              console.log('Remove image error:', error);
              Alert.alert('Error', 'Failed to remove image');
            }
          },
        },
      ]
    );
  };

const handleGalleryUpload = async () => {
  // Get images that are new (don't have an ID) and not null
  const imagesToUpload = pictures.filter((img, index) => img !== null && !galleryIds[index]);
  
  if (imagesToUpload.length === 0) {
    Alert.alert('Info', 'No new images to upload. Add some photos first!');
    return;
  }

  Alert.alert(
    'Upload Gallery',
    `Upload ${imagesToUpload.length} new image(s) to your gallery?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Upload',
        onPress: async () => {
          try {
            setUploadingGallery(true);

            // Prepare images for upload
            const imageAssets = [];
            pictures.forEach((pic, idx) => {
              if (pic !== null && !galleryIds[idx]) {
                const fileName = pic.split('/').pop();
                imageAssets.push({
                  uri: pic,
                  type: 'image/jpeg',
                  fileName: fileName || `gallery_${Date.now()}_${idx}.jpg`,
                });
              }
            });

            // Upload to server (without userId parameter)
            const response = await uploadGalleryImages(imageAssets);
            
            if (response.status) {
              Alert.alert('Success', 'Gallery images uploaded successfully');
              await fetchProfile(); // Refresh all data
            } else {
              throw new Error(response.message || 'Failed to upload gallery images');
            }
          } catch (error) {
            console.log('Gallery upload error:', error);
            Alert.alert('Error', error.message || 'Failed to upload gallery images');
          } finally {
            setUploadingGallery(false);
          }
        },
      },
    ]
  );
};

const handleProfilePhotoUpload = () => {
  // Cek dulu apakah profile sudah ada dan punya id
  if (!profile || !profile.id) {
    Alert.alert('Error', 'Data user tidak ditemukan. Silahkan refresh halaman profile.');
    return;
  }

  const options = {
    mediaType: 'photo',
    includeBase64: false,
    maxHeight: 500,
    maxWidth: 500,
  };

  launchImageLibrary(options, async (response) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.error) {
      console.log('ImagePicker Error: ', response.error);
      Alert.alert('Error', 'Gagal memilih gambar');
    } else if (response.assets && response.assets[0]) {
      try {
        setSaving(true);
        
        const imageAsset = response.assets[0];
        
        // Kirim userId dengan benar
        const responseData = await uploadProfilePhoto(
          profile.id,        // userId (contoh: "Ug7Ow8=uYh8I")
          imageAsset.uri,    // imageUri
          imageAsset.type,   // imageType 
          imageAsset.fileName // imageName
        );
        
        if (responseData && responseData.status) {
          // Refresh profile untuk ambil data terbaru
          await fetchProfile();
          Alert.alert('Sukses', 'Foto profile berhasil diupdate');
        } else {
          throw new Error(responseData?.message || 'Gagal upload foto profile');
        }
      } catch (error) {
        console.log('Upload error detail:', error);
        Alert.alert('Error', error.message || 'Gagal upload foto profile');
      } finally {
        setSaving(false);
      }
    }
  });
};

  // Render each picture input column
  const renderPictureItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.pictureItem}
      onPress={() => pickImage(index)}
      onLongPress={() => item && removeImage(index)}
      activeOpacity={0.7}
    >
      {item ? (
        <>
          <Image source={{ uri: item }} style={styles.pictureImage} />
          <TouchableOpacity 
            style={styles.removeIcon}
            onPress={() => removeImage(index)}
          >
            <Icon name="close-circle" size={24} color="#ff4444" />
          </TouchableOpacity>
          {!galleryIds[index] && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.picturePlaceholder}>
          <Icon name="camera-outline" size={30} color="#999" />
          <Text style={styles.picturePlaceholderText}>Add Photo</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#075E54" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={60} color="#ff4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{
                  uri: profile?.profile_picture || 'https://via.placeholder.com/120',
                }}
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.editIcon} onPress={handleProfilePhotoUpload}>
                <Icon name="camera-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
            <Text style={styles.bio}>
              {profile?.gender === 'man' ? 'Male' : profile?.gender === 'woman' ? 'Female' : ''}
            </Text>
              <Text style={styles.gender}>{profile?.id || 'User ID'}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {profile?.gallery?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2.5K</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1.2K</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* 6 Picture Input Columns */}
          <View style={styles.picturesContainer}>
            <Text style={styles.picturesTitle}>My Gallery</Text>
            <FlatList
              data={pictures}
              renderItem={renderPictureItem}
              keyExtractor={(_, index) => index.toString()}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={styles.picturesGrid}
            />
            
            {/* Upload Gallery Button */}
            {pictures.some((img, idx) => img !== null && !galleryIds[idx]) && (
              <TouchableOpacity 
                style={styles.uploadGalleryButton}
                onPress={handleGalleryUpload}
                disabled={uploadingGallery}
              >
                {uploadingGallery ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.uploadGalleryButtonText}>Uploading...</Text>
                  </>
                ) : (
                  <>
                    <Icon name="cloud-upload-outline" size={24} color="#fff" />
                    <Text style={styles.uploadGalleryButtonText}>Upload New Photos</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={openEditModal}>
              <View style={styles.menuLeft}>
                <Icon name="person-outline" size={24} color="#075E54" />
                <Text style={styles.menuText}>Personal Information</Text>
              </View>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Preferences')}>
              <View style={styles.menuLeft}>
                <Icon name="settings-outline" size={24} color="#075E54" />
                <Text style={styles.menuText}>Preferences</Text>
              </View>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SecurityPrivacy')}>
              <View style={styles.menuLeft}>
                <Icon name="lock-closed-outline" size={24} color="#075E54" />
                <Text style={styles.menuText}>Security & Privacy</Text>
              </View>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('NotificationSettings')}
            >
              <View style={styles.menuLeft}>
                <Icon name="notifications-outline" size={24} color="#075E54" />
                <Text style={styles.menuText}>Notifications</Text>
              </View>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Icon name="language-outline" size={24} color="#075E54" />
                <Text style={styles.menuText}>Language</Text>
              </View>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('HelpSupport')}
            >
              <View style={styles.menuLeft}>
                <Icon name="help-circle-outline" size={24} color="#075E54" />
                <Text style={styles.menuText}>Help & Support</Text>
              </View>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PremiumAccess')}>
              <View style={styles.menuLeft}>
                <Icon name="card-outline" size={24} color="#075E54" />
                <Text style={styles.premiumText}>Premium Access</Text>
              </View>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="log-out-outline" size={24} color="#ff4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version 2.0.5</Text>
          </View>
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.full_name}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, full_name: text })
                  }
                  placeholder="Enter full name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.email}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, email: text })
                  }
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>WhatsApp</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.whatsapp}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, whatsapp: text })
                  }
                  placeholder="Enter WhatsApp number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleEditProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Footer navigation={navigation} active="profile" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  newBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: '#075E54',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  uploadGalleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#075E54',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 15,
  },
  uploadGalleryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  removeIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
  },

  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#075E54',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#075E54',
  },
  editIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#075E54',
    borderRadius: 15,
    padding: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 5,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  gender: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 5,
  },

  whatsapp: {
    fontSize: 13,
    color: '#25D366',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#075E54',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  picturesContainer: {
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 15,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
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
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pictureImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  picturePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  picturePlaceholderText: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#111',
    marginLeft: 15,
  },
  premiumText: {
    fontSize: 16,
    color: '#238eff',
    marginLeft: 15,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 15,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    color: '#ff4444',
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
  userIdText: {
    fontSize: 10,
    color: '#ccc',
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#075E54',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default Profile;