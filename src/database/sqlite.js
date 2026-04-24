// src/database/sqlite.js
import SQLite from 'react-native-sqlite-storage';

// Enable promise
SQLite.enablePromise(true);

let db = null;

export const getDatabase = async () => {
  if (!db) {
    try {
      db = await SQLite.openDatabase({
        name: 'chat_app.db',
        location: 'default',
      });
      console.log('✅ Database opened successfully');
    } catch (error) {
      console.error('Failed to open database:', error);
      throw error;
    }
  }
  return db;
};

export const executeQuery = async (sql, params = []) => {
  try {
    const database = await getDatabase();
    const results = await database.executeSql(sql, params);
    
    if (results && results.length > 0) {
      return results[0];
    }
    
    // Return empty result set
    return {
      rows: {
        length: 0,
        item: () => null,
        _array: []
      },
      insertId: 0,
      rowsAffected: 0
    };
  } catch (error) {
    console.error('SQL Error:', error);
    console.error('SQL Query:', sql);
    throw error;
  }
};

export const executeTransaction = async (callback) => {
  try {
    const database = await getDatabase();
    await database.transaction(callback);
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
};