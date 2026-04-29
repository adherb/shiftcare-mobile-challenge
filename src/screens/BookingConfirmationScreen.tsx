import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useBookings } from '../context/BookingsContext';
import useDoctors from '../hooks/useDoctors';

type RouteProps = RouteProp<RootStackParamList, 'BookingConfirmation'>;
type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'BookingConfirmation'>;

// Parse manually to avoid UTC shift from new Date(isoString).
function formatDateForDisplay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatTimezone(tz: string): string {
  const parts = tz.split('/');
  const city = parts[parts.length - 1].replace(/_/g, ' ');
  const country = parts[0];
  return `${city}, ${country}`;
}

function formatTimeForDisplay(time24: string): string {
  const [hourStr, minuteStr] = time24.split(':');
  const hour = Number(hourStr);
  const minute = minuteStr;
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${period}`;
}

export default function BookingConfirmationScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProps>();
  const { slot } = route.params;
  const { addBooking } = useBookings();
  const { doctors } = useDoctors();
  const doctor = doctors.find((d) => d.name === slot.doctorName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    const result = await addBooking(slot);

    if (!result.success) {
      setError(result.error ?? 'Booking failed');
      setBusy(false);
      return;
    }

    // Reset stack so "back" from MyBookings goes to DoctorsList
    // rather than returning to this confirmation screen.
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'DoctorsList' },
          { name: 'MyBookings' },
        ],
      })
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.heading}>Confirm Your Booking</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Doctor</Text>
            <Text style={styles.value}>{slot.doctorName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{formatDateForDisplay(slot.date)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>
              {formatTimeForDisplay(slot.startTime)} - {formatTimeForDisplay(slot.endTime)}
            </Text>
          </View>
          {doctor && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>Timezone</Text>
                <Text style={styles.value}>{formatTimezone(doctor.timezone)}</Text>
              </View>
            </>
          )}
        </View>

        <Text style={styles.tzNote}>Times shown in the doctor's local timezone.</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.confirmButton, pressed && styles.confirmButtonPressed]}
          onPress={handleConfirm}
          disabled={busy}
        >
          <Text style={styles.confirmText}>{busy ? 'Booking...' : 'Confirm Booking'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 15,
    color: '#666',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ddd',
  },
  tzNote: {
    fontSize: 13,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#c00',
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonPressed: {
    opacity: 0.8,
  },
  confirmText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
});
