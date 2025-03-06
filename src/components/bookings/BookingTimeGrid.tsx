
import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingEntry } from "./BookingEntry";
import { EntitySelector } from "./EntitySelector";
import { Maximize2, Minimize2, Calendar, Clock } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns";

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
}

export interface Carer {
  id: string;
  name: string;
  initials: string;
  bookingCount: number;
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
  
  const weeklyGridRef = useRef<HTMLDivElement>(null);
  const dailyGridRef = useRef<HTMLDivElement>(null);
  
  const hourHeight = 60; // height in px for one hour
  const hourWidth = 40; // width in px for one hour in daily view
  
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
  
  const displayedClients = selectedClientId 
    ? clientBookings.filter(c => c.id === selectedClientId)
    : clientBookings;
    
  const displayedCarers = selectedCarerId
    ? carerBookings.filter(c => c.id === selectedCarerId)
    : carerBookings;
  
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

  const getCurrentTimePositionDaily = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return hours * hourWidth + (minutes / 60) * hourWidth;
  };

  const getCurrentTimePercentage = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutesInDay = 24 * 60;
    const currentMinutes = hours * 60 + minutes;
    return (currentMinutes / totalMinutesInDay) * 100;
  };

  const getBookingStyle = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startPosition = startHour * hourHeight + (startMin / 60) * hourHeight;
    const endPosition = endHour * hourHeight + (endMin / 60) * hourHeight;
    const height = endPosition - startPosition;
    
    return { top: startPosition, height };
  };

  const getBookingStyleDaily = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startPosition = startHour * hourWidth + (startMin / 60) * hourWidth;
    const endPosition = endHour * hourWidth + (endMin / 60) * hourWidth;
    const width = endPosition - startPosition;
    
    return { left: startPosition, width };
  };
  
  const isBookingOnDate = (booking: Booking, checkDate: Date) => {
    if (!booking.date) return false;
    const bookingDate = new Date(booking.date);
    return isSameDay(bookingDate, checkDate);
  };
  
  useEffect(() => {
    // Scroll handling for weekly view
    if (viewType === "weekly" && isToday(date)) {
      const currentHour = new Date().getHours();
      const weeklyGridElements = document.querySelectorAll('.weekly-grid');
      
      weeklyGridElements.forEach(element => {
        if (element instanceof HTMLElement) {
          const scrollTarget = Math.max(0, (currentHour - 2) * hourHeight);
          element.scrollTop = scrollTarget;
        }
      });
    }
    
    // Scroll handling for daily view
    if (viewType === "daily" && isToday(date)) {
      const currentHour = new Date().getHours();
      if (dailyGridRef.current) {
        const scrollTarget = Math.max(0, (currentHour - 2) * hourWidth);
        dailyGridRef.current.scrollLeft = scrollTarget;
      }
    }
  }, [viewType, date, hourHeight, hourWidth]);
  
  // Rendering the daily view according to the new design
  const renderDailyView = (entities: Array<Client | Carer>, type: 'client' | 'carer') => {
    const isClient = type === 'client';
    const selectedId = isClient ? selectedClientId : selectedCarerId;
    const colorClass = isClient ? 'blue' : 'purple';
    
    return (
      <div className="daily-view">
        {entities.map((entity, index) => (
          <div key={entity.id} className={`entity-row ${
            entity.id === selectedId ? 'selected-row' : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
          }`}>
            <div className="entity-info">
              <div className={`h-10 w-10 rounded-full bg-${colorClass}-100 flex items-center justify-center text-${colorClass}-600 font-medium mr-2`}>
                {entity.initials}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{entity.name}</p>
                <Badge className={`bg-${colorClass}-50 text-${colorClass}-700 font-normal text-xs`}>
                  {entity.bookingCount} bookings
                </Badge>
              </div>
            </div>
            
            <div className="entity-timeline" ref={dailyGridRef}>
              <div className="time-header">
                {timeSlots.map((time, index) => (
                  <div key={index} className="time-header-slot">
                    {time}
                  </div>
                ))}
              </div>
              
              <div className="relative" style={{ height: '60px' }}>
                {timeSlots.map((_, i) => (
                  <div
                    key={i}
                    className="hour-cell-daily"
                    style={{ 
                      position: 'absolute', 
                      left: `${i * hourWidth}px`,
                      height: '100%'
                    }}
                  ></div>
                ))}
                
                {isToday(date) && (
                  <div 
                    className="current-time-line-daily" 
                    style={{ 
                      left: `${getCurrentTimePositionDaily()}px`,
                    }}
                  >
                    <span className="current-time-label-daily">
                      {format(currentTime, 'HH:mm')}
                    </span>
                  </div>
                )}
                
                {/* Display bookings for this entity */}
                {isClient
                  ? (entity as Client).bookings.filter(booking => booking.date === date.toISOString().split('T')[0])
                    .map(booking => {
                      const style = getBookingStyleDaily(booking.startTime, booking.endTime);
                      
                      return (
                        <div
                          key={booking.id}
                          className={`booking-item-daily booking-status-${booking.status}`}
                          style={{ left: `${style.left}px`, width: `${style.width}px` }}
                        >
                          <div className="booking-time text-xs font-medium">
                            {booking.startTime} - {booking.endTime}
                          </div>
                          <div className="booking-carer text-xs truncate">
                            {booking.carerName}
                          </div>
                        </div>
                      );
                    })
                  : (entity as Carer).bookings.filter(booking => booking.date === date.toISOString().split('T')[0])
                    .map(booking => {
                      const style = getBookingStyleDaily(booking.startTime, booking.endTime);
                      
                      return (
                        <div
                          key={booking.id}
                          className={`booking-item-daily booking-status-${booking.status}`}
                          style={{ left: `${style.left}px`, width: `${style.width}px` }}
                        >
                          <div className="booking-time text-xs font-medium">
                            {booking.startTime} - {booking.endTime}
                          </div>
                          <div className="booking-client text-xs truncate">
                            {booking.clientName}
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            </div>
          </div>
        ))}
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
        
        <div className="flex flex-1 flex-wrap md:flex-nowrap justify-end gap-3 md:gap-4">
          <div className="w-full md:w-60">
            <EntitySelector 
              type="client"
              entities={clients}
              selectedEntity={selectedClientId}
              onSelect={setSelectedClientId}
            />
          </div>
          
          <div className="w-full md:w-60">
            <EntitySelector 
              type="carer"
              entities={carers}
              selectedEntity={selectedCarerId}
              onSelect={setSelectedCarerId}
            />
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
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-4 p-4">
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center">
            Clients
            {selectedClientId && (
              <Badge className="ml-2 bg-blue-50 text-blue-700 hover:bg-blue-100">
                Selected: {displayedClients[0]?.name}
              </Badge>
            )}
          </h3>
          
          {viewType === "daily" ? (
            renderDailyView(displayedClients, 'client')
          ) : (
            <div className="weekly-view">
              {displayedClients.map((client) => (
                <div key={client.id} className="mb-6">
                  <div className={`client-header p-2 rounded-md ${client.id === selectedClientId ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-2">
                        {client.initials}
                      </div>
                      <div className="text-sm font-medium">{client.name}</div>
                      <Badge className="ml-2 bg-blue-50 text-blue-700 text-xs">
                        {client.bookings.length} bookings
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="weekly-grid mt-1 relative" ref={weeklyGridRef}>
                    <div className="time-column">
                      {timeSlots.map((time, index) => (
                        <div key={index} className="time-slot">
                          <span>{time}</span>
                        </div>
                      ))}
                    </div>
                    
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
                            
                            {client.bookings.filter(booking => isBookingOnDate(booking, day)).map(booking => {
                              const style = getBookingStyle(booking.startTime, booking.endTime);
                              
                              return (
                                <div
                                  key={booking.id}
                                  className={`booking-item booking-status-${booking.status}`}
                                  style={{ top: `${style.top}px`, height: `${style.height}px` }}
                                >
                                  <div className="booking-time text-xs font-medium">
                                    {booking.startTime} - {booking.endTime}
                                  </div>
                                  <div className="booking-carer text-xs truncate">
                                    {booking.carerName}
                                  </div>
                                </div>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center">
            Carers
            {selectedCarerId && (
              <Badge className="ml-2 bg-purple-50 text-purple-700 hover:bg-purple-100">
                Selected: {displayedCarers[0]?.name}
              </Badge>
            )}
          </h3>
          
          {viewType === "daily" ? (
            renderDailyView(displayedCarers, 'carer')
          ) : (
            <div className="weekly-view">
              {displayedCarers.map((carer) => (
                <div key={carer.id} className="mb-6">
                  <div className={`carer-header p-2 rounded-md ${carer.id === selectedCarerId ? 'bg-purple-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium mr-2">
                        {carer.initials}
                      </div>
                      <div className="text-sm font-medium">{carer.name}</div>
                      <Badge className="ml-2 bg-purple-50 text-purple-700 text-xs">
                        {carer.bookings.length} bookings
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="weekly-grid mt-1 relative" ref={weeklyGridRef}>
                    <div className="time-column">
                      {timeSlots.map((time, index) => (
                        <div key={index} className="time-slot">
                          <span>{time}</span>
                        </div>
                      ))}
                    </div>
                    
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
                            
                            {carer.bookings.filter(booking => isBookingOnDate(booking, day)).map(booking => {
                              const style = getBookingStyle(booking.startTime, booking.endTime);
                              
                              return (
                                <div
                                  key={booking.id}
                                  className={`booking-item booking-status-${booking.status}`}
                                  style={{ top: `${style.top}px`, height: `${style.height}px` }}
                                >
                                  <div className="booking-time text-xs font-medium">
                                    {booking.startTime} - {booking.endTime}
                                  </div>
                                  <div className="booking-client text-xs truncate">
                                    {booking.clientName}
                                  </div>
                                </div>
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
