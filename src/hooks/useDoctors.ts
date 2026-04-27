import { useState, useEffect, useCallback, useRef } from 'react';
import { Doctor } from '../types';
import { fetchDoctors } from '../services/api';

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

    try {
      const result = await fetchDoctors();
      if (isMountedRef.current) setDoctors(result);
    } catch {
      if (isMountedRef.current) {
        setDoctors([]);
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
