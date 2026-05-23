import { 
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import RNFS from 'react-native-fs';
import AudioRecord from 'react-native-audio-record';
import Sound from 'react-native-sound';

class VoiceCallService {
  constructor() {
    this.isCallActive = false;
    this.isMuted = false;
    this.isSpeakerOn = false;
    this.currentCallId = null;
    this.callType = null; // 'incoming' or 'outgoing'
    this.callStatus = 'idle'; // idle, ringing, connecting, connected, ended
    this.audioStream = null;
    this.sound = null;
    
    // Callback handlers
    this.callHandlers = {
      onCallConnected: null,
      onCallEnded: null,
      onCallError: null,
      onCallRinging: null,
    };
  }

  // =========================
  // REQUEST PERMISSIONS
  // =========================
  async requestPermissions() {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        ]);
        
        const allGranted = Object.values(grants).every(
          grant => grant === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (!allGranted) {
          Alert.alert('Permission Denied', 'Microphone permission is required for voice calls');
          return false;
        }
        return true;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  }

  // =========================
  // INITIALIZE AUDIO RECORDER
  // =========================
  initAudioRecorder() {
    const options = {
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6, // VOICE_COMMUNICATION
      wavFile: 'call_audio.wav',
    };
    
    AudioRecord.init(options);
  }

  // =========================
  // START VOICE CALL (OUTGOING)
  // =========================
  async startCall({
    callerId,
    callerName,
    receiverId,
    receiverName,
    webSocketService,
    onConnected,
    onEnded,
    onError,
  }) {
    // Request permissions first
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      if (onError) onError('Microphone permission denied');
      return false;
    }

    this.initAudioRecorder();
    
    this.currentCallId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.callType = 'outgoing';
    this.callStatus = 'ringing';
    
    // Store handlers
    this.callHandlers.onCallConnected = onConnected;
    this.callHandlers.onCallEnded = onEnded;
    this.callHandlers.onCallError = onError;
    
    // Send call request via WebSocket
    if (webSocketService && webSocketService.sendCallRequest) {
      webSocketService.sendCallRequest({
        callId: this.currentCallId,
        callerId,
        callerName,
        receiverId,
        receiverName,
        type: 'voice',
      });
    } else {
      console.warn('WebSocket sendCallRequest not available');
    }
    
    // Play ringing sound
    this.playRingingSound();
    
    // Set timeout for unanswered call (30 seconds)
    this.callTimeout = setTimeout(() => {
      if (this.callStatus === 'ringing') {
        this.endCall('timeout');
        if (onError) onError('Call not answered');
      }
    }, 30000);
    
    console.log(`📞 Outgoing call started: ${this.currentCallId}`);
    return true;
  }

  // =========================
  // ACCEPT INCOMING CALL
  // =========================
  async acceptCall({
    callId,
    callerId,
    callerName,
    webSocketService,
    onConnected,
    onEnded,
    onError,
  }) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      if (onError) onError('Microphone permission denied');
      return false;
    }
    
    this.initAudioRecorder();
    
    this.currentCallId = callId;
    this.callType = 'incoming';
    this.callStatus = 'connecting';
    
    this.callHandlers.onCallConnected = onConnected;
    this.callHandlers.onCallEnded = onEnded;
    this.callHandlers.onCallError = onError;
    
    // Stop ringing sound
    this.stopRingingSound();
    
    // Send accept response
    if (webSocketService && webSocketService.acceptCall) {
      webSocketService.acceptCall(callId);
    }
    
    // Start audio recording/streaming
    this.startAudioStream();
    
    console.log(`📞 Incoming call accepted: ${this.currentCallId}`);
    return true;
  }

  // =========================
  // REJECT CALL
  // =========================
  rejectCall(callId, webSocketService) {
    if (webSocketService && webSocketService.rejectCall) {
      webSocketService.rejectCall(callId);
    }
    this.stopRingingSound();
    this.callStatus = 'ended';
    console.log(`📞 Call rejected: ${callId}`);
  }

  // =========================
  // END CURRENT CALL
  // =========================
  async endCall(reason = 'user_ended') {
    if (this.callTimeout) {
      clearTimeout(this.callTimeout);
    }
    
    this.stopRingingSound();
    this.stopAudioStream();
    
    this.isCallActive = false;
    this.callStatus = 'ended';
    
    if (this.callHandlers.onCallEnded) {
      this.callHandlers.onCallEnded(reason);
    }
    
    console.log(`📞 Call ended: ${this.currentCallId}, reason: ${reason}`);
    
    // Reset
    this.currentCallId = null;
    this.callType = null;
  }

  // =========================
  // TOGGLE MUTE
  // =========================
  toggleMute() {
    this.isMuted = !this.isMuted;
    // Implement mute logic here
    console.log(`🔇 Mute: ${this.isMuted}`);
    return this.isMuted;
  }

  // =========================
  // TOGGLE SPEAKER
  // =========================
  toggleSpeaker() {
    this.isSpeakerOn = !this.isSpeakerOn;
    // Implement speaker logic here
    console.log(`🔊 Speaker: ${this.isSpeakerOn}`);
    return this.isSpeakerOn;
  }

  // =========================
  // PLAY RINGING SOUND
  // =========================
  playRingingSound() {
    try {
      const ringtone = new Sound('ringtone.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('Failed to load ringtone', error);
          return;
        }
        this.sound = ringtone;
        this.sound.setNumberOfLoops(-1); // Loop indefinitely
        this.sound.play();
      });
    } catch (error) {
      console.log('Play ringtone error:', error);
    }
  }

  // =========================
  // STOP RINGING SOUND
  // =========================
  stopRingingSound() {
    if (this.sound) {
      this.sound.stop();
      this.sound.release();
      this.sound = null;
    }
  }

  // =========================
  // START AUDIO STREAM
  // =========================
  startAudioStream() {
    try {
      AudioRecord.start();
      this.isCallActive = true;
      this.callStatus = 'connected';
      
      if (this.callHandlers.onCallConnected) {
        this.callHandlers.onCallConnected();
      }
      
      // Start listening for audio data
      AudioRecord.on('data', (data) => {
        // Send audio data via WebSocket
        if (this.isCallActive && !this.isMuted) {
          this.sendAudioChunk(data);
        }
      });
      
      console.log('🎙️ Audio stream started');
    } catch (error) {
      console.error('Start audio stream error:', error);
    }
  }

  // =========================
  // STOP AUDIO STREAM
  // =========================
  stopAudioStream() {
    try {
      AudioRecord.stop();
      this.isCallActive = false;
      console.log('🎙️ Audio stream stopped');
    } catch (error) {
      console.error('Stop audio stream error:', error);
    }
  }

  // =========================
  // SEND AUDIO CHUNK
  // =========================
  sendAudioChunk(audioData) {
    // Will be implemented with WebSocket
    console.log(`📤 Audio chunk size: ${audioData.length}`);
  }

  // =========================
  // GET CALL STATUS
  // =========================
  getCallStatus() {
    return {
      isActive: this.isCallActive,
      status: this.callStatus,
      callId: this.currentCallId,
      callType: this.callType,
      isMuted: this.isMuted,
      isSpeakerOn: this.isSpeakerOn,
    };
  }
}

const voiceCallService = new VoiceCallService();
export default voiceCallService;