import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
} from 'react-native';
import {
  Text,
  IconButton,
  Avatar,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';
import webrtcService from '../services/webrtcService';

const IncomingCallScreen = ({ route, navigation }) => {
  const { caller, offer } = route.params;
  const { user } = useAuth();
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    // Listen for call rejected/ended by caller
    socketService.on('call_ended', handleCallEnded);

    return () => {
      socketService.off('call_ended', handleCallEnded);
    };
  }, []);

  const handleCallEnded = () => {
    navigation.goBack();
  };

  const handleAccept = async () => {
    try {
      // Accept the call and create answer
      const answer = await webrtcService.acceptCall(offer);

      // Send answer back to caller
      socketService.acceptCall(caller.id, answer);

      // Navigate to active call screen
      navigation.replace('ActiveCall', {
        friend: caller,
        isIncoming: true,
      });
    } catch (error) {
      console.error('Error accepting call:', error);
      navigation.goBack();
    }
  };

  const handleReject = () => {
    // Send rejection
    socketService.rejectCall(caller.id);

    // Go back
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerText}>
          Incoming Video Call
        </Text>
      </View>

      <View style={styles.callerInfo}>
        <Avatar.Text
          size={120}
          label={caller.username.substring(0, 2).toUpperCase()}
          style={styles.avatar}
        />
        <Text variant="headlineMedium" style={styles.callerName}>
          {caller.username}
        </Text>
        <Text variant="bodyLarge" style={styles.callerStatus}>
          Calling...
        </Text>
      </View>

      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <IconButton
            icon="phone-hangup"
            iconColor="#fff"
            size={32}
            style={styles.rejectButton}
            onPress={handleReject}
          />
          <Text variant="bodyMedium" style={styles.actionLabel}>
            Decline
          </Text>
        </View>

        <View style={styles.actionButton}>
          <IconButton
            icon="phone"
            iconColor="#fff"
            size={32}
            style={styles.acceptButton}
            onPress={handleAccept}
          />
          <Text variant="bodyMedium" style={styles.actionLabel}>
            Accept
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
  callerInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    marginBottom: 24,
  },
  callerName: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  callerStatus: {
    color: '#aaa',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 80,
    paddingHorizontal: 60,
  },
  actionButton: {
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#f44336',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  acceptButton: {
    backgroundColor: '#4caf50',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  actionLabel: {
    color: '#fff',
    marginTop: 8,
  },
});

export default IncomingCallScreen;