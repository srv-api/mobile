// src/config/firebase.js
import { initializeApp, getApps } from '@react-native-firebase/app';

// Konfigurasi Firebase dari google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyB5F2O7C16Bz5yWT_Pi7q1g26deUtZ6xVQ",
  authDomain: "cashpay-2ac49.firebaseapp.com",
  databaseURL: "https://cashpay-2ac49-default-rtdb.firebaseio.com",
  projectId: "cashpay-2ac49",
  storageBucket: "cashpay-2ac49.firebasestorage.app",
  messagingSenderId: "424973742981",
  appId: "1:424973742981:android:715aa43b6d702801960aec",
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