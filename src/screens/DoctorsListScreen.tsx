import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import useDoctors from '../hooks/useDoctors';
import { Ionicons } from '@expo/vector-icons';
import { Doctor } from '../types';
import { formatTimezone } from '../utils/format';
import LoadingState from '../components/LoadingState';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DoctorsList'>;

const AVATAR_COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5856D6'];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function DoctorsListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { doctors, loading, error, refetch } = useDoctors();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('MyBookings')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.headerLink}>My bookings</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  if (loading) {
    return <LoadingState message="Loading doctors..." />;
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
      <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.name) }]}>
        <Ionicons name="person" size={20} color="#fff" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.doctorName}>{item.name}</Text>
        <Text style={styles.timezone}>{formatTimezone(item.timezone)}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
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
  headerLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 44,
    backgroundColor: '#fff',
  },
  cardPressed: {
    opacity: 0.6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
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
  chevron: {
    fontSize: 22,
    color: '#ccc',
    marginLeft: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ddd',
    marginHorizontal: 16,
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
