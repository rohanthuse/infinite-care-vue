import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { useState, useCallback, useEffect } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface UseGeolocationResult {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  getCurrentLocation: (highAccuracy?: boolean) => Promise<LocationData | null>;
  watchLocation: (callback: (location: LocationData) => void) => Promise<string | null>;
  clearWatch: (watchId: string) => Promise<void>;
  isNativeGeolocation: boolean;
  hasPermission: boolean | null;
  requestPermission: () => Promise<boolean>;
}

/**
 * Hook for accessing device geolocation using Capacitor Geolocation plugin
 * Useful for carer check-in/check-out location verification
 */
export const useGeolocation = (): UseGeolocationResult => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const isNativeGeolocation = Capacitor.isNativePlatform();

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const status = await Geolocation.checkPermissions();
        setHasPermission(status.location === 'granted' || status.coarseLocation === 'granted');
      } catch (err) {
        setHasPermission(false);
      }
    };
    checkPermissions();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const status = await Geolocation.requestPermissions();
      const granted = status.location === 'granted' || status.coarseLocation === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (err) {
      setHasPermission(false);
      return false;
    }
  }, []);

  const positionToLocationData = (position: Position): LocationData => ({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    altitude: position.coords.altitude,
    altitudeAccuracy: position.coords.altitudeAccuracy,
    heading: position.coords.heading,
    speed: position.coords.speed,
    timestamp: position.timestamp
  });

  const getCurrentLocation = useCallback(async (highAccuracy = true): Promise<LocationData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check and request permissions if needed
      const permissions = await Geolocation.checkPermissions();
      
      if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted' && requested.coarseLocation !== 'granted') {
          throw new Error('Location permission denied');
        }
        setHasPermission(true);
      }

      const options: PositionOptions = {
        enableHighAccuracy: highAccuracy,
        timeout: 15000,
        maximumAge: 0
      };

      const position = await Geolocation.getCurrentPosition(options);
      const locationData = positionToLocationData(position);
      
      setLocation(locationData);
      return locationData;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get location';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const watchLocation = useCallback(async (
    callback: (location: LocationData) => void
  ): Promise<string | null> => {
    try {
      // Check permissions
      const permissions = await Geolocation.checkPermissions();
      
      if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted' && requested.coarseLocation !== 'granted') {
          throw new Error('Location permission denied');
        }
      }

      const watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true },
        (position, err) => {
          if (err) {
            setError(err.message);
            return;
          }
          if (position) {
            const locationData = positionToLocationData(position);
            setLocation(locationData);
            callback(locationData);
          }
        }
      );

      return watchId;
    } catch (err: any) {
      setError(err.message || 'Failed to watch location');
      return null;
    }
  }, []);

  const clearWatch = useCallback(async (watchId: string): Promise<void> => {
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (err: any) {
      console.error('Failed to clear location watch:', err);
    }
  }, []);

  return {
    location,
    isLoading,
    error,
    getCurrentLocation,
    watchLocation,
    clearWatch,
    isNativeGeolocation,
    hasPermission,
    requestPermission
  };
};

/**
 * Calculate distance between two coordinates in meters
 * Uses Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Check if a location is within a radius of a target location
 */
export const isWithinRadius = (
  currentLat: number,
  currentLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number
): boolean => {
  const distance = calculateDistance(currentLat, currentLon, targetLat, targetLon);
  return distance <= radiusMeters;
};
