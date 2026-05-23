import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native'; // Tambahkan import ini

const LikedYou = () => {
  const [loading, setLoading] = useState(true);
  const [likedUsers, setLikedUsers] = useState([]);
const navigation = useNavigation();
  useEffect(() => {
    fetchLikedUsers();
  }, []);

  const fetchLikedUsers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      
      const response = await fetch('http://103.150.227.223:2388/api/account/like/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setLikedUsers(result.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

    const handleUpgrade = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('GetSee');
    } else {
      console.error('Navigation is not available');
      Alert.alert('Error', 'Unable to navigate. Please try again.');
    }
  };


  const getPhotoUrl = (photo_url) => {
    if (!photo_url) return '';
    return `http://103.150.227.223:2356/profile/${photo_url}`;
  };


  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        {item.photo_url ? (
          <Image
            source={{ uri: getPhotoUrl(item.photo_url) }}
            style={styles.image}
            blurRadius={15}
          />
        ) : (
          <View style={styles.noPhotoContainer}>
            <Text style={styles.noPhotoText}>No Photo</Text>
          </View>
        )}
        <View style={styles.overlay}>
          <Text style={styles.name}>{item.full_name}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff4458" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={likedUsers}
        keyExtractor={(item) => item.user_id}
        numColumns={2}
        renderItem={renderItem}
      />

      <View style={styles.bottomBox}>
        <Text style={styles.unlockText}>
          Unlock to see who liked you
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleUpgrade}>
          <Text style={styles.buttonText} >Upgrade</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LikedYou;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    marginBottom: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  card: {
    flex: 1,
    margin: 10,
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noPhotoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc',
  },
  noPhotoText: {
    color: '#666',
    fontSize: 12,
  },
  overlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomBox: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  unlockText: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#555',
  },
  button: {
    backgroundColor: '#ff4458',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});