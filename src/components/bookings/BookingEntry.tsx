import React from "react";
import { Booking } from "./BookingTimeGrid";
import { Clock, Info, MapPin, Phone, User, PoundSterling, FileText, AlertCircle } from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Draggable } from "react-beautiful-dnd";

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
  index: number;
  onEditBooking?: (booking: Booking) => void;
  onViewBooking?: (booking: Booking) => void;
  isHighlighted?: boolean;
}

export const BookingEntry: React.FC<BookingEntryProps> = ({
  booking,
  startPos = 0,
  width = 100,
  type = "client",
  displayMode = "horizontal",
  position,
  index,
  onEditBooking,
  onViewBooking,
  isHighlighted = false
}) => {
  // Determine background color based on status
  const statusColors = {
    assigned: "bg-green-100 border-green-300 text-green-800",
    unassigned: "bg-amber-100 border-amber-400 border-2 text-amber-900", // Enhanced styling for unassigned
    done: "bg-blue-100 border-blue-300 text-blue-800",
    "in-progress": "bg-purple-100 border-purple-300 text-purple-800",
    cancelled: "bg-red-100 border-red-300 text-red-800",
    departed: "bg-teal-100 border-teal-300 text-teal-800",
    suspended: "bg-gray-100 border-gray-300 text-gray-800"
  };
  
  const backgroundColor = statusColors[booking.status];
  
  // Apply highlight styles if this booking is highlighted
  const highlightClasses = isHighlighted ? 
    "ring-4 ring-amber-400 ring-opacity-75 shadow-lg animate-pulse" : "";
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric" 
    });
  };
  
  // Calculate booking duration (handles overnight bookings)
  const calculateDuration = () => {
    const [startHour, startMin] = booking.startTime.split(':').map(Number);
    const [endHour, endMin] = booking.endTime.split(':').map(Number);
    
    let durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    
    // Handle overnight bookings (when end time is earlier than start time)
    if (durationMinutes < 0) {
      durationMinutes += 1440; // Add 24 hours (1440 minutes)
    }
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  };

  // Enhanced tooltip content
  const renderTooltipContent = () => {
    const isClientView = type === "client";
    const primaryPerson = isClientView ? booking.carerName : booking.clientName;
    const primaryInitials = isClientView ? booking.carerInitials : booking.clientInitials;
    const secondaryPerson = isClientView ? booking.clientName : booking.carerName;
    const secondaryInitials = isClientView ? booking.clientInitials : booking.carerInitials;

    return (
      <div className="space-y-3 min-w-0">
        {/* Header with primary person */}
        <div className="border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              isClientView ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {primaryInitials}
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-900">{primaryPerson}</div>
              <div className="text-xs text-gray-500">{isClientView ? 'Assigned Carer' : 'Client'}</div>
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <div className="font-medium text-gray-700">
              {booking.startTime} - {booking.endTime}
            </div>
            <div className="text-gray-500">({calculateDuration()})</div>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <div className="text-gray-600">
              {isClientView ? 'Client' : 'Carer'}: <span className="font-medium">{secondaryPerson}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="w-3.5 h-3.5 flex items-center justify-center">
              📅
            </div>
            <div className="text-gray-600">{formatDate(booking.date)}</div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-xs py-1 px-2 rounded-full ${statusColors[booking.status]}`}>
            {booking.status === 'in-progress' && <div className="w-2 h-2 bg-current rounded-full animate-pulse" />}
            {booking.status === 'unassigned' && <AlertCircle className="h-3 w-3 text-amber-600" />}
            {booking.status === 'cancelled' && <AlertCircle className="h-3 w-3" />}
            {booking.status === 'done' && <div className="w-2 h-2 bg-current rounded-full" />}
            <span className="font-medium">
              {booking.status === 'unassigned' 
                ? 'Unassigned - Carer Needed' 
                : booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('-', ' ')
              }
            </span>
          </div>
        </div>

        {/* Additional Information */}
        {booking.notes && (
          <div className="border-t border-gray-100 pt-2">
            <div className="flex items-start gap-2 text-xs">
              <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="text-gray-600 leading-relaxed">{booking.notes}</div>
            </div>
          </div>
        )}

        {/* Action Hint */}
        <div className="border-t border-gray-100 pt-2">
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Click to view • Shift+Click to edit
          </div>
        </div>
      </div>
    );
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if shift key is pressed for edit mode
    if (e.shiftKey && onEditBooking) {
      onEditBooking(booking);
    } else if (onViewBooking) {
      onViewBooking(booking);
    }
  };
  
  // If position is provided, use it (vertical view)
  if (position) {
    return (
      <Draggable draggableId={booking.id} index={index}>
        {(provided, snapshot) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`absolute rounded shadow-sm border ${backgroundColor} hover:shadow-md transition-shadow cursor-move text-xs z-10 ${snapshot.isDragging ? 'opacity-70 shadow-lg' : ''} ${highlightClasses}`}
                style={{ 
                  top: `${position.top}px`,
                  height: `${position.height}px`,
                  left: '2px',
                  right: '2px',
                  ...provided.draggableProps.style
                }}
                onClick={handleClick}
              >
                <div className="p-1 overflow-hidden h-full flex flex-col">
                  <div className="font-medium truncate flex items-center">
                    {booking.status === 'unassigned' && <AlertCircle className="h-3 w-3 mr-1 text-amber-600" />}
                    <span>{booking.startTime}-{booking.endTime}</span>
                    <Info className="h-3 w-3 ml-1 opacity-60" />
                  </div>
                  <div className="truncate mt-auto">
                    {booking.status === 'unassigned' 
                      ? 'Needs Carer Assignment' 
                      : (type === "client" ? booking.carerName.split(",")[0] : booking.clientInitials)
                    }
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipPrimitive.Portal>
              <TooltipContent 
                side="top" 
                sideOffset={30}
                avoidCollisions={true}
                sticky="always"
                alignOffset={0}
                className="max-w-sm bg-popover text-popover-foreground border border-border shadow-lg rounded-md p-4 z-[10000] fixed"
              >
                {renderTooltipContent()}
              </TooltipContent>
            </TooltipPrimitive.Portal>
          </Tooltip>
        )}
      </Draggable>
    );
  }
  
  // Only render horizontal booking entry in daily view
  if (displayMode === "horizontal") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`absolute top-1.5 bottom-1.5 rounded shadow-sm border ${backgroundColor} hover:shadow-md transition-shadow cursor-pointer text-xs z-10 ${highlightClasses}`}
            style={{ 
              left: `${startPos}%`,
              width: `${width}%`,
              minWidth: "25px"
            }}
            onClick={handleClick}
          >
            <div className="p-1 overflow-hidden h-full flex flex-col">
              <div className="font-medium truncate flex items-center">
                {booking.status === 'unassigned' && <AlertCircle className="h-3 w-3 mr-1 text-amber-600" />}
                <span>{booking.startTime}-{booking.endTime}</span>
                {width > 10 && (
                  <Info className="h-3 w-3 ml-1 opacity-60" />
                )}
              </div>
              <div className="truncate mt-auto">
                {booking.status === 'unassigned' 
                  ? 'Needs Carer Assignment' 
                  : (type === "client" ? booking.carerName.split(",")[0] : booking.clientInitials)
                }
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipPrimitive.Portal>
          <TooltipContent 
            side="top" 
            sideOffset={30}
            avoidCollisions={true}
            sticky="always"
            alignOffset={0}
            className="max-w-sm bg-popover text-popover-foreground border border-border shadow-lg rounded-md p-4 z-[10000] fixed"
          >
            {renderTooltipContent()}
          </TooltipContent>
        </TooltipPrimitive.Portal>
      </Tooltip>
    );
  }
  
  // Vertical display mode (not used directly, handled in BookingTimeGrid)
  return null;
};
