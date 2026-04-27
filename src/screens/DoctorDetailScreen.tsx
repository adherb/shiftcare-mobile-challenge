import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DoctorDetailScreen() {
  // TODO: Show doctor info, generate available slots, allow booking
  return (
    <View style={styles.container}>
      <Text>Doctor Detail Screen</Text>
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
