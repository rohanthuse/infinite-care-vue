
import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Calendar, Clock, Plus } from "lucide-react";
import { format } from "date-fns";

interface BookingContextMenuProps {
  children: React.ReactNode;
  date: Date;
  time: string;
  onCreateBooking: (date: Date, time: string) => void;
}

export const BookingContextMenu: React.FC<BookingContextMenuProps> = ({
  children,
  date,
  time,
  onCreateBooking,
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(date, "EEE, MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{time}</span>
          </div>
        </div>
        <ContextMenuItem 
          className="cursor-pointer flex items-center" 
          onClick={() => onCreateBooking(date, time)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Booking
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
