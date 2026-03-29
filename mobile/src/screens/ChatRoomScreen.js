import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  TextInput,
  IconButton,
  Text,
  Avatar,
  Snackbar,
  ActivityIndicator,
  Menu,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { messagesAPI } from '../services/api';
import socketService from '../services/socketService';
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';

const ChatRoomScreen = ({ route, navigation }) => {
  const { friend } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [typing, setTyping] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Set header
    navigation.setOptions({
      title: friend.username,
    });

    loadMessages();

    // Socket listeners
    socketService.on('receive_message', handleReceiveMessage);
    socketService.on('user_typing', handleTyping);
    socketService.on('message_sent', handleMessageSent);

    return () => {
      socketService.off('receive_message', handleReceiveMessage);
      socketService.off('user_typing', handleTyping);
      socketService.off('message_sent', handleMessageSent);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const loadMessages = async () => {
    try {
      const response = await messagesAPI.getMessages(friend.id);
      setMessages(response.data);
      
      // Mark messages as read
      const unreadMessages = response.data.filter(
        msg => msg.receiver_id === user.id && !msg.read
      );
      for (const msg of unreadMessages) {
        await messagesAPI.markAsRead(msg.id);
        socketService.sendMessageRead(msg.sender_id, msg.id);
      }
    } catch (err) {
      setError('Failed to load messages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveMessage = (message) => {
    if (message.sender_id === friend.id || message.receiver_id === friend.id) {
      setMessages(prev => [...prev, message]);
      
      // Mark as read if it's from the friend
      if (message.sender_id === friend.id) {
        messagesAPI.markAsRead(message.id);
        socketService.sendMessageRead(friend.id, message.id);
      }
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleMessageSent = (data) => {
    if (data.success) {
      setSending(false);
    }
  };

  const handleTyping = (data) => {
    if (data.sender_id === friend.id) {
      setTyping(data.is_typing);
    }
  };

  const handleInputChange = (text) => {
    setInputText(text);
    
    // Send typing indicator
    socketService.sendTyping(friend.id, user.id, true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(friend.id, user.id, false);
    }, 2000);
  };

  const sendMessage = async (content, messageType = 'text', mediaUrl = null) => {
    if (!content && !mediaUrl) return;

    setSending(true);

    try {
      const messageData = {
        receiver_id: friend.id,
        content,
        message_type: messageType,
        media_url: mediaUrl,
      };

      const response = await messagesAPI.sendMessage(messageData);
      const newMessage = response.data;

      // Add to local messages
      setMessages(prev => [...prev, newMessage]);

      // Send via socket
      socketService.sendMessage({
        receiver_id: friend.id,
        message: newMessage,
      });

      // Clear input
      setInputText('');

      // Stop typing indicator
      socketService.sendTyping(friend.id, user.id, false);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleSendText = () => {
    if (inputText.trim()) {
      sendMessage(inputText.trim(), 'text');
    }
  };

  const handleImagePicker = async () => {
    setMenuVisible(false);
    
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel) return;

      const asset = result.assets[0];
      await uploadAndSendMedia(asset, 'image');
    } catch (err) {
      setError('Failed to pick image');
      console.error(err);
    }
  };

  const handleVideoPicker = async () => {
    setMenuVisible(false);
    
    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
      });

      if (result.didCancel) return;

      const asset = result.assets[0];
      await uploadAndSendMedia(asset, 'video');
    } catch (err) {
      setError('Failed to pick video');
      console.error(err);
    }
  };

  const handleDocumentPicker = async () => {
    setMenuVisible(false);
    
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      const file = result[0];
      await uploadAndSendMedia(file, 'file');
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        setError('Failed to pick document');
        console.error(err);
      }
    }
  };

  const uploadAndSendMedia = async (file, type) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type || 'application/octet-stream',
        name: file.fileName || file.name || 'file',
      });

      const uploadResponse = await messagesAPI.uploadMedia(formData);
      const mediaUrl = uploadResponse.data.media_url;

      // Send message with media
      await sendMessage(file.fileName || file.name || 'Media', type, mediaUrl);
    } catch (err) {
      setError('Failed to upload media');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === user.id;
    const time = new Date(item.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.theirMessage,
        ]}
      >
        {!isMyMessage && (
          <Avatar.Text
            size={32}
            label={friend.username.substring(0, 2).toUpperCase()}
            style={styles.messageAvatar}
          />
        )}

        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          ]}
        >
          {item.message_type === 'text' && (
            <Text style={isMyMessage ? styles.myMessageText : styles.theirMessageText}>
              {item.content}
            </Text>
          )}

          {item.message_type === 'image' && item.media_url && (
            <TouchableOpacity onPress={() => Linking.openURL(item.media_url)}>
              <Image
                source={{ uri: item.media_url }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}

          {item.message_type === 'video' && (
            <View style={styles.mediaPlaceholder}>
              <Text style={isMyMessage ? styles.myMessageText : styles.theirMessageText}>
                🎥 {item.content}
              </Text>
            </View>
          )}

          {item.message_type === 'file' && (
            <View style={styles.mediaPlaceholder}>
              <Text style={isMyMessage ? styles.myMessageText : styles.theirMessageText}>
                📎 {item.content}
              </Text>
            </View>
          )}

          <Text
            style={[
              styles.timestamp,
              isMyMessage ? styles.myTimestamp : styles.theirTimestamp,
            ]}
          >
            {time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            onLayout={() => flatListRef.current?.scrollToEnd()}
          />

          {typing && (
            <View style={styles.typingIndicator}>
              <Text variant="bodySmall" style={styles.typingText}>
                {friend.username} is typing...
              </Text>
            </View>
          )}

          {uploading && (
            <View style={styles.uploadingIndicator}>
              <ActivityIndicator size="small" />
              <Text variant="bodySmall" style={styles.uploadingText}>
                Uploading...
              </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="plus"
                  size={24}
                  onPress={() => setMenuVisible(true)}
                  disabled={sending || uploading}
                />
              }
            >
              <Menu.Item
                onPress={handleImagePicker}
                title="Photo"
                leadingIcon="image"
              />
              <Menu.Item
                onPress={handleVideoPicker}
                title="Video"
                leadingIcon="video"
              />
              <Menu.Item
                onPress={handleDocumentPicker}
                title="Document"
                leadingIcon="file"
              />
            </Menu>

            <TextInput
              mode="outlined"
              placeholder="Type a message..."
              value={inputText}
              onChangeText={handleInputChange}
              style={styles.input}
              disabled={sending || uploading}
              multiline
              maxLength={1000}
            />

            <IconButton
              icon="send"
              size={24}
              onPress={handleSendText}
              disabled={!inputText.trim() || sending || uploading}
              loading={sending}
            />
          </View>
        </>
      )}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  theirMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: '#1976d2',
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  myTimestamp: {
    color: '#e3f2fd',
    textAlign: 'right',
  },
  theirTimestamp: {
    color: '#999',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  mediaPlaceholder: {
    padding: 8,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  typingText: {
    color: '#666',
    fontStyle: 'italic',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  uploadingText: {
    marginLeft: 8,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    maxHeight: 100,
  },
});

export default ChatRoomScreen;
