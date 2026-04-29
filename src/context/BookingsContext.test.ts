import { bookingsReducer } from './BookingsContext';
import { Booking } from '../types';

const emptyState = {
  bookings: [],
  loading: true,
  error: null,
};

function buildBooking(overrides?: Partial<Booking>): Booking {
  return {
    id: 'booking-1',
    doctorName: 'Dr. Test',
    date: '2026-04-28',
    startTime: '09:00',
    endTime: '09:30',
    bookedAt: '2026-04-28T00:00:00.000Z',
    ...overrides,
  };
}

// bookingsReducer
describe('bookingsReducer', () => {
  it('sets bookings and clears loading on HYDRATE_SUCCESS', () => {
    const bookings = [buildBooking()];
    const result = bookingsReducer(emptyState, { type: 'HYDRATE_SUCCESS', bookings });
    expect(result.bookings).toEqual(bookings);
    expect(result.loading).toBe(false);
    expect(result.error).toBeNull();
  });

  it('sets error and clears loading on HYDRATE_FAILURE', () => {
    const result = bookingsReducer(emptyState, { type: 'HYDRATE_FAILURE', error: 'fail' });
    expect(result.loading).toBe(false);
    expect(result.error).toBe('fail');
  });

  it('appends a booking on ADD_BOOKING', () => {
    const state = { ...emptyState, loading: false, bookings: [buildBooking()] };
    const newBooking = buildBooking({ id: 'booking-2', startTime: '10:00', endTime: '10:30' });
    const result = bookingsReducer(state, { type: 'ADD_BOOKING', booking: newBooking });
    expect(result.bookings).toHaveLength(2);
    expect(result.bookings[1]).toEqual(newBooking);
  });

  it('does not mutate the original bookings array on ADD_BOOKING', () => {
    const original = [buildBooking()];
    const state = { ...emptyState, loading: false, bookings: original };
    bookingsReducer(state, { type: 'ADD_BOOKING', booking: buildBooking({ id: 'booking-2' }) });
    expect(original).toHaveLength(1);
  });

  it('removes the correct booking on CANCEL_BOOKING', () => {
    const state = {
      ...emptyState,
      loading: false,
      bookings: [
        buildBooking({ id: 'keep' }),
        buildBooking({ id: 'remove' }),
      ],
    };
    const result = bookingsReducer(state, { type: 'CANCEL_BOOKING', bookingId: 'remove' });
    expect(result.bookings).toHaveLength(1);
    expect(result.bookings[0].id).toBe('keep');
  });

  it('returns unchanged state when cancelling a non-existent booking', () => {
    const state = { ...emptyState, loading: false, bookings: [buildBooking()] };
    const result = bookingsReducer(state, { type: 'CANCEL_BOOKING', bookingId: 'nope' });
    expect(result.bookings).toHaveLength(1);
  });

  it('sets error on STORAGE_ERROR', () => {
    const state = { ...emptyState, loading: false };
    const result = bookingsReducer(state, { type: 'STORAGE_ERROR', error: 'disk full' });
    expect(result.error).toBe('disk full');
  });

  it('clears error on CLEAR_ERROR', () => {
    const state = { ...emptyState, loading: false, error: 'something broke' };
    const result = bookingsReducer(state, { type: 'CLEAR_ERROR' });
    expect(result.error).toBeNull();
  });

  it('returns state unchanged for unknown action', () => {
    const state = { ...emptyState, loading: false };
    // @ts-expect-error testing unknown action type
    const result = bookingsReducer(state, { type: 'UNKNOWN' });
    expect(result).toBe(state);
  });

  it('preserves existing bookings when HYDRATE_FAILURE occurs', () => {
    const state = { ...emptyState, bookings: [buildBooking()] };
    const result = bookingsReducer(state, { type: 'HYDRATE_FAILURE', error: 'fail' });
    expect(result.bookings).toHaveLength(1);
  });

  it('clears previous error on HYDRATE_SUCCESS', () => {
    const state = { ...emptyState, error: 'old error' };
    const result = bookingsReducer(state, { type: 'HYDRATE_SUCCESS', bookings: [] });
    expect(result.error).toBeNull();
  });
});
