import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  List,
  Avatar,
  Text,
  Badge,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { friendsAPI, messagesAPI } from '../services/api';
import socketService from '../services/socketService';

const ChatListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    loadConversations();
    
    // Listen for new messages
    socketService.on('receive_message', handleNewMessage);
    socketService.on('user_status', handleUserStatus);
    
    return () => {
      socketService.off('receive_message', handleNewMessage);
      socketService.off('user_status', handleUserStatus);
    };
  }, []);

  const handleUserStatus = (data) => {
    const { user_id, online } = data;
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      if (online) {
        newSet.add(user_id);
      } else {
        newSet.delete(user_id);
      }
      return newSet;
    });
  };

  const handleNewMessage = (message) => {
    // Update conversation list
    loadConversations();
    
    // Update unread count
    if (message.sender_id !== user.id) {
      setUnreadCounts(prev => ({
        ...prev,
        [message.sender_id]: (prev[message.sender_id] || 0) + 1,
      }));
    }
  };

  const loadConversations = async () => {
    try {
      // Get all friends
      const friendsResponse = await friendsAPI.getFriends();
      const acceptedFriends = friendsResponse.data.filter(
        f => f.status === 'accepted'
      );
      
      // Get last message for each friend
      const conversationsWithMessages = await Promise.all(
        acceptedFriends.map(async (friendship) => {
          const friend = friendship.friend;
          try {
            const messagesResponse = await messagesAPI.getMessages(friend.id, 1);
            const lastMessage = messagesResponse.data[0];
            
            return {
              friend,
              lastMessage,
              timestamp: lastMessage?.timestamp || friendship.created_at,
            };
          } catch (err) {
            return {
              friend,
              lastMessage: null,
              timestamp: friendship.created_at,
            };
          }
        })
      );
      
      // Sort by most recent
      conversationsWithMessages.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      setConversations(conversationsWithMessages);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderConversation = ({ item }) => {
    const { friend, lastMessage } = item;
    const isOnline = onlineUsers.has(friend.id);
    const unreadCount = unreadCounts[friend.id] || 0;
    
    let description = 'No messages yet';
    if (lastMessage) {
      if (lastMessage.message_type === 'text') {
        description = lastMessage.content;
      } else if (lastMessage.message_type === 'image') {
        description = '📷 Photo';
      } else if (lastMessage.message_type === 'video') {
        description = '🎥 Video';
      } else {
        description = '📎 File';
      }
      
      if (lastMessage.sender_id === user.id) {
        description = 'You: ' + description;
      }
    }
    
    return (
      <View>
        <List.Item
          title={friend.username}
          description={description}
          descriptionNumberOfLines={1}
          left={() => (
            <View>
              <Avatar.Text
                size={48}
                label={friend.username.substring(0, 2).toUpperCase()}
                style={styles.avatar}
              />
              {isOnline && (
                <Badge
                  size={12}
                  style={styles.onlineBadge}
                />
              )}
            </View>
          )}
          right={() => (
            <View style={styles.rightContainer}>
              <Text variant="bodySmall" style={styles.timestamp}>
                {formatTimestamp(item.timestamp)}
              </Text>
              {unreadCount > 0 && (
                <Badge size={20} style={styles.unreadBadge}>
                  {unreadCount}
                </Badge>
              )}
            </View>
          )}
          onPress={() => {
            // Clear unread count
            setUnreadCounts(prev => ({ ...prev, [friend.id]: 0 }));
            navigation.navigate('ChatRoom', { friend });
          }}
        />
        <Divider />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {conversations.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyText}>
            No conversations yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Add friends and start chatting!
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.friend.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  avatar: {
    marginLeft: 8,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4caf50',
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 8,
  },
  timestamp: {
    color: '#999',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#1976d2',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginBottom: 8,
    color: '#666',
  },
  emptySubtext: {
    color: '#999',
  },
});

export default ChatListScreen;