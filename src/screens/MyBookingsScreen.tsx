import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ListRenderItem,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useBookings } from '../context/BookingsContext';
import { Booking } from '../types';
import { formatDateForDisplay, formatTimeForDisplay } from '../utils/format';
import LoadingState from '../components/LoadingState';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MyBookings'>;

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
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            cancelBooking(booking.id);
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingState message="Loading your bookings..." />;
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
          onPress={() => navigation.dispatch(CommonActions.reset({
            index: 0,
            routes: [{ name: 'DoctorsList' }],
          }))}
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: '#fde8e8',
    borderRadius: 20,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#c00',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ddd',
    marginHorizontal: 16,
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
