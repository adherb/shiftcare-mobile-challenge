import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BookingsProvider } from './src/context/BookingsContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <BookingsProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </BookingsProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
