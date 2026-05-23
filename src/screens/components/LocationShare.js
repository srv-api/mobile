import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Geolocation from 'react-native-geolocation-service';

const LocationShare = ({ visible, onClose, onSendLocation, receiverName }) => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await Geolocation.requestAuthorization('whenInUse');
        return granted === 'granted';
      } catch (err) {
        console.log('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      setError('Location permission denied');
      setLoading(false);
      Alert.alert(
        'Permission Required',
        'Please enable location permission to share your location.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {
            if (Platform.OS === 'android') {
              Linking.openSettings();
            }
          }}
        ]
      );
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          latitude,
          longitude,
          timestamp: position.timestamp,
        });
        setLoading(false);
      },
      (error) => {
        console.log('Location error:', error);
        setError(error.message || 'Failed to get location');
        setLoading(false);
        Alert.alert('Error', 'Failed to get your location. Please try again.');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    } else {
      setLocation(null);
      setError(null);
    }
  }, [visible]);

  const handleSendLocation = () => {
    if (location) {
      onSendLocation(location);
      onClose();
    }
  };

  const openMaps = () => {
    if (!location) return;
    
    const { latitude, longitude } = location;
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
    });
    
    Linking.openURL(url).catch(err => {
      console.log('Error opening maps:', err);
    });
  };

  const formatLocationString = () => {
    if (!location) return '';
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share Location</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#075E54" />
                <Text style={styles.loadingText}>Getting your location...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle-outline" size={48} color="#F44336" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={getCurrentLocation}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : location ? (
              <View style={styles.locationContainer}>
                <Icon name="location" size={48} color="#075E54" />
                <Text style={styles.locationLabel}>Your current location:</Text>
                <Text style={styles.locationCoordinates}>
                  {formatLocationString()}
                </Text>
                <TouchableOpacity 
                  style={styles.viewMapButton}
                  onPress={openMaps}
                >
                  <Icon name="map-outline" size={20} color="#075E54" />
                  <Text style={styles.viewMapText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.sendButton, !location && styles.disabledButton]}
              onPress={handleSendLocation}
              disabled={!location || loading}
            >
              <Icon name="send-outline" size={20} color="#fff" />
              <Text style={styles.sendButtonText}>Send Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    minHeight: 200,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#075E54',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  locationContainer: {
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 12,
  },
  locationCoordinates: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  viewMapText: {
    marginLeft: 8,
    color: '#075E54',
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#075E54',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default LocationShare;