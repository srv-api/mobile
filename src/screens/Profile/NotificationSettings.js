// src/screens/NotificationSettings.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_PREF_KEY = '@notification_enabled';

const NotificationSettings = ({ navigation }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [systemPermissionGranted, setSystemPermissionGranted] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load local preference
      const savedPref = await AsyncStorage.getItem(NOTIFICATION_PREF_KEY);
      const enabled = savedPref === 'true';
      setIsEnabled(enabled);

      // Check system permission (Android 13+)
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        setSystemPermissionGranted(granted);
      } else {
        setSystemPermissionGranted(true);
      }
    } catch (error) {
      console.error('Load settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestSystemPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Enable Notifications',
            message: 'This app needs permission to send you notifications about new messages.',
            buttonNeutral: 'Ask Later',
            buttonNegative: 'Deny',
            buttonPositive: 'Allow',
          }
        );
        const granted = result === PermissionsAndroid.RESULTS.GRANTED;
        setSystemPermissionGranted(granted);
        return granted;
      } catch (error) {
        console.error('Request permission error:', error);
        return false;
      }
    }
    return true;
  };

  const openSystemSettings = () => {
    Linking.openSettings();
  };

  const toggleSwitch = async (value) => {
    if (value === true) {
      // Enable notifications: check system permission
      if (!systemPermissionGranted) {
        const granted = await requestSystemPermission();
        if (granted) {
          setIsEnabled(true);
          await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, 'true');
          Alert.alert('Success', 'Notifications enabled.');
        } else {
          // Permission denied – keep toggle OFF
          setIsEnabled(false);
          Alert.alert(
            'Permission Required',
            'Please enable notification permission in system settings to receive alerts.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: openSystemSettings },
            ]
          );
        }
      } else {
        setIsEnabled(true);
        await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, 'true');
        Alert.alert('Success', 'Notifications enabled.');
      }
    } else {
      // Disable notifications (local preference only, system permission remains)
      setIsEnabled(false);
      await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, 'false');
      Alert.alert('Notifications Disabled', 'You will no longer receive notifications from this app.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#075E54" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#075E54" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#075E54" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name="notifications-outline" size={28} color="#075E54" />
              <Text style={styles.label}>Receive Notifications</Text>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: '#075E54' }}
              thumbColor={isEnabled ? '#fff' : '#f4f3f4'}
              onValueChange={toggleSwitch}
              value={isEnabled}
            />
          </View>
          <Text style={styles.description}>
            Turn on to get alerts when you receive new messages.
          </Text>
        </View>

        {!systemPermissionGranted && Platform.OS === 'android' && Platform.Version >= 33 && (
          <View style={styles.warningCard}>
            <Icon name="alert-circle-outline" size={24} color="#f57c00" />
            <Text style={styles.warningText}>
              Notification permission is not granted. Please enable it in system settings.
            </Text>
            <TouchableOpacity style={styles.settingsButton} onPress={openSystemSettings}>
              <Text style={styles.settingsButtonText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#075E54' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 20,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '600', color: '#111', marginLeft: 12 },
  description: { fontSize: 14, color: '#666', lineHeight: 20 },
  warningCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  warningText: { fontSize: 14, color: '#f57c00', textAlign: 'center', marginTop: 8, marginBottom: 12 },
  settingsButton: { backgroundColor: '#f57c00', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  settingsButtonText: { color: '#fff', fontWeight: '600' },
});

export default NotificationSettings;