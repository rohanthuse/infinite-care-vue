import React, { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { useTriggerAlertProcessing } from '@/hooks/useLateBookingAlerts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Booking } from './BookingTimeGrid';

interface LateBookingAlertsBannerProps {
  branchId?: string;
  selectedDate?: Date;
  viewType?: "daily" | "weekly" | "monthly";
  bookings?: Booking[];
  onViewDetails?: () => void;
}

export const LateBookingAlertsBanner: React.FC<LateBookingAlertsBannerProps> = ({
  branchId,
  selectedDate,
  viewType = "daily",
  bookings = [],
  onViewDetails
}) => {
  const triggerProcessing = useTriggerAlertProcessing();

  // Calculate stats from loaded bookings for the selected date range
  const stats = useMemo(() => {
    if (!selectedDate || bookings.length === 0) {
      return { lateStartCount: 0, missedCount: 0 };
    }

    let dateBookings: Booking[] = [];
    
    if (viewType === "daily") {
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      dateBookings = bookings.filter(b => b.date === selectedDateStr);
    } else if (viewType === "weekly") {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      dateBookings = bookings.filter(b => {
        const bookingDate = parseISO(b.date);
        return isWithinInterval(bookingDate, { start: weekStart, end: weekEnd });
      });
    } else if (viewType === "monthly") {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      dateBookings = bookings.filter(b => {
        const bookingDate = parseISO(b.date);
        return isWithinInterval(bookingDate, { start: monthStart, end: monthEnd });
      });
    }
    
    // Count late and missed bookings
    const lateStartCount = dateBookings.filter(b => b.is_late_start === true && !b.is_missed).length;
    const missedCount = dateBookings.filter(b => b.is_missed === true).length;

    return { lateStartCount, missedCount };
  }, [bookings, selectedDate, viewType]);

  // Don't show if no alerts
  if (stats.lateStartCount === 0 && stats.missedCount === 0) {
    return null;
  }

  const handleRefresh = () => {
    triggerProcessing.mutate();
  };

  return (
    <Alert 
      variant="destructive" 
      className="mb-4 border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/30"
    >
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="flex items-center gap-2 font-semibold">
        Action Required - Booking Alerts
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 ml-auto"
          onClick={handleRefresh}
          disabled={triggerProcessing.isPending}
        >
          <RefreshCw className={`h-4 w-4 ${triggerProcessing.isPending ? 'animate-spin' : ''}`} />
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex flex-wrap items-center gap-4">
          {stats.lateStartCount > 0 && (
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Clock className="h-4 w-4" />
              <span className="font-medium">
                {stats.lateStartCount} late arrival{stats.lateStartCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {stats.missedCount > 0 && (
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">
                {stats.missedCount} missed booking{stats.missedCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {onViewDetails && (
            <Button 
              variant="link" 
              size="sm" 
              className="text-red-700 dark:text-red-400 p-0 h-auto"
              onClick={onViewDetails}
            >
              View Details →
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};
