import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { useLateBookingAlerts, useTriggerAlertProcessing } from '@/hooks/useLateBookingAlerts';

interface LateBookingAlertsBannerProps {
  branchId?: string;
  onViewDetails?: () => void;
}

export const LateBookingAlertsBanner: React.FC<LateBookingAlertsBannerProps> = ({
  branchId,
  onViewDetails
}) => {
  const { todayStats, isLoading } = useLateBookingAlerts(branchId);
  const triggerProcessing = useTriggerAlertProcessing();

  // Don't show if loading or no alerts
  if (isLoading || (todayStats.lateStartCount === 0 && todayStats.missedCount === 0)) {
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
          {todayStats.lateStartCount > 0 && (
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Clock className="h-4 w-4" />
              <span className="font-medium">
                {todayStats.lateStartCount} late arrival{todayStats.lateStartCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {todayStats.missedCount > 0 && (
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">
                {todayStats.missedCount} missed booking{todayStats.missedCount !== 1 ? 's' : ''}
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
