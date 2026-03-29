import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL } from '../config/constants';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  async connect() {
    if (this.socket && this.connected) {
      return;
    }

    const token = await AsyncStorage.getItem('authToken');
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connected = true;
      this.authenticate();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  async authenticate() {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      this.emit('authenticate', { user_id: user.id });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Chat methods
  sendMessage(message) {
    this.emit('send_message', { message });
  }

  sendTyping(receiverId, senderId, isTyping) {
    this.emit('typing', {
      receiver_id: receiverId,
      sender_id: senderId,
      is_typing: isTyping,
    });
  }

  sendMessageRead(senderId, messageId) {
    this.emit('message_read', {
      sender_id: senderId,
      message_id: messageId,
    });
  }

  // WebRTC signaling methods
  callUser(calleeId, callerId, callerName, offer, callType = 'video') {
    this.emit('call_user', {
      callee_id: calleeId,
      caller_id: callerId,
      caller_name: callerName,
      offer,
      call_type: callType,
    });
  }

  acceptCall(callerId, answer) {
    this.emit('call_accepted', {
      caller_id: callerId,
      answer,
    });
  }

  rejectCall(callerId) {
    this.emit('call_rejected', {
      caller_id: callerId,
    });
  }

  sendIceCandidate(targetId, candidate) {
    this.emit('ice_candidate', {
      target_id: targetId,
      candidate,
    });
  }

  endCall(targetId) {
    this.emit('end_call', {
      target_id: targetId,
    });
  }
}

export default new SocketService();
