// src/services/messageFormatter.js
class MessageFormatter {
  // Format timestamp
  formatTimestamp(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  }

  // Format date for header
  formatDateHeader(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch (error) {
      console.error('Error formatting date header:', error);
      return '';
    }
  }

  // Format message from API response
  formatMessage(msg, currentUserId, currentUserName, receiverName) {
    return {
      id: msg.ID || msg.id,
      text: msg.Message || msg.message,
      timestamp: this.formatTimestamp(msg.CreatedAt || msg.createdAt),
      isOwn: (msg.SenderID || msg.sender_id) === currentUserId,
      sender: (msg.SenderID || msg.sender_id) === currentUserId ? currentUserName : receiverName,
      senderId: msg.SenderID || msg.sender_id,
      receiverId: msg.ReceiverID || msg.receiver_id,
      createdAt: msg.CreatedAt || msg.createdAt,
    };
  }

  // Format multiple messages
  formatMessages(messages, currentUserId, currentUserName, receiverName) {
    if (!Array.isArray(messages)) return [];
    return messages.map(msg => this.formatMessage(msg, currentUserId, currentUserName, receiverName));
  }

  // Format WebSocket message
  formatWebSocketMessage(message, currentUserId, currentUserName, receiverName) {
    return {
      id: message.ID || Date.now().toString(),
      text: message.Message || message.message,
      timestamp: this.formatTimestamp(message.CreatedAt || new Date().toISOString()),
      isOwn: (message.SenderID || message.sender_id) === currentUserId,
      sender: (message.SenderID || message.sender_id) === currentUserId ? currentUserName : receiverName,
      senderId: message.SenderID || message.sender_id,
      receiverId: message.ReceiverID || message.receiver_id,
      createdAt: message.CreatedAt || new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const messageFormatter = new MessageFormatter();