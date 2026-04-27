import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MyBookingsScreen() {
  // TODO: List all bookings from context/storage, allow cancellation
  return (
    <View style={styles.container}>
      <Text>My Bookings Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
