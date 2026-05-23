// src/components/ActiveCallScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const ActiveCallScreen = ({
  visible,
  callerName,
  callType,
  duration,
  isMuted,
  isSpeakerOn,
  onToggleMute,
  onToggleSpeaker,
  onEndCall,
}) => {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Back button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onEndCall}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {callerName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          </View>
          
          {/* Caller info */}
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callType}>
            {callType === 'voice' ? 'Voice Call' : 'Video Call'}
          </Text>
          <Text style={styles.duration}>{formatDuration(duration)}</Text>
          
          {/* Control buttons */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={onToggleSpeaker}
            >
              <View style={styles.controlIconContainer}>
                <Icon
                  name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
                  size={28}
                  color="#fff"
                />
              </View>
              <Text style={styles.controlText}>
                {isSpeakerOn ? 'Speaker' : 'Earpiece'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.controlButton}
              onPress={onToggleMute}
            >
              <View style={[styles.controlIconContainer, isMuted && styles.activeControl]}>
                <Icon
                  name={isMuted ? 'mic-off' : 'mic'}
                  size={28}
                  color="#fff"
                />
              </View>
              <Text style={styles.controlText}>
                {isMuted ? 'Unmute' : 'Mute'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* End call button */}
          <TouchableOpacity
            style={styles.endCallButton}
            onPress={onEndCall}
          >
            <Icon name="call" size={32} color="#fff" />
            <Text style={styles.endCallText}>End Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  avatarContainer: {
    marginBottom: 24,
    marginTop: 60,
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
  duration: {
    fontSize: 24,
    fontWeight: '300',
    color: '#4CAF50',
    marginBottom: 60,
    fontVariant: ['tabular-nums'],
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
    marginBottom: 60,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeControl: {
    backgroundColor: '#075E54',
  },
  controlText: {
    color: '#fff',
    fontSize: 12,
  },
  endCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 40,
    gap: 12,
    position: 'absolute',
    bottom: 50,
  },
  endCallText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ActiveCallScreen;