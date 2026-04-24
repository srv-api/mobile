// src/service/TempStorage.js
class TemporaryStorage {
  constructor() {
    this.pendingMessages = new Map();
  }
  
  save(message) {
    if (!message || !message.id) {
      console.error('Invalid message for temp storage');
      return;
    }
    this.pendingMessages.set(message.id, { ...message, savedAt: Date.now() });
    console.log('📝 Temp saved:', message.id);
  }
  
  remove(messageId) {
    if (!messageId) return;
    const deleted = this.pendingMessages.delete(messageId);
    if (deleted) console.log('🗑️ Temp removed:', messageId);
  }
  
  get(messageId) {
    if (!messageId) return null;
    return this.pendingMessages.get(messageId);
  }
}

export default new TemporaryStorage();