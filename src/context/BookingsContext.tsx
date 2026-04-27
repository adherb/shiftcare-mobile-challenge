import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { Booking, Slot } from '../types';
import { slotKey } from '../utils/slots';

const STORAGE_KEY = '@shiftcare/bookings';

// State

type State = {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
};

const initialState: State = {
  bookings: [],
  loading: true,
  error: null,
};

// Actions

type Action =
  | { type: 'HYDRATE_SUCCESS'; bookings: Booking[] }
  | { type: 'HYDRATE_FAILURE'; error: string }
  | { type: 'ADD_BOOKING'; booking: Booking }
  | { type: 'CANCEL_BOOKING'; bookingId: string }
  | { type: 'STORAGE_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' };

// Exported so it can be unit-tested without rendering a provider.
export function bookingsReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE_SUCCESS':
      return { ...state, bookings: action.bookings, loading: false, error: null };
    case 'HYDRATE_FAILURE':
      return { ...state, loading: false, error: action.error };
    case 'ADD_BOOKING':
      return { ...state, bookings: [...state.bookings, action.booking] };
    case 'CANCEL_BOOKING':
      return { ...state, bookings: state.bookings.filter((b) => b.id !== action.bookingId) };
    case 'STORAGE_ERROR':
      return { ...state, error: action.error };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// Context

type BookingsContextValue = State & {
  addBooking: (slot: Slot) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  isSlotBooked: (slot: Slot) => boolean;
};

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

// Provider

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingsReducer, initialState);

  // Hydrate bookings from AsyncStorage on mount.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        const bookings: Booking[] = Array.isArray(parsed) ? parsed : [];
        dispatch({ type: 'HYDRATE_SUCCESS', bookings });
      } catch (e) {
        dispatch({ type: 'HYDRATE_FAILURE', error: 'Failed to load saved bookings' });
      }
    })();
  }, []);

  // Persist bookings whenever they change.
  // Skip while loading so we don't overwrite saved data with the empty initial state.
  useEffect(() => {
    if (state.loading) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings)).catch(() => {
      dispatch({ type: 'STORAGE_ERROR', error: 'Failed to save bookings' });
    });
  }, [state.bookings, state.loading]);

  // Double-booking check lives here so screens don't need to know the rule.
  // Uses slotKey for identity rather than object reference equality since
  // two independently-created Slot objects for the same time should match.
  const isSlotBooked = (slot: Slot): boolean => {
    const key = slotKey(slot);
    return state.bookings.some((b) => slotKey(b) === key);
  };

  const addBooking = async (slot: Slot): Promise<void> => {
    if (isSlotBooked(slot)) {
      dispatch({ type: 'STORAGE_ERROR', error: 'Slot is already booked' });
      return;
    }

    const booking: Booking = {
      id: randomUUID(),
      doctorName: slot.doctorName,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      bookedAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_BOOKING', booking });
  };

  const cancelBooking = async (bookingId: string): Promise<void> => {
    dispatch({ type: 'CANCEL_BOOKING', bookingId });
  };

  return (
    <BookingsContext.Provider value={{ ...state, addBooking, cancelBooking, isSlotBooked }}>
      {children}
    </BookingsContext.Provider>
  );
}

export function useBookings(): BookingsContextValue {
  const context = useContext(BookingsContext);
  if (context === undefined) {
    throw new Error('useBookings must be used within a BookingsProvider');
  }
  return context;
}
