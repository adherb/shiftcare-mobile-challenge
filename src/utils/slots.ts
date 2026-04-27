import { Doctor, Schedule, Slot } from '../types';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const SLOT_DURATION_MINUTES = 30;

// Parse a 12-hour time string like " 9:00AM" or "12:30PM" into minutes since midnight.
// Return null for the UI to decide how to hanlde data
export function parseTimeToMinutes(input: string): number | null {
  const trimmed = input.trim().toUpperCase();
  // Match "H:MM AM/PM" or "HH:MM AM/PM", capturing hour, minutes, and period.
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(AM|PM)$/); // ["5:30PM", "5", "30", "PM"]
  if (!match) return null;

  const hour12 = Number(match[1]); // 5
  const minutes = Number(match[2]); // 30
  const period = match[3]; // "PM"

  if (hour12 < 1 || hour12 > 12) return null;
  if (minutes < 0 || minutes > 59) return null;

  // handle 24-hour format
  let hour24 = hour12 % 12; // 5 % 12 = 5
  if (period === 'PM') hour24 += 12; // 17

  return hour24 * 60 + minutes;
}

// Format minutes since midnight as a 24-hour time string. Inverse of parseTimeToMinutes.
// 540 -> "09:00", 1050 -> "17:30".
function formatMinutesAsTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60); // 1050 / 60 = 17 (floored)
  const mins = totalMinutes % 60; // 1050 % 60 = 30
  // padStart adds a leading zero so "9" becomes "09" for clean display.
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Format a Date as "YYYY-MM-DD" using local date components.
// Avoids toISOString() which converts to UTC and can shift the date by a day.
// e.g. midnight in Brisbane (UTC+10) is still the previous day in UTC.
function formatDateAsISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth is 0-indexed (Jan = 0)
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate all bookable 30-minute slots for a doctor on a given date.
// Times are wall-clock in the doctor's timezone — no device-timezone conversion.
// Returns [] if the doctor doesn't work that day. Drops any remainder time
// that doesn't fit a full 30-minute slot.
export function generateSlots(doctor: Doctor, date: Date): Slot[] {
  // getDay() returns 0-6 (Sun-Sat). Map to the day name strings the API uses.
  const dayOfWeek = DAY_NAMES[date.getDay()];

  // A doctor can have multiple windows on the same day (e.g. split schedule
  // with a lunch break: 9am-12pm and 1pm-5pm). Grab them all.
  const windowsForDay: Schedule[] = doctor.schedules.filter(
    (s) => s.dayOfWeek === dayOfWeek
  );

  if (windowsForDay.length === 0) return [];

  const isoDate = formatDateAsISO(date);
  const slots: Slot[] = [];

  for (const window of windowsForDay) {
    const startMinutes = parseTimeToMinutes(window.availableAt);
    const endMinutes = parseTimeToMinutes(window.availableUntil);

    // Skip malformed windows rather than crashing the screen.
    if (startMinutes === null || endMinutes === null) continue;
    if (endMinutes <= startMinutes) continue;

    // Walk the window in 30-min steps. Stop when the next slot would overflow
    // the window's end — this is what drops partial slots like a 15-min tail.
    let current = startMinutes;
    while (current + SLOT_DURATION_MINUTES <= endMinutes) {
      const slotEnd = current + SLOT_DURATION_MINUTES;

      slots.push({
        doctorName: doctor.name,
        date: isoDate,
        startTime: formatMinutesAsTime(current),
        endTime: formatMinutesAsTime(slotEnd),
      });

      current = slotEnd;
    }
  }

  return slots;
}

// Stable unique key for a slot. The bookings layer uses this to detect
// double-bookings and mark slots as taken in the UI. Pipe separator avoids
// collisions with any character that might appear inside a doctor's name.
export function slotKey(slot: Pick<Slot, 'doctorName' | 'date' | 'startTime'>): string {
  return `${slot.doctorName}|${slot.date}|${slot.startTime}`;
}
