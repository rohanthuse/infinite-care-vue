import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, UserCog, X } from "lucide-react";
import { Booking } from "./BookingTimeGrid";

interface BookingReassignActionsBarProps {
  selectedBookings: Booking[];
  onClearSelection: () => void;
  onBulkReassign: () => void;
}

export const BookingReassignActionsBar = ({ 
  selectedBookings, 
  onClearSelection, 
  onBulkReassign 
}: BookingReassignActionsBarProps) => {
  if (selectedBookings.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-background border border-border shadow-lg rounded-lg p-4 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">
            {selectedBookings.length} appointment{selectedBookings.length > 1 ? 's' : ''} selected
          </span>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {selectedBookings.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkReassign}
            className="flex items-center gap-2"
          >
            <UserCog className="h-4 w-4" />
            Reassign to Staff
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};
