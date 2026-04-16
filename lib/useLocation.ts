import { useState, useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import * as ExpoLocation from 'expo-location';

export type UserLocation = {
  latitude: number;
  longitude: number;
};

type LocationState = {
  location: UserLocation | null;
  error: string | null;
  loading: boolean;
  /** Re-request location (e.g. after user grants permission) */
  refresh: () => void;
};

/**
 * Cross-platform location hook.
 * - Web: uses browser Geolocation API
 * - iOS/Android: uses expo-location
 */
export function useLocation(): LocationState {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const requestLocation = async () => {
    setLoading(true);
    setError(null);

    if (Platform.OS === 'web') {
      // Web: use browser Geolocation API
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setError('Geolocation not supported');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000,
        },
      );
    } else {
      // Native: use expo-location
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          setLoading(false);
          return;
        }

        const pos = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced,
        });
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to get location');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Re-fetch location when app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        requestLocation();
      }
    });
    return () => subscription.remove();
  }, []);

  return { location, error, loading, refresh: requestLocation };
}

/**
 * Haversine distance between two points in miles.
 */
export function getDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Format distance for display: "0.3 mi", "1.2 mi", "15 mi"
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) return '< 0.1 mi';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}
