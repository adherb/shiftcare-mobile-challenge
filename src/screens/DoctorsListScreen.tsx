import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import useDoctors from '../hooks/useDoctors';
import { Doctor } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DoctorsList'>;

export default function DoctorsListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { doctors, loading, error, refetch } = useDoctors();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading doctors...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (doctors.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No doctors available right now.</Text>
      </View>
    );
  }

  const renderItem: ListRenderItem<Doctor> = ({ item }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => navigation.navigate('DoctorDetail', { doctorName: item.name })}
    >
      <Text style={styles.doctorName}>{item.name}</Text>
      <Text style={styles.timezone}>{item.timezone}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={doctors}
        renderItem={renderItem}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
  },
  card: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 44,
    backgroundColor: '#fff',
  },
  cardPressed: {
    opacity: 0.6,
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  timezone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ddd',
    marginHorizontal: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
  errorText: {
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
  emptyText: {
    fontSize: 15,
    color: '#666',
  },
});
