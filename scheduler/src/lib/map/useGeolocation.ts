"use client";

import { useEffect, useState } from "react";

interface GeolocationState {
  userLocation: [number, number] | null;
  locationError: string | null;
  loading: boolean;
}

/**
 * Hook that requests the browser's geolocation and returns the result.
 * Shared by both FriendMap and any other map feature that needs the user's position.
 */
export function useGeolocation(): GeolocationState {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLoading(false);
      },
      (error) => {
        setLocationError("Unable to retrieve your location");
        setLoading(false);
        console.error(error);
      }
    );
  }, []);

  return { userLocation, locationError, loading };
}
