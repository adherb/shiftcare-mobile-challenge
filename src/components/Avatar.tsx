import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  size: number;
};

export default function Avatar({ size }: Props) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name="person" size={size * 0.45} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
