import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';
import socketService from './socketService';
import { ICE_SERVERS } from '../config/constants';

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.isCaller = false;
    this.callId = null;
    this.listeners = {};
  }

  // Event emitter
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // Initialize local media stream
  async initializeLocalStream(videoEnabled = true, audioEnabled = true) {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: audioEnabled,
        video: videoEnabled ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user',
        } : false,
      });

      this.localStream = stream;
      this.emit('localStream', stream);
      return stream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      throw error;
    }
  }

  // Create peer connection
  createPeerConnection() {
    const configuration = {
      iceServers: ICE_SERVERS,
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate:', event.candidate);
        this.emit('iceCandidate', event.candidate);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
      this.emit('connectionStateChange', this.peerConnection.connectionState);
      
      if (this.peerConnection.connectionState === 'connected') {
        this.emit('callConnected');
      } else if (this.peerConnection.connectionState === 'failed') {
        this.emit('callFailed');
      } else if (this.peerConnection.connectionState === 'disconnected') {
        this.emit('callDisconnected');
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Remote track received:', event.track);
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.emit('remoteStream', event.streams[0]);
      }
    };

    return this.peerConnection;
  }

  // Initiate call (caller side)
  async initiateCall(calleeId, callerName) {
    try {
      this.isCaller = true;
      this.callId = `call_${Date.now()}`;

      // Initialize local stream
      await this.initializeLocalStream();

      // Create peer connection
      this.createPeerConnection();

      // Create offer
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection.setLocalDescription(offer);

      // Send offer via signaling
      socketService.callUser(
        calleeId,
        null, // caller ID will be from socket auth
        callerName,
        {
          type: offer.type,
          sdp: offer.sdp,
        },
        'video'
      );

      return this.callId;
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }

  // Accept call (callee side)
  async acceptCall(offer) {
    try {
      this.isCaller = false;

      // Initialize local stream
      await this.initializeLocalStream();

      // Create peer connection
      this.createPeerConnection();

      // Set remote description (offer)
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      // Create answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      return {
        type: answer.type,
        sdp: answer.sdp,
      };
    } catch (error) {
      console.error('Error accepting call:', error);
      throw error;
    }
  }

  // Handle answer (caller side)
  async handleAnswer(answer) {
    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  // Handle ICE candidate
  async handleIceCandidate(candidate) {
    try {
      if (this.peerConnection) {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  // Toggle audio
  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  // Toggle video
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  // Switch camera
  async switchCamera() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        // Toggle facing mode
        videoTrack._switchCamera();
      }
    }
  }

  // End call
  endCall() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.callId = null;
    this.isCaller = false;

    this.emit('callEnded');
  }

  // Get local stream
  getLocalStream() {
    return this.localStream;
  }

  // Get remote stream
  getRemoteStream() {
    return this.remoteStream;
  }

  // Check if audio is enabled
  isAudioEnabled() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      return audioTrack ? audioTrack.enabled : false;
    }
    return false;
  }

  // Check if video is enabled
  isVideoEnabled() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      return videoTrack ? videoTrack.enabled : false;
    }
    return false;
  }
}

export default new WebRTCService();
