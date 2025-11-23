import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, Calendar } from 'lucide-react';

interface BookingRequestStatusBadgeProps {
  requestType: 'cancellation' | 'reschedule' | null;
  requestStatus: 'pending' | 'approved' | 'rejected' | null;
  className?: string;
}

export function BookingRequestStatusBadge({
  requestType,
  requestStatus,
  className,
}: BookingRequestStatusBadgeProps) {
  if (!requestType || !requestStatus) {
    return null;
  }

  const getStatusConfig = () => {
    if (requestStatus === 'pending') {
      if (requestType === 'cancellation') {
        return {
          label: 'Cancellation Pending',
          icon: Clock,
          className: 'bg-orange-100 text-orange-800 border-orange-300',
        };
      } else {
        return {
          label: 'Reschedule Pending',
          icon: Calendar,
          className: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      }
    }

    if (requestStatus === 'approved') {
      return {
        label: 'Request Approved',
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-800 border-green-300',
      };
    }

    if (requestStatus === 'rejected') {
      return {
        label: 'Request Rejected',
        icon: XCircle,
        className: 'bg-red-100 text-red-800 border-red-300',
      };
    }

    return null;
  };

  const config = getStatusConfig();

  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} ${className || ''} gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
