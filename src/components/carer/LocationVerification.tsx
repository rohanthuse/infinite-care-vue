import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, CheckCircle, AlertTriangle, Navigation, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGeolocation, LocationData, calculateDistance, isWithinRadius } from '@/hooks/useGeolocation';
import { useHaptics } from '@/hooks/useHaptics';
import { useNativeAppMode } from '@/contexts/NativeAppContext';
import { ImpactStyle, NotificationType } from '@capacitor/haptics';
import { cn } from '@/lib/utils';

interface LocationVerificationProps {
  /** Client address for display */
  clientAddress: string;
  /** Client coordinates (if available) */
  clientLatitude?: number | null;
  clientLongitude?: number | null;
  /** Radius in meters for valid check-in (default: 200m) */
  verificationRadiusMeters?: number;
  /** Callback when location is verified */
  onLocationVerified: (location: LocationData, isWithinRange: boolean) => void;
  /** Whether location verification is required before check-in */
  requireVerification?: boolean;
  /** Whether check-in is in progress */
  isCheckingIn?: boolean;
  disabled?: boolean;
}

interface VerificationStatus {
  status: 'idle' | 'acquiring' | 'verified' | 'warning' | 'error';
  message: string;
  distance?: number;
}

/**
 * Location Verification Component for Check-In
 * 
 * Verifies the carer's GPS location against the client's address
 * before allowing check-in. Shows distance and verification status.
 */
export const LocationVerification: React.FC<LocationVerificationProps> = ({
  clientAddress,
  clientLatitude,
  clientLongitude,
  verificationRadiusMeters = 200,
  onLocationVerified,
  requireVerification = false,
  isCheckingIn = false,
  disabled = false
}) => {
  const { isNative } = useNativeAppMode();
  const { getCurrentLocation, location, isLoading, error, hasPermission, requestPermission } = useGeolocation();
  const { impact, notification } = useHaptics();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    status: 'idle',
    message: 'Location not verified'
  });
  const [lastVerifiedLocation, setLastVerifiedLocation] = useState<LocationData | null>(null);

  // Check if we have client coordinates
  const hasClientCoordinates = clientLatitude != null && clientLongitude != null;

  /**
   * Verify current location against client address
   */
  const verifyLocation = async () => {
    setVerificationStatus({ status: 'acquiring', message: 'Getting your location...' });
    
    await impact(ImpactStyle.Medium);

    const currentLocation = await getCurrentLocation(true);

    if (!currentLocation) {
      setVerificationStatus({
        status: 'error',
        message: error || 'Unable to get your location'
      });
      await notification(NotificationType.Error);
      return;
    }

    setLastVerifiedLocation(currentLocation);

    // If we have client coordinates, calculate distance
    if (hasClientCoordinates) {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        clientLatitude!,
        clientLongitude!
      );

      const withinRange = distance <= verificationRadiusMeters;

      if (withinRange) {
        setVerificationStatus({
          status: 'verified',
          message: `Location verified (${Math.round(distance)}m from client)`,
          distance
        });
        await notification(NotificationType.Success);
      } else {
        setVerificationStatus({
          status: 'warning',
          message: `You are ${Math.round(distance)}m from client (limit: ${verificationRadiusMeters}m)`,
          distance
        });
        await notification(NotificationType.Warning);
      }

      onLocationVerified(currentLocation, withinRange);
    } else {
      // No client coordinates - just capture location
      setVerificationStatus({
        status: 'verified',
        message: 'Location captured (no client coordinates to verify against)',
        distance: undefined
      });
      await notification(NotificationType.Success);
      onLocationVerified(currentLocation, true);
    }
  };

  /**
   * Handle permission request
   */
  const handleRequestPermission = async () => {
    await impact(ImpactStyle.Light);
    const granted = await requestPermission();
    if (granted) {
      await verifyLocation();
    }
  };

  // Status icon and color
  const getStatusIcon = () => {
    switch (verificationStatus.status) {
      case 'acquiring':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'verified':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus.status) {
      case 'verified':
        return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'warning':
        return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'acquiring':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const isVerified = verificationStatus.status === 'verified';
  const isWarning = verificationStatus.status === 'warning';
  const canProceed = isVerified || (isWarning && !requireVerification);

  return (
    <div className="space-y-4">
      {/* Client Address Display */}
      <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Visit Location</p>
          <p className="text-sm text-muted-foreground break-words">{clientAddress || 'No address available'}</p>
        </div>
      </div>

      {/* Verification Status Card */}
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        getStatusColor()
      )}>
        {getStatusIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{verificationStatus.message}</p>
          {lastVerifiedLocation && verificationStatus.status !== 'acquiring' && (
            <p className="text-xs opacity-75 mt-0.5">
              Accuracy: ±{Math.round(lastVerifiedLocation.accuracy)}m
            </p>
          )}
        </div>
      </div>

      {/* Permission Request */}
      {hasPermission === false && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
            Location access is required to verify your check-in location.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRequestPermission}
            disabled={disabled || isLoading}
            className="w-full"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Enable Location Access
          </Button>
        </div>
      )}

      {/* Verify / Re-verify Button */}
      {hasPermission !== false && (
        <Button
          variant={isVerified ? "outline" : "default"}
          onClick={verifyLocation}
          disabled={disabled || isLoading || isCheckingIn}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Getting Location...
            </>
          ) : isVerified || isWarning ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-verify Location
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              Verify My Location
            </>
          )}
        </Button>
      )}

      {/* Warning for out-of-range check-in */}
      {isWarning && !requireVerification && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
          ⚠️ You appear to be outside the expected check-in area. You can still proceed, but this will be noted.
        </p>
      )}

      {/* Native app hint */}
      {!isNative && verificationStatus.status === 'idle' && (
        <p className="text-xs text-muted-foreground text-center">
          💡 For best accuracy, use the Infinite Care mobile app
        </p>
      )}
    </div>
  );
};
