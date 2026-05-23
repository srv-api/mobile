// src/service/chat/WebRTCService.js

import { 
  mediaDevices, 
  RTCPeerConnection, 
  RTCSessionDescription,
  RTCIceCandidate 
} from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';

class WebRTCService {
  constructor() {
    this.pc = null;
    this.localStream = null;
    this.remoteStream = null;
    this.currentCallId = null;
    this.isCallActive = false;
    this.isMuted = false;
    this.isSpeakerOn = false;
    this.signalingService = null;
    this.targetUserId = null;
    
    // Callback functions
    this.onRemoteStreamCallback = null;
    this.onCallEndedCallback = null;
    
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
      iceCandidatePoolSize: 10,
    };
  }

  // ========== CALLBACK REGISTRATION ==========
  
  setCallbacks(onRemoteStream, onCallEnded) {
    this.onRemoteStreamCallback = onRemoteStream;
    this.onCallEndedCallback = onCallEnded;
    console.log('✅ WebRTC callbacks registered');
  }

  // ========== PERMISSIONS & AUDIO ==========

  requestPermissions = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      console.log('✅ Microphone stream acquired');
      return stream;
    } catch (error) {
      console.error('Failed to get media permissions:', error);
      throw new Error('Microphone permission denied');
    }
  };

  setupAudioSession = () => {
    InCallManager.start({ media: 'audio' });
    InCallManager.setSpeakerphoneOn(this.isSpeakerOn);
    InCallManager.setMicrophoneMute(this.isMuted);
  };

  cleanupAudioSession = () => {
    InCallManager.stop();
  };

  // ========== CALL MANAGEMENT ==========

  startCall = async (callId, targetUserId, signalingService) => {
    try {
      console.log('📞 Starting outgoing call:', callId);
      
      this.currentCallId = callId;
      this.targetUserId = targetUserId;
      this.signalingService = signalingService;
      
      this.setupAudioSession();
      this.localStream = await this.requestPermissions();
      this.pc = new RTCPeerConnection(this.configuration);
      
      this.setupPeerConnectionListeners();
      
      this.localStream.getTracks().forEach(track => {
        this.pc.addTrack(track, this.localStream);
        console.log('Added track:', track.kind);
      });
      
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
      });
      await this.pc.setLocalDescription(offer);
      
      signalingService.sendWebRTCOffer(callId, targetUserId, offer);
      
      this.isCallActive = true;
      console.log('📞 Offer sent, waiting for answer');
      return true;
      
    } catch (error) {
      console.error('Start call error:', error);
      this.endCall();
      throw error;
    }
  };

  acceptCall = async (callId, callerId, signalingService) => {
    try {
      console.log('📞 Accepting incoming call:', callId);
      
      this.currentCallId = callId;
      this.targetUserId = callerId;
      this.signalingService = signalingService;
      
      this.setupAudioSession();
      this.localStream = await this.requestPermissions();
      this.pc = new RTCPeerConnection(this.configuration);
      
      this.setupPeerConnectionListeners();
      
      this.localStream.getTracks().forEach(track => {
        this.pc.addTrack(track, this.localStream);
      });
      
      this.isCallActive = true;
      return true;
      
    } catch (error) {
      console.error('Accept call error:', error);
      this.endCall();
      throw error;
    }
  };

  // ========== PEER CONNECTION LISTENERS ==========

  setupPeerConnectionListeners = () => {
    if (!this.pc) return;
    
    // Handle ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.signalingService && this.currentCallId && this.targetUserId) {
        this.signalingService.sendWebRTCIce(
          this.currentCallId,
          this.targetUserId,
          event.candidate
        );
        console.log('📤 ICE candidate sent');
      }
    };
    
    // Handle remote stream
    this.pc.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      console.log('📥 Remote stream received');
      
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };
    
    // Handle connection state
    this.pc.onconnectionstatechange = () => {
      if (!this.pc) return;
      console.log('Connection state:', this.pc.connectionState);
      
      switch (this.pc.connectionState) {
        case 'connected':
          console.log('✅ Call connected successfully');
          break;
        case 'disconnected':
          console.log('⚠️ Call disconnected');
          break;
        case 'failed':
          console.log('❌ Call failed');
          this.endCall();
          if (this.onCallEndedCallback) {
            this.onCallEndedCallback();
          }
          break;
        case 'closed':
          console.log('🔇 Call closed');
          break;
      }
    };
    
    // Handle ICE connection state
    this.pc.oniceconnectionstatechange = () => {
      if (!this.pc) return;
      console.log('ICE connection state:', this.pc.iceConnectionState);
      
      if (this.pc.iceConnectionState === 'failed') {
        console.log('❌ ICE connection failed');
        this.endCall();
        if (this.onCallEndedCallback) {
          this.onCallEndedCallback();
        }
      }
    };
  };

  // ========== SIGNALING HANDLERS ==========

  handleRemoteOffer = async (offer) => {
    try {
      if (!this.pc) {
        console.log('❌ No peer connection for remote offer');
        return;
      }
      console.log('📥 Received remote offer');
      await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      
      if (this.signalingService) {
        this.signalingService.sendWebRTCAnswer(
          this.currentCallId,
          this.targetUserId,
          answer
        );
      }
      
      console.log('📤 Answer sent');
    } catch (error) {
      console.error('Handle remote offer error:', error);
    }
  };

  handleRemoteAnswer = async (answer) => {
    try {
      if (!this.pc) {
        console.log('❌ No peer connection for remote answer');
        return;
      }
      console.log('📥 Received remote answer');
      await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ Remote description set');
    } catch (error) {
      console.error('Handle remote answer error:', error);
    }
  };

  handleRemoteIceCandidate = async (candidate) => {
    try {
      if (!this.pc) {
        console.log('❌ No peer connection for ICE candidate');
        return;
      }
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('✅ ICE candidate added');
    } catch (error) {
      console.error('Add ICE candidate error:', error);
    }
  };

  // ========== AUDIO CONTROLS ==========

  toggleMute = () => {
    this.isMuted = !this.isMuted;
    InCallManager.setMicrophoneMute(this.isMuted);
    console.log(`🔇 Mute: ${this.isMuted}`);
    return this.isMuted;
  };

  toggleSpeaker = () => {
    this.isSpeakerOn = !this.isSpeakerOn;
    InCallManager.setSpeakerphoneOn(this.isSpeakerOn);
    console.log(`🔊 Speaker: ${this.isSpeakerOn}`);
    return this.isSpeakerOn;
  };

  // ========== END CALL ==========

  endCall = () => {
    console.log('📞 Ending call...');
    
    // Reset callbacks
    this.onRemoteStreamCallback = null;
    this.onCallEndedCallback = null;
    
    // Remove all event listeners
    if (this.pc) {
      this.pc.onicecandidate = null;
      this.pc.ontrack = null;
      this.pc.onconnectionstatechange = null;
      this.pc.oniceconnectionstatechange = null;
      
      this.pc.close();
      this.pc = null;
    }
    
    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }
    
    // Cleanup audio session
    this.cleanupAudioSession();
    
    // Reset state
    this.isCallActive = false;
    this.remoteStream = null;
    this.currentCallId = null;
    this.targetUserId = null;
    this.signalingService = null;
    this.isMuted = false;
    this.isSpeakerOn = false;
    
    console.log('✅ Call ended and cleaned up');
  };

  // ========== GETTERS ==========

  getCallStatus = () => ({
    isActive: this.isCallActive,
    isMuted: this.isMuted,
    isSpeakerOn: this.isSpeakerOn,
    callId: this.currentCallId,
  });
}

const webRTCService = new WebRTCService();
export default webRTCService;