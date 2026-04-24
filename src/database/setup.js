// src/database/setup.js
import { executeQuery } from './sqlite';

export const setupDatabase = async () => {
  try {
    // ✅ PERBAIKAN: Tambahkan kolom created_at jika belum ada
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_name TEXT,
        receiver_id TEXT NOT NULL,
        receiver_name TEXT,
        is_own INTEGER DEFAULT 0,
        status TEXT DEFAULT 'sent',
        timestamp TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ✅ PERBAIKAN: Update index untuk performance
    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation 
      ON messages(sender_id, receiver_id)
    `);
    
    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_messages_created_at 
      ON messages(created_at)
    `);
    
    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_time 
      ON messages(sender_id, receiver_id, created_at)
    `);
    
    console.log('✅ Database setup completed');
    
    // Test database
    const testResult = await executeQuery('SELECT COUNT(*) as count FROM messages');
    if (testResult && testResult.rows && testResult.rows.length > 0) {
      const count = testResult.rows.item(0).count;
      console.log(`📊 Total messages in DB: ${count}`);
    }
    
    // ✅ Fix inconsistent data
    const MessageRepository = (await import('./MessageRepository')).default;
    await MessageRepository.fixInconsistentData();
    
  } catch (error) {
    console.error('❌ Database setup error:', error);
  }
};