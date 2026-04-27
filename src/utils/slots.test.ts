import { generateSlots, parseTimeToMinutes, slotKey } from './slots';
import { Doctor, Schedule } from '../types';

// 2026-04-27 is a Monday. Pinned so tests never depend on "today".
const REFERENCE_MONDAY = new Date(2026, 3, 27);

function buildSchedule(overrides?: Partial<Schedule>): Schedule {
  return {
    dayOfWeek: 'Monday',
    availableAt: ' 9:00AM',
    availableUntil: ' 5:00PM',
    ...overrides,
  };
}

function buildDoctor(overrides?: Partial<Doctor>): Doctor {
  return {
    name: 'Christy Schumm',
    timezone: 'Australia/Sydney',
    schedules: [buildSchedule()],
    ...overrides,
  };
}

// parseTimeToMinutes
describe('parseTimeToMinutes', () => {
  it('parses a simple morning time like "9:00AM"', () => {
    expect(parseTimeToMinutes('9:00AM')).toBe(540);
  });

  it('parses a time with leading whitespace like " 9:00AM"', () => {
    expect(parseTimeToMinutes(' 9:00AM')).toBe(540);
  });

  it('parses 12:00AM as midnight (0)', () => {
    expect(parseTimeToMinutes('12:00AM')).toBe(0);
  });

  it('parses 12:00PM as noon (720)', () => {
    expect(parseTimeToMinutes('12:00PM')).toBe(720);
  });

  it('parses 11:59PM correctly (1439)', () => {
    expect(parseTimeToMinutes('11:59PM')).toBe(1439);
  });

  it('handles lowercase am/pm', () => {
    expect(parseTimeToMinutes('9:00am')).toBe(540);
  });

  it('returns null for malformed input like "banana"', () => {
    expect(parseTimeToMinutes('banana')).toBeNull();
  });

  it('returns null for hour out of range like "25:00PM"', () => {
    expect(parseTimeToMinutes('25:00PM')).toBeNull();
  });

  it('returns null for minutes out of range like "9:99AM"', () => {
    expect(parseTimeToMinutes('9:99AM')).toBeNull();
  });

  it('returns null for missing AM/PM like "9:00"', () => {
    expect(parseTimeToMinutes('9:00')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseTimeToMinutes('')).toBeNull();
  });
});

