import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DoctorsListScreen() {
  // TODO: Fetch doctors from API, display as a list, navigate to DoctorDetailScreen on tap
  return (
    <View style={styles.container}>
      <Text>Doctors List Screen</Text>
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
