import React from "react";
import { Booking } from "./BookingTimeGrid";
import { Clock, Info, MapPin, Phone, User, PoundSterling, FileText, AlertCircle, StickyNote, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Draggable } from "react-beautiful-dnd";
import { getEffectiveBookingStatus, getBookingStatusColor } from "./utils/bookingColors";

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
  // Determine if booking requires reassignment
  const needsReassignment = booking.unavailability_request && (
    booking.unavailability_request.status === 'pending' || 
    booking.unavailability_request.status === 'approved'
  );

  // Determine if booking has pending change requests
  const hasPendingCancellation = booking.cancellation_request_status === 'pending';
  const hasPendingReschedule = booking.reschedule_request_status === 'pending';

  // Check for late/missed status
  const isLateStart = booking.is_late_start === true;
  const isMissed = booking.is_missed === true;

  // Determine background color based on status
  const statusColors = {
    assigned: "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200",
    unassigned: "bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600 border-2 text-amber-900 dark:text-amber-200",
    done: "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200",
    "in-progress": "bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200",
    cancelled: "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200",
    departed: "bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200",
    suspended: "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200",
    // Late/missed colors
    late: "bg-amber-100 dark:bg-amber-900/40 border-amber-500 dark:border-amber-500 border-l-4 text-amber-900 dark:text-amber-200",
    missed: "bg-red-100 dark:bg-red-900/40 border-red-500 dark:border-red-500 border-l-4 text-red-900 dark:text-red-200",
  };
  
  // Color coding for change requests with prominent left borders
  const getBookingColor = () => {
    if (hasPendingCancellation) {
      return "bg-red-50 border-red-500 border-l-4 text-red-900"; // RED for cancellation with thick left border
    }
    if (hasPendingReschedule) {
      return "bg-orange-50 border-orange-500 border-l-4 text-orange-900"; // ORANGE for reschedule with thick left border
    }
    if (needsReassignment) {
      return "bg-amber-50 border-amber-400 border-2 text-amber-900";
    }
    // Check for late/missed status using the helper
    if (isMissed) {
      return statusColors.missed;
    }
    if (isLateStart) {
      return statusColors.late;
    }
    return statusColors[booking.status];
  };
  
  const backgroundColor = getBookingColor();
  
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
    // Handle unassigned bookings - show "Not Assigned" instead of "(Unknown Carer)"
    const isUnassigned = !booking.carerId || booking.status === 'unassigned';
    
    // Check for multiple carers (from merged booking data)
    const allCarerNames = (booking as any).allCarerNames as string[] | undefined;
    const hasMultipleCarers = allCarerNames && allCarerNames.length > 1;
    
    const primaryPerson = isClientView 
      ? (isUnassigned ? 'Not Assigned' : (hasMultipleCarers ? `${allCarerNames.length} Carers` : booking.carerName)) 
      : booking.clientName;
    const primaryInitials = isClientView 
      ? (isUnassigned ? '—' : (hasMultipleCarers ? `${allCarerNames.length}` : booking.carerInitials)) 
      : booking.clientInitials;
    const secondaryPerson = isClientView ? booking.clientName : (isUnassigned ? 'Not Assigned' : booking.carerName);
    const secondaryInitials = isClientView ? booking.clientInitials : (isUnassigned ? '—' : booking.carerInitials);

    return (
      <div className="space-y-3 min-w-0">
        {/* Header with primary person */}
        <div className="border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              isClientView 
                ? (isUnassigned ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' : (hasMultipleCarers ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'))
                : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
            }`}>
              {primaryInitials}
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground">{primaryPerson}</div>
              <div className="text-xs text-muted-foreground">
                {isClientView 
                  ? (isUnassigned ? 'Carer Status' : (hasMultipleCarers ? 'Assigned Carers' : 'Assigned Carer')) 
                  : 'Client'
                }
              </div>
            </div>
          </div>
          
          {/* Show all carers if multiple */}
          {hasMultipleCarers && (
            <div className="mt-2 flex flex-wrap gap-1">
              {allCarerNames.map((name, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                >
                  {name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Appointment Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <div className="font-medium text-foreground">
              {booking.startTime} - {booking.endTime}
            </div>
            <div className="text-muted-foreground">({calculateDuration()})</div>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <div className="text-muted-foreground">
              {isClientView ? 'Client' : 'Carer'}: <span className="font-medium text-foreground">{secondaryPerson}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="w-3.5 h-3.5 flex items-center justify-center">
              📅
            </div>
            <div className="text-muted-foreground">{formatDate(booking.date)}</div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-xs py-1 px-2 rounded-full ${statusColors[booking.status]}`}>
            {booking.status === 'in-progress' && <div className="w-2 h-2 bg-current rounded-full animate-pulse" />}
            {booking.status === 'unassigned' && <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />}
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

        {/* Request Status */}
        {(hasPendingCancellation || hasPendingReschedule) && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              {hasPendingCancellation && (
                <>
                  <XCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                  <span className="text-xs font-medium text-red-700 dark:text-red-300">
                    Client requested cancellation
                  </span>
                </>
              )}
              {hasPendingReschedule && (
                <>
                  <RefreshCw className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" />
                  <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                    Client requested reschedule
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Additional Information */}
        {booking.notes && (
          <div className="border-t border-border pt-2">
            <div className="flex items-start gap-2 text-xs">
              <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-muted-foreground leading-relaxed">{booking.notes}</div>
            </div>
          </div>
        )}

        {/* Action Hint */}
        <div className="border-t border-border pt-2">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
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
            {/* Request indicator badge */}
            {(hasPendingCancellation || hasPendingReschedule) && (
              <div className="absolute top-1 right-1">
                <div className={`w-2 h-2 rounded-full ${
                  hasPendingCancellation ? 'bg-red-500' : 'bg-orange-500'
                } animate-pulse`} />
              </div>
            )}
            {booking.notes && !hasPendingCancellation && !hasPendingReschedule && (
              <div 
                className="absolute top-1 right-1 z-10 pointer-events-none"
                title="Has notes"
              >
                <div className="bg-blue-600 text-white rounded-full p-0.5 shadow-sm">
                  <StickyNote className="h-3 w-3" />
                </div>
              </div>
            )}
            <div className="p-1 overflow-hidden h-full flex flex-col">
              {needsReassignment && (
                <div className="flex items-center gap-1 bg-amber-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold mb-1">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {booking.unavailability_request?.status === 'pending' ? 'Reassign Pending' : 'Reassign Required'}
                </div>
              )}
              {hasPendingCancellation && (
                <div className="flex items-center gap-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold mb-1">
                  <XCircle className="h-2.5 w-2.5" />
                  Cancel Request
                </div>
              )}
              {hasPendingReschedule && (
                <div className="flex items-center gap-1 bg-orange-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold mb-1">
                  <RefreshCw className="h-2.5 w-2.5" />
                  Reschedule Request
                </div>
              )}
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
            {/* Request indicator badge */}
            {(hasPendingCancellation || hasPendingReschedule) && (
              <div className="absolute top-1 right-1">
                <div className={`w-2 h-2 rounded-full ${
                  hasPendingCancellation ? 'bg-red-500' : 'bg-orange-500'
                } animate-pulse`} />
              </div>
            )}
            {booking.notes && !hasPendingCancellation && !hasPendingReschedule && (
              <div 
                className="absolute top-1 right-1 z-10 pointer-events-none"
                title="Has notes"
              >
                <div className="bg-blue-600 text-white rounded-full p-0.5 shadow-sm">
                  <StickyNote className="h-3 w-3" />
                </div>
              </div>
            )}
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
