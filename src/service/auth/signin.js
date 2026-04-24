import axios from 'axios';
import { Platform } from 'react-native';

const getBaseURL = () => {
  if (Platform.OS === 'android') {
    return 'http://103.150.227.223:2356'; // IP baru dari ipconfig
  }
  return 'http://localhost:2356';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'x-api-key': '3f=Pr#g1@RU-nw=30',
    'Content-Type': 'application/json',
  },
});

export const signin = async (identifier, password) => {
  const payload = {
    password,
  };

  if (identifier.includes('@')) {
    payload.email = identifier;
  } else {
    let whatsapp = identifier;
    whatsapp = whatsapp.replace(/\s/g, '');
    if (!whatsapp.startsWith('+')) {
      whatsapp = `+${whatsapp}`;
    }
    payload.whatsapp = whatsapp;
  }

  console.log('=== SIGNIN DEBUG ===');
  console.log('Base URL:', getBaseURL());
  console.log('Full URL:', getBaseURL() + '/auth/signin');
  console.log('Payload:', payload);

  try {
    const response = await apiClient.post('/auth/signin', payload);
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Signin error:', error.message);
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
};