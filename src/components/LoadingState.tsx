import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

type Props = {
  message: string;
};

export default function LoadingState({ message }: Props) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  message: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
});
