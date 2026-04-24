import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://103.150.227.223:2388';

const Preferences = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(50);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(65);
  const [interestedGender, setInterestedGender] = useState('both');
  const [detailId, setDetailId] = useState(null); // id dari user_details
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    loadUserAndPreferences();
  }, []);

  const loadUserAndPreferences = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Error', 'User not logged in');
        navigation.goBack();
        return;
      }
      setAccessToken(token);

      // Panggil API GET /merchant/get
      const response = await fetch(`${API_BASE_URL}/merchant/get`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.status === true && result.data) {
        const prefs = result.data;
        setDetailId(prefs.id); // simpan id dari user_details
        setRadius(prefs.radius ?? 50);
        setAgeMin(prefs.min_age ?? 18);
        setAgeMax(prefs.max_age ?? 65);
        setInterestedGender(prefs.gender_target ?? 'both');
      } else {
        // Jika belum ada data, coba ambil dari storage lokal (opsional)
        const stored = await AsyncStorage.getItem('@user_preferences');
        if (stored) {
          const localPrefs = JSON.parse(stored);
          setRadius(localPrefs.radius ?? 50);
          setAgeMin(localPrefs.ageMin ?? 18);
          setAgeMax(localPrefs.ageMax ?? 65);
          setInterestedGender(localPrefs.interestedGender ?? 'both');
        }
        // Jika tidak ada detailId, mungkin user_detail belum dibuat? Tapi seharusnya sudah.
      }
    } catch (error) {
      console.error('Load error:', error);
      Alert.alert('Error', 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!detailId) {
      Alert.alert('Error', 'User detail not found. Please try again.');
      return;
    }
    if (!accessToken) {
      Alert.alert('Error', 'Not authenticated');
      return;
    }

    try {
      // Update ke server via PUT /merchant/update?id=... (id dari user_details)
            const token = await AsyncStorage.getItem('access_token');

      const updateResponse = await fetch(`${API_BASE_URL}/merchant/update?id=${detailId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          radius: radius,
          min_age: ageMin,
          max_age: ageMax,
          gender_target: interestedGender,
        }),
      });

      const updateResult = await updateResponse.json();
      if (updateResponse.ok && updateResult.status !== false) {
        // Simpan ke storage lokal sebagai cadangan
        const prefs = {
          radius,
          ageMin,
          ageMax,
          interestedGender,
        };
        await AsyncStorage.setItem('@user_preferences', JSON.stringify(prefs));
        Alert.alert('Success', 'Preferences saved');
        navigation.goBack();
      } else {
        Alert.alert('Error', updateResult.message || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save preferences');
    }
  };

  const handleReset = () => {
    setRadius(50);
    setAgeMin(18);
    setAgeMax(65);
    setInterestedGender('both');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#075E54" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preferences</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#075E54" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#075E54" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <TouchableOpacity onPress={savePreferences}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Radius */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="radio-outline" size={24} color="#075E54" />
            <Text style={styles.cardTitle}>Discovery Radius</Text>
          </View>
          <Text style={styles.valueText}>{radius} km</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={radius}
            onValueChange={setRadius}
            minimumTrackTintColor="#075E54"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#075E54"
          />
          <View style={styles.rangeLabels}>
            <Text>1 km</Text>
            <Text>100 km</Text>
          </View>
        </View>

        {/* Age Range */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="calendar-outline" size={24} color="#075E54" />
            <Text style={styles.cardTitle}>Age Range</Text>
          </View>
          <Text style={styles.valueText}>Min: {ageMin}</Text>
          <Slider
            style={styles.slider}
            minimumValue={18}
            maximumValue={ageMax - 1}
            step={1}
            value={ageMin}
            onValueChange={setAgeMin}
            minimumTrackTintColor="#075E54"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#075E54"
          />
          <Text style={styles.valueText}>Max: {ageMax}</Text>
          <Slider
            style={styles.slider}
            minimumValue={ageMin + 1}
            maximumValue={80}
            step={1}
            value={ageMax}
            onValueChange={setAgeMax}
            minimumTrackTintColor="#075E54"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#075E54"
          />
        </View>

        {/* Interested In */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="people-outline" size={24} color="#075E54" />
            <Text style={styles.cardTitle}>Interested In</Text>
          </View>
          <View style={styles.genderContainer}>
            {['man', 'woman', 'both'].map(gender => (
              <TouchableOpacity
                key={gender}
                style={[styles.genderButton, interestedGender === gender && styles.genderActive]}
                onPress={() => setInterestedGender(gender)}
              >
                <Icon
                  name={gender === 'man' ? 'male-outline' : gender === 'woman' ? 'female-outline' : 'people-outline'}
                  size={24}
                  color={interestedGender === gender ? '#fff' : '#075E54'}
                />
                <Text style={[styles.genderText, interestedGender === gender && styles.genderTextActive]}>
                  {gender === 'man' ? 'Men' : gender === 'woman' ? 'Women' : 'Both'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Icon name="refresh-outline" size={20} color="#f44336" />
          <Text style={styles.resetText}>Reset to Default</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#075E54' },
  saveText: { fontSize: 16, fontWeight: '600', color: '#075E54' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginLeft: 12 },
  valueText: { fontSize: 16, fontWeight: '600', color: '#075E54', textAlign: 'center', marginBottom: 8 },
  slider: { width: '100%', height: 40 },
  rangeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  genderContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  genderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    gap: 8,
  },
  genderActive: { backgroundColor: '#075E54' },
  genderText: { fontSize: 14, fontWeight: '600', color: '#075E54' },
  genderTextActive: { color: '#fff' },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 30,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  resetText: { fontSize: 14, color: '#f44336', fontWeight: '600' },
});

export default Preferences;