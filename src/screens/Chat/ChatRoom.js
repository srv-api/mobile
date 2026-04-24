// src/screens/ChatRoom.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { webSocketService } from '../../service/WebSocketServices';
import { useFocusEffect } from '@react-navigation/native';

import {
  fetchChatHistory,
  formatTimestamp,
  formatDateHeader,
} from '../../service/chat/chatApi';

import MessageRepository from '../../database/MessageRepository';
import { setupDatabase } from '../../database/setup';
import TemporaryStorage from '../../database/TempStorage';
import NotificationService from '../../service/NotificationService';

const { width, height } = Dimensions.get('window');

const ChatRoom = ({ route, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [replyTo, setReplyTo] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [dbReady, setDbReady] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const flatListRef = useRef(null);
  const isMountedRef = useRef(true);
  const inputRef = useRef(null);
  const reconnectIntervalRef = useRef(null);
  
  const receiverId = route?.params?.receiverId;
  const receiverName = route?.params?.receiverName;
  const currentUserId = route?.params?.currentUserId;
  const currentUserName = route?.params?.currentUserName;

  // Initialize Database
  useEffect(() => {
    const initDatabase = async () => {
      try {
        await setupDatabase();
        setDbReady(true);
        console.log('✅ Database ready');
      } catch (error) {
        console.error('❌ Database init error:', error);
      }
    };
    initDatabase();
  }, []);

  // WebSocket message handler
  useEffect(() => {
    const handleGlobalMessage = (message) => {
      console.log('🌐 Global message received in ChatRoom:', message);
      
      if (message.type === 'chat' && message.message) {
        const isForThisChat = 
          (message.sender_id === receiverId && message.receiver_id === currentUserId) ||
          (message.sender_id === currentUserId && message.receiver_id === receiverId);
        
        if (isForThisChat) {
          setMessages(prevMessages => {
            const exists = prevMessages.some(m => 
              m.id === message.id || 
              (m.text === message.message && 
               Math.abs(new Date(m.createdAt) - new Date(message.created_at)) < 1000)
            );
            
            if (!exists) {
              const newMessage = {
                id: message.id || `msg_${Date.now()}_${Math.random()}`,
                text: message.message,
                timestamp: formatTimestamp(message.created_at) || formatTimestamp(new Date().toISOString()),
                isOwn: message.sender_id === currentUserId,
                sender: message.sender_name || (message.sender_id === currentUserId ? currentUserName : receiverName),
                senderId: message.sender_id,
                receiverId: message.receiver_id,
                createdAt: message.created_at || new Date().toISOString(),
              };
              
              setTimeout(() => scrollToBottom(), 100);
              return [...prevMessages, newMessage];
            }
            return prevMessages;
          });
        }
      }
    };
    
    const handleStatusChange = (status) => {
      console.log('🌐 Global WebSocket status:', status);
      setWsStatus(status);
      
      // Jika status menjadi connected, reload messages
      if (status === 'connected') {
        setIsReconnecting(false);
        if (reconnectIntervalRef.current) {
          clearInterval(reconnectIntervalRef.current);
          reconnectIntervalRef.current = null;
        }
        // Reload messages saat koneksi kembali
        if (dbReady && currentUserId && receiverId) {
          console.log('✅ WebSocket connected, reloading messages...');
          loadChatHistory(1, false);
        }
      }
    };
    
    webSocketService.onMessage(handleGlobalMessage);
    webSocketService.onStatusChange(handleStatusChange);
    setWsStatus(webSocketService.getStatus());
    
    return () => {
      webSocketService.removeHandler(handleGlobalMessage);
      webSocketService.removeHandler(handleStatusChange);
    };
  }, [receiverId, currentUserId, currentUserName, receiverName, dbReady]);

  // App State listener untuk notifikasi dan reconnect
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      setAppState(nextAppState);
      if (nextAppState === 'active') {
        NotificationService.clearBadge();
        // Cek dan reconnect WebSocket saat app aktif kembali
        await checkAndReconnectWebSocket();
      }
    });
    return () => subscription.remove();
  }, []);