// generateSlots
describe('generateSlots', () => {
  it('generates correct number of 30-min slots for a simple 2-hour window', () => {
    const doctor = buildDoctor({
      schedules: [buildSchedule({ availableAt: ' 9:00AM', availableUntil: '11:00AM' })],
    });
    const slots = generateSlots(doctor, REFERENCE_MONDAY);
    expect(slots).toHaveLength(4);
  });

  it('each slot is exactly 30 minutes apart', () => {
    const doctor = buildDoctor({
      schedules: [buildSchedule({ availableAt: ' 9:00AM', availableUntil: '11:00AM' })],
    });
    const slots = generateSlots(doctor, REFERENCE_MONDAY);
    for (let i = 0; i < slots.length - 1; i++) {
      expect(slots[i].endTime).toBe(slots[i + 1].startTime);
    }
  });

  it("first slot starts at the window's start time", () => {
    const doctor = buildDoctor({
      schedules: [buildSchedule({ availableAt: ' 9:00AM', availableUntil: '11:00AM' })],
    });
    const slots = generateSlots(doctor, REFERENCE_MONDAY);
    expect(slots[0].startTime).toBe('09:00');
  });

  it("last slot ends at or before the window's end time", () => {
    const doctor = buildDoctor({
      schedules: [buildSchedule({ availableAt: ' 9:00AM', availableUntil: '11:00AM' })],
    });
    const slots = generateSlots(doctor, REFERENCE_MONDAY);
    expect(slots[slots.length - 1].endTime).toBe('11:00');
  });

  it('drops remainder when window does not divide evenly into 30 minutes', () => {
    const doctor = buildDoctor({
      schedules: [buildSchedule({ availableAt: ' 9:00AM', availableUntil: '10:45AM' })],
    });
    const slots = generateSlots(doctor, REFERENCE_MONDAY);
    expect(slots).toHaveLength(3);
    expect(slots[slots.length - 1].endTime).toBe('10:30');
  });

  it('returns empty array when date falls on a day the doctor is unavailable', () => {
    const doctor = buildDoctor();
    const tuesday = new Date(2026, 3, 28);
    expect(generateSlots(doctor, tuesday)).toEqual([]);
  });

  it('returns empty array for a doctor with no schedules', () => {
    const doctor = buildDoctor({ schedules: [] });
    expect(generateSlots(doctor, REFERENCE_MONDAY)).toEqual([]);
  });

  it('generates slots for multiple windows on the same day (split schedule)', () => {
    const thursday = new Date(2026, 3, 30);
    const doctor = buildDoctor({
      name: 'Dr. Geovany Keebler',
      timezone: 'Australia/Perth',
      schedules: [
        buildSchedule({ dayOfWeek: 'Thursday', availableAt: ' 7:00AM', availableUntil: ' 2:00PM' }),
        buildSchedule({ dayOfWeek: 'Thursday', availableAt: ' 3:00PM', availableUntil: ' 5:00PM' }),
      ],
    });
    const slots = generateSlots(doctor, thursday);
    expect(slots).toHaveLength(18);
  });

  it('does not generate overlapping slots across split schedule windows', () => {
    const thursday = new Date(2026, 3, 30);
    const doctor = buildDoctor({
      name: 'Dr. Geovany Keebler',
      timezone: 'Australia/Perth',
      schedules: [
        buildSchedule({ dayOfWeek: 'Thursday', availableAt: ' 7:00AM', availableUntil: ' 2:00PM' }),
        buildSchedule({ dayOfWeek: 'Thursday', availableAt: ' 3:00PM', availableUntil: ' 5:00PM' }),
      ],
    });
    const slots = generateSlots(doctor, thursday);
    expect(slots[13].endTime).toBe('14:00');
    expect(slots[14].startTime).toBe('15:00');
  });

  it('handles leading whitespace in API time strings', () => {
    const doctor = buildDoctor({
      schedules: [buildSchedule({ availableAt: '  9:00AM', availableUntil: ' 11:00AM' })],
    });
    const slots = generateSlots(doctor, REFERENCE_MONDAY);
    expect(slots).toHaveLength(4);
    expect(slots[0].startTime).toBe('09:00');
  });

  it('parses 12:00PM as noon correctly within a window', () => {
    const doctor = buildDoctor({
      schedules: [buildSchedule({ availableAt: '11:00AM', availableUntil: ' 1:00PM' })],
    });
    const slots = generateSlots(doctor, REFERENCE_MONDAY);
    expect(slots).toHaveLength(4);
    expect(slots[2]).toMatchObject({ startTime: '12:00', endTime: '12:30' });
  });

  it('returns empty array when end time is before start time', () => {
    const doctor = buildDoctor({
      schedules: [buildSchedule({ availableAt: ' 5:00PM', availableUntil: ' 9:00AM' })],
    });
    expect(generateSlots(doctor, REFERENCE_MONDAY)).toEqual([]);
  });

  it('returns empty array when end time equals start time', () => {
    const doctor = buildDoctor({
      schedules: [buildSchedule({ availableAt: ' 9:00AM', availableUntil: ' 9:00AM' })],
    });
    expect(generateSlots(doctor, REFERENCE_MONDAY)).toEqual([]);
  });

  it('skips a malformed window but still generates slots for valid windows on the same day', () => {
    const doctor = buildDoctor({
      schedules: [
        buildSchedule({ availableAt: 'banana', availableUntil: ' 5:00PM' }),
        buildSchedule({ availableAt: ' 9:00AM', availableUntil: '11:00AM' }),
      ],
    });
    const slots = generateSlots(doctor, REFERENCE_MONDAY);
    expect(slots).toHaveLength(4);
  });

  it('slot output uses 24-hour format', () => {
    const doctor = buildDoctor({
      schedules: [buildSchedule({ availableAt: ' 1:00PM', availableUntil: ' 2:00PM' })],
    });
    const slots = generateSlots(doctor, REFERENCE_MONDAY);
    expect(slots[0].startTime).toBe('13:00');
    expect(slots[0].endTime).toBe('13:30');
  });

  it('each slot includes the correct doctor name and ISO date string', () => {
    const doctor = buildDoctor({
      name: 'Test Doctor',
      schedules: [buildSchedule({ availableAt: ' 9:00AM', availableUntil: '10:00AM' })],
    });
    const slots = generateSlots(doctor, REFERENCE_MONDAY);
    for (const slot of slots) {
      expect(slot.doctorName).toBe('Test Doctor');
      expect(slot.date).toBe('2026-04-27');
    }
  });
});

// slotKey
describe('slotKey', () => {
  it('generates a stable key for a given slot', () => {
    const slot = { doctorName: 'Dr. A', date: '2026-04-27', startTime: '09:00', endTime: '09:30' };
    expect(slotKey(slot)).toBe('Dr. A|2026-04-27|09:00');
  });

  it('generates different keys for different doctors at the same time', () => {
    const slotA = { doctorName: 'Dr. A', date: '2026-04-27', startTime: '09:00', endTime: '09:30' };
    const slotB = { doctorName: 'Dr. B', date: '2026-04-27', startTime: '09:00', endTime: '09:30' };
    expect(slotKey(slotA)).not.toBe(slotKey(slotB));
  });

  it('generates different keys for different times on the same date', () => {
    const slot1 = { doctorName: 'Dr. A', date: '2026-04-27', startTime: '09:00', endTime: '09:30' };
    const slot2 = { doctorName: 'Dr. A', date: '2026-04-27', startTime: '10:00', endTime: '10:30' };
    expect(slotKey(slot1)).not.toBe(slotKey(slot2));
  });

  it('generates different keys for the same time on different dates', () => {
    const slot1 = { doctorName: 'Dr. A', date: '2026-04-27', startTime: '09:00', endTime: '09:30' };
    const slot2 = { doctorName: 'Dr. A', date: '2026-04-28', startTime: '09:00', endTime: '09:30' };
    expect(slotKey(slot1)).not.toBe(slotKey(slot2));
  });
});
