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
      console.log(`🔍 Getting chat history: ${userId1} <-> ${userId2}, limit=${limit}, offset=${offset}`);
      
      // Query untuk mendapatkan pesan
      const query = `
        SELECT * FROM messages 
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
        console.warn('No rows returned');
        return [];
      }
      
      const messages = [];
      const rowsLength = result.rows.length || 0;
      
      for (let i = 0; i < rowsLength; i++) {
        const row = result.rows.item(i);
        if (row) {
          messages.push(row);
        }
      }
      
      console.log(`📱 Retrieved ${messages.length} messages from offset ${offset}`);
      
      // ✅ DEBUG: Log ID pesan yang diambil
      if (messages.length > 0) {
        console.log(`📋 Message IDs:`, messages.map(m => m.id).join(', '));
        console.log(`📅 Timestamps:`, messages.map(m => m.created_at).join(', '));
      }
      
      return messages;
      
    } catch (error) {
      console.error('Error in getChatHistory:', error);
      return [];
    }
  }

  // ✅ TAMBAHKAN: Get ALL messages tanpa limit untuk debugging
  async getAllChatMessages(userId1, userId2) {
    if (!userId1 || !userId2) return [];
    
    try {
      const query = `
        SELECT * FROM messages 
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
          messages.push(row);
        }
      }
      
      console.log(`📊 TOTAL messages in DB for this chat: ${messages.length}`);
      
      // Debug: Tampilkan semua pesan
      messages.forEach((msg, idx) => {
        console.log(`  ${idx+1}. ID: ${msg.id}, Sender: ${msg.sender_id}, Created: ${msg.created_at}`);
      });
      
      return messages;
      
    } catch (error) {
      console.error('Error getting all messages:', error);
      return [];
    }
  }

  // ✅ TAMBAHKAN: Fix inconsistent data
  async fixInconsistentData() {
    try {
      console.log('🔧 Fixing inconsistent data...');
      
      // Update created_at yang NULL atau invalid
      await executeQuery(`
        UPDATE messages 
        SET created_at = datetime('now') 
        WHERE created_at IS NULL OR created_at = ''
      `);
      
      // Update timestamp yang NULL
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

  // ✅ TAMBAHKAN: Get messages dengan raw query untuk debug
  async debugQuery(userId1, userId2) {
    try {
      // Cek semua pesan tanpa filter
      const allQuery = `SELECT COUNT(*) as total FROM messages`;
      const allResult = await executeQuery(allQuery, []);
      const totalAll = allResult.rows.item(0).total;
      console.log(`📊 Total semua pesan di DB: ${totalAll}`);
      
      // Cek pesan berdasarkan sender/receiver
      const senderQuery = `
        SELECT COUNT(*) as count, sender_id, receiver_id 
        FROM messages 
        GROUP BY sender_id, receiver_id
      `;
      const senderResult = await executeQuery(senderQuery, []);
      console.log(`📊 Group by sender/receiver:`);
      for (let i = 0; i < senderResult.rows.length; i++) {
        const row = senderResult.rows.item(i);
        console.log(`  ${row.sender_id} -> ${row.receiver_id}: ${row.count} messages`);
      }
      
      // Cek pesan spesifik untuk chat ini
      const chatQuery = `
        SELECT COUNT(*) as count 
        FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
      `;
      const chatResult = await executeQuery(chatQuery, [userId1, userId2, userId2, userId1]);
      const chatCount = chatResult.rows.item(0).count;
      console.log(`📊 Pesan untuk chat ${userId1} <-> ${userId2}: ${chatCount} messages`);
      
      return {
        totalAll,
        chatCount
      };
      
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
      const rowsLength = result.rows.length || 0;
      
      for (let i = 0; i < rowsLength; i++) {
        const row = result.rows.item(i);
        if (row) {
          messages.push(row);
        }
      }
      
      if (messages.length > 0) {
        console.log(`🆕 Found ${messages.length} new messages after ${afterTimestamp}`);
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
        const row = result.rows.item(0);
        return row.last_timestamp;
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
      
      const row = result.rows.item(0);
      return row && row.count > 0;
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
        const row = result.rows.item(0);
        return row.count;
      }
      return 0;
    } catch (error) {
      console.error('Error getting message count:', error);
      return 0;
    }
  }
}

export default new MessageRepository();