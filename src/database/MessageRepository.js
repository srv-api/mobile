// src/database/MessageRepository.js
import { executeQuery } from './sqlite';

class MessageRepository {
  
  async deleteMessageById(messageId) {
    try {
      await executeQuery('DELETE FROM messages WHERE id = ?', [messageId]);
      console.log(`✅ Message ${messageId} deleted`);
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }
  
  async saveMessage(message) {
    if (!message || !message.id) {
      console.error('Invalid message data:', message);
      return false;
    }
    
    const query = `
      INSERT OR REPLACE INTO messages (
        id, text, sender_id, sender_name, receiver_id, receiver_name,
        is_own, status, timestamp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      message.id || '',
      message.text || '',
      message.senderId || '',
      message.senderName || null,
      message.receiverId || '',
      message.receiverName || null,
      message.isOwn ? 1 : 0,
      message.status || 'sent',
      message.timestamp || '',
      message.createdAt || new Date().toISOString()
    ];
    
    try {
      await executeQuery(query, params);
      console.log('✅ Message saved:', message.id);
      return true;
    } catch (error) {
      console.error('Failed to save message:', error);
      return false;
    }
  }

  // ✅ PERBAIKAN UTAMA: Get chat history dengan debug lengkap
async getChatHistory(userId1, userId2, limit = 20, offset = 0) {
  if (!userId1 || !userId2) {
    console.error('Invalid userId for getChatHistory');
    return [];
  }
  
  try {
    // ✅ Ambil SEMUA kolom
    const query = `
      SELECT 
        id, text, sender_id, sender_name, receiver_id, receiver_name,
        is_own, status, timestamp, created_at, type,
        audio_path, audio_base64, duration
      FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?) 
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY datetime(created_at) ASC
      LIMIT ? OFFSET ?
    `;
    
    const result = await executeQuery(query, [
      userId1, userId2, 
      userId2, userId1, 
      limit, offset
    ]);
    
    if (!result || !result.rows) {
      return [];
    }
    
    const messages = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      if (row) {
        messages.push({
          id: row.id,
          text: row.text,
          sender_id: row.sender_id,
          sender_name: row.sender_name,
          receiver_id: row.receiver_id,
          receiver_name: row.receiver_name,
          is_own: row.is_own,
          status: row.status,
          timestamp: row.timestamp,
          created_at: row.created_at,
          type: row.type || 'text',
          audio_path: row.audio_path,
          audio_base64: row.audio_base64,
          duration: row.duration,
        });
      }
    }
    
    return messages;
    
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    return [];
  }
}


  async saveVoiceMessage({
    id,
    text,
    audioPath,
    audioBase64,
    duration,
    senderId,
    senderName,
    receiverId,
    receiverName,
    isOwn,
    status,
    timestamp,
    createdAt
  }) {
    try {
      const query = `
        INSERT INTO messages (
          id, text, sender_id, sender_name, receiver_id, receiver_name, 
          is_own, status, timestamp, created_at, type, audio_path, audio_base64, duration
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        id,
        text || '🎤 Voice Message',
        senderId,
        senderName || '',
        receiverId,
        receiverName || '',
        isOwn ? 1 : 0,
        status || 'sent',
        timestamp,
        createdAt || new Date().toISOString(),
        'voice',
        audioPath || '',
        audioBase64 || '',
        duration || '00:00'
      ];
      
      await executeQuery(query, params);
      console.log('✅ Voice message saved to database');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to save voice message:', error);
      throw error;
    }
  }

  // ✅ FIX INCONSISTENT DATA (HANYA SATU, jangan static)
  async fixInconsistentData() {
    try {
      console.log('🔧 Fixing inconsistent data...');
      
      await executeQuery(`
        UPDATE messages 
        SET created_at = datetime('now') 
        WHERE created_at IS NULL OR created_at = ''
      `);
      
      await executeQuery(`
        UPDATE messages 
        SET timestamp = datetime(created_at, 'localtime')
        WHERE timestamp IS NULL OR timestamp = ''
      `);
      
      console.log('✅ Data inconsistency fixed');
    } catch (error) {
      console.error('Error fixing data:', error);
    }
  }

  // ✅ GET ALL messages tanpa limit
 async getAllChatMessages(userId1, userId2) {
  if (!userId1 || !userId2) return [];
  
  try {
    // ✅ Ambil SEMUA kolom termasuk untuk voice message
    const query = `
      SELECT 
        id, text, sender_id, sender_name, receiver_id, receiver_name,
        is_own, status, timestamp, created_at, type, 
        audio_path, audio_base64, duration
      FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?) 
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY datetime(created_at) ASC
    `;
    
    const result = await executeQuery(query, [userId1, userId2, userId2, userId1]);
    
    const messages = [];
    const rowsLength = result.rows.length || 0;
    
    for (let i = 0; i < rowsLength; i++) {
      const row = result.rows.item(i);
      if (row) {
        messages.push({
          id: row.id,
          text: row.text,
          sender_id: row.sender_id,
          sender_name: row.sender_name,
          receiver_id: row.receiver_id,
          receiver_name: row.receiver_name,
          is_own: row.is_own,
          status: row.status,
          timestamp: row.timestamp,
          created_at: row.created_at,
          type: row.type || 'text',
          audio_path: row.audio_path,
          audio_base64: row.audio_base64,
          duration: row.duration,
        });
      }
    }
    
    console.log(`📊 Loaded ${messages.length} messages from DB`);
    
    // Debug: Tampilkan voice messages
    const voiceMessages = messages.filter(m => m.type === 'voice');
    if (voiceMessages.length > 0) {
      console.log(`🎤 Found ${voiceMessages.length} voice messages`);
      voiceMessages.forEach(vm => {
        console.log(`  - ID: ${vm.id}, Duration: ${vm.duration}, HasBase64: ${!!vm.audio_base64}`);
      });
    }
    
    return messages;
    
  } catch (error) {
    console.error('Error getting all messages:', error);
    return [];
  }
}


  // ✅ DEBUG QUERY
  async debugQuery(userId1, userId2) {
    try {
      const allQuery = `SELECT COUNT(*) as total FROM messages`;
      const allResult = await executeQuery(allQuery, []);
      const totalAll = allResult.rows.item(0).total;
      console.log(`📊 Total semua pesan di DB: ${totalAll}`);
      
      const chatQuery = `
        SELECT COUNT(*) as count 
        FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
      `;
      const chatResult = await executeQuery(chatQuery, [userId1, userId2, userId2, userId1]);
      const chatCount = chatResult.rows.item(0).count;
      console.log(`📊 Pesan untuk chat ${userId1} <-> ${userId2}: ${chatCount} messages`);
      
      return { totalAll, chatCount };
      
    } catch (error) {
      console.error('Debug error:', error);
      return null;
    }
  }

  async getNewMessagesAfter(userId1, userId2, afterTimestamp) {
    if (!userId1 || !userId2) return [];
    
    try {
      const query = `
        SELECT * FROM messages 
        WHERE ((sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?))
          AND datetime(created_at) > datetime(?)
        ORDER BY datetime(created_at) ASC
      `;
      
      const result = await executeQuery(query, [
        userId1, userId2, 
        userId2, userId1, 
        afterTimestamp || '2000-01-01'
      ]);
      
      const messages = [];
      for (let i = 0; i < result.rows.length; i++) {
        messages.push(result.rows.item(i));
      }
      
      return messages;
    } catch (error) {
      console.error('Error getting new messages:', error);
      return [];
    }
  }

  async getLastMessageTimestamp(userId1, userId2) {
    if (!userId1 || !userId2) return null;
    
    try {
      const query = `
        SELECT MAX(datetime(created_at)) as last_timestamp
        FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
      `;
      
      const result = await executeQuery(query, [userId1, userId2, userId2, userId1]);
      
      if (result && result.rows && result.rows.length > 0) {
        return result.rows.item(0).last_timestamp;
      }
      return null;
    } catch (error) {
      console.error('Error getting last timestamp:', error);
      return null;
    }
  }

  async messageExists(messageId) {
    if (!messageId) return false;
    
    try {
      const result = await executeQuery(
        'SELECT COUNT(*) as count FROM messages WHERE id = ?',
        [messageId]
      );
      
      if (!result || !result.rows || result.rows.length === 0) {
        return false;
      }
      
      return result.rows.item(0).count > 0;
    } catch (error) {
      console.error('Error checking message exists:', error);
      return false;
    }
  }
  
  async updateMessageStatus(messageId, status) {
    if (!messageId) return;
    
    try {
      await executeQuery(
        'UPDATE messages SET status = ? WHERE id = ?',
        [status, messageId]
      );
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  async deleteAllMessages() {
    try {
      await executeQuery('DELETE FROM messages');
      console.log('🗑️ All messages deleted');
      return true;
    } catch (error) {
      console.error('Error deleting all messages:', error);
      return false;
    }
  }

  async getMessageCount() {
    try {
      const result = await executeQuery('SELECT COUNT(*) as count FROM messages');
      if (result && result.rows && result.rows.length > 0) {
        return result.rows.item(0).count;
      }
      return 0;
    } catch (error) {
      console.error('Error getting message count:', error);
      return 0;
    }
  }

  async getUnreadCount(currentUserId, otherUserId) {
    if (!currentUserId || !otherUserId) return 0;
    
    try {
      const query = `SELECT COUNT(*) as count FROM messages WHERE sender_id = ? AND receiver_id = ?`;
      const result = await executeQuery(query, [otherUserId, currentUserId]);
      
      if (result && result.rows && result.rows.length > 0) {
        return result.rows.item(0).count || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async getAllChatUsers(currentUserId) {
    if (!currentUserId) return [];
    
    try {
      const query = `
        SELECT DISTINCT 
          CASE 
            WHEN sender_id = ? THEN receiver_id
            ELSE sender_id
          END as user_id
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
      `;
      
      const result = await executeQuery(query, [currentUserId, currentUserId, currentUserId]);
      
      const users = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        if (row.user_id) {
          users.push(row.user_id);
        }
      }
      
      console.log(`📱 Found ${users.length} chat users`);
      return users;
    } catch (error) {
      console.error('Error getting chat users:', error);
      return [];
    }
  }

  async getAllLastMessages(currentUserId) {
    if (!currentUserId) return [];
    
    try {
      const chatUsers = await this.getAllChatUsers(currentUserId);
      const lastMessages = [];
      
      for (const otherUserId of chatUsers) {
        const history = await this.getChatHistory(currentUserId, otherUserId, 1, 0);
        const unreadCount = await this.getUnreadCount(currentUserId, otherUserId);
        
        if (history && history.length > 0) {
          const lastMsg = history[history.length - 1];
          lastMessages.push({
            userId: otherUserId,
            lastMessage: lastMsg.text,
            lastMessageTime: lastMsg.created_at,
            unreadCount: unreadCount,
            messageId: lastMsg.id,
            status: lastMsg.status,
          });
        }
      }
      
      lastMessages.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || 0);
        const timeB = new Date(b.lastMessageTime || 0);
        return timeB - timeA;
      });
      
      console.log(`📱 Retrieved last messages for ${lastMessages.length} chats`);
      return lastMessages;
      
    } catch (error) {
      console.error('Error getting all last messages:', error);
      return [];
    }
  }
}

// ✅ Export sebagai INSTANCE (bukan class)
const messageRepository = new MessageRepository();
export default messageRepository;