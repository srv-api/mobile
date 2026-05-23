import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

class UserActionService {
  // Block user
  static async blockUser(userId, userName, navigation = null) {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // TODO: Ganti dengan endpoint API Anda
      const response = await fetch('YOUR_API_URL/users/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          blocked_user_id: userId,
          action: 'block',
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', `${userName} has been blocked`);
        // Optional: Navigate back or clear chat
        if (navigation) {
          setTimeout(() => navigation.goBack(), 1500);
        }
        return true;
      } else {
        throw new Error(data.message || 'Failed to block user');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert('Error', error.message || 'Failed to block user');
      return false;
    }
  }

  // Report user
  static async reportUser(userId, userName, reason = null) {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // TODO: Ganti dengan endpoint API Anda
      const response = await fetch('YOUR_API_URL/users/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reported_user_id: userId,
          reason: reason || 'Reported from chat',
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', `${userName} has been reported to our team`);
        return true;
      } else {
        throw new Error(data.message || 'Failed to report user');
      }
    } catch (error) {
      console.error('Error reporting user:', error);
      Alert.alert('Error', error.message || 'Failed to report user');
      return false;
    }
  }

  // Show report reason dialog
  static async showReportDialog(userId, userName) {
    return new Promise((resolve) => {
      Alert.alert(
        'Report User',
        'Please select a reason for reporting this user:',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Spam',
            onPress: () => {
              this.reportUser(userId, userName, 'Spam');
              resolve(true);
            },
          },
          {
            text: 'Harassment',
            onPress: () => {
              this.reportUser(userId, userName, 'Harassment');
              resolve(true);
            },
          },
          {
            text: 'Inappropriate Content',
            onPress: () => {
              this.reportUser(userId, userName, 'Inappropriate Content');
              resolve(true);
            },
          },
          {
            text: 'Other',
            onPress: () => {
              this.reportUser(userId, userName, 'Other');
              resolve(true);
            },
          },
        ]
      );
    });
  }
}

export default UserActionService;