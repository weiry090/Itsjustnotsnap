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
  IconButton,
  Text,
  FAB,
  Divider,
  Snackbar,
  Badge,
  Button,
  Chip,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { friendsAPI } from '../services/api';
import socketService from '../services/socketService';

const FriendsListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    loadFriends();
    
    // Listen for user status updates
    socketService.on('user_status', handleUserStatus);
    
    return () => {
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

  const loadFriends = async () => {
    try {
      const response = await friendsAPI.getFriends();
      const allFriendships = response.data;
      
      // Separate accepted friends and pending requests
      const accepted = allFriendships.filter(f => 
        f.status === 'accepted'
      );
      
      const pending = allFriendships.filter(f => 
        f.status === 'pending' && f.friend_id === user.id
      );
      
      setFriends(accepted);
      setPendingRequests(pending);
    } catch (err) {
      setError('Failed to load friends');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await friendsAPI.acceptRequest(friendshipId);
      loadFriends();
    } catch (err) {
      setError('Failed to accept request');
    }
  };

  const handleRejectRequest = async (friendshipId) => {
    try {
      await friendsAPI.rejectRequest(friendshipId);
      loadFriends();
    } catch (err) {
      setError('Failed to reject request');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await friendsAPI.removeFriend(friendId);
      loadFriends();
    } catch (err) {
      setError('Failed to remove friend');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFriends();
  };

  const renderPendingRequest = ({ item }) => {
    const friend = item.friend;
    return (
      <View>
        <List.Item
          title={friend.username}
          description={friend.email}
          left={() => (
            <Avatar.Text
              size={48}
              label={friend.username.substring(0, 2).toUpperCase()}
              style={styles.avatar}
            />
          )}
          right={() => (
            <View style={styles.requestActions}>
              <IconButton
                icon="check"
                mode="contained"
                iconColor="#fff"
                containerColor="#4caf50"
                size={20}
                onPress={() => handleAcceptRequest(item.id)}
              />
              <IconButton
                icon="close"
                mode="contained"
                iconColor="#fff"
                containerColor="#f44336"
                size={20}
                onPress={() => handleRejectRequest(item.id)}
              />
            </View>
          )}
        />
        <Divider />
      </View>
    );
  };

  const renderFriend = ({ item }) => {
    const friend = item.friend;
    const isOnline = onlineUsers.has(friend.id);
    
    return (
      <View>
        <List.Item
          title={friend.username}
          description={
            <View style={styles.statusRow}>
              <Text variant="bodySmall" style={{ color: isOnline ? '#4caf50' : '#999' }}>
                {isOnline ? '● Online' : '○ Offline'}
              </Text>
            </View>
          }
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
            <View style={styles.friendActions}>
              <IconButton
                icon="message"
                mode="contained-tonal"
                size={20}
                onPress={() => navigation.navigate('ChatRoom', { friend })}
              />
              <IconButton
                icon="phone"
                mode="contained-tonal"
                size={20}
                onPress={() => {
                  navigation.navigate('OutgoingCall', { friend });
                }}
              />
            </View>
          )}
          onPress={() => navigation.navigate('ChatRoom', { friend })}
        />
        <Divider />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {pendingRequests.length > 0 && (
        <View style={styles.pendingSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Friend Requests ({pendingRequests.length})
          </Text>
          <FlatList
            data={pendingRequests}
            renderItem={renderPendingRequest}
            keyExtractor={(item) => item.id}
          />
          <Divider style={styles.divider} />
        </View>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Friends ({friends.length})
      </Text>

      {friends.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            No friends yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Tap the + button to add friends
          </Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddFriend')}
      />

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
      >
        {error}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  pendingSection: {
    backgroundColor: '#fff3cd',
  },
  sectionTitle: {
    padding: 16,
    fontWeight: 'bold',
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
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
  divider: {
    height: 8,
    backgroundColor: '#e0e0e0',
  },
});

export default FriendsListScreen;