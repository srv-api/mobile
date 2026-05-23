
// src/service/chat/VoiceMessageService.js

import {
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';

import RNFS from 'react-native-fs';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

import MessageRepository from '../../database/MessageRepository';
import { formatTimestamp } from './chatApi';

class VoiceMessageService {
  constructor() {
    this.audioRecorderPlayer = AudioRecorderPlayer;
    this.isRecording = false;
    this.recordTime = '00:00';
    this.audioPath = '';
  }

  // =========================
  // REQUEST PERMISSION
  // =========================
  async requestMicrophonePermission() {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message:
              'App needs microphone permission to send voice messages',
            buttonPositive: 'OK',
          }
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }

      return true;
    } catch (error) {
      console.log('Permission error:', error);
      return false;
    }
  }

  // =========================
  // FORMAT TIME
  // =========================
  mmssss(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return (
      String(minutes).padStart(2, '0') +
      ':' +
      String(seconds).padStart(2, '0')
    );
  }

  // =========================
  // START RECORDING
  // =========================
  async startRecording(onRecordingStart, onTimeUpdate) {
    try {
      const hasPermission =
        await this.requestMicrophonePermission();

      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Microphone permission required'
        );
        return false;
      }

      const path = Platform.select({
        android: `${RNFS.CachesDirectoryPath}/voice_${Date.now()}.mp4`,
        ios: `${RNFS.DocumentDirectoryPath}/voice_${Date.now()}.m4a`,
      });

      console.log('🎤 Recording path:', path);

      this.audioPath = path;

      await this.audioRecorderPlayer.startRecorder(path);

      this.audioRecorderPlayer.addRecordBackListener((e) => {
        const time = this.mmssss(e.currentPosition);

        this.recordTime = time;

        if (onTimeUpdate) {
          onTimeUpdate(time);
        }

        return;
      });

      this.isRecording = true;

      if (onRecordingStart) {
        onRecordingStart();
      }

      console.log('✅ Recording started');

      return true;
    } catch (error) {
      console.log('❌ Start record error:', error);

      this.isRecording = false;

      Alert.alert(
        'Error',
        'Failed to start recording'
      );

      return false;
    }
  }

  // =========================
  // STOP RECORDING
  // =========================
  async stopRecording() {
    try {
      if (!this.isRecording) {
        return null;
      }

      const result =
        await this.audioRecorderPlayer.stopRecorder();

      this.audioRecorderPlayer.removeRecordBackListener();

      console.log('✅ Recording stopped:', result);

      const response = {
        audioPath: result,
        duration: this.recordTime,
      };

      this.isRecording = false;
      this.recordTime = '00:00';

      return response;
    } catch (error) {
      console.log('❌ Stop record error:', error);

      this.isRecording = false;

      Alert.alert(
        'Error',
        'Failed to stop recording'
      );

      return null;
    }
  }

  // =========================
  // CANCEL RECORDING
  // =========================
  async cancelRecording() {
    try {
      if (this.isRecording) {
        await this.audioRecorderPlayer.stopRecorder();

        this.audioRecorderPlayer.removeRecordBackListener();
      }

      if (
        this.audioPath &&
        (await RNFS.exists(this.audioPath))
      ) {
        await RNFS.unlink(this.audioPath);
      }

      this.isRecording = false;
      this.recordTime = '00:00';
      this.audioPath = '';

      console.log('🗑 Recording cancelled');

      return true;
    } catch (error) {
      console.log('Cancel recording error:', error);
      return false;
    }
  }

  // =========================
  // AUDIO TO BASE64
  // =========================
  async audioFileToBase64(audioPath) {
    try {
      const exists = await RNFS.exists(audioPath);

      if (!exists) {
        throw new Error('Audio file not found');
      }

      const base64 = await RNFS.readFile(
        audioPath,
        'base64'
      );

      return base64;
    } catch (error) {
      console.log('Audio to base64 error:', error);
      return null;
    }
  }

  // src/service/chat/VoiceMessageService.js
// Perbaiki method sendVoiceMessage

