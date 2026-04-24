// src/screens/SecurityPrivacy.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SecurityPrivacy = ({ navigation }) => {
  const [lastSeenEnabled, setLastSeenEnabled] = useState(true);
  const [profilePhotoVisible, setProfilePhotoVisible] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const lastSeen = await AsyncStorage.getItem('@last_seen_enabled');
      if (lastSeen !== null) setLastSeenEnabled(lastSeen === 'true');
      const photoVisible = await AsyncStorage.getItem('@profile_photo_visible');
      if (photoVisible !== null) setProfilePhotoVisible(photoVisible === 'true');
      const twoFactor = await AsyncStorage.getItem('@two_factor_enabled');
      if (twoFactor !== null) setTwoFactorEnabled(twoFactor === 'true');
    } catch (error) {
      console.error(error);
    }
  };

  const saveSetting = async (key, value) => {
    await AsyncStorage.setItem(key, String(value));
  };

  const handleLastSeenToggle = (value) => {
    setLastSeenEnabled(value);
    saveSetting('@last_seen_enabled', value);
    Alert.alert('Success', value ? 'Last seen is now visible to others' : 'Last seen is now hidden');
  };

  const handleProfilePhotoToggle = (value) => {
    setProfilePhotoVisible(value);
    saveSetting('@profile_photo_visible', value);
    Alert.alert('Success', value ? 'Profile photo is visible to everyone' : 'Profile photo is hidden');
  };

  const handleTwoFactorToggle = async (value) => {
    if (value) {
      Alert.alert(
        'Enable Two-Factor Authentication',
        'You will be guided to set up 2FA using an authenticator app.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setTwoFactorEnabled(false) },
          { text: 'Setup', onPress: () => {
              Alert.alert('Coming Soon', '2FA setup will be available soon.');
              setTwoFactorEnabled(false);
            }
          }
        ]
      );
    } else {
      setTwoFactorEnabled(false);
      saveSetting('@two_factor_enabled', 'false');
      Alert.alert('Success', 'Two-Factor Authentication disabled');
    }
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'This feature will be available soon.');
  };

  const handleManageDevices = () => {
    Alert.alert('Manage Devices', 'You will be able to see and remove connected devices soon.');
  };

  const handleBlockedUsers = () => {
    Alert.alert('Blocked Users', 'Manage your blocked list will be available soon.');
  };

  const handleDataSharing = () => {
    Alert.alert('Data Sharing', 'Manage third-party app access will be available soon.');
  };

  const handleAccountVisibility = () => {
    Alert.alert('Account Visibility', 'Switch between Public and Private account soon.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#075E54" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Security</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
            <View style={styles.menuLeft}>
              <Icon name="key-outline" size={24} color="#075E54" />
              <Text style={styles.menuText}>Change Password</Text>
            </View>
            <Icon name="chevron-forward-outline" size={20} color="#999" />
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Icon name="shield-checkmark-outline" size={24} color="#075E54" />
              <Text style={styles.menuText}>Two-Factor Authentication</Text>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: '#075E54' }}
              thumbColor={twoFactorEnabled ? '#fff' : '#f4f3f4'}
              onValueChange={handleTwoFactorToggle}
              value={twoFactorEnabled}
            />
          </View>

          <TouchableOpacity style={styles.menuItem} onPress={handleManageDevices}>
            <View style={styles.menuLeft}>
              <Icon name="phone-portrait-outline" size={24} color="#075E54" />
              <Text style={styles.menuText}>Manage Devices</Text>
            </View>
            <Icon name="chevron-forward-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Privacy Controls Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Controls</Text>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Icon name="eye-outline" size={24} color="#075E54" />
              <Text style={styles.menuText}>Last Seen & Online</Text>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: '#075E54' }}
              thumbColor={lastSeenEnabled ? '#fff' : '#f4f3f4'}
              onValueChange={handleLastSeenToggle}
              value={lastSeenEnabled}
            />
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Icon name="camera-outline" size={24} color="#075E54" />
              <Text style={styles.menuText}>Profile Photo Visibility</Text>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: '#075E54' }}
              thumbColor={profilePhotoVisible ? '#fff' : '#f4f3f4'}
              onValueChange={handleProfilePhotoToggle}
              value={profilePhotoVisible}
            />
          </View>

          <TouchableOpacity style={styles.menuItem} onPress={handleAccountVisibility}>
            <View style={styles.menuLeft}>
              <Icon name="globe-outline" size={24} color="#075E54" />
              <Text style={styles.menuText}>Account Visibility (Public/Private)</Text>
            </View>
            <Icon name="chevron-forward-outline" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleBlockedUsers}>
            <View style={styles.menuLeft}>
              <Icon name="ban-outline" size={24} color="#075E54" />
              <Text style={styles.menuText}>Blocked Users</Text>
            </View>
            <Icon name="chevron-forward-outline" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleDataSharing}>
            <View style={styles.menuLeft}>
              <Icon name="share-social-outline" size={24} color="#075E54" />
              <Text style={styles.menuText}>Data Sharing with Third Parties</Text>
            </View>
            <Icon name="chevron-forward-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Icon name="information-circle-outline" size={20} color="#2E7D32" />
          <Text style={styles.infoText}>
            Your security and privacy are important. We encrypt your messages end-to-end.
          </Text>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#075E54',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#075E54',
    marginTop: 12,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: '#111',
    marginLeft: 16,
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default SecurityPrivacy;