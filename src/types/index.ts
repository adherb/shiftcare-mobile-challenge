// Matches the raw shape returned by the API
export interface ScheduleEntry {
  name: string;
  timezone: string;
  day_of_week: string;
  available_at: string;
  available_until: string;
}

// Derived domain types for the app

export interface Doctor {
  name: string;
  timezone: string;
  schedules: Schedule[];
}

export interface Schedule {
  dayOfWeek: string;
  availableAt: string;
  availableUntil: string;
}

export interface Slot {
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface Booking {
  id: string;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  bookedAt: string;
}
