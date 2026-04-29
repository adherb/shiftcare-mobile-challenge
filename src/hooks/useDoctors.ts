import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Doctor } from '../types';
import { fetchDoctors } from '../services/api';

const CACHE_KEY = '@shiftcare/doctors';

export default function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mounted ref so async fetches that resolve after unmount don't setState.
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Show cached data immediately so the UI renders without waiting for network.
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached && isMountedRef.current) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDoctors(parsed);
        }
      }
    } catch {
      // Cache miss or corrupt data -- continue to network fetch.
    }

    try {
      const result = await fetchDoctors();
      if (isMountedRef.current) {
        setDoctors(result);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(result)).catch(() => {});
      }
    } catch {
      // Only show error if we have no cached data to fall back on.
      if (isMountedRef.current && doctors.length === 0) {
        setError('Failed to load doctors. Please try again.');
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  return { doctors, loading, error, refetch: loadDoctors };
}
