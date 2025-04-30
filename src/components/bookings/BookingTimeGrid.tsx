import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingEntry } from "./BookingEntry";
import { EntitySelector } from "./EntitySelector";
import { EntityList } from "./EntityList";
import { BookingContextMenu } from "./BookingContextMenu";
import { EditBookingDialog } from "./EditBookingDialog";
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
}

export interface Client {
  id: string;
  name: string;
  initials: string;
  bookingCount: number;
  bookings?: Booking[];
}

export interface Carer {
  id: string;
  name: string;
  initials: string;
  bookingCount: number;
  bookings?: Booking[];
}

interface BookingTimeGridProps {
  date: Date;
  bookings: Booking[];
  clients: Client[];
  carers: Carer[];
  viewType: "daily" | "weekly";
  viewMode: "client" | "group";
  onCreateBooking?: (date: Date, time: string, clientId?: string, carerId?: string) => void;
  onUpdateBooking?: (booking: Booking) => void;
  onEditBooking?: (booking: Booking) => void;
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
  viewType,
  viewMode,
  onCreateBooking,
  onUpdateBooking,
  onEditBooking,
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
  }, [bookings]);

  const gridRef = useRef<HTMLDivElement>(null);
  
  const hourHeight = 60; // height in px for one hour
  const timeInterval = 30; // time interval in minutes (30 = half hour intervals)
  
  const timeSlots = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0') + ":00"
  );
  
  const getWeekDates = () => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday as start of week
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };
  
  const weekDates = getWeekDates();
  
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
    if (!booking.date) return false;
    const bookingDate = new Date(booking.date);
    return isSameDay(bookingDate, checkDate);
  };
  
  useEffect(() => {
    if (gridRef.current) {
      const currentHour = new Date().getHours();
      const scrollTarget = Math.max(0, (currentHour - 2) * hourHeight);
      
      if ((viewType === "weekly" && weekDates.some(d => isToday(d))) || 
          (viewType === "daily" && isToday(date))) {
        gridRef.current.scrollTop = scrollTarget;
      }
    }
  }, [viewType, date, hourHeight, weekDates]);
  
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

  const handleUpdateBooking = (updatedBooking: Booking) => {
    const updatedBookings = localBookings.map(b => 
      b.id === updatedBooking.id ? updatedBooking : b
    );
    setLocalBookings(updatedBookings);
    
    if (onUpdateBooking) {
      onUpdateBooking(updatedBooking);
    }
  };

  // Modified handleDragEnd to show confirmation dialog
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    const booking = localBookings.find(b => b.id === draggableId);
    if (!booking) return;

    const parts = destination.droppableId.split('-');
    const type = parts[0];
    let dateStr = parts.slice(1).join('-');
    
    if (viewType === "weekly") {
      const dayIndex = parseInt(dateStr);
      if (!isNaN(dayIndex) && dayIndex >= 0 && dayIndex < weekDates.length) {
        dateStr = format(weekDates[dayIndex], 'yyyy-MM-dd');
      }
    }
    
    // Get the y-coordinate from the destination.index
    const dropPositionY = destination.index * 10;
    const newStartTime = getTimeFromPosition(dropPositionY);
    
    // Parse the times to calculate duration
    const [startHour, startMin] = booking.startTime.split(':').map(Number);
    const [endHour, endMin] = booking.endTime.split(':').map(Number);
    
    // Calculate total minutes for start and end times
    const startInMinutes = startHour * 60 + startMin;
    const endInMinutes = endHour * 60 + endMin;
    const durationMinutes = endInMinutes - startInMinutes;
    
    // Calculate new start time in minutes
    const [newHour, newMin] = newStartTime.split(':').map(Number);
    const newStartInMinutes = newHour * 60 + newMin;
    
    // Calculate new end time by adding duration
    const newEndInMinutes = newStartInMinutes + durationMinutes;
    const newEndHour = Math.floor(newEndInMinutes / 60) % 24;
    const newEndMin = newEndInMinutes % 60;
    const newEndTime = `${String(newEndHour).padStart(2, '0')}:${String(newEndMin).padStart(2, '0')}`;
    
    // Check if new booking is within business hours (6:00 to 22:00)
    if (newHour < 6 || newHour >= 22) {
      toast.error("Bookings can only be scheduled between 6:00 and 22:00");
      return;
    }
    
    // Check if the end time exceeds business hours
    if (newEndHour >= 22 || (newEndHour === 21 && newEndMin > 30)) {
      toast.error("Booking would end after business hours (22:00)");
      return;
    }
    
    // Set pending booking move instead of updating immediately
    setPendingBookingMove({
      booking,
      newDate: dateStr,
      newStartTime,
      newEndTime,
      originalDate: booking.date,
      originalStartTime: booking.startTime,
      originalEndTime: booking.endTime
    });
    
    // Open confirmation dialog
    setConfirmDialogOpen(true);
  };

  // New function to handle confirmed booking move
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
      onUpdateBooking(updatedBooking);
      toast.success(`Booking updated: ${updatedBooking.startTime} - ${updatedBooking.endTime}`);
    }
    
    // Close dialog and clear pending move
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
    if (!entity) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 border rounded-md">
          <p className="text-gray-500 text-sm">Select a {entityType} to view their schedule</p>
        </div>
      );
    }

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={`booking-view ${viewType === "weekly" ? "weekly-view" : "daily-view"} h-full`}>
          <div className={`entity-header p-2 rounded-md ${entityType === "client" ? 'bg-blue-50' : 'bg-purple-50'}`}>
            <div className="flex items-center">
              <div className={`h-8 w-8 rounded-full ${entityType === "client" ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'} flex items-center justify-center text-sm font-medium mr-2`}>
                {entity.initials}
              </div>
              <div className="text-sm font-medium">{entity.name}</div>
              <Badge className={`ml-2 ${entityType === "client" ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'} text-xs`}>
                {entity.bookings?.length || 0} bookings
              </Badge>
            </div>
          </div>
                    
          <div className="booking-grid-container" ref={gridRef}>
            <div className="booking-scroll-container">
              <div className="time-column">
                {timeSlots.map((time, index) => (
                  <div key={index} className="time-slot">
                    <span>{time}</span>
                  </div>
                ))}
              </div>
                        
              {viewType === "daily" ? (
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
                        className={`day-content ${snapshot.isDraggingOver ? 'bg-gray-50' : ''}`}
                        onContextMenu={(e) => handleContextMenuOpen(e, e.currentTarget)}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {timeSlots.map((_, timeIndex) => (
                          <div key={timeIndex} className="hour-cell"></div>
                        ))}
                              
                        {entity.bookings?.filter(booking => isBookingOnDate(booking, date)).map((booking, index) => {
                          const position = getBookingPosition(booking.startTime, booking.endTime);
                                
                          return (
                            <BookingEntry
                              key={booking.id}
                              booking={booking}
                              position={position}
                              type={entityType}
                              index={index}
                              onEditBooking={handleEditBooking}
                            />
                          );
                        })}
                              
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
                              className={`day-content ${snapshot.isDraggingOver ? 'bg-gray-50' : ''}`}
                              onContextMenu={(e) => handleContextMenuOpen(e, e.currentTarget)}
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                            >
                              {timeSlots.map((_, timeIndex) => (
                                <div key={timeIndex} className="hour-cell"></div>
                              ))}
                                      
                              {entity.bookings?.filter(booking => isBookingOnDate(booking, day)).map((booking, index) => {
                                const position = getBookingPosition(booking.startTime, booking.endTime);
                                        
                                return (
                                  <BookingEntry
                                    key={booking.id}
                                    booking={booking}
                                    position={position}
                                    type={entityType}
                                    index={index}
                                    onEditBooking={handleEditBooking}
                                  />
                                );
                              })}
                                      
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

  return (
    <div className={`${isFullScreen ? 'booking-fullscreen' : ''} bg-white rounded-lg border border-gray-200 shadow-sm`}>
      <div className="p-4 border-b border-gray-100 flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-500" />
          {viewType === "daily" ? (
            <span className="font-medium">{format(date, 'EEEE, MMMM d, yyyy')}</span>
          ) : (
            <span className="font-medium">
              {format(weekDates[0], 'MMM d')} - {format(weekDates[6], 'MMM d, yyyy')}
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
        clients={clients}
        carers={carers}
        onUpdateBooking={handleUpdateBooking}
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
                  <div className="border rounded-md p-3 bg-gray-50">
                    <h4 className="font-medium mb-2">Booking Details:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Client:</p>
                        <p className="font-medium">{pendingBookingMove.booking.clientName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Carer:</p>
                        <p className="font-medium">{pendingBookingMove.booking.carerName}</p>
                      </div>
                    </div>
                  </div>
                
                  <div className="flex gap-4">
                    <div className="border rounded-md p-3 flex-1 bg-red-50">
                      <h4 className="font-medium mb-2 text-red-700">From:</h4>
                      <div className="text-sm">
                        <div className="flex items-center mb-1">
                          <Calendar className="h-4 w-4 mr-1 text-red-600" />
                          <span>{formatBookingDate(pendingBookingMove.originalDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-red-600" />
                          <span>{pendingBookingMove.originalStartTime} - {pendingBookingMove.originalEndTime}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-3 flex-1 bg-green-50">
                      <h4 className="font-medium mb-2 text-green-700">To:</h4>
                      <div className="text-sm">
                        <div className="flex items-center mb-1">
                          <Calendar className="h-4 w-4 mr-1 text-green-600" />
                          <span>{formatBookingDate(pendingBookingMove.newDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-green-600" />
                          <span>{pendingBookingMove.newStartTime} - {pendingBookingMove.newEndTime}</span>
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
            <AlertDialogAction className="bg-blue-600 hover:bg-blue-700" onClick={handleConfirmBookingMove}>
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
