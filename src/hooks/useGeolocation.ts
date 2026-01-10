import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  loading: boolean;
  error: string | null;
  permission: 'granted' | 'denied' | 'prompt' | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    city: null,
    loading: false,
    error: null,
    permission: null,
  });

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setState(prev => ({ ...prev, permission: permission.state as any }));

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Call edge function to reverse geocode and save
          try {
            const { data: locationData, error: geocodeError } = await supabase.functions.invoke(
              'reverse-geocode',
              {
                body: {
                  latitude,
                  longitude,
                  userId: (await supabase.auth.getUser()).data.user?.id,
                },
              }
            );

            if (geocodeError) throw geocodeError;

            setState({
              latitude,
              longitude,
              city: locationData.location.city,
              loading: false,
              error: null,
              permission: 'granted',
            });

            // Store in localStorage for anonymous users
            localStorage.setItem('user_location', JSON.stringify({
              latitude,
              longitude,
              city: locationData.location.city,
              state: locationData.location.state,
            }));
          } catch (error) {
            console.error('Geocoding error:', error);
            // Still save coordinates even if geocoding fails
            setState({
              latitude,
              longitude,
              city: null,
              loading: false,
              error: null,
              permission: 'granted',
            });
            localStorage.setItem('user_location', JSON.stringify({ latitude, longitude }));
          }
        },
        (error) => {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error.message,
            permission: 'denied',
          }));
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 3600000, // 1 hour cache
        }
      );
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Location error',
      }));
    }
  };

  // Check for saved location on mount
  useEffect(() => {
    const saved = localStorage.getItem('user_location');
    if (saved) {
      try {
        const { latitude, longitude } = JSON.parse(saved);
        setState(prev => ({ ...prev, latitude, longitude }));
      } catch (e) {
        // Invalid saved data
      }
    }
  }, []);

  return {
    ...state,
    requestLocation,
    clearLocation: () => {
      localStorage.removeItem('user_location');
      setState({
        latitude: null,
        longitude: null,
        city: null,
        loading: false,
        error: null,
        permission: null,
      });
    },
  };
}
