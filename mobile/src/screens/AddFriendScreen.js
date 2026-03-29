import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Searchbar,
  List,
  Avatar,
  Button,
  Text,
  Snackbar,
  ActivityIndicator,
} from 'react-native-paper';
import { friendsAPI } from '../services/api';

const AddFriendScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sentRequests, setSentRequests] = useState(new Set());

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await friendsAPI.searchUsers(query.trim());
      setSearchResults(response.data);
    } catch (err) {
      setError('Search failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (friendEmail, userId) => {
    try {
      await friendsAPI.sendRequest(friendEmail);
      setSentRequests(prev => new Set([...prev, userId]));
      setSuccess(`Friend request sent to ${friendEmail}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send request');
    }
  };

  const renderUser = ({ item }) => {
    const requestSent = sentRequests.has(item.id);
    
    return (
      <List.Item
        title={item.username}
        description={item.email}
        left={() => (
          <Avatar.Text
            size={48}
            label={item.username.substring(0, 2).toUpperCase()}
            style={styles.avatar}
          />
        )}
        right={() => (
          <Button
            mode={requestSent ? 'outlined' : 'contained'}
            onPress={() => handleSendRequest(item.email, item.id)}
            disabled={requestSent}
            style={styles.addButton}
          >
            {requestSent ? 'Sent' : 'Add'}
          </Button>
        )}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by username or email"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      )}

      {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            No users found
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Try searching with a different username or email
          </Text>
        </View>
      )}

      {!loading && searchQuery.length < 2 && (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            Search for friends
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Enter at least 2 characters to search
          </Text>
        </View>
      )}

      {!loading && searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      )}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
        style={styles.errorSnackbar}
      >
        {error}
      </Snackbar>

      <Snackbar
        visible={!!success}
        onDismiss={() => setSuccess('')}
        duration={3000}
        style={styles.successSnackbar}
      >
        {success}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchbar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  list: {
    flex: 1,
  },
  avatar: {
    marginLeft: 8,
  },
  addButton: {
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  errorSnackbar: {
    backgroundColor: '#d32f2f',
  },
  successSnackbar: {
    backgroundColor: '#4caf50',
  },
});

export default AddFriendScreen;