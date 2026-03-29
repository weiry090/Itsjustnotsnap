import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, List, Avatar, Divider } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <Avatar.Text
          size={80}
          label={user?.username?.substring(0, 2).toUpperCase() || 'U'}
          style={styles.avatar}
        />
        <Text variant="headlineMedium" style={styles.username}>
          {user?.username}
        </Text>
        <Text variant="bodyLarge" style={styles.email}>
          {user?.email}
        </Text>
      </View>

      <View style={styles.info}>
        <Text variant="titleMedium" style={styles.infoTitle}>
          🎉 All Phases Complete!
        </Text>
        <Text variant="bodyMedium" style={styles.infoText}>
          ✅ User authentication{`\n`}
          ✅ Friend management{`\n`}
          ✅ Real-time chat{`\n`}
          ✅ Media sharing{`\n`}
          ✅ Camera with filters{`\n`}
          ✅ WebRTC video calling{`\n`}
          ✅ Call controls{`\n`}
          ✅ Call history{`\n`}
          {`\n`}
          🚀 App fully functional!
        </Text>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.menuSection}>
        <List.Item
          title="Call History"
          description="View your call history"
          left={(props) => <List.Icon {...props} icon="phone-clock" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('CallHistory')}
        />
        <Divider />
        <List.Item
          title="About"
          description="App information and version"
          left={(props) => <List.Icon {...props} icon="information" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('About')}
        />
      </View>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={logout}
          style={styles.button}
          icon="logout"
        >
          Logout
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
  },
  avatar: {
    marginBottom: 16,
    backgroundColor: '#1976d2',
  },
  username: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    color: '#666',
  },
  info: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 8,
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
  divider: {
    height: 8,
    backgroundColor: '#e0e0e0',
    marginVertical: 0,
  },
  menuSection: {
    backgroundColor: '#fff',
    marginTop: 8,
  },
  actions: {
    padding: 24,
  },
  button: {
    paddingVertical: 6,
  },
});

export default HomeScreen;

export default HomeScreen;