import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type Props = {
  message: string;
  onRetry: () => void;
};

export default function ErrorState({ message, onRetry }: Props) {
  return (
    <View style={styles.centered}>
      <Text style={styles.message}>{message}</Text>
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
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
    fontSize: 15,
    color: '#c00',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
