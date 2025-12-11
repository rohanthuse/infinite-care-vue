import { XCircle, RefreshCw } from "lucide-react";

export interface Booking {
  id: string;
  cancellation_request_status?: string | null;
  reschedule_request_status?: string | null;
  [key: string]: any;
}

export const getRequestStatusColors = (booking: Booking) => {
  const hasPendingCancellation = booking.cancellation_request_status === 'pending';
  const hasPendingReschedule = booking.reschedule_request_status === 'pending';

  if (hasPendingCancellation) {
    return {
      background: "bg-red-50",
      border: "border-l-4 border-red-500",
      text: "text-red-900",
      dotColor: "bg-red-500",
      icon: XCircle,
      iconColor: "text-red-500",
      tooltip: "Client requested cancellation",
      hasRequest: true
    };
  }

  if (hasPendingReschedule) {
    return {
      background: "bg-orange-50",
      border: "border-l-4 border-orange-500",
      text: "text-orange-900",
      dotColor: "bg-orange-500",
      icon: RefreshCw,
      iconColor: "text-orange-500",
      tooltip: "Client requested reschedule",
      hasRequest: true
    };
  }

  return {
    background: "",
    border: "",
    text: "",
    dotColor: "",
    icon: null,
    iconColor: "",
    tooltip: "",
    hasRequest: false
  };
};
