import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import {
  Text,
  IconButton,
  Avatar,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';
import webrtcService from '../services/webrtcService';

const OutgoingCallScreen = ({ route, navigation }) => {
  const { friend } = route.params;
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState('Calling...');

  useEffect(() => {
    // Initiate the call
    initiateCall();

    // Listen for call events
    socketService.on('call_accepted', handleCallAccepted);
    socketService.on('call_rejected', handleCallRejected);
    socketService.on('call_failed', handleCallFailed);

    return () => {
      socketService.off('call_accepted', handleCallAccepted);
      socketService.off('call_rejected', handleCallRejected);
      socketService.off('call_failed', handleCallFailed);
    };
  }, []);

  const initiateCall = async () => {
    try {
      await webrtcService.initiateCall(friend.id, user.username);
    } catch (error) {
      console.error('Failed to initiate call:', error);
      setCallStatus('Call failed');
      setTimeout(() => navigation.goBack(), 2000);
    }
  };

  const handleCallAccepted = async ({ answer }) => {
    try {
      // Handle the answer from callee
      await webrtcService.handleAnswer(answer);

      // Navigate to active call
      navigation.replace('ActiveCall', {
        friend,
        isIncoming: false,
      });
    } catch (error) {
      console.error('Error handling answer:', error);
      navigation.goBack();
    }
  };

  const handleCallRejected = () => {
    setCallStatus('Call declined');
    setTimeout(() => navigation.goBack(), 2000);
  };

  const handleCallFailed = ({ reason }) => {
    setCallStatus(reason || 'Call failed');
    setTimeout(() => navigation.goBack(), 2000);
  };

  const handleEndCall = () => {
    webrtcService.endCall();
    socketService.endCall(friend.id);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerText}>
          Video Call
        </Text>
      </View>

      <View style={styles.calleeInfo}>
        <Avatar.Text
          size={120}
          label={friend.username.substring(0, 2).toUpperCase()}
          style={styles.avatar}
        />
        <Text variant="headlineMedium" style={styles.calleeName}>
          {friend.username}
        </Text>
        <Text variant="bodyLarge" style={styles.callStatus}>
          {callStatus}
        </Text>
      </View>

      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <IconButton
            icon="phone-hangup"
            iconColor="#fff"
            size={32}
            style={styles.endButton}
            onPress={handleEndCall}
          />
          <Text variant="bodyMedium" style={styles.actionLabel}>
            End Call
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 60,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
  },
  calleeInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    marginBottom: 24,
  },
  calleeName: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  callStatus: {
    color: '#aaa',
  },
  actions: {
    alignItems: 'center',
    paddingBottom: 80,
  },
  actionButton: {
    alignItems: 'center',
  },
  endButton: {
    backgroundColor: '#f44336',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  actionLabel: {
    color: '#fff',
    marginTop: 8,
  },
});

export default OutgoingCallScreen;