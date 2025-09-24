import React from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BookingVisibilityStatusProps {
  isVerifying?: boolean;
  hasRecentBookings?: boolean;
  onForceRefresh?: () => void;
}

export const BookingVisibilityStatus: React.FC<BookingVisibilityStatusProps> = ({
  isVerifying,
  hasRecentBookings,
  onForceRefresh
}) => {
  if (isVerifying) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <RefreshCw className="h-4 w-4 animate-spin text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Verifying booking visibility on calendar...
        </AlertDescription>
      </Alert>
    );
  }

  if (hasRecentBookings === false) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 flex items-center justify-between">
          <span>Bookings may not be visible on the calendar</span>
          {onForceRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onForceRefresh}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Force Refresh
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (hasRecentBookings === true) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          All bookings are visible on the calendar
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};