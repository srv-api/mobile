// src/screens/HelpSupport.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearTokens } from '../../service/chat/roomApi';

const HelpSupport = ({ navigation }) => {
  const [deleting, setDeleting] = React.useState(false);

  const handleOpenFAQ = () => {
    Alert.alert('FAQ', 'This feature will be available soon.');
  };

  const handleShareApp = () => {
    Share.share({
      message: 'Try Yuhuu! app for easy and secure chatting! Download at: https://miSee.com/download',
      title: 'Share App',
    });
  };

  const handleReportIssue = () => {
    Alert.alert(
      'Report Issue',
      'Please describe the issue you are facing:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => Alert.alert('Thank you', 'Your report has been submitted.'),
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent and all your data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      // Call your delete account API here
      // Example: await deleteUserAccount();
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Clear local storage and tokens
      await clearTokens();
      await AsyncStorage.multiRemove(['user_data', '@notification_enabled']);

      // Navigate to Login screen
      navigation.replace('Login');
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert('Error', 'Failed to delete account. Please try again later.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#075E54" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Delete Account Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            <Icon name="trash-outline" size={24} color="#f44336" />
            <Text style={[styles.menuText, styles.deleteText]}>Delete Account</Text>
            {deleting ? (
              <ActivityIndicator size="small" color="#f44336" />
            ) : (
              <Icon name="chevron-forward-outline" size={20} color="#999" style={styles.chevron} />
            )}
          </TouchableOpacity>
        </View>

        {/* Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Information</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleOpenFAQ}>
            <Icon name="help-circle-outline" size={24} color="#075E54" />
            <Text style={styles.menuText}>Frequently Asked Questions (FAQ)</Text>
            <Icon name="chevron-forward-outline" size={20} color="#999" style={styles.chevron} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleReportIssue}>
            <Icon name="alert-circle-outline" size={24} color="#f44336" />
            <Text style={styles.menuText}>Report an Issue</Text>
            <Icon name="chevron-forward-outline" size={20} color="#999" style={styles.chevron} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleShareApp}>
            <Icon name="share-outline" size={24} color="#075E54" />
            <Text style={styles.menuText}>Share App</Text>
            <Icon name="chevron-forward-outline" size={20} color="#999" style={styles.chevron} />
          </TouchableOpacity>
        </View>

        {/* Version & Credits */}
        <View style={styles.infoContainer}>
          <Text style={styles.versionText}>App Version: 2.0.5</Text>
          <Text style={styles.copyrightText}>© Yuhuu Platforms</Text>
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
  card: {
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
  cardTitle: {
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#111',
    marginLeft: 16,
  },
  deleteText: {
    color: '#f44336',
  },
  chevron: {
    marginLeft: 8,
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#bbb',
    textAlign: 'center',
  },
});

export default HelpSupport;