// Di ChatRoom.js, tambahkan useEffect untuk debug
useEffect(() => {
  const debugDatabase = async () => {
    if (dbReady && currentUserId && receiverId) {
      console.log('🔍 ===== DATABASE DEBUG =====');
      
      // Get ALL messages tanpa limit
      const allMessages = await MessageRepository.getAllChatMessages(currentUserId, receiverId);
      console.log(`📊 ALL messages in DB: ${allMessages.length}`);
      
      // Get paginated messages
      const paginatedMessages = await MessageRepository.getChatHistory(currentUserId, receiverId, 20, 0);
      console.log(`📊 Paginated messages: ${paginatedMessages.length}`);
      
      // Debug query
      const debugInfo = await MessageRepository.debugQuery(currentUserId, receiverId);
      console.log('🔍 Debug info:', debugInfo);
      
      if (allMessages.length !== paginatedMessages.length) {
        console.warn(`⚠️ MISMATCH! DB has ${allMessages.length} but query returned ${paginatedMessages.length}`);
        console.log('This explains why you see fewer messages in UI!');
      }
      
      console.log('🔍 ===== END DEBUG =====');
    }
  };
  
  debugDatabase();
}, [dbReady, currentUserId, receiverId]);
  // Fungsi untuk cek dan reconnect WebSocket
  const checkAndReconnectWebSocket = useCallback(async () => {
    const currentStatus = webSocketService.getStatus();
    console.log('🔍 Checking WebSocket status:', currentStatus);
    
    if (currentStatus !== 'connected') {
      console.log('🔄 WebSocket not connected, attempting to reconnect...');
      setIsReconnecting(true);
      
      const userId = await AsyncStorage.getItem('user_id');
      const token = await AsyncStorage.getItem('access_token');
      
      if (userId && token) {
        webSocketService.connect(userId);
        
        // Setup interval untuk mengecek koneksi
        if (reconnectIntervalRef.current) {
          clearInterval(reconnectIntervalRef.current);
        }
        
        reconnectIntervalRef.current = setInterval(() => {
          const status = webSocketService.getStatus();
          if (status === 'connected') {
            setIsReconnecting(false);
            if (reconnectIntervalRef.current) {
              clearInterval(reconnectIntervalRef.current);
              reconnectIntervalRef.current = null;
            }
          } else if (status === 'error') {
            console.log('⚠️ Reconnect failed, retrying...');
            webSocketService.connect(userId);
          }
        }, 3000);
      } else {
        console.log('❌ No user session found');
        setIsReconnecting(false);
      }
    } else {
      console.log('✅ WebSocket already connected');
    }
  }, []);

  // Focus effect - reconnect saat screen difokuskan
  useFocusEffect(
    useCallback(() => {
      console.log('📱 ChatRoom focused');
      
      const initChat = async () => {
        if (dbReady && currentUserId && receiverId) {
          // Cek dan reconnect WebSocket
          await checkAndReconnectWebSocket();
          // Load chat history
          await loadChatHistory(1, false);
        }
        
        // Clear badge
        NotificationService.clearBadge();
      };
      
      initChat();
      
      return () => {
        // Cleanup jika perlu
      };
    }, [dbReady, currentUserId, receiverId, checkAndReconnectWebSocket])
  );

  // Polling status untuk update UI
  useEffect(() => {
    const statusInterval = setInterval(() => {
      const status = webSocketService.getStatus();
      if (status !== wsStatus) {
        console.log(`📡 Status changed: ${wsStatus} -> ${status}`);
        setWsStatus(status);
        
        // Jika baru connected, reload messages
        if (status === 'connected' && wsStatus !== 'connected') {
          console.log('🎉 WebSocket just connected, reloading messages...');
          loadChatHistory(1, false);
          setTimeout(() => scrollToBottom(), 500);
        }
      }
    }, 2000);
    
    return () => clearInterval(statusInterval);
  }, [wsStatus]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => scrollToBottom(), 100);
      }
    );
    
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    
    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
      }
    };
  }, []);

  const handleSessionExpired = useCallback(() => {
    Alert.alert(
      'Session Expired',
      'Your session has expired. Please login again.',
      [
        { 
          text: 'OK', 
          onPress: async () => {
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('refresh_token');
            await AsyncStorage.removeItem('user_id');
            webSocketService.disconnect();
            navigation.replace('Login');
          } 
        }
      ]
    );
  }, [navigation]);

  const handleDeleteMessage = useCallback(async (message) => {
    Alert.alert(
      'Hapus Pesan',
      'Yakin ingin menghapus pesan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              await MessageRepository.deleteMessageById(message.id);
              setMessages(prev => prev.filter(msg => msg.id !== message.id));
              if (replyTo?.id === message.id) {
                setReplyTo(null);
              }
              Alert.alert('Berhasil', 'Pesan berhasil dihapus');
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'Gagal menghapus pesan');
            }
          }
        }
      ]
    );
  }, [replyTo]);

  const scrollToBottom = useCallback(() => {
    try {
      setTimeout(() => {
        if (flatListRef?.current && isMountedRef.current) {
          if (typeof flatListRef.current.scrollToEnd === 'function') {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }
      }, 100);
    } catch (error) {
      console.log('ScrollToBottom error:', error);
    }
  }, []);

  // LOAD CHAT HISTORY
// GANTI fungsi loadChatHistory yang lama dengan ini
const loadChatHistory = useCallback(async () => {
  if (!isMountedRef.current || !dbReady || !currentUserId || !receiverId) return;
  
  try {
    setLoading(true);
    
    // ✅ LANGSUNG ambil semua pesan, tanpa limit
    const allMessages = await MessageRepository.getAllChatMessages(currentUserId, receiverId);
    
    console.log(`📱 Loaded ${allMessages.length} messages from SQLite`);
    
    if (allMessages.length > 0) {
      const formattedMessages = allMessages.map(msg => {
        let formattedTimestamp = '';
        try {
          formattedTimestamp = formatTimestamp(msg.created_at) || '';
        } catch (e) {}
        
        return {
          id: msg.id,
          text: msg.text || '',
          timestamp: formattedTimestamp,
          isOwn: msg.is_own === 1,
          sender: msg.is_own === 1 ? currentUserName : receiverName,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          createdAt: msg.created_at,
        };
      });
      
      setMessages(formattedMessages);
      setTimeout(() => scrollToBottom(), 500);
    } else {
      setMessages([]);
    }
    
    setHasMore(false); // Tidak ada pagination karena semua sudah diambil
    
  } catch (error) {
    console.error('Error loading chat history:', error);
    setMessages([]);
  } finally {
    if (isMountedRef.current) {
      setLoading(false);
    }
  }
}, [currentUserId, receiverId, currentUserName, receiverName, scrollToBottom, dbReady]);
  // Polling untuk pesan baru dari database
// GANTI useEffect checkNewMessages
useEffect(() => {
  const checkNewMessages = setInterval(async () => {
    if (!dbReady || !currentUserId || !receiverId) return;
    
    try {
      // ✅ Ambil semua pesan, bukan hanya 20
      const allMessages = await MessageRepository.getAllChatMessages(currentUserId, receiverId);
      
      if (allMessages && allMessages.length > 0) {
        const formattedMessages = allMessages.map(msg => ({
          id: msg.id,
          text: msg.text || '',
          timestamp: formatTimestamp(msg.created_at) || '',
          isOwn: msg.is_own === 1,
          sender: msg.is_own === 1 ? currentUserName : receiverName,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          createdAt: msg.created_at,
        }));
        
        setMessages(prevMessages => {
          if (prevMessages.length !== formattedMessages.length) {
            console.log(`🆕 Updating messages: ${prevMessages.length} -> ${formattedMessages.length}`);
            setTimeout(() => scrollToBottom(), 100);
            return formattedMessages;
          }
          return prevMessages;
        });
      }
    } catch (error) {
      console.error('Error checking new messages:', error);
    }
  }, 3000);
  
  return () => clearInterval(checkNewMessages);
}, [dbReady, currentUserId, receiverId, currentUserName, receiverName, scrollToBottom]);
  // SEND MESSAGE
  const sendMessage = useCallback(async () => {
    const messageText = inputText.trim();
    
    if (messageText.length === 0) return;
    
    // Cek koneksi WebSocket
    if (webSocketService.getStatus() !== 'connected') {
      Alert.alert(
        'Koneksi Terputus',
        'Mohon tunggu sebentar atau coba lagi nanti.',
        [
          { text: 'OK', style: 'cancel' },
          { 
            text: 'Coba Lagi', 
            onPress: () => {
              checkAndReconnectWebSocket();
              setTimeout(() => sendMessage(), 1000);
            }
          }
        ]
      );
      return;
    }
    
    const accessToken = await AsyncStorage.getItem('access_token');
    if (!accessToken) {
      handleSessionExpired();
      return;
    }
    
    if (!dbReady) {
      Alert.alert('Error', 'Database not ready');
      return;
    }
    
    setSending(true);
    
    const messageId = Date.now().toString();
    const nowISO = new Date().toISOString();
    
    let replyToText = '';
    if (replyTo) {
      replyToText = `📍 Membalas: "${replyTo.text.substring(0, 50)}${replyTo.text.length > 50 ? '...' : ''}"\n\n`;
      setReplyTo(null);
    }
    
    const fullMessageText = replyToText + messageText;
    
    const messageData = {
      id: messageId,
      text: fullMessageText,
      timestamp: formatTimestamp(nowISO) || '',
      isOwn: true,
      sender: currentUserName,
      senderId: currentUserId,
      receiverId: receiverId,
      createdAt: nowISO,
    };
    
    setMessages(prev => [...prev, messageData]);
    scrollToBottom();
    setInputText('');
    
    TemporaryStorage.save(messageData);
    
    try {
      webSocketService.sendMessage(receiverId, messageText, currentUserName);
      
      await MessageRepository.saveMessage({
        id: messageId,
        text: fullMessageText,
        senderId: currentUserId,
        senderName: currentUserName,
        receiverId: receiverId,
        receiverName: receiverName,
        isOwn: true,
        status: 'sent',
        timestamp: formatTimestamp(nowISO) || '',
        createdAt: nowISO,
      });
      
      TemporaryStorage.remove(messageId);
      
    } catch (error) {
      console.error('Error sending message:', error);
      TemporaryStorage.remove(messageId);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, sendError: true } : msg
        )
      );
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [inputText, currentUserId, currentUserName, receiverId, receiverName, handleSessionExpired, scrollToBottom, replyTo, dbReady, checkAndReconnectWebSocket]);

  const retrySendMessage = useCallback((failedMessage) => {
    if (!failedMessage.sendError) return;
    setMessages(prev => prev.filter(msg => msg.id !== failedMessage.id));
    let originalText = failedMessage.text;
    if (originalText.startsWith('📍 Membalas:')) {
      const parts = originalText.split('\n\n');
      originalText = parts[1] || parts[0];
    }
    setInputText(originalText);
    setTimeout(() => sendMessage(), 100);
  }, [sendMessage]);

  const loadMoreMessages = useCallback(() => {
    if (!loading && !loadingMore && hasMore && messages.length > 0) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadChatHistory(nextPage, true);
    }
  }, [loading, loadingMore, hasMore, messages.length, page, loadChatHistory]);

  const getConnectionStatusText = () => {
    if (isReconnecting) return 'Menghubungkan...';
    switch (wsStatus) {
      case 'connected': return 'Online';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Offline';
    }
  };

  const getConnectionStatusColor = () => {
    if (isReconnecting) return '#FFC107';
    switch (wsStatus) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FFC107';
      case 'error': return '#F44336';
      default: return '#999';
    }
  };

  const renderMessage = useCallback(({ item, index }) => {
    if (!item.text || item.text.trim().length === 0) {
      return null;
    }
    
    let showDateHeader = false;
    try {
      showDateHeader = index === 0 || 
        (index > 0 && messages[index - 1] && 
         formatDateHeader(item.createdAt) !== formatDateHeader(messages[index - 1]?.createdAt));
    } catch (e) {
      showDateHeader = false;
    }
    
    const isReplying = item.text && item.text.startsWith('📍 Membalas:');
    let displayText = item.text;
    let replyPreview = null;
    
    if (isReplying) {
      const parts = item.text.split('\n\n');
      replyPreview = parts[0];
      displayText = parts[1] || parts[0];
    }
    
    let dateHeaderText = '';
    try {
      dateHeaderText = formatDateHeader(item.createdAt) || '';
    } catch (e) {
      dateHeaderText = '';
    }
    
    return (
      <>
        {showDateHeader && dateHeaderText ? (
          <View style={styles.dateHeader}>
            <View style={styles.dateHeaderLine} />
            <Text style={styles.dateHeaderText}>{dateHeaderText}</Text>
            <View style={styles.dateHeaderLine} />
          </View>
        ) : null}
        <View style={[
          styles.messageWrapper,
          item.isOwn ? styles.messageWrapperOwn : styles.messageWrapperOther
        ]}>
          {replyPreview ? (
            <View style={[styles.replyPreview, item.isOwn ? styles.replyPreviewOwn : styles.replyPreviewOther]}>
              <Icon name="return-up-back-outline" size={12} color="#888" />
              <Text style={styles.replyPreviewText} numberOfLines={1}>{replyPreview}</Text>
            </View>
          ) : null}
          
          <TouchableOpacity 
            style={[
              styles.messageContainer,
              item.isOwn ? styles.ownMessage : styles.otherMessage
            ]}
            onLongPress={() => {
              if (!item.sendError) {
                Alert.alert(
                  'Pesan',
                  'Pilih tindakan',
                  [
                    { text: 'Batal', style: 'cancel' },
                    { 
                      text: 'Balas', 
                      onPress: () => {
                        setReplyTo(item);
                        Alert.alert('Balas Pesan', 'Pesan akan dibalas', [{ text: 'OK' }]);
                      }
                    },
                    { 
                      text: 'Hapus', 
                      style: 'destructive',
                      onPress: () => handleDeleteMessage(item)
                    }
                  ]
                );
              }
            }}
            activeOpacity={0.7}
            disabled={item.sendError}
          >
            {!item.isOwn ? (
              <View style={styles.senderInfo}>
                <View style={styles.avatarSmall}>
                  <Text style={styles.avatarSmallText}>
                    {item.sender?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <Text style={styles.senderName}>{item.sender}</Text>
              </View>
            ) : null}
            <View style={[
              styles.messageBubble,
              item.isOwn ? styles.ownBubble : styles.otherBubble,
              item.sendError && styles.errorBubble,
            ]}>
              <Text style={styles.messageText}>{displayText}</Text>
              <View style={styles.messageFooter}>
                <Text style={styles.timestamp}>{item.timestamp || ''}</Text>
                {item.sendError ? (
                  <TouchableOpacity onPress={() => retrySendMessage(item)}>
                    <Icon name="alert-circle-outline" size={14} color="#F44336" style={styles.statusIcon} />
                  </TouchableOpacity>
                ) : item.isOwn ? (
                  <Icon name="checkmark-done-outline" size={14} color="#4CAF50" style={styles.statusIcon} />
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </>
    );
  }, [messages, retrySendMessage, handleDeleteMessage, setReplyTo]);

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loaderMore}>
          <ActivityIndicator size="small" color="#075E54" />
        </View>
      );
    }
    return null;
  };

  const renderHeader = () => {
    if (wsStatus !== 'connected' || isReconnecting) {
      return (
        <View style={[styles.connectionStatus, styles.connectionStatusReconnecting]}>
          <Icon 
            name={isReconnecting || wsStatus === 'connecting' ? 'sync-outline' : 'alert-circle-outline'} 
            size={16} 
            color={isReconnecting || wsStatus === 'connecting' ? '#FFC107' : '#F44336'} 
            spin={isReconnecting || wsStatus === 'connecting'}
          />
          <Text style={styles.connectionStatusText}>
            {getConnectionStatusText()}
          </Text>
          {wsStatus === 'error' && (
            <TouchableOpacity 
              style={styles.reconnectButton}
              onPress={checkAndReconnectWebSocket}
            >
              <Text style={styles.reconnectButtonText}>Coba Lagi</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return null;
  };

  if (loading && messages.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#075E54" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.roomName}>{receiverName}</Text>
            <Text style={styles.memberCount}>Loading...</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Icon name="call-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Icon name="videocam-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#075E54" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top','bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#075E54" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerInfo} onPress={() => navigation.navigate('UserProfile', { userId: receiverId })}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {receiverName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.roomName} numberOfLines={1}>{receiverName}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: getConnectionStatusColor() }]} />
              <Text style={[styles.memberCount, { color: getConnectionStatusColor() }]}>
                {getConnectionStatusText()}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="call-outline" size={22} color="#075E54" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="videocam-outline" size={22} color="#075E54" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="ellipsis-vertical" size={20} color="#075E54" />
          </TouchableOpacity>
        </View>
      </View>

      {replyTo ? (
        <View style={styles.replyBar}>
          <View style={styles.replyBarContent}>
            <Icon name="return-up-back" size={20} color="#075E54" />
            <View style={styles.replyBarText}>
              <Text style={styles.replyBarLabel}>Membalas</Text>
              <Text style={styles.replyBarMessage} numberOfLines={1}>
                {replyTo.text}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Icon name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={renderHeader}
        onContentSizeChange={scrollToBottom}
        extraData={messages}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.keyboardAvoidingView}
      >
        <View style={[
          styles.inputContainer,
          { marginBottom: Platform.OS === 'ios' ? 0 : keyboardHeight }
        ]}>
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={() => Alert.alert('Coming Soon', 'File attachment feature coming soon!')}
          >
            <Icon name="add-circle-outline" size={28} color="#075E54" />
          </TouchableOpacity>
          
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder={wsStatus === 'connected' && !isReconnecting ? "Ketik pesan..." : "Menunggu koneksi..."}
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={wsStatus === 'connected' && !sending && !isReconnecting}
          />
          
          {inputText.trim().length > 0 && wsStatus === 'connected' && !isReconnecting ? (
            <TouchableOpacity 
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#075E54" />
              ) : (
                <Icon name="send" size={24} color="#075E54" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.micButton} 
              disabled={wsStatus !== 'connected' || isReconnecting}
              onPress={() => {
                if (wsStatus !== 'connected') {
                  checkAndReconnectWebSocket();
                }
              }}
            >
              <Icon 
                name={wsStatus !== 'connected' ? "wifi-outline" : "mic-outline"} 
                size={24} 
                color={wsStatus === 'connected' && !isReconnecting ? "#075E54" : "#ccc"} 
              />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 0,
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
    color: '#075E54'
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: '#075E54',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  roomName: {
    color: '#075E54',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  memberCount: {
    fontSize: 12,
    color: '#075E54',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 20,
    padding: 4,
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dateHeaderText: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    color: '#666',
    marginHorizontal: 8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginHorizontal: 12,
  },
  connectionStatusReconnecting: {
    backgroundColor: '#FFF3E0',
  },
  connectionStatusconnecting: {
    backgroundColor: '#FFF3E0',
  },
  connectionStatuserror: {
    backgroundColor: '#FFEBEE',
  },
  connectionStatusText: {
    fontSize: 12,
    marginLeft: 8,
  },
  reconnectButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#075E54',
    borderRadius: 16,
  },
  reconnectButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageWrapper: {
    marginBottom: 12,
  },
  messageWrapperOwn: {
    alignItems: 'flex-end',
  },
  messageWrapperOther: {
    alignItems: 'flex-start',
  },
  messageContainer: {
    maxWidth: '80%',
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: 4,
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#075E54',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarSmallText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
    backgroundColor: '#FFEBEE',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#000',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
  },
  statusIcon: {
    marginLeft: 6,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    marginBottom: 4,
    maxWidth: '90%',
  },
  replyPreviewOwn: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  replyPreviewOther: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  replyPreviewText: {
    fontSize: 11,
    color: '#888',
    marginLeft: 4,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  replyBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  replyBarText: {
    marginLeft: 8,
    flex: 1,
  },
  replyBarLabel: {
    fontSize: 11,
    color: '#075E54',
    fontWeight: '500',
  },
  replyBarMessage: {
    fontSize: 12,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    marginHorizontal: 8,
  },
  attachButton: {
    padding: 8,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  micButton: {
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  loaderMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default ChatRoom;