import { ScheduleEntry } from '../types';

const API_URL =
  'https://raw.githubusercontent.com/suyogshiftcare/jsontest/main/available.json';

export async function fetchDoctors(): Promise<ScheduleEntry[]> {
  // TODO: Fetch from API_URL, parse JSON, return typed array
  // Handle network errors and invalid responses gracefully
  throw new Error('Not implemented');
}