async sendVoiceMessage({
  audioPath,
  duration,
  currentUserId,
  currentUserName,
  receiverId,
  receiverName,
  webSocketService,
  onSuccess,
  onError,
}) {
  try {
    const audioBase64 = await this.audioFileToBase64(audioPath);

    if (!audioBase64) {
      throw new Error('Failed convert audio to base64');
    }

    const messageId = Date.now().toString();
    const nowISO = new Date().toISOString();

    const messageData = {
      id: messageId,
      type: 'voice',
      text: '🎤 Voice Message',
      audioPath,
      audioBase64,
      duration,
      timestamp: formatTimestamp(nowISO) || '',
      isOwn: true,
      sender: currentUserName,
      senderId: currentUserId,
      receiverId,
      createdAt: nowISO,
    };

    // PERBAIKAN: Cek dengan aman sebelum panggil sendVoiceMessage
    let sent = false;
    
    if (webSocketService) {
      // Cek apakah method sendVoiceMessage ada
      if (typeof webSocketService.sendVoiceMessage === 'function') {
        try {
          sent = webSocketService.sendVoiceMessage(
            receiverId,
            audioBase64,
            duration,
            currentUserName
          );
          console.log('📤 WebSocket send result:', sent);
        } catch (wsErr) {
          console.warn('WebSocket error:', wsErr);
          sent = false;
        }
      } else {
        console.warn('⚠️ webSocketService.sendVoiceMessage is NOT a function');
        console.log('Available methods:', Object.keys(webSocketService));
      }
    } else {
      console.warn('⚠️ webSocketService is null/undefined');
    }

    // TETAP SIMPAN KE DATABASE
    await MessageRepository.saveVoiceMessage({
      id: messageId,
      text: '🎤 Voice Message',
      audioPath,
      audioBase64,
      duration,
      senderId: currentUserId,
      senderName: currentUserName,
      receiverId,
      receiverName,
      isOwn: true,
      status: sent ? 'sent' : 'pending',
      timestamp: formatTimestamp(nowISO) || '',
      createdAt: nowISO,
    });

    console.log('✅ Voice message saved to database');

    if (onSuccess) {
      onSuccess(messageData);
    }

    return messageData;
  } catch (error) {
    console.log('❌ Send voice error:', error);
    if (onError) {
      onError(error);
    }
    return null;
  }
}


  // =========================
  // PLAY AUDIO
  // =========================
  async playVoiceMessage(
    audioPath,
    audioBase64
  ) {
    try {
      let pathToPlay = audioPath;

      // kalau file tidak ada
      if (
        (!audioPath ||
          !(await RNFS.exists(audioPath))) &&
        audioBase64
      ) {
        pathToPlay = `${RNFS.CachesDirectoryPath}/temp_${Date.now()}.mp4`;

        await RNFS.writeFile(
          pathToPlay,
          audioBase64,
          'base64'
        );
      }

      if (!pathToPlay) {
        throw new Error(
          'No audio available'
        );
      }

      await this.audioRecorderPlayer.startPlayer(
        pathToPlay
      );

      this.audioRecorderPlayer.addPlayBackListener(
        async (e) => {
          if (
            e.currentPosition >= e.duration
          ) {
            await this.audioRecorderPlayer.stopPlayer();

            this.audioRecorderPlayer.removePlayBackListener();
          }

          return;
        }
      );

      return true;
    } catch (error) {
      console.log('❌ Play audio error:', error);

      Alert.alert(
        'Error',
        'Failed to play voice message'
      );

      return false;
    }
  }

  // =========================
  // STOP PLAYBACK
  // =========================
  async stopPlayback() {
    try {
      await this.audioRecorderPlayer.stopPlayer();

      this.audioRecorderPlayer.removePlayBackListener();

      return true;
    } catch (error) {
      console.log('Stop playback error:', error);
      return false;
    }
  }

  // =========================
  // GET STATUS
  // =========================
  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      recordTime: this.recordTime,
      audioPath: this.audioPath,
    };
  }

  // =========================
  // CLEANUP
  // =========================
  async cleanup() {
    try {
      if (this.isRecording) {
        await this.cancelRecording();
      }

      await this.audioRecorderPlayer.stopPlayer();

      this.audioRecorderPlayer.removePlayBackListener();

      this.audioRecorderPlayer.removeRecordBackListener();

      console.log('🧹 Voice cleanup done');
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  }
}

const voiceMessageService =
  new VoiceMessageService();

export default voiceMessageService;

