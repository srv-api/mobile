// src/service/chat/chatHelper.js
import MessageRepository from '../../database/MessageRepository';

export const getLastMessagesForUser = async (currentUserId) => {
  try {
    // Query untuk mendapatkan last message per user
    const query = `
      SELECT 
        CASE 
          WHEN sender_id = ? THEN receiver_id
          ELSE sender_id
        END as other_user_id,
        MAX(created_at) as last_message_time,
        (
          SELECT text FROM messages m2 
          WHERE (m2.sender_id = ? AND m2.receiver_id = other_user_id)
             OR (m2.sender_id = other_user_id AND m2.receiver_id = ?)
          ORDER BY datetime(m2.created_at) DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT COUNT(*) FROM messages m3
          WHERE m3.sender_id = other_user_id 
            AND m3.receiver_id = ?
            AND m3.is_read = 0
        ) as unread_count
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
      GROUP BY other_user_id
      ORDER BY last_message_time DESC
    `;
    
    // Karena executeQuery tidak langsung mendukung query kompleks,
    // kita akan menggunakan pendekatan berbeda
    const allChats = await getAllChatUsers(currentUserId);
    
    const lastMessages = [];
    for (const otherUserId of allChats) {
      // Ambil last message
      const history = await MessageRepository.getChatHistory(currentUserId, otherUserId, 1, 0);
      const unreadCount = await MessageRepository.getUnreadCount(currentUserId, otherUserId);
      
      if (history && history.length > 0) {
        const lastMsg = history[history.length - 1];
        lastMessages.push({
          userId: otherUserId,
          lastMessage: lastMsg.text,
          lastMessageTime: lastMsg.created_at,
          unreadCount: unreadCount,
        });
      }
    }
    
    // Sort by last message time
    lastMessages.sort((a, b) => {
      const timeA = new Date(a.lastMessageTime || 0);
      const timeB = new Date(b.lastMessageTime || 0);
      return timeB - timeA;
    });
    
    return lastMessages;
    
  } catch (error) {
    console.error('Error getting last messages:', error);
    return [];
  }
};

export const getAllChatUsers = async (currentUserId) => {
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
    
    return users;
  } catch (error) {
    console.error('Error getting chat users:', error);
    return [];
  }
};