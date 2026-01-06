import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingEntry } from "./BookingEntry";
import { EntitySelector } from "./EntitySelector";
import { EntityList } from "./EntityList";
import { BookingContextMenu } from "./BookingContextMenu";
import { EditBookingDialog } from "./dialogs/EditBookingDialog";
import { BookingsMonthView } from "./BookingsMonthView";

import { Maximize2, Minimize2, Calendar, Clock, AlertCircle } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import { toast } from "sonner";
import "@/styles/bookings.css";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Allow window property for pointer Y coordinate tracking (for react-beautiful-dnd workaround)
declare global {
  interface Window {
    _lastBookingPointerY?: number;
  }
}

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  clientInitials: string;
  carerId: string;
  carerName: string;
  carerInitials: string;
  startTime: string; // Format: "07:30"
  endTime: string; // Format: "08:00"
  date: string; // Format: "2023-05-15"
  status: "assigned" | "unassigned" | "done" | "in-progress" | "cancelled" | "departed" | "suspended";
  notes?: string;
  // Raw database fields for EditBookingDialog compatibility
  start_time?: string;  // ISO format
  end_time?: string;    // ISO format
  service_id?: string;
  service_ids?: string[]; // Multiple services from junction table
  branch_id?: string;
  client_id?: string;
  unavailability_request?: {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'reassigned';
    reason: string;
    notes?: string;
    requested_at: string;
    reviewed_at?: string;
    admin_notes?: string;
  } | null;
  cancellation_request_status?: 'pending' | 'approved' | 'rejected' | null;
  reschedule_request_status?: 'pending' | 'approved' | 'rejected' | null;
  visit_records?: Array<{
    id: string;
    visit_start_time: string | null;
    visit_end_time: string | null;
    status: string;
  }>;
  // Address fields
  location_address?: string | null;
  clientAddress?: string;
  // Late/missed booking fields
  is_late_start?: boolean | null;
  is_missed?: boolean | null;
  late_start_minutes?: number | null;
}

export interface Client {
  id: string;
  name: string;
  initials: string;
  bookingCount: number;
  bookings?: Booking[];
  address?: string;
}

export interface Carer {
  id: string;
  name: string;
  initials: string;
  status?: string;
  bookingCount: number;
  bookings?: Booking[];
}

interface BookingTimeGridProps {
  date: Date;
  bookings: Booking[];
  clients: Client[];
  carers: Carer[];
  services?: Array<{ id: string; title: string }>;
  viewType: "daily" | "weekly" | "monthly";
  viewMode: "client" | "group";
  branchId?: string; // Add branchId for debug panel
  onCreateBooking?: (date: Date, time: string, clientId?: string, carerId?: string) => void;
  onUpdateBooking?: (booking: Booking, carers: Carer[]) => void;
  onEditBooking?: (booking: Booking) => void;
  onViewBooking?: (booking: Booking) => void;
  onRequestViewTypeChange?: (viewType: "daily" | "weekly" | "monthly") => void;
  isUpdatingBooking?: boolean;
  isCheckingOverlap?: boolean;
  highlightedBookingId?: string | null;
}

interface PendingBookingMove {
  booking: Booking;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  originalDate: string;
  originalStartTime: string;
  originalEndTime: string;
}

