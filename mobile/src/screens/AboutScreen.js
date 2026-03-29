import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Text, List, Divider, Button } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

const AboutScreen = ({ navigation }) => {
  const { user } = useAuth();

  const openGitHub = () => {
    Linking.openURL('https://github.com/emergent-ai');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.appName}>
          Video Call App
        </Text>
        <Text variant="bodyLarge" style={styles.version}>
          Version 1.0.0
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Connect with friends through video calls and chat
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Features
        </Text>
        <List.Item
          title="Video Calling"
          description="High-quality peer-to-peer video calls"
          left={(props) => <List.Icon {...props} icon="video" />}
        />
        <List.Item
          title="Real-time Chat"
          description="Instant messaging with media sharing"
          left={(props) => <List.Icon {...props} icon="message" />}
        />
        <List.Item
          title="Camera Filters"
          description="13 filters for photos and videos"
          left={(props) => <List.Icon {...props} icon="image-filter" />}
        />
        <List.Item
          title="Friend Management"
          description="Add and manage your contacts"
          left={(props) => <List.Icon {...props} icon="account-group" />}
        />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Technology
        </Text>
        <List.Item
          title="React Native"
          description="Cross-platform mobile framework"
        />
        <List.Item
          title="WebRTC"
          description="Peer-to-peer video calling"
        />
        <List.Item
          title="Socket.IO"
          description="Real-time communication"
        />
        <List.Item
          title="FastAPI & MongoDB"
          description="Backend infrastructure"
        />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          User Information
        </Text>
        <List.Item
          title="Username"
          description={user?.username}
          left={(props) => <List.Icon {...props} icon="account" />}
        />
        <List.Item
          title="Email"
          description={user?.email}
          left={(props) => <List.Icon {...props} icon="email" />}
        />
        <List.Item
          title="Account Created"
          description={new Date(user?.created_at).toLocaleDateString()}
          left={(props) => <List.Icon {...props} icon="calendar" />}
        />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          About
        </Text>
        <Text variant="bodyMedium" style={styles.aboutText}>
          This app was built as a demonstration of modern mobile app development
          using React Native, WebRTC, and real-time communication technologies.
        </Text>
        <Text variant="bodyMedium" style={styles.aboutText}>
          It showcases features like video calling, instant messaging, camera
          filters, and peer-to-peer connectivity.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={openGitHub}
          icon="github"
          style={styles.button}
        >
          View on GitHub
        </Button>
        <Text variant="bodySmall" style={styles.copyright}>
          © 2026 Video Call App. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#1976d2',
  },
  appName: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  version: {
    color: '#e3f2fd',
    marginBottom: 8,
  },
  subtitle: {
    color: '#e3f2fd',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    paddingVertical: 16,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontWeight: 'bold',
  },
  divider: {
    height: 8,
    backgroundColor: '#e0e0e0',
  },
  aboutText: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#666',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  button: {
    marginBottom: 16,
  },
  copyright: {
    color: '#999',
    textAlign: 'center',
  },
});

export default AboutScreen;
