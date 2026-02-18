import { useEffect } from 'react';
import { useGeolocation } from './useGeolocation';
import { useAuth } from '@/contexts/AuthContext';
import { safeLocalStorage } from '@/lib/utils';

export function useLocationTracking() {
  const { user } = useAuth();
  const { requestLocation, latitude, permission } = useGeolocation();

  useEffect(() => {
    // Only track for logged-in users
    if (!user) return;

    // Check if location is already captured
    const lastUpdate = safeLocalStorage.getItem('location_last_update');
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    // Update location once per day
    if (!lastUpdate || now - parseInt(lastUpdate) > ONE_DAY) {
      if (permission === 'granted' || !latitude) {
        requestLocation();
        safeLocalStorage.setItem('location_last_update', now.toString());
      }
    }
  }, [user, permission, latitude, requestLocation]);
}
