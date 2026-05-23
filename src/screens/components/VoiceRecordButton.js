// src/components/VoiceRecordButton.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import VoiceMessageService from '../../service/chat/VoiceMessageService';

const { width, height } = Dimensions.get('window');

const VoiceRecordButton = ({ 
  onSendVoiceMessage, 
  disabled = false,
  webSocketStatus = 'connected'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const recordTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
      VoiceMessageService.cleanup();
    };
  }, []);

  const startRecordingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startRecordingProgress = () => {
    // Progress bar animation (max 60 seconds)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 60000,
      useNativeDriver: false,
    }).start();
  };

  const handleStartRecording = async () => {
    if (disabled || webSocketStatus !== 'connected') {
      Alert.alert('Koneksi Terputus', 'Tidak dapat merekam suara');
      return;
    }

    setShowRecordModal(true);
    
    const success = await VoiceMessageService.startRecording(
      () => {
        setIsRecording(true);
        startRecordingAnimation();
        startRecordingProgress();
      },
      (time) => {
        setRecordTime(time);
      }
    );

    if (!success) {
      setShowRecordModal(false);
    }
  };

  const handleStopRecording = async () => {
    const result = await VoiceMessageService.stopRecording();
    
    if (result && result.audioPath) {
      setShowRecordModal(false);
      setIsRecording(false);
      setRecordTime('00:00');
      progressAnim.setValue(0);
      
      // Send voice message
      if (onSendVoiceMessage) {
        await onSendVoiceMessage(result.audioPath, result.duration);
      }
    }
  };

  const handleCancelRecording = async () => {
    await VoiceMessageService.cancelRecording();
    setShowRecordModal(false);
    setIsRecording(false);
    setRecordTime('00:00');
    progressAnim.setValue(0);
  };

  const getRecordingDuration = () => {
    const [minutes, seconds] = recordTime.split(':');
    const totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
    if (totalSeconds >= 60) {
      return '01:00';
    }
    return recordTime;
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.micButton,
          isRecording && styles.recordingButton
        ]}
        disabled={disabled || webSocketStatus !== 'connected'}
        onPress={handleStartRecording}
      >
        <Icon
          name="mic"
          size={24}
          color={disabled || webSocketStatus !== 'connected' ? "#999" : "#075E54"}
        />
      </TouchableOpacity>

      <Modal
        visible={showRecordModal}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Voice</Text>
            
            <View style={styles.recordingContainer}>
              <Animated.View style={[
                styles.recordingCircle,
                { transform: [{ scale: scaleAnim }] }
              ]}>
                <Icon name="mic" size={60} color="#F44336" />
              </Animated.View>
              
              <Text style={styles.recordingTime}>{getRecordingDuration()}</Text>
              
              <View style={styles.progressBarContainer}>
                <Animated.View 
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%']
                      })
                    }
                  ]} 
                />
              </View>
              
              <Text style={styles.recordingHint}>
                Release to send, swipe left to cancel
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelRecording}
              >
                <Icon name="close-circle" size={50} color="#999" />
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={handleStopRecording}
              >
                <Icon name="paper-plane" size={50} color="#4CAF50" />
                <Text style={styles.buttonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  micButton: {
    padding: 8,
    borderRadius: 30,
  },
  recordingButton: {
    backgroundColor: '#F44336',
    borderRadius: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#075E54',
    marginBottom: 20,
  },
  recordingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  recordingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordingTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  recordingHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  cancelButton: {
    alignItems: 'center',
  },
  sendButton: {
    alignItems: 'center',
  },
  buttonText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
});

export default VoiceRecordButton;