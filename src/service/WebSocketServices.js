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

// Di sendWebRTCOffer, ganti target_id menjadi receiver_id agar konsisten
sendWebRTCOffer(callId, targetUserId, offer) {
  if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
    console.warn('WebSocket not connected');
    return false;
  }
  
  const message = {
    type: 'webrtc_offer',
    callId: callId,
    sender_id: this.userId,
    receiver_id: targetUserId,  // ← GANTI dari target_id
    offer: offer,
    timestamp: new Date().toISOString(),
  };
  
  this.ws.send(JSON.stringify(message));
  console.log('📞 WebRTC offer sent to:', targetUserId);
  return true;
}
sendWebRTCAnswer(callId, targetUserId, answer) {
  if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
  
  const message = {
    type: 'webrtc_answer',
    callId: callId,
    sender_id: this.userId,
    receiver_id: targetUserId,  // ← GANTI dari target_id
    answer: answer,
    timestamp: new Date().toISOString(),
  };
  
  this.ws.send(JSON.stringify(message));
  console.log('📞 WebRTC answer sent to:', targetUserId);
  return true;
}

sendWebRTCIce(callId, targetUserId, candidate) {
  if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
  
  const message = {
    type: 'webrtc_ice',
    callId: callId,
    sender_id: this.userId,
    receiver_id: targetUserId,  // ← GANTI dari target_id
    candidate: candidate,
    timestamp: new Date().toISOString(),
  };
  
  this.ws.send(JSON.stringify(message));
  return true;
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
  
  // Handle WebRTC signaling
  if (message.type === 'webrtc_offer') {
    this.broadcastMessage({
      type: 'webrtc_offer',
      callId: message.callId,
      callerId: message.sender_id,
      targetUserId: message.receiver_id,  // ← TAMBAHKAN
      offer: message.offer,
    });
    return;
  }
  
  if (message.type === 'webrtc_answer') {
    this.broadcastMessage({
      type: 'webrtc_answer',
      callId: message.callId,
      answer: message.answer,
    });
    return;
  }
  
  if (message.type === 'webrtc_ice') {
    this.broadcastMessage({
      type: 'webrtc_ice',
      callId: message.callId,
      candidate: message.candidate,
    });
    return;
  }
  
  // Handle chat message
  if (message.type === 'chat' && message.message) {
    try {
      const messageId = message.id || Date.now().toString();
      const exists = await MessageRepository.messageExists(messageId);
      
      if (!exists) {
        await MessageRepository.saveMessage({
          id: messageId,
          text: message.message,
          senderId: message.sender_id,
          senderName: message.sender_name || 'User',
          receiverId: message.receiver_id,
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
  
  // Handle voice message
  if (message.type === 'voice' && message.audio_base64) {
    try {
      const messageId = message.id || Date.now().toString();
      const exists = await MessageRepository.messageExists(messageId);
      
      if (!exists) {
        await MessageRepository.saveVoiceMessage({
          id: messageId,
          text: '🎤 Voice Message',
          audioPath: null,
          audioBase64: message.audio_base64,
          duration: message.duration || '00:00',
          senderId: message.sender_id,
          senderName: message.sender_name || 'User',
          receiverId: this.userId,
          receiverName: 'Me',
          isOwn: false,
          status: 'received',
          timestamp: formatTimestamp(message.timestamp) || '',
          createdAt: message.timestamp || new Date().toISOString(),
        });
        console.log('✅ Voice message saved to SQLite');
      }
    } catch (error) {
      console.error('Failed to save voice message:', error);
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
// Di src/service/WebSocketService.js
 sendVoiceMessage(receiverId, audioBase64, duration, senderName) {
  console.log('🎤 sendVoiceMessage called', { receiverId, duration, senderName });
  
  if (!this.ws) {
    console.warn('⚠️ WebSocket not initialized');
    return false;
  }
  
  if (this.ws.readyState !== WebSocket.OPEN) {
    console.warn(`⚠️ WebSocket not open. State: ${this.ws.readyState}`);
    return false;
  }
  
  if (!this.userId) {
    console.warn('⚠️ User ID not set');
    return false;
  }
  
  try {
    const message = {
      type: 'voice',
      sender_id: this.userId,
      receiver_id: receiverId,
      audio_base64: audioBase64,
      duration: duration,
      sender_name: senderName || '',
      timestamp: new Date().toISOString()
    };
    
    this.ws.send(JSON.stringify(message));
    console.log('🎤 Voice message sent via WebSocket');
    return true;
  } catch (error) {
    console.error('❌ Error sending voice message:', error);
    return false;
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