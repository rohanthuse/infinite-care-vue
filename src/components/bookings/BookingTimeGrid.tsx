
import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingEntry } from "./BookingEntry";
import { EntitySelector } from "./EntitySelector";
import { EntityList } from "./EntityList";
import { Maximize2, Minimize2, Calendar, Clock } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns";
import "@/styles/bookings.css";

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  clientInitials: string;
  carerId: string;
  carerName: string;
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
}

export const BookingTimeGrid: React.FC<BookingTimeGridProps> = ({
  date,
  bookings,
  clients,
  carers,
  viewType,
  viewMode,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedCarerId, setSelectedCarerId] = useState<string | null>(null);
  const [showHalfHours, setShowHalfHours] = useState(true);
  
  const gridRef = useRef<HTMLDivElement>(null);
  
  const hourHeight = 60; // height in px for one hour
  
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
      bookings: bookings.filter(booking => booking.clientId === client.id)
    };
  });
  
  const carerBookings = carers.map(carer => {
    return {
      ...carer,
      bookings: bookings.filter(booking => booking.carerId === carer.id)
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

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleCarerSelect = (carerId: string) => {
    setSelectedCarerId(carerId);
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
      <div className="booking-view daily-view h-full">
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
              <div className="day-content">
                {timeSlots.map((_, timeIndex) => (
                  <div key={timeIndex} className="hour-cell"></div>
                ))}
                        
                {entity.bookings?.filter(booking => isBookingOnDate(booking, date)).map(booking => {
                  const position = getBookingPosition(booking.startTime, booking.endTime);
                          
                  return (
                    <BookingEntry
                      key={booking.id}
                      booking={booking}
                      position={position}
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
              </div>
            ) : (
              <div className="day-columns">
                {weekDates.map((day, dayIndex) => (
                  <div key={dayIndex} className={`day-column ${isToday(day) ? 'today' : ''}`}>
                    <div className="day-header">
                      <div className="day-name">{format(day, 'EEE')}</div>
                      <div className="day-date">{format(day, 'd')}</div>
                    </div>
                            
                    <div className="day-content">
                      {timeSlots.map((_, timeIndex) => (
                        <div key={timeIndex} className="hour-cell"></div>
                      ))}
                              
                      {entity.bookings?.filter(booking => isBookingOnDate(booking, day)).map(booking => {
                        const position = getBookingPosition(booking.startTime, booking.endTime);
                                
                        return (
                          <BookingEntry
                            key={booking.id}
                            booking={booking}
                            position={position}
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
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
            entities={clients}
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
            entities={carers}
            selectedEntityId={selectedCarerId}
            onSelect={handleCarerSelect}
          />
        </div>
        
        <div className="carer-calendar">
          {renderCalendar("carer", displayedCarer)}
        </div>
      </div>
    </div>
  );
};
