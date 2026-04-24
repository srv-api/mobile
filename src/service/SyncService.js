// src/services/SyncService.js
import MessageRepository from '../database/MessageRepository';
import { sendMessageViaHttp } from './chatApi';
import NetInfo from '@react-native-community/netinfo';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
  }
  
  startBackgroundSync() {
    // Sync when network comes back
    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.syncPendingMessages();
      }
    });
    
    // Periodic sync every 5 minutes
    this.syncInterval = setInterval(() => {
      this.syncPendingMessages();
    }, 5 * 60 * 1000);
  }
  
  stopBackgroundSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  async syncPendingMessages() {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    try {
      const unsyncedMessages = await MessageRepository.getUnsyncedMessages(50);
      
      for (const message of unsyncedMessages) {
        if (message.is_own === 1) {
          try {
            await sendMessageViaHttp(
              message.sender_id,
              message.receiver_id,
              message.text
            );
            await MessageRepository.markAsSynced(message.id);
            console.log(`✅ Synced message ${message.id}`);
          } catch (error) {
            console.error(`Failed to sync message ${message.id}:`, error);
            await MessageRepository.updateMessageStatus(message.id, 'failed', error.message);
          }
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }
}

export default new SyncService();