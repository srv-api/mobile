// src/service/NotificationService.js
import { Platform, PermissionsAndroid } from 'react-native';

export default class NotificationService {
  static async checkPermissions() {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return hasPermission;
      } catch (error) {
        console.error('checkPermissions error:', error);
        return false;
      }
    }
    return true; // untuk Android < 33 atau iOS, anggap sudah diizinkan
  }

  static async requestPermissions() {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Aktifkan Notifikasi',
            message: 'Aplikasi ingin mengirim notifikasi saat ada pesan baru.',
            buttonNeutral: 'Tanya Nanti',
            buttonNegative: 'Tolak',
            buttonPositive: 'Izinkan',
          }
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('requestPermissions error:', error);
        return false;
      }
    }
    return true;
  }
}