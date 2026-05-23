// src/components/IncomingCallModal.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  Vibration,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const IncomingCallModal = ({
  visible,
  callerName,
  callType,
  onAccept,
  onReject,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const vibrationInterval = useRef(null);

  // Animasi pulse untuk incoming call
  useEffect(() => {
    if (visible) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Vibrate untuk incoming call (pattern: getar, diam, getar)
      Vibration.vibrate([1000, 500, 1000], true);
      vibrationInterval.current = true;
    } else {
      // Stop vibration
      Vibration.cancel();
      if (vibrationInterval.current) {
        vibrationInterval.current = null;
      }
      pulseAnim.setValue(1);
    }

    return () => {
      Vibration.cancel();
    };
  }, [visible, pulseAnim]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Animated.View 
            style={[
              styles.avatarContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {callerName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.ringingRing} />
          </Animated.View>
          
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callType}>
            Panggilan Suara Masuk
          </Text>
          <Text style={styles.ringingText}>Sedang berdering...</Text>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={onReject}
              activeOpacity={0.8}
            >
              <View style={styles.buttonCircle}>
                <Icon name="call" size={32} color="#fff" />
              </View>
              <Text style={styles.buttonText}>Tolak</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={onAccept}
              activeOpacity={0.8}
            >
              <View style={styles.buttonCircle}>
                <Icon name="call" size={32} color="#fff" />
              </View>
              <Text style={styles.buttonText}>Terima</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    width: width - 40,
  },
  avatarContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#075E54',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  ringingRing: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#4CAF50',
    opacity: 0.5,
  },
  avatarText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  callerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  callType: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 8,
  },
  ringingText: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 60,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 40,
  },
  button: {
    alignItems: 'center',
  },
  buttonCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  acceptButton: {
    backgroundColor: 'transparent',
  },
  acceptButton: {
    backgroundColor: 'transparent',
  },
  rejectButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

// Tambahkan style untuk acceptButton dan rejectButton
styles.acceptButton.buttonCircle = {
  backgroundColor: '#4CAF50',
};

styles.rejectButton.buttonCircle = {
  backgroundColor: '#F44336',
};

export default IncomingCallModal;