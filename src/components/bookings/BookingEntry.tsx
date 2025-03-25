
import React from "react";
import { Booking } from "./BookingTimeGrid";
import { Clock, Info } from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface BookingEntryProps {
  booking: Booking;
  startPos?: number;
  width?: number;
  type?: "client" | "carer";
  displayMode?: "horizontal" | "vertical";
  position?: {
    top: number;
    height: number;
  };
}

export const BookingEntry: React.FC<BookingEntryProps> = ({
  booking,
  startPos = 0,
  width = 100,
  type = "client",
  displayMode = "horizontal",
  position
}) => {
  // Determine background color based on status
  const statusColors = {
    assigned: "bg-green-100 border-green-300 text-green-800",
    unassigned: "bg-amber-100 border-amber-300 text-amber-800",
    done: "bg-blue-100 border-blue-300 text-blue-800",
    "in-progress": "bg-purple-100 border-purple-300 text-purple-800",
    cancelled: "bg-red-100 border-red-300 text-red-800",
    departed: "bg-teal-100 border-teal-300 text-teal-800",
    suspended: "bg-gray-100 border-gray-300 text-gray-800"
  };
  
  const backgroundColor = statusColors[booking.status];
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric" 
    });
  };
  
  // If position is provided, use it (vertical view)
  if (position) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`absolute rounded shadow-sm border ${backgroundColor} hover:shadow-md transition-shadow cursor-pointer text-xs z-10`}
            style={{ 
              top: `${position.top}px`,
              height: `${position.height}px`,
              left: '2px',
              right: '2px'
            }}
          >
            <div className="p-1 overflow-hidden h-full flex flex-col">
              <div className="font-medium truncate flex items-center">
                <span>{booking.startTime}-{booking.endTime}</span>
                <Info className="h-3 w-3 ml-1 opacity-60" />
              </div>
              <div className="truncate mt-auto">
                {type === "client" ? booking.carerName.split(",")[0] : booking.clientInitials}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-white p-3 shadow-lg rounded-md border">
          <div className="space-y-1.5">
            <div className="font-semibold text-sm">{type === "client" ? booking.carerName : booking.clientName}</div>
            <div className="flex items-center text-xs text-gray-600">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>{booking.startTime} - {booking.endTime}</span>
              <span className="mx-1.5">·</span>
              <span>{formatDate(booking.date)}</span>
            </div>
            <div className={`text-xs py-0.5 px-1.5 rounded-full inline-flex ${statusColors[booking.status]}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </div>
            {booking.notes && (
              <div className="text-xs mt-1 text-gray-600">{booking.notes}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  // Only render horizontal booking entry in daily view
  if (displayMode === "horizontal") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`absolute top-1.5 bottom-1.5 rounded shadow-sm border ${backgroundColor} hover:shadow-md transition-shadow cursor-pointer text-xs z-10`}
            style={{ 
              left: `${startPos}%`,
              width: `${width}%`,
              minWidth: "25px"
            }}
          >
            <div className="p-1 overflow-hidden h-full flex flex-col">
              <div className="font-medium truncate flex items-center">
                <span>{booking.startTime}-{booking.endTime}</span>
                {width > 10 && (
                  <Info className="h-3 w-3 ml-1 opacity-60" />
                )}
              </div>
              <div className="truncate mt-auto">
                {type === "client" ? booking.carerName.split(",")[0] : booking.clientInitials}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-white p-3 shadow-lg rounded-md border">
          <div className="space-y-1.5">
            <div className="font-semibold text-sm">{type === "client" ? booking.carerName : booking.clientName}</div>
            <div className="flex items-center text-xs text-gray-600">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>{booking.startTime} - {booking.endTime}</span>
              <span className="mx-1.5">·</span>
              <span>{formatDate(booking.date)}</span>
            </div>
            <div className={`text-xs py-0.5 px-1.5 rounded-full inline-flex ${statusColors[booking.status]}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </div>
            {booking.notes && (
              <div className="text-xs mt-1 text-gray-600">{booking.notes}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  // Vertical display mode (not used directly, handled in BookingTimeGrid)
  return null;
};
