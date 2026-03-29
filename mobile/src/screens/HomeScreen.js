import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

const HomeScreen = () => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.welcome}>
        Welcome, {user?.username}!
      </Text>
      <Text variant="bodyLarge" style={styles.email}>
        {user?.email}
      </Text>
      
      <View style={styles.info}>
        <Text variant="titleMedium" style={styles.infoTitle}>
          🎉 Phase 1 Complete!
        </Text>
        <Text variant="bodyMedium" style={styles.infoText}>
          ✅ User authentication working{`\n`}
          ✅ Backend API connected{`\n`}
          ✅ Socket.IO ready{`\n`}
          {`\n`}
          Next: Friend system & Chat coming soon...
        </Text>
      </View>

      <Button
        mode="contained"
        onPress={logout}
        style={styles.button}
        icon="logout"
      >
        Logout
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  welcome: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  email: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  info: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
    elevation: 2,
  },
  infoTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  infoText: {
    lineHeight: 24,
    color: '#444',
  },
  button: {
    paddingVertical: 6,
  },
});

export default HomeScreen;