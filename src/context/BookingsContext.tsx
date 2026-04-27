import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Booking } from '../types';

interface BookingsContextValue {
  bookings: Booking[];
  // TODO: Add functions for addBooking, removeBooking, loadBookings
}

const BookingsContext = createContext<BookingsContextValue | undefined>(
  undefined
);

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [bookings] = useState<Booking[]>([]);

  // TODO: Implement addBooking, removeBooking
  // TODO: Persist bookings with AsyncStorage
  // TODO: Load bookings on mount

  return (
    <BookingsContext.Provider value={{ bookings }}>
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
