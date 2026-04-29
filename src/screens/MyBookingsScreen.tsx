import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useBookings } from '../context/BookingsContext';
import { Booking } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MyBookings'>;

// Duplicated from BookingConfirmationScreen. Worth extracting to a
// shared utility if a third caller appears.
function formatDateForDisplay(isoDate: string): string {
  // Parse manually to avoid UTC shift from new Date(isoString).
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatTimeForDisplay(time24: string): string {
  const [hourStr, minuteStr] = time24.split(':');
  const hour = Number(hourStr);
  const minute = minuteStr;
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${period}`;
}

// Both date and startTime are zero-padded so lexicographic comparison
// gives correct chronological order.
function sortBookings(bookings: Booking[]): Booking[] {
  return [...bookings].sort((a, b) => {
    const keyA = `${a.date}T${a.startTime}`;
    const keyB = `${b.date}T${b.startTime}`;
    return keyA.localeCompare(keyB);
  });
}

export default function MyBookingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { bookings, loading, cancelBooking } = useBookings();

  const sorted = useMemo(() => sortBookings(bookings), [bookings]);

  // Destructive style highlights the cancel action in red on iOS.
  const handleCancel = (booking: Booking) => {
    Alert.alert(
      'Cancel this booking?',
      `${booking.doctorName} on ${formatDateForDisplay(booking.date)} at ${formatTimeForDisplay(booking.startTime)}`,
      [
        { text: 'Keep booking', style: 'cancel' },
        { text: 'Cancel booking', style: 'destructive', onPress: () => cancelBooking(booking.id) },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No bookings yet.</Text>
        <Text style={styles.emptySubtitle}>
          Tap below to browse doctors and book your first appointment.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.browseButton, pressed && styles.browseButtonPressed]}
          onPress={() => navigation.navigate('DoctorsList')}
        >
          <Text style={styles.browseText}>Browse Doctors</Text>
        </Pressable>
      </View>
    );
  }

  const renderItem: ListRenderItem<Booking> = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.doctorName}>{item.doctorName}</Text>
        <Text style={styles.detail}>{formatDateForDisplay(item.date)}</Text>
        <Text style={styles.detail}>
          {formatTimeForDisplay(item.startTime)} - {formatTimeForDisplay(item.endTime)}
        </Text>
      </View>
      <Pressable style={styles.cancelButton} onPress={() => handleCancel(item)}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={sorted}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#c00',
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  browseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  browseButtonPressed: {
    opacity: 0.8,
  },
  browseText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
});
