
import React from "react";
import { Booking } from "./BookingTimeGrid";

interface BookingEntryProps {
  booking: Booking;
  startPos: number;
  width: number;
  type: "client" | "carer";
}

export const BookingEntry: React.FC<BookingEntryProps> = ({
  booking,
  startPos,
  width,
  type
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
  
  return (
    <div 
      className={`absolute top-1.5 bottom-1.5 rounded shadow-sm border ${backgroundColor} hover:shadow-md transition-shadow cursor-pointer text-xs z-10`}
      style={{ 
        left: `${startPos}%`,
        width: `${width}%`,
        minWidth: "25px"
      }}
    >
      <div className="p-1 overflow-hidden h-full flex flex-col">
        <div className="font-medium truncate">
          {booking.startTime}-{booking.endTime}
        </div>
        <div className="truncate mt-auto">
          {type === "client" ? booking.carerName.split(",")[0] : booking.clientInitials}
        </div>
      </div>
    </div>
  );
};
