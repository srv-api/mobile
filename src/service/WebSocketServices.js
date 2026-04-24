// src/service/WebSocketService.js
import { createWebSocketConnection, sendWebSocketMessage } from './chat/chatApi';
import MessageRepository from '../database/MessageRepository';
import { formatTimestamp } from './chat/chatApi';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.userId = null;
    this.isConnected = false;
    this.messageHandlers = [];
    this.statusHandlers = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
    this.reconnectTimeout = null;
  }

  // Registrasi handler untuk pesan masuk
  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  // Registrasi handler untuk status koneksi
  onStatusChange(handler) {
    this.statusHandlers.push(handler);
  }

  // Hapus handler (panggil saat unmount)
  removeHandler(handler) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  // Update status ke semua handler
  updateStatus(status) {
    this.statusHandlers.forEach(handler => handler(status));
  }

  // Broadcast pesan ke semua handler
  broadcastMessage(message) {
    this.messageHandlers.forEach(handler => handler(message));
  }

  // Konek ke WebSocket
  async connect(userId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      this.updateStatus('connected');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket is connecting...');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.userId = userId;
    this.updateStatus('connecting');

    this.ws = createWebSocketConnection(
      userId,
      this.handleMessage.bind(this),
      this.handleOpen.bind(this),
      this.handleError.bind(this),
      this.handleClose.bind(this)
    );
  }

  // Handle pesan masuk
async handleMessage(message) {
  console.log('🌐 Global WebSocket message:', message);
  
  if (message.type === 'chat' && message.message) {
    try {
      const messageId = message.id || Date.now().toString();
      const exists = await MessageRepository.messageExists(messageId);
      
      if (!exists) {
        // ✅ PASTIKAN receiver_id dan sender_id terisi dengan benar
        await MessageRepository.saveMessage({
          id: messageId,
          text: message.message,
          senderId: message.sender_id,
          senderName: message.sender_name || 'User',
          receiverId: message.receiver_id,  // ← Pastikan ini tidak kosong
          receiverName: 'Me',
          isOwn: false,
          status: 'received',
          timestamp: formatTimestamp(message.created_at) || '',
          createdAt: message.created_at || new Date().toISOString(),
        });
        console.log('✅ Message saved to SQLite');
      }
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  }
  
  this.broadcastMessage(message);
}

  handleOpen() {
    console.log('🌐 Global WebSocket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.updateStatus('connected');
  }

  handleError(error) {
    console.error('🌐 Global WebSocket error:', error);
    this.updateStatus('error');
  }

  handleClose(event) {
    console.log(`🌐 Global WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
    this.isConnected = false;
    this.updateStatus('error');
    
    // Auto reconnect jika bukan normal close (1000)
    if (event.code !== 1000 && this.userId && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
      console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect(this.userId);
      }, delay);
    }
  }

  // Kirim pesan
  sendMessage(receiverId, messageText, senderName = '') {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    
    const wsMessage = {
      sender_id: this.userId,
      receiver_id: receiverId,
      message: messageText,
      type: 'chat',
      sender_name: senderName,
    };
    
    sendWebSocketMessage(this.ws, wsMessage);
  }

  // Disconnect (panggil saat logout)
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.userId = null;
    this.isConnected = false;
    this.updateStatus('disconnected');
  }

  getStatus() {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();