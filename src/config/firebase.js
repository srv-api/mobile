// src/config/firebase.js
import { initializeApp, getApps } from '@react-native-firebase/app';

// Konfigurasi Firebase dari google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyCNRzlhms5QKDXeFkArPZjjOWXS-0HIb0c",
  authDomain: "yuhuu-87e52.firebaseapp.com",
  databaseURL: "https://yuhuu-87e52-default-rtdb.firebaseio.com",
  projectId: "yuhuu-87e52",
  storageBucket: "yuhuu-87e52.firebasestorage.app",
  messagingSenderId: "744637953413",
  appId: "1:744637953413:android:d1b201d2b4ae2cde6080ec",
};

// ✅ Cek apakah sudah ada instance Firebase sebelum inisialisasi
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase init error:', error);
  }
} else {
  app = getApps()[0];
  console.log('✅ Firebase already initialized');
}

export default app;