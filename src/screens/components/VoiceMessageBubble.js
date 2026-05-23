// src/components/VoiceMessageBubble.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import VoiceMessageService from '../../service/chat/VoiceMessageService';

const VoiceMessageBubble = ({ message, isOwn, onLongPress }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const handlePlayPause = async () => {
    if (isPlaying) {
      await VoiceMessageService.stopPlayback();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      await VoiceMessageService.playVoiceMessage(message.audioPath, message.audioBase64);
      
      // Reset playing state after playback ends
      setTimeout(() => {
        setIsPlaying(false);
        setPlaybackProgress(0);
      }, 10000); // Adjust based on actual duration
    }
  };

  return (
    <View style={[
      styles.messageWrapper,
      isOwn ? styles.messageWrapperOwn : styles.messageWrapperOther
    ]}>
      <TouchableOpacity 
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage
        ]}
        onLongPress={onLongPress}
        delayLongPress={500}
      >
        <View style={[
          styles.messageBubble,
          isOwn ? styles.ownBubble : styles.otherBubble,
        ]}>
          <View style={styles.voiceContainer}>
            <TouchableOpacity onPress={handlePlayPause}>
              <Icon 
                name={isPlaying ? "pause-circle" : "play-circle"} 
                size={44} 
                color={isOwn ? "#075E54" : "#075E54"} 
              />
            </TouchableOpacity>
            
            <View style={styles.voiceInfo}>
              <View style={styles.waveform}>
                {[...Array(12)].map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.waveBar, 
                      { 
                        height: isPlaying ? 8 + Math.sin(Date.now() / 200 + i) * 6 : 8,
                        backgroundColor: isOwn ? "#075E54" : "#075E54"
                      }
                    ]} 
                  />
                ))}
              </View>
              <Text style={styles.voiceDuration}>
                {message.duration || '00:00'}
              </Text>
            </View>
          </View>
          
          <View style={styles.messageFooter}>
            <Text style={styles.timestamp}>{message.timestamp || ''}</Text>
            {message.sendError && (
              <TouchableOpacity>
                <Icon name="alert-circle-outline" size={14} color="#F44336" />
              </TouchableOpacity>
            )}
            {isOwn && !message.sendError && (
              <Icon name="checkmark-done-outline" size={14} color="#4CAF50" style={styles.statusIcon} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  messageWrapper: {
    marginBottom: 12,
  },
  messageWrapperOwn: {
    alignItems: 'flex-end',
  },
  messageWrapperOther: {
    alignItems: 'flex-start',
  },
  messageContainer: {
    maxWidth: '80%',
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 180,
  },
  voiceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
  },
  waveBar: {
    width: 3,
    marginHorizontal: 2,
    backgroundColor: '#075E54',
    borderRadius: 1.5,
  },
  voiceDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginRight: 4,
  },
  statusIcon: {
    marginLeft: 4,
  },
});

export default VoiceMessageBubble;