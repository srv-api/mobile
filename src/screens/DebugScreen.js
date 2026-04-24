// src/screens/DebugScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MessageRepository from '../database/MessageRepository';
import { webSocketService } from '../service/WebSocketServices';
import { executeQuery } from '../database/sqlite'; // ✅ import executeQuery

// Temporary reset function until we have the proper one
const resetDatabase = async () => {
  try {
    console.log('⚠️ Resetting database...');
    await MessageRepository.deleteAllMessages();
    console.log('✅ Database reset completed');
    return true;
  } catch (error) {
    console.error('Error resetting database:', error);
    return false;
  }
};

const DebugScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [dbInfo, setDbInfo] = useState(null);

  const handleResetDatabase = async () => {
    Alert.alert(
      'Reset Database',
      'Yakin ingin mereset semua data chat? Data akan hilang permanen.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const success = await resetDatabase();
              if (success) {
                Alert.alert('Sukses', 'Database telah direset');
                navigation.replace('Login');
              } else {
                Alert.alert('Error', 'Gagal mereset database');
              }
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const handleClearStorage = async () => {
    Alert.alert(
      'Clear Storage',
      'Hapus semua data login?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_id']);
              webSocketService.disconnect();
              Alert.alert('Sukses', 'Storage telah dibersihkan');
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const handleCheckDatabase = async () => {
    setLoading(true);
    try {
      const count = await MessageRepository.getMessageCount();
      const userId = await AsyncStorage.getItem('user_id');
      
      let info = {
        totalMessages: count,
        currentUserId: userId,
      };
      
      setDbInfo(info);
      console.log('Database Info:', info);
      
      Alert.alert(
        'Info Database',
        `Total pesan: ${count}\nUser ID: ${userId || 'Tidak ada'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error checking database:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleReconnectWebSocket = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const token = await AsyncStorage.getItem('access_token');
      
      if (userId && token) {
        webSocketService.disconnect();
        setTimeout(() => {
          webSocketService.connect(userId);
          Alert.alert('Sukses', 'WebSocket reconnecting...');
        }, 1000);
      } else {
        Alert.alert('Error', 'User tidak login');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Tambahkan fungsi untuk menghapus pesan corrupt
  const handleCleanCorruptMessages = async () => {
    Alert.alert(
      'Hapus Pesan Corrupt',
      'Hapus semua pesan dengan receiver_id kosong?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await executeQuery("DELETE FROM messages WHERE receiver_id = '' OR receiver_id IS NULL");
              console.log('✅ Pesan corrupt dihapus');
              await handleCheckDatabase(); // refresh info
              Alert.alert('Sukses', 'Pesan corrupt telah dihapus');
            } catch (error) {
              console.error('Error cleaning corrupt messages:', error);
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#075E54" />
        <Text style={styles.loadingText}>Processing...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Debug Menu</Text>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Database Info:</Text>
        <Text style={styles.infoText}>Total Messages: {dbInfo?.totalMessages ?? '?'}</Text>
        <Text style={styles.infoText}>User ID: {dbInfo?.currentUserId ?? 'Not logged in'}</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, styles.dangerButton]} 
        onPress={handleResetDatabase}
      >
        <Text style={styles.buttonText}>🗑️ Reset Database</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.warningButton]} 
        onPress={handleClearStorage}
      >
        <Text style={styles.buttonText}>🧹 Clear Storage & Logout</Text>
      </TouchableOpacity>
      
      {/* ✅ Tombol baru untuk hapus pesan corrupt */}
      <TouchableOpacity 
        style={[styles.button, styles.warningButton]} 
        onPress={handleCleanCorruptMessages}
      >
        <Text style={styles.buttonText}>🧹 Hapus Pesan Corrupt</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.infoButton]} 
        onPress={handleCheckDatabase}
      >
        <Text style={styles.buttonText}>📊 Check Database</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.primaryButton]} 
        onPress={handleReconnectWebSocket}
      >
        <Text style={styles.buttonText}>🔄 Reconnect WebSocket</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>⬅️ Kembali</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // ... styles tetap sama seperti sebelumnya
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#075E54',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  warningButton: {
    backgroundColor: '#ffc107',
  },
  infoButton: {
    backgroundColor: '#17a2b8',
  },
  primaryButton: {
    backgroundColor: '#075E54',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DebugScreen;