export const BookingTimeGrid: React.FC<BookingTimeGridProps> = ({
  date,
  bookings,
  clients,
  carers,
  services = [],
  viewType,
  viewMode,
  branchId,
  onCreateBooking,
  onUpdateBooking,
  onEditBooking,
  onViewBooking,
  onRequestViewTypeChange,
  isUpdatingBooking,
  isCheckingOverlap = false,
  highlightedBookingId = null,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedCarerId, setSelectedCarerId] = useState<string | null>(null);
  const [showHalfHours, setShowHalfHours] = useState(true);
  const [contextMenuTime, setContextMenuTime] = useState("08:00");
  const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);
  const [editBookingDialogOpen, setEditBookingDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // New state for confirmation dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingBookingMove, setPendingBookingMove] = useState<PendingBookingMove | null>(null);

  useEffect(() => {
    setLocalBookings(bookings);
    
    // Debug booking updates
    console.log(`[BookingTimeGrid] Bookings updated: ${bookings.length} total bookings`);
    if (bookings.length > 0) {
      console.log('[BookingTimeGrid] Sample booking dates:', 
        bookings.slice(0, 5).map(b => ({ id: b.id, date: b.date }))
      );
    }
  }, [bookings]);

  const gridRef = useRef<HTMLDivElement>(null);

  // Only define these ONCE!
  // Height per hour - must match CSS values for each view type
  const hourHeight = viewType === "weekly" ? 50 : 60; // weekly=50px, daily=60px (matches CSS)
  const timeInterval = 30; // time interval in minutes (30 = half hour intervals)
  const timeSlots = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, '0') + ":00"
  );

  // Ensure we have a valid date
  const validDate = date && !isNaN(date.getTime()) ? date : new Date();

  const getWeekDates = () => {
    const weekStart = startOfWeek(validDate, { weekStartsOn: 1 }); // Monday as start of week
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };
  
  const weekDates = getWeekDates();

  // Helper to check if a booking is in the current view range
  const isBookingInViewRange = (booking: Booking): boolean => {
    if (!booking.date) return false;
    
    if (viewType === "daily") {
      return booking.date === format(validDate, 'yyyy-MM-dd');
    } else if (viewType === "weekly") {
      return weekDates.some(d => booking.date === format(d, 'yyyy-MM-dd'));
    }
    // Monthly - check if in same month
    const bookingMonth = booking.date.substring(0, 7); // "YYYY-MM"
    const currentMonth = format(validDate, 'yyyy-MM');
    return bookingMonth === currentMonth;
  };

  // Auto-select first client with bookings for the current view if none selected
  useEffect(() => {
    if (!selectedClientId && clients.length > 0 && bookings.length > 0) {
      // Find clients that have bookings in the current view range
      const clientsWithVisibleBookings = clients.filter(client => 
        bookings.some(b => b.clientId === client.id && isBookingInViewRange(b))
      );
      
      if (clientsWithVisibleBookings.length > 0) {
        console.log(`[BookingTimeGrid] Auto-selecting client with visible bookings: ${clientsWithVisibleBookings[0].name}`);
        setSelectedClientId(clientsWithVisibleBookings[0].id);
      } else {
        // Fallback: select first client with any bookings
        const clientsWithAnyBookings = clients.filter(client => 
          bookings.some(b => b.clientId === client.id)
        );
        if (clientsWithAnyBookings.length > 0) {
          console.log(`[BookingTimeGrid] Auto-selecting client with any bookings: ${clientsWithAnyBookings[0].name}`);
          setSelectedClientId(clientsWithAnyBookings[0].id);
        } else if (clients.length > 0) {
          console.log(`[BookingTimeGrid] Auto-selecting first client: ${clients[0].name}`);
          setSelectedClientId(clients[0].id);
        }
      }
    }
  }, [clients, bookings, selectedClientId, viewType, validDate, weekDates]);

  // Auto-select first carer with bookings for the current view if none selected
  useEffect(() => {
    if (!selectedCarerId && carers.length > 0 && bookings.length > 0) {
      // Find carers that have bookings in the current view range
      const carersWithVisibleBookings = carers.filter(carer => 
        bookings.some(b => b.carerId === carer.id && isBookingInViewRange(b))
      );
      
      if (carersWithVisibleBookings.length > 0) {
        console.log(`[BookingTimeGrid] Auto-selecting carer with visible bookings: ${carersWithVisibleBookings[0].name}`);
        setSelectedCarerId(carersWithVisibleBookings[0].id);
      } else {
        // Fallback: select first carer with any bookings
        const carersWithAnyBookings = carers.filter(carer => 
          bookings.some(b => b.carerId === carer.id)
        );
        if (carersWithAnyBookings.length > 0) {
          console.log(`[BookingTimeGrid] Auto-selecting carer with any bookings: ${carersWithAnyBookings[0].name}`);
          setSelectedCarerId(carersWithAnyBookings[0].id);
        } else if (carers.length > 0) {
          console.log(`[BookingTimeGrid] Auto-selecting first carer: ${carers[0].name}`);
          setSelectedCarerId(carers[0].id);
        }
      }
    }
  }, [carers, bookings, selectedCarerId, viewType, validDate, weekDates]);
  
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    
    if (!isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullScreen) {
        toggleFullScreen();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isFullScreen]);
  
  const clientBookings = clients.map(client => {
    return {
      ...client,
      bookings: localBookings.filter(booking => booking.clientId === client.id)
    };
  });
  
  const carerBookings = carers.map(carer => {
    return {
      ...carer,
      bookings: localBookings.filter(booking => booking.carerId === carer.id)
    };
  });
  
  const displayedClient = selectedClientId 
    ? clientBookings.find(c => c.id === selectedClientId)
    : null;
    
  const displayedCarer = selectedCarerId
    ? carerBookings.find(c => c.id === selectedCarerId)
    : null;
  
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear();
  };
  
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return hours * hourHeight + (minutes / 60) * hourHeight;
  };

  const isBookingOnDate = (booking: Booking, checkDate: Date) => {
    if (!booking.date) {
      console.warn(`[isBookingOnDate] No date for booking ${booking.id}`);
      return false;
    }
    
    try {
      // Convert checkDate to YYYY-MM-DD format for direct string comparison
      const checkDateString = format(checkDate, 'yyyy-MM-dd');
      
      // Direct string comparison - more reliable than date parsing
      const result = booking.date === checkDateString;
      
      return result;
    } catch (error) {
      console.error(`[isBookingOnDate] Error comparing dates for booking ${booking.id}:`, error, { 
        bookingDate: booking.date, 
        checkDate: checkDate 
      });
      return false;
    }
  };
  
  useEffect(() => {
    if (gridRef.current) {
      const currentHour = new Date().getHours();
      const scrollTarget = Math.max(0, (currentHour - 2) * hourHeight);
      
      if ((viewType === "weekly" && weekDates.some(d => isToday(d))) || 
          (viewType === "daily" && isToday(validDate))) {
        gridRef.current.scrollTop = scrollTarget;
      }
    }
  }, [viewType, validDate, hourHeight, weekDates]);
  
  const getBookingPosition = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startPosition = startHour * hourHeight + (startMin / 60) * hourHeight;
    const endPosition = endHour * hourHeight + (endMin / 60) * hourHeight;
    const height = endPosition - startPosition;
    
    return { top: startPosition, height };
  };

  const getTimeFromPosition = (yPosition: number): string => {
    // Calculate total minutes from Y position
    const totalMinutes = Math.floor((yPosition / hourHeight) * 60);
    
    // Extract hours and initial minutes
    let hours = Math.floor(totalMinutes / 60);
    let minutes = totalMinutes % 60;
    
    // Round minutes to nearest interval (typically 30 minutes)
    const roundedMinutes = Math.round(minutes / timeInterval) * timeInterval;
    
    // Handle overflow when minutes are rounded up
    if (roundedMinutes === 60) {
      hours += 1;
      minutes = 0;
    } else {
      minutes = roundedMinutes;
    }
    
    // Ensure hours are within 0-23 range
    hours = hours % 24;
    
    // Format the time string
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleContextMenuBooking = (date: Date, time: string) => {
    if (onCreateBooking) {
      onCreateBooking(date, time, selectedClientId || undefined, selectedCarerId || undefined);
    }
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleCarerSelect = (carerId: string) => {
    setSelectedCarerId(carerId);
  };

  const handleContextMenuOpen = (e: React.MouseEvent, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const time = getTimeFromPosition(y);
    setContextMenuTime(time);
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditBookingDialogOpen(true);
  };

  // Use the overlap-aware update handler passed from parent
  const handleUpdateBooking = (updatedBooking: Booking) => {
    // Update local state for immediate UI feedback
    const updatedBookings = localBookings.map(b => 
      b.id === updatedBooking.id ? updatedBooking : b
    );
    setLocalBookings(updatedBookings);
    
    // Use the parent's overlap-aware update handler
    if (onUpdateBooking) {
      onUpdateBooking(updatedBooking, carers);
    }
  };

  // -- DRAG AND DROP LOGIC UPGRADE --
  // Instead of mapping drop zone by "fake index", snap bookings to nearest time slot. All times are valid.

  // Each 30-minute interval in the calendar is a valid drop slot. We'll calculate y offset against "hourHeight".
  // On drop, we estimate the intended time by relating the offset to the interval.

  // Helper: get total number of time slots in the day
  const timeSlotsPerDay = 24 * (60 / timeInterval);

  const getBookingPositionFromDrop = (y: number) => {
    // Snap Y to nearest 30-min grid
    const slotHeight = hourHeight / (60 / timeInterval); // 30min = 30px if 60px = 1hr
    let slotIdx = Math.round(y / slotHeight);
    let hours = Math.floor(slotIdx * timeInterval / 60);
    let mins = (slotIdx * timeInterval) % 60;
    // Clamp to valid times
    hours = Math.max(6, Math.min(21, hours)) // booking window 06:00-21:59
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // MAIN: handle drag. Instead of using the destination.index (which can be random), we use the y coordinate over the calendar and snap it.
  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    // Get the DOM slot for the drop
    const droppable = document.querySelector(`[data-rbd-droppable-id="${destination.droppableId}"]`);
    if (!droppable) return;

    // Get Y offset within the droppable slot
    const bounding = droppable.getBoundingClientRect();
    // Use last stored pointer coords or fallback to center of slot
    let y = 0;
    if (typeof window._lastBookingPointerY !== 'undefined') {
      y = window._lastBookingPointerY - bounding.top;
    } else {
      // fallback: place to center
      y = bounding.height / 2;
    }
    const newStartTime = getBookingPositionFromDrop(y);

    const booking = localBookings.find(b => b.id === draggableId);
    if (!booking) return;

    let bkDate = booking.date;
    const parts = destination.droppableId.split('-');
    const type = parts[0];
    let dateStr = parts?.[1] || '';
    if (viewType === "weekly") {
      const idx = parseInt(dateStr, 10);
      if (!isNaN(idx) && idx >= 0 && idx < weekDates.length) {
        // Bugfix: use date-fns format (local date) not UTC
        bkDate = format(weekDates[idx], 'yyyy-MM-dd');
      }
    } else {
      bkDate = format(date, 'yyyy-MM-dd');
    }

    const [sh, sm] = booking.startTime.split(":").map(Number);
    const [eh, em] = booking.endTime.split(":").map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);

    let [nh, nm] = newStartTime.split(":").map(Number);
    let newEnd = nh * 60 + nm + duration;
    let endHour = Math.floor(newEnd / 60);
    let endMin = newEnd % 60;
    if (endHour > 22) {
      endHour = 22;
      endMin = 0;
    }
    const newEndTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    setPendingBookingMove({
      booking,
      newDate: bkDate,
      newStartTime,
      newEndTime,
      originalDate: booking.date,
      originalStartTime: booking.startTime,
      originalEndTime: booking.endTime
    });
    setConfirmDialogOpen(true);
    delete window._lastBookingPointerY;
  };

  // -- Listen for mouse move for pointer Y coordinate (hack for rbd) --
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      window._lastBookingPointerY = e.clientY;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const handleConfirmBookingMove = () => {
    if (!pendingBookingMove) return;
    
    const { booking, newDate, newStartTime, newEndTime } = pendingBookingMove;
    
    const updatedBooking = {
      ...booking,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime
    };
    
    const updatedBookings = localBookings.map(b => b.id === booking.id ? updatedBooking : b);
    setLocalBookings(updatedBookings);
    
    if (onUpdateBooking) {
      onUpdateBooking(updatedBooking, carers);
      toast.success(`Booking updated: ${updatedBooking.startTime} - ${updatedBooking.endTime}`);
    }
    
    setConfirmDialogOpen(false);
    setPendingBookingMove(null);
  };

  // Function to cancel booking move
  const handleCancelBookingMove = () => {
    setConfirmDialogOpen(false);
    setPendingBookingMove(null);
  };

  // Format date for display
  const formatBookingDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'EEE, MMM d, yyyy');
  };

  const renderCalendar = (entityType: "client" | "carer", entity: Client | Carer | null) => {
    const entityList = entityType === "client" ? clients : carers;
    const entityBookings = entityType === "client" ? clientBookings : carerBookings;
    const totalBookingsForType = entityBookings.reduce((sum, e) => sum + (e.bookings?.length || 0), 0);
    
    if (!entity) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-muted/50 border border-border rounded-md p-6">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm font-medium text-center">
            Select a {entityType} from the list to view their schedule
          </p>
          <p className="text-muted-foreground text-xs mt-2 text-center">
            {entityList.length} {entityType}s • {totalBookingsForType} bookings
          </p>
        </div>
      );
    }

    // Calculate filtered booking count based on view type
    const getFilteredBookingsCount = () => {
      if (!entity?.bookings) return 0;
      
      if (viewType === "daily") {
        return entity.bookings.filter(b => isBookingOnDate(b, date)).length;
      } else if (viewType === "weekly") {
        return entity.bookings.filter(b => 
          weekDates.some(weekDate => isBookingOnDate(b, weekDate))
        ).length;
      }
      return entity.bookings.length; // Monthly shows all
    };

    const filteredBookingsCount = getFilteredBookingsCount();

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={`booking-view ${viewType === "weekly" ? "weekly-view" : "daily-view"} h-full`}>
          <div className={`entity-header p-2 rounded-md ${entityType === "client" ? 'bg-accent' : 'bg-accent'}`}>
            <div className="flex items-center">
              <div className={`h-8 w-8 rounded-full ${entityType === "client" ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'} flex items-center justify-center text-sm font-medium mr-2`}>
                {entity.initials}
              </div>
              <div className="text-sm font-medium text-foreground">{entity.name}</div>
              <Badge 
                variant="outline" 
                className={`ml-2 ${
                  entityType === "client" 
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                    : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                } text-xs font-medium`}
              >
                {filteredBookingsCount} bookings
              </Badge>
            </div>
          </div>
                    
          <div className="booking-grid-container" ref={gridRef}>
            <div className="booking-scroll-container">
              <div className="time-column">
                {/* Add spacer for weekly view to align with day headers */}
                {viewType === "weekly" && (
                  <div className="time-column-header">
                    <span className="text-xs text-muted-foreground">Time</span>
                  </div>
                )}
                {timeSlots.map((time, index) => (
                  <div key={index} className="time-slot">
                    <span>{time}</span>
                  </div>
                ))}
              </div>
                        
              {viewType === "daily" ? (
                <div className="day-columns">
                  <div className="day-column">
                    <BookingContextMenu 
                      date={date} 
                      time={contextMenuTime} 
                      onCreateBooking={(date, time) => handleContextMenuBooking(date, time)}
                    >
                      <Droppable 
                        droppableId={`${entityType}-${format(date, 'yyyy-MM-dd')}`} 
                        type="booking"
                        direction="vertical"
                      >
                        {(provided, snapshot) => (
                          <div 
                            className={`day-content ${snapshot.isDraggingOver ? 'bg-muted/50' : ''}`}
                            onContextMenu={(e) => handleContextMenuOpen(e, e.currentTarget)}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            data-rbd-droppable-id={`${entityType}-${format(date, 'yyyy-MM-dd')}`}
                          >
                        {timeSlots.map((_, timeIndex) => (
                          <div key={timeIndex} className="hour-cell"></div>
                        ))}
                              
                         {(() => {
                           const filteredBookings = entity.bookings?.filter(booking => isBookingOnDate(booking, date)) || [];
                           
                           // Debug logging to understand the data
                           if (entity.bookings && entity.bookings.length > 0 && filteredBookings.length === 0) {
                             const sampleDates = entity.bookings.slice(0, 5).map(b => b.date);
                             console.warn(`[BookingTimeGrid] Daily view - ${entity.name} has ${entity.bookings.length} total bookings but 0 for ${format(date, 'yyyy-MM-dd')}. Sample dates:`, sampleDates);
                           }
                           
                           return filteredBookings.map((booking, index) => {
                          const position = getBookingPosition(booking.startTime, booking.endTime);
                                
                          return (
                            <BookingEntry
                              key={booking.id}
                              booking={booking}
                              position={position}
                              type={entityType}
                              index={index}
                              onEditBooking={handleEditBooking}
                              onViewBooking={onViewBooking}
                              isHighlighted={booking.id === highlightedBookingId}
                            />
                           );
                         });
                         })()}
                               
                         {isToday(date) && (
                          <div 
                            className="current-time-line" 
                            style={{ top: `${getCurrentTimePosition()}px` }}
                          >
                            <span className="current-time-label">
                              {format(currentTime, 'HH:mm')}
                            </span>
                          </div>
                        )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </BookingContextMenu>
                  </div>
                </div>
              ) : (
                <div className="day-columns">
                  {weekDates.map((day, dayIndex) => (
                    <div key={dayIndex} className={`day-column ${isToday(day) ? 'today' : ''}`}>
                      <div className="day-header">
                        <div className="day-name">{format(day, 'EEE')}</div>
                        <div className="day-date">{format(day, 'd')}</div>
                      </div>
                      
                      <BookingContextMenu 
                        date={day} 
                        time={contextMenuTime}
                        onCreateBooking={(date, time) => handleContextMenuBooking(date, time)}
                      >        
                        <Droppable 
                          droppableId={`${entityType}-${dayIndex}`} 
                          type="booking"
                          direction="vertical"
                        >
                          {(provided, snapshot) => (
                            <div 
                              className={`day-content ${snapshot.isDraggingOver ? 'bg-muted/50' : ''}`}
                              onContextMenu={(e) => handleContextMenuOpen(e, e.currentTarget)}
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              data-rbd-droppable-id={`${entityType}-${dayIndex}`}
                            >
                              {timeSlots.map((_, timeIndex) => (
                                <div key={timeIndex} className="hour-cell"></div>
                              ))}
                                      
                               {(() => {
                                 const filteredBookings = entity.bookings?.filter(booking => isBookingOnDate(booking, day)) || [];
                                 
                                 return filteredBookings.map((booking, index) => {
                                const position = getBookingPosition(booking.startTime, booking.endTime);
                                        
                                return (
                                  <BookingEntry
                                    key={booking.id}
                                    booking={booking}
                                    position={position}
                                    type={entityType}
                                    index={index}
                                    onEditBooking={handleEditBooking}
                                    onViewBooking={onViewBooking}
                                    isHighlighted={booking.id === highlightedBookingId}
                                  />
                                 );
                               });
                               })()}
                                       
                               {isToday(day) && (
                                <div 
                                  className="current-time-line" 
                                  style={{ top: `${getCurrentTimePosition()}px` }}
                                >
                                  <span className="current-time-label">
                                    {format(currentTime, 'HH:mm')}
                                  </span>
                                </div>
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </BookingContextMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DragDropContext>
    );
  };

  // For monthly view, use the dedicated BookingsMonthView component with entity lists
  if (viewType === "monthly") {
    // Filter bookings based on selected client/carer
    const filteredMonthlyBookings = localBookings.filter(booking => {
      const matchesClient = !selectedClientId || booking.clientId === selectedClientId;
      const matchesCarer = !selectedCarerId || booking.carerId === selectedCarerId;
      return matchesClient && matchesCarer;
    });

    return (
      <div className="bg-card rounded-lg border border-border shadow-sm">
        {/* Header with date range */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {format(validDate, 'MMMM yyyy')}
            </span>
          </div>
        </div>
        
        {/* Monthly view with entity lists - three column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4 p-4">
          {/* Clients List */}
          <div className="border border-border rounded-md overflow-hidden">
            <EntityList 
              type="client"
              entities={clientBookings}
              selectedEntityId={selectedClientId}
              onSelect={handleClientSelect}
              currentDate={validDate}
              viewType="monthly"
              weekDates={[]}
            />
          </div>
          
          {/* Monthly Calendar */}
          <div className="border border-border rounded-md overflow-hidden">
            <BookingsMonthView
              date={validDate}
              bookings={filteredMonthlyBookings}
              clients={clients}
              carers={carers}
              isLoading={false}
              onBookingClick={(booking) => {
                onViewBooking?.(booking);
              }}
              onCreateBooking={(date, time) => {
                onCreateBooking?.(date, time, selectedClientId || undefined, selectedCarerId || undefined);
              }}
            />
          </div>
          
          {/* Carers List */}
          <div className="border border-border rounded-md overflow-hidden">
            <EntityList 
              type="carer"
              entities={carerBookings}
              selectedEntityId={selectedCarerId}
              onSelect={handleCarerSelect}
              currentDate={validDate}
              viewType="monthly"
              weekDates={[]}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullScreen ? 'booking-fullscreen' : ''} bg-card rounded-lg border border-border shadow-sm`}>
      <div className="p-4 border-b border-border flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {viewType === "daily" ? (
            <span className="font-medium text-foreground">
              {validDate && !isNaN(validDate.getTime()) ? format(validDate, 'EEEE, MMMM d, yyyy') : 'Invalid Date'}
            </span>
          ) : (
            <span className="font-medium text-foreground">
              {weekDates.length > 0 && weekDates[0] && weekDates[6] ? 
                `${format(weekDates[0], 'MMM d')} - ${format(weekDates[6], 'MMM d, yyyy')}` : 
                'Invalid Date Range'
              }
            </span>
          )}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullScreen}
          className="ml-2 h-10 w-10"
          title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
        >
          {isFullScreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="grid-container">
        <div className="entity-lists">
          <EntityList 
            type="client"
            entities={clientBookings}
            selectedEntityId={selectedClientId}
            onSelect={handleClientSelect}
            currentDate={validDate}
            viewType={viewType}
            weekDates={weekDates}
          />
        </div>
        
        <div className="client-calendar">
          {renderCalendar("client", displayedClient)}
        </div>
        
        <div className="carer-lists">
          <EntityList 
            type="carer"
            entities={carerBookings}
            selectedEntityId={selectedCarerId}
            onSelect={handleCarerSelect}
            currentDate={validDate}
            viewType={viewType}
            weekDates={weekDates}
          />
        </div>
        
        <div className="carer-calendar">
          {renderCalendar("carer", displayedCarer)}
        </div>
      </div>
      
      <EditBookingDialog
        open={editBookingDialogOpen}
        onOpenChange={setEditBookingDialogOpen}
        booking={selectedBooking}
        services={services}
        branchId={branchId}
        carers={carers}
        onSuccess={(bookingId) => {
          console.log('[BookingTimeGrid] Booking updated successfully:', bookingId);
          setEditBookingDialogOpen(false);
          setSelectedBooking(null);
        }}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Booking Change</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="flex items-center mb-2 text-amber-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Are you sure you want to move this booking?</span>
              </div>
              
              {pendingBookingMove && (
                <>
                  <div className="border border-border rounded-md p-3 bg-muted">
                    <h4 className="font-medium mb-2 text-foreground">Booking Details:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Client:</p>
                        <p className="font-medium text-foreground">{pendingBookingMove.booking.clientName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Carer:</p>
                        <p className="font-medium text-foreground">{pendingBookingMove.booking.carerName}</p>
                      </div>
                    </div>
                  </div>
                
                  <div className="flex gap-4">
                    <div className="border border-border rounded-md p-3 flex-1 bg-destructive/10">
                      <h4 className="font-medium mb-2 text-destructive">From:</h4>
                      <div className="text-sm">
                        <div className="flex items-center mb-1">
                          <Calendar className="h-4 w-4 mr-1 text-destructive" />
                          <span className="text-foreground">{formatBookingDate(pendingBookingMove.originalDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-destructive" />
                          <span className="text-foreground">{pendingBookingMove.originalStartTime} - {pendingBookingMove.originalEndTime}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-border rounded-md p-3 flex-1 bg-primary/10">
                      <h4 className="font-medium mb-2 text-primary">To:</h4>
                      <div className="text-sm">
                        <div className="flex items-center mb-1">
                          <Calendar className="h-4 w-4 mr-1 text-primary" />
                          <span className="text-foreground">{formatBookingDate(pendingBookingMove.newDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-primary" />
                          <span className="text-foreground">{pendingBookingMove.newStartTime} - {pendingBookingMove.newEndTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelBookingMove}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isUpdatingBooking} onClick={handleConfirmBookingMove}>
              {isUpdatingBooking ? "Updating..." : "Confirm Change"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
