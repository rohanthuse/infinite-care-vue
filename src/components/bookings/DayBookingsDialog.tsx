import React from "react";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Booking } from "./BookingsMonthView";
import { 
  getBookingStatusLabel,
  getEffectiveBookingStatus 
} from "./utils/bookingColors";

interface DayBookingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  bookings: Booking[];
  onBookingClick?: (booking: Booking) => void;
}

const getStatusBadgeColor = (status: string): string => {
  const colors: Record<string, string> = {
    assigned: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    unassigned: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    done: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    "in-progress": "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
    departed: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
    suspended: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    missed: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    late: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
    training: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  };
  return colors[status] || colors.assigned;
};

const getCardBorderColor = (status: string): string => {
  const borders: Record<string, string> = {
    assigned: "border-l-green-500",
    unassigned: "border-l-yellow-500",
    done: "border-l-blue-500",
    "in-progress": "border-l-purple-500",
    cancelled: "border-l-rose-500",
    departed: "border-l-teal-500",
    suspended: "border-l-gray-500",
    missed: "border-l-red-500",
    late: "border-l-orange-500",
    training: "border-l-amber-500",
  };
  return borders[status] || borders.assigned;
};

export const DayBookingsDialog: React.FC<DayBookingsDialogProps> = ({
  open,
  onOpenChange,
  date,
  bookings,
  onBookingClick,
}) => {
  // Sort bookings by start time
  const sortedBookings = [...bookings].sort((a, b) => {
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <DialogTitle>
              Bookings on {format(date, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-4 scroll-smooth">
          <div className="space-y-3">
            {sortedBookings.map((booking) => (
              <Card
                key={booking.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md hover:border-primary/50 border-l-4",
                  getCardBorderColor(getEffectiveBookingStatus(booking)),
                  onBookingClick && "cursor-pointer"
                )}
                onClick={() => onBookingClick?.(booking)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {booking.clientName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Carer: {booking.carerName}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {booking.startTime} - {booking.endTime}
                        </span>
                      </div>

                      {booking.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {booking.notes}
                        </p>
                      )}
                    </div>

                    <Badge 
                      variant="custom"
                      className={cn(
                        "shrink-0",
                        getStatusBadgeColor(getEffectiveBookingStatus(booking))
                      )}
                    >
                      {getBookingStatusLabel(getEffectiveBookingStatus(booking))}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
