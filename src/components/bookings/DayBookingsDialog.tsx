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

interface DayBookingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  bookings: Booking[];
  onBookingClick?: (booking: Booking) => void;
}

const getStatusColor = (status: Booking["status"]): string => {
  const colors = {
    assigned: "bg-blue-500 text-white",
    unassigned: "bg-gray-400 text-white",
    done: "bg-green-500 text-white",
    "in-progress": "bg-amber-500 text-white",
    cancelled: "bg-red-500 text-white",
    departed: "bg-purple-500 text-white",
    suspended: "bg-orange-500 text-white",
  };
  return colors[status] || "bg-gray-500 text-white";
};

const getStatusLabel = (status: Booking["status"]): string => {
  const labels = {
    assigned: "Assigned",
    unassigned: "Unassigned",
    done: "Done",
    "in-progress": "In Progress",
    cancelled: "Cancelled",
    departed: "Departed",
    suspended: "Suspended",
  };
  return labels[status] || status;
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
                  "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
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

                    <Badge className={cn("shrink-0", getStatusColor(booking.status))}>
                      {getStatusLabel(booking.status)}
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
