import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  StyleSheet,
  ListRenderItem,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import useDoctors from '../hooks/useDoctors';
import { useBookings } from '../context/BookingsContext';
import { generateSlots, slotKey } from '../utils/slots';
import { Slot } from '../types';
import { formatTimeForDisplay, formatTimezone } from '../utils/format';
import LoadingState from '../components/LoadingState';
import Avatar from '../components/Avatar';

type RouteProps = RouteProp<RootStackParamList, 'DoctorDetail'>;
type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'DoctorDetail'>;

function formatDayLabel(date: Date): { weekday: string; day: string } {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const day = String(date.getDate());
  return { weekday, day };
}

export default function DoctorDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProps>();
  const { doctorName } = route.params;
  const { doctors, loading, error, refetch } = useDoctors();
  const { isSlotBooked } = useBookings();

  const [selectedDate, setSelectedDate] = useState(new Date());

  const nextSevenDays = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const doctor = doctors.find((d) => d.name === doctorName);

  // Avoids regenerating slot objects on every render.
  const slots = useMemo(
    () => (doctor ? generateSlots(doctor, selectedDate) : []),
    [doctor, selectedDate]
  );

  if (loading) {
    return <LoadingState message="Loading..." />;
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

  if (!doctor) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Doctor not found.</Text>
      </View>
    );
  }

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  // Header + day picker live in ListHeaderComponent so we avoid
  // nesting a FlatList inside a ScrollView (which triggers a
  // VirtualizedLists warning).
  const listHeader = (
    <View>
      <View style={styles.doctorHeader}>
        <Avatar size={48} />
        <View style={styles.doctorHeaderText}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.timezone}>{formatTimezone(doctor.timezone)}</Text>
        </View>
      </View>
      <Text style={styles.tzNote}>Times shown in the doctor's local timezone.</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayPickerContent}
      >
        {nextSevenDays.map((date) => {
          const selected = isSameDay(date, selectedDate);
          const { weekday, day } = formatDayLabel(date);
          return (
            <Pressable
              key={date.toISOString()}
              style={[styles.dayPill, selected && styles.dayPillSelected]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.dayPillWeekday, selected && styles.dayPillTextSelected]}>
                {weekday}
              </Text>
              <Text style={[styles.dayPillDay, selected && styles.dayPillTextSelected]}>
                {day}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  // Show disabled rather than hide so users understand the time
  // exists but is already taken.
  const renderSlot: ListRenderItem<Slot> = ({ item }) => {
    const booked = isSlotBooked(item);
    return (
      <Pressable
        style={[styles.slotCell, booked ? styles.slotBooked : styles.slotAvailable]}
        disabled={booked}
        onPress={() => navigation.navigate('BookingConfirmation', { slot: item })}
      >
        <Text style={[styles.slotText, booked && styles.slotTextBooked]}>
          {formatTimeForDisplay(item.startTime)}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={slots}
        renderItem={renderSlot}
        keyExtractor={(item) => slotKey(item)}
        numColumns={3}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={<Text style={styles.noSlots}>No availability this day.</Text>}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.slotRow}
      />
    </SafeAreaView>
  );
}

const SCREEN_PADDING = 16;
const COLUMN_GAP = 8;
const NUM_COLUMNS = 3;
const SLOT_WIDTH =
  (Dimensions.get('window').width - SCREEN_PADDING * 2 - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

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
  content: {
    padding: 16,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  doctorHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  timezone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tzNote: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
    marginBottom: 16,
  },
  dayPickerContent: {
    flexDirection: 'row',
    paddingVertical: 4,
    gap: 8,
    marginBottom: 20,
  },
  dayPill: {
    width: 64,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  dayPillSelected: {
    backgroundColor: '#007AFF',
  },
  dayPillWeekday: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  dayPillDay: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginTop: 2,
  },
  dayPillTextSelected: {
    color: '#fff',
  },
  noSlots: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 32,
  },
  slotRow: {
    gap: 8,
  },
  slotCell: {
    width: SLOT_WIDTH,
    minHeight: 44,
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotAvailable: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  slotBooked: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  slotText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
  },
  slotTextBooked: {
    color: '#999',
    textDecorationLine: 'line-through',
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
