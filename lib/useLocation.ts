import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

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
 * Hook that requests the user's location via the browser Geolocation API.
 * Returns { location, error, loading, refresh }.
 *
 * On native platforms this is a no-op for now (returns null) — swap in
 * expo-location when you ship iOS / Android.
 */
export function useLocation(): LocationState {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const requestLocation = () => {
    // Only works on web for now
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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
        enableHighAccuracy: false, // faster, good enough for sorting
        timeout: 10000,
        maximumAge: 5 * 60 * 1000, // cache for 5 min
      },
    );
  };

  useEffect(() => {
    requestLocation();
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
