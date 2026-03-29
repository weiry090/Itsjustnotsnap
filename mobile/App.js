/**
 * Video Call & Chat App
 * React Native Android App
 */

import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { PaperProvider, DefaultTheme } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1976d2',
    accent: '#ff4081',
    background: '#f5f5f5',
  },
};

function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <StatusBar barStyle="light-content" backgroundColor="#1976d2" />
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}

export default App;