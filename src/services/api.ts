import { Doctor, Schedule, ScheduleEntry } from '../types';

const API_URL =
  'https://raw.githubusercontent.com/suyogshiftcare/jsontest/main/available.json';

// Fetches the raw flat array of schedule entries from the API.
async function fetchRawSchedule(): Promise<ScheduleEntry[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('API response is not a JSON array');
  }

  return data as ScheduleEntry[];
}

// Groups flat API entries into Doctor domain objects keyed by name.
// Doctor identity is name-based since the API provides no unique IDs.
export function transformToDoctors(entries: ScheduleEntry[]): Doctor[] {
  const doctorMap = new Map<string, Doctor>();

  // Skip entries missing required fields rather than throwing, keeps the rest
  // of the doctor list usable even if a single entry is bad.
  for (const entry of entries) {
    if (!entry.name || !entry.timezone || !entry.day_of_week || !entry.available_at || !entry.available_until) {
      continue;
    }

    const schedule: Schedule = {
      dayOfWeek: entry.day_of_week,
      availableAt: entry.available_at,
      availableUntil: entry.available_until,
    };

    const existing = doctorMap.get(entry.name);
    if (existing) {
      existing.schedules.push(schedule);
    } else {
      doctorMap.set(entry.name, {
        name: entry.name,
        timezone: entry.timezone,
        schedules: [schedule],
      });
    }
  }

  return Array.from(doctorMap.values());
}

// Fetches schedule data from the API and returns it as domain-typed doctors.
export async function fetchDoctors(): Promise<Doctor[]> {
  return transformToDoctors(await fetchRawSchedule());
}
