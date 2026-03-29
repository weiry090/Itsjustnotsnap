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
  IconButton,
  Divider,
  Chip,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { callsAPI, friendsAPI } from '../services/api';

const CallHistoryScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [friendsMap, setFriendsMap] = useState({});

  useEffect(() => {
    loadCallHistory();
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const response = await friendsAPI.getFriends();
      const map = {};
      response.data.forEach(friendship => {
        map[friendship.friend.id] = friendship.friend;
      });
      setFriendsMap(map);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const loadCallHistory = async () => {
    try {
      const response = await callsAPI.getHistory(50);
      setCalls(response.data);
    } catch (error) {
      console.error('Failed to load call history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCallHistory();
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatTimestamp = (timestamp) => {
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
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCallBack = (friend) => {
    if (friend) {
      navigation.navigate('FriendsTab', {
        screen: 'OutgoingCall',
        params: { friend },
      });
    }
  };

  const renderCall = ({ item }) => {
    const isIncoming = item.callee_id === user.id;
    const friendId = isIncoming ? item.caller_id : item.callee_id;
    const friend = friendsMap[friendId];

    if (!friend) {
      return null; // Skip if friend not found
    }

    const callTypeIcon = item.call_type === 'video' ? 'video' : 'phone';
    const callDirectionIcon = isIncoming ? 'phone-incoming' : 'phone-outgoing';

    return (
      <View>
        <List.Item
          title={friend.username}
          description={
            <View style={styles.callInfo}>
              <View style={styles.callMeta}>
                <Chip
                  icon={callDirectionIcon}
                  style={styles.directionChip}
                  textStyle={styles.chipText}
                >
                  {isIncoming ? 'Incoming' : 'Outgoing'}
                </Chip>
                <Text variant="bodySmall" style={styles.duration}>
                  {formatDuration(item.duration)}
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.timestamp}>
                {formatTimestamp(item.timestamp)}
              </Text>
            </View>
          }
          left={() => (
            <Avatar.Text
              size={48}
              label={friend.username.substring(0, 2).toUpperCase()}
              style={styles.avatar}
            />
          )}
          right={() => (
            <View style={styles.actions}>
              <IconButton
                icon={callTypeIcon}
                size={24}
                onPress={() => handleCallBack(friend)}
              />
            </View>
          )}
        />
        <Divider />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {calls.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyText}>
            No call history
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Your call history will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={calls}
          renderItem={renderCall}
          keyExtractor={(item) => item._id}
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
  callInfo: {
    marginTop: 4,
  },
  callMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  directionChip: {
    height: 24,
    marginRight: 8,
  },
  chipText: {
    fontSize: 11,
    marginVertical: 0,
  },
  duration: {
    color: '#666',
  },
  timestamp: {
    color: '#999',
  },
  actions: {
    justifyContent: 'center',
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
    textAlign: 'center',
  },
});

export default CallHistoryScreen;
