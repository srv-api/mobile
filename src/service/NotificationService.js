// src/services/NotificationService.js
import notifee, { AndroidImportance } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { navigate } from '../navigation/RootNavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
// ✅ Hanya import config, jangan inisialisasi ulang
import '../config/firebase';
import MessageRepository from '../database/MessageRepository';

const API_BASE_CHAT = 'http://103.150.227.223:2369';

// ✅ Global Set untuk mencegah duplicate message
const processedMessageIds = new Set();
// ✅ Pending promises untuk mencegah race condition
const pendingSaves = new Map();

// ✅ Cleanup setiap 30 detik
setInterval(() => {
  processedMessageIds.clear();
  console.log('🧹 Cleaned processed message IDs cache');
}, 30000);

// ✅ Helper untuk sanitasi data notification (validasi tipe data)
const sanitizeNotificationData = (data) => {
  const safeData = {};
  if (!data) return safeData;
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && typeof value !== 'object') {
      safeData[key] = String(value);
    }
  }
  return safeData;
};

// ✅ Helper untuk proses message dengan lock (mencegah race condition)
const processMessage = async (messageId, saveFunction) => {
  if (!messageId) return false;
  
  // Cek jika sudah diproses
  if (processedMessageIds.has(messageId)) {
    console.log('⚠️ Duplicate message ignored (already processed):', messageId);
    return false;
  }
  
  // Cek jika sedang diproses
  if (pendingSaves.has(messageId)) {
    console.log('⏳ Message already being processed, waiting...', messageId);
    await pendingSaves.get(messageId);
    return false;
  }
  
  // Tandai sebagai sedang diproses
  const savePromise = saveFunction();
  pendingSaves.set(messageId, savePromise);
  
  try {
    await savePromise;
    processedMessageIds.add(messageId);
    return true;
  } finally {
    pendingSaves.delete(messageId);
  }
};

// ✅ Helper untuk cek duplicate sederhana
const isDuplicate = (messageId) => {
  if (!messageId) return false;
  return processedMessageIds.has(messageId);
};

// ✅ Tambahkan pengecekan apakah Firebase sudah siap
const isFirebaseReady = () => {
  try {
    return messaging().app.options.projectId;
  } catch (e) {
    return false;
  }
};

// BACKGROUND MESSAGE HANDLER
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('📨 Background message received:', remoteMessage);
  
  const messageId = remoteMessage.data?.message_id || remoteMessage.messageId;
  
  const result = await processMessage(messageId, async () => {
    const data = remoteMessage.data;
    const notification = remoteMessage.notification;
    
    const title = notification?.title || data?.sender_name || 'New Message';
    const body = notification?.body || data?.message || 'You have a new message';
    const senderId = data?.sender_id;
    const messageText = data?.message || body;
    const senderName = data?.sender_name || title;
    const receiverId = data?.receiver_id || '';
    const createdAt = new Date().toISOString();
    
    // ✅ CEK DI DATABASE DAN SAVE
    if (messageText && senderId) {
      try {
        const exists = await MessageRepository.messageExists(messageId);
        if (!exists) {
          await MessageRepository.saveMessage({
            id: messageId,
            text: messageText,
            senderId: senderId,
            senderName: senderName,
            receiverId: receiverId,
            receiverName: 'Me',
            isOwn: false,
            status: 'received',
            timestamp: new Date().toLocaleTimeString(),
            createdAt: createdAt,
          });
          console.log('✅ Message saved to SQLite from FCM background');
        } else {
          console.log('⚠️ Message already exists in DB, skip saving');
        }
      } catch (error) {
        console.error('Failed to save FCM message:', error);
      }
    }
    
    // ✅ Tampilkan notifikasi dengan data yang sudah disanitasi
    const notificationData = sanitizeNotificationData({
      ...data,
      message_id: messageId ? String(messageId) : Date.now().toString(),
      message: messageText ? String(messageText) : '',
      sender_id: senderId ? String(senderId) : '',
      sender_name: senderName ? String(senderName) : '',
    });
    
    try {
      await notifee.displayNotification({
        title: String(title || 'New Message'),
        body: String(body || 'You have a new message'),
        data: notificationData,
        android: {
          channelId: 'chat_messages',
          pressAction: { id: 'default', launchActivity: 'default' },
          smallIcon: 'ic_launcher',
        },
        ios: {
          sound: 'default',
        },
      });
      console.log('✅ Notification displayed successfully');
    } catch (notifError) {
      console.error('Failed to display notification:', notifError);
      // Fallback: coba tanpa data
      await notifee.displayNotification({
        title: String(title || 'New Message'),
        body: String(body || 'You have a new message'),
        android: {
          channelId: 'chat_messages',
          pressAction: { id: 'default', launchActivity: 'default' },
          smallIcon: 'ic_launcher',
        },
      });
    }
  });
  
  if (!result) {
    console.log('⚠️ Background message skipped:', messageId);
  }
});

// BACKGROUND NOTIFEE HANDLER
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('📱 Notifee background event:', type);
  
  if (type === 'press') {
    const data = detail.notification?.data;
    console.log('Notification pressed with data:', data);
    
    if (data?.sender_id) {
      navigate('ChatRoom', {
        receiverId: data.sender_id,
        receiverName: data.sender_name || 'User',
        currentUserId: data.current_user_id,
        currentUserName: data.current_user_name,
      });
    }
  }
});

class NotificationService {

  // src/service/NotificationService.js
  
  // ✅ TAMBAHKAN METHOD INI
  async init() {
    console.log('🚀 Initializing NotificationService...');
    
    try {
      // Setup notification channels
      await this.setupChannels();
      
      // Setup FCM listeners (foreground)
      this.setupFCMListeners();
      
      // Request permission and get token
      const hasPermission = await this.requestPermission();
      if (hasPermission) {
        await this.getFCMToken();
      }
      
      console.log('✅ NotificationService initialized successfully');
    } catch (error) {
      console.error('❌ NotificationService init error:', error);
    }
  }
  
  
  
  async requestPermission() {
    try {
      // ✅ Cek Firebase ready
      if (!isFirebaseReady()) {
        console.log('Firebase not ready yet, waiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      return enabled;
    } catch (error) {
      console.error('Request permission error:', error);
      return false;
    }
  }

  async getFCMToken() {
    try {
      if (!isFirebaseReady()) {
        console.log('Firebase not ready, cannot get token');
        return null;
      }
      
      const token = await messaging().getToken();
      console.log('📱 FCM Token:', token);
      await this.sendTokenToBackend(token);
      await AsyncStorage.setItem('fcm_token', token);
      return token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  async sendTokenToBackend(token) {
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const userId = await AsyncStorage.getItem('user_id'); // pr token
      
      if (!accessToken || !userId) {
        console.log('No auth token, skip sending FCM');
        return;
      }
      
      const response = await fetch(`${API_BASE_CHAT}/users/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ 
          fcm_token: token, 
        }),
      });
      
      if (response.ok) {
        console.log('✅ FCM token sent to backend');
      } else {
        console.log('Failed to send FCM token:', response.status);
      }
    } catch (error) {
      console.error('Failed to send token:', error);
    }
  }

  async setupChannels() {
    await notifee.createChannel({
      id: 'chat_messages',
      name: 'Chat Messages',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
    });
    console.log('✅ Notification channels created');
  }

  async showLocalNotification(title, body, data = {}) {
    try {
      const safeData = sanitizeNotificationData(data);
      await notifee.displayNotification({
        title: String(title || 'New Message'),
        body: String(body || 'You have a new message'),
        data: safeData,
        android: {
          channelId: 'chat_messages',
          pressAction: { id: 'default', launchActivity: 'default' },
          smallIcon: 'ic_launcher',
        },
        ios: {
          sound: 'default',
        },
      });
      console.log('✅ Local notification shown');
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  setupFCMListeners() {
    // Foreground message handler
    messaging().onMessage(async (remoteMessage) => {
      console.log('📨 FCM in foreground:', remoteMessage);
      
      const data = remoteMessage.data;
      const notification = remoteMessage.notification;
      const messageId = data?.message_id || remoteMessage.messageId || Date.now().toString();
      const messageText = data?.message || notification?.body || '';
      const senderId = data?.sender_id;
      const senderName = data?.sender_name || notification?.title || 'User';
      
      // ✅ CEK DUPLICATE dengan lock
      const result = await processMessage(messageId, async () => {
        if (messageText && senderId) {
          const exists = await MessageRepository.messageExists(messageId);
          if (!exists) {
            await MessageRepository.saveMessage({
              id: messageId,
              text: messageText,
              senderId: senderId,
              senderName: senderName,
              receiverId: data?.receiver_id || '',
              receiverName: 'Me',
              isOwn: false,
              status: 'received',
              timestamp: new Date().toLocaleTimeString(),
              createdAt: new Date().toISOString(),
            });
            console.log('✅ Message saved to SQLite from FCM foreground');
          } else {
            console.log('⚠️ Message already exists in DB, skip saving');
          }
        }
      });
      
      if (!result) {
        console.log('⚠️ Foreground message skipped (duplicate):', messageId);
      }
    });

    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('📱 App opened from background');
      this.handleNotificationNavigation(remoteMessage);
    });

    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('📱 App opened from killed state');
        this.handleNotificationNavigation(remoteMessage);
      }
    });
  }

  handleNotificationNavigation(remoteMessage) {
    const senderId = remoteMessage.data?.sender_id;
    const senderName = remoteMessage.data?.sender_name;
    const currentUserId = remoteMessage.data?.current_user_id;
    const currentUserName = remoteMessage.data?.current_user_name;
    
    console.log('🔍 Navigation data:', { senderId, senderName });
    
    if (senderId && senderName) {
      setTimeout(() => {
        navigate('ChatRoom', {
          receiverId: senderId,
          receiverName: senderName,
          currentUserId: currentUserId || senderId,
          currentUserName: currentUserName || senderName,
        });
      }, 500);
    }
  }

  async setBadgeCount(count) {
    await notifee.setBadgeCount(count);
  }

  async getBadgeCount() {
    return await notifee.getBadgeCount();
  }

  async clearBadge() {
    await notifee.setBadgeCount(0);
  }
}

export default new NotificationService();