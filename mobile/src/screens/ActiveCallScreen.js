import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Text,
  IconButton,
} from 'react-native-paper';
import { RTCView } from 'react-native-webrtc';
import webrtcService from '../services/webrtcService';
import socketService from '../services/socketService';
import { useAuth } from '../contexts/AuthContext';
import { callsAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

const ActiveCallScreen = ({ route, navigation }) => {
  const { friend, isIncoming } = route.params;
  const { user } = useAuth();
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState('connecting');
  
  const callStartTime = useRef(null);
  const durationInterval = useRef(null);

  useEffect(() => {
    setupCall();

    // Listen for WebRTC events
    webrtcService.on('localStream', handleLocalStream);
    webrtcService.on('remoteStream', handleRemoteStream);
    webrtcService.on('iceCandidate', handleIceCandidate);
    webrtcService.on('callConnected', handleCallConnected);
    webrtcService.on('callEnded', handleCallEnded);
    webrtcService.on('connectionStateChange', handleConnectionStateChange);

    // Listen for signaling events
    socketService.on('ice_candidate', handleRemoteIceCandidate);
    socketService.on('call_ended', handleRemoteCallEnded);

    return () => {
      cleanup();
      webrtcService.off('localStream', handleLocalStream);
      webrtcService.off('remoteStream', handleRemoteStream);
      webrtcService.off('iceCandidate', handleIceCandidate);
      webrtcService.off('callConnected', handleCallConnected);
      webrtcService.off('callEnded', handleCallEnded);
      webrtcService.off('connectionStateChange', handleConnectionStateChange);
      socketService.off('ice_candidate', handleRemoteIceCandidate);
      socketService.off('call_ended', handleRemoteCallEnded);
    };
  }, []);

  const setupCall = () => {
    // Get streams that were already initialized
    const local = webrtcService.getLocalStream();
    const remote = webrtcService.getRemoteStream();
    
    if (local) {
      setLocalStream(local);
    }
    if (remote) {
      setRemoteStream(remote);
    }
  };

  const handleLocalStream = (stream) => {
    setLocalStream(stream);
  };

  const handleRemoteStream = (stream) => {
    setRemoteStream(stream);
  };

  const handleIceCandidate = (candidate) => {
    // Send ICE candidate to peer
    socketService.sendIceCandidate(friend.id, candidate);
  };

  const handleRemoteIceCandidate = ({ candidate }) => {
    webrtcService.handleIceCandidate(candidate);
  };

  const handleCallConnected = () => {
    setConnectionState('connected');
    callStartTime.current = Date.now();
    
    // Start duration timer
    durationInterval.current = setInterval(() => {
      if (callStartTime.current) {
        const duration = Math.floor((Date.now() - callStartTime.current) / 1000);
        setCallDuration(duration);
      }
    }, 1000);
  };

  const handleConnectionStateChange = (state) => {
    setConnectionState(state);
  };

  const handleRemoteCallEnded = () => {
    endCall();
  };

  const handleCallEnded = () => {
    navigation.goBack();
  };

  const cleanup = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
  };

  const toggleAudio = () => {
    const enabled = webrtcService.toggleAudio();
    setAudioEnabled(enabled);
  };

  const toggleVideo = () => {
    const enabled = webrtcService.toggleVideo();
    setVideoEnabled(enabled);
  };

  const switchCamera = () => {
    webrtcService.switchCamera();
  };

  const endCall = async () => {
    // Log call
    try {
      await callsAPI.logCall({
        caller_id: isIncoming ? friend.id : user.id,
        callee_id: isIncoming ? user.id : friend.id,
        duration: callDuration,
        call_type: 'video',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log call:', error);
    }

    // End WebRTC call
    webrtcService.endCall();
    
    // Send end call signal
    socketService.endCall(friend.id);
    
    // Go back
    navigation.goBack();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Remote video (full screen) */}
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <View style={styles.placeholderVideo}>
          <Text variant="bodyLarge" style={styles.placeholderText}>
            {connectionState === 'connected' ? 'Waiting for video...' : 'Connecting...'}
          </Text>
        </View>
      )}

      {/* Local video (picture-in-picture) */}
      {localStream && videoEnabled && (
        <View style={styles.localVideoContainer}>
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror={true}
          />
        </View>
      )}

      {/* Top info bar */}
      <View style={styles.topBar}>
        <Text variant="titleMedium" style={styles.friendName}>
          {friend.username}
        </Text>
        <Text variant="bodyMedium" style={styles.callDuration}>
          {formatDuration(callDuration)}
        </Text>
        <View style={styles.connectionIndicator}>
          <View
            style={[
              styles.connectionDot,
              connectionState === 'connected' && styles.connectedDot,
            ]}
          />
          <Text variant="bodySmall" style={styles.connectionText}>
            {connectionState}
          </Text>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <IconButton
          icon={audioEnabled ? 'microphone' : 'microphone-off'}
          iconColor="#fff"
          size={28}
          style={[styles.controlButton, !audioEnabled && styles.disabledButton]}
          onPress={toggleAudio}
        />
        
        <IconButton
          icon="phone-hangup"
          iconColor="#fff"
          size={32}
          style={styles.endCallButton}
          onPress={endCall}
        />
        
        <IconButton
          icon={videoEnabled ? 'video' : 'video-off'}
          iconColor="#fff"
          size={28}
          style={[styles.controlButton, !videoEnabled && styles.disabledButton]}
          onPress={toggleVideo}
        />
        
        <IconButton
          icon="camera-flip"
          iconColor="#fff"
          size={28}
          style={styles.controlButton}
          onPress={switchCamera}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    width: width,
    height: height,
  },
  placeholderVideo: {
    width: width,
    height: height,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 80,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  friendName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  callDuration: {
    color: '#fff',
    marginTop: 4,
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff9800',
    marginRight: 6,
  },
  connectedDot: {
    backgroundColor: '#4caf50',
  },
  connectionText: {
    color: '#fff',
    textTransform: 'capitalize',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 32,
    paddingTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  disabledButton: {
    backgroundColor: '#f44336',
  },
  endCallButton: {
    backgroundColor: '#f44336',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
});

export default ActiveCallScreen;
