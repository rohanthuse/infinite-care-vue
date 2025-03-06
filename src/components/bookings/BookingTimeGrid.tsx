import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingEntry } from "./BookingEntry";
import { EntitySelector } from "./EntitySelector";
import { Maximize2, Minimize2, Calendar, Clock } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay } from "date-fns";

// Type definitions
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
  
  const getCurrentTimePercentage = () => {
    const totalMinutes = 24 * 60;
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    return (currentMinutes / totalMinutes) * 100;
  };

  // Function to get position and height for weekly view bookings
  const getBookingPosition = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startInMinutes = startHour * 60 + startMin;
    const endInMinutes = endHour * 60 + endMin;
    
    const top = (startInMinutes / 60) * hourHeight;
    const height = ((endInMinutes - startInMinutes) / 60) * hourHeight;
    
    return { top, height };
  };
  
  // Helper to check if a booking is on a specific date
  const isBookingOnDate = (booking: Booking, date: Date) => {
    const bookingDate = new Date(booking.date);
    return isSameDay(bookingDate, date);
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
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-11 flex">
                <div className="w-36 flex-shrink-0"></div>
                <div className={`flex-grow ${showHalfHours ? 'grid-cols-48' : 'grid-cols-24'} grid gap-0`}>
                  {timeSlots.map((time, i) => (
                    <div 
                      key={i} 
                      className={`h-full text-center text-xs text-gray-500 border-r border-gray-100 ${
                        showHalfHours ? (i % 2 === 0 ? 'border-gray-200' : 'border-gray-100') : 'border-gray-200'
                      }`}
                    >
                      {showHalfHours ? (i % 2 === 0 ? time.split(':')[0] : '') : time}
                    </div>
                  ))}
                </div>
              </div>
              
              {new Date().toDateString() === date.toDateString() && (
                <div 
                  className="time-marker" 
                  style={{ 
                    left: `calc(${getCurrentTimePercentage()}% + 144px)`,
                  }}
                >
                  <div className="time-marker-label">
                    {currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}
                  </div>
                </div>
              )}
              
              <div className="mt-11 relative">
                {displayedClients.map((client, index) => (
                  <div 
                    key={client.id} 
                    className={`flex h-20 ${
                      client.id === selectedClientId ? 'selected-row' : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className="w-36 flex-shrink-0 p-2 border-r border-gray-200">
                      <div className="flex items-center h-full">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-2">
                          {client.initials}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium truncate">{client.name}</p>
                          <Badge className="bg-blue-50 text-blue-700 font-normal text-xs">
                            {client.bookingCount} bookings
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`flex-grow ${showHalfHours ? 'grid-cols-48' : 'grid-cols-24'} grid gap-0 relative`}>
                      {timeSlots.map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-full border-r ${
                            showHalfHours ? (i % 2 === 0 ? 'border-gray-200' : 'border-gray-100') : 'border-gray-200'
                          }`}
                        ></div>
                      ))}
                      
                      {client.bookings
                        .filter(booking => booking.date === date.toISOString().split('T')[0])
                        .map((booking) => {
                          const [startHour, startMin] = booking.startTime.split(':').map(Number);
                          const [endHour, endMin] = booking.endTime.split(':').map(Number);
                          
                          const startInMinutes = startHour * 60 + startMin;
                          const endInMinutes = endHour * 60 + endMin;
                          const dayInMinutes = 24 * 60;
                          
                          const startPos = (startInMinutes / dayInMinutes) * 100;
                          const endPos = (endInMinutes / dayInMinutes) * 100;
                          const width = endPos - startPos;
                          
                          return (
                            <BookingEntry
                              key={booking.id}
                              booking={booking}
                              startPos={startPos}
                              width={width}
                              type="client"
                              displayMode="horizontal"
                            />
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="weekly-view">
              <div className="weekly-grid-header">
                <div className="time-column">
                  <div className="time-header">Time</div>
                </div>
                {weekDates.map((day, index) => (
                  <div 
                    key={index} 
                    className={`day-column-header ${isToday(day) ? 'today' : ''}`}
                  >
                    <div className="day-name">{format(day, 'EEE')}</div>
                    <div className="day-date">{format(day, 'd MMM')}</div>
                  </div>
                ))}
              </div>
              
              {displayedClients.map((client) => (
                <div 
                  key={client.id} 
                  className={`weekly-client-row ${client.id === selectedClientId ? 'selected-row' : ''}`}
                >
                  <div className="client-info">
                    <div className="client-avatar">{client.initials}</div>
                    <div className="client-name">{client.name}</div>
                  </div>
                  
                  <div className="day-columns-container">
                    {weekDates.map((day, dayIndex) => (
                      <div 
                        key={dayIndex} 
                        className={`day-column ${isToday(day) ? 'today' : ''}`}
                      >
                        {timeSlots.map((time, timeIndex) => (
                          <div key={timeIndex} className="time-cell">
                            {timeIndex === 0 && (
                              <div className="time-label">{time}</div>
                            )}
                          </div>
                        ))}
                        
                        {client.bookings
                          .filter(booking => isBookingOnDate(booking, day))
                          .map(booking => {
                            const { top, height } = getBookingPosition(booking.startTime, booking.endTime);
                            
                            return (
                              <div
                                key={booking.id}
                                className={`weekly-booking booking-status-${booking.status}`}
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`
                                }}
                              >
                                <div className="booking-time">
                                  {booking.startTime} - {booking.endTime}
                                </div>
                                <div className="booking-carer-name">
                                  {booking.carerName.split(' ')[0]}
                                </div>
                              </div>
                            );
                          })}
                        
                        {isToday(day) && (
                          <div 
                            className="current-time-indicator" 
                            style={{ 
                              top: `${(currentTime.getHours() * 60 + currentTime.getMinutes()) / 60 * hourHeight}px` 
                            }}
                          >
                            <div className="current-time-label">
                              {currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="time-slots-container">
                {timeSlots.map((time, i) => (
                  <div key={i} className="time-slot" style={{ top: `${i * hourHeight}px` }}>
                    {time}
                  </div>
                ))}
              </div>
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
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-11 flex">
                <div className="w-36 flex-shrink-0"></div>
                <div className={`flex-grow ${showHalfHours ? 'grid-cols-48' : 'grid-cols-24'} grid gap-0`}>
                  {timeSlots.map((time, i) => (
                    <div 
                      key={i} 
                      className={`h-full text-center text-xs text-gray-500 border-r border-gray-100 ${
                        showHalfHours ? (i % 2 === 0 ? 'border-gray-200' : 'border-gray-100') : 'border-gray-200'
                      }`}
                    >
                      {showHalfHours ? (i % 2 === 0 ? time.split(':')[0] : '') : time}
                    </div>
                  ))}
                </div>
              </div>
              
              {new Date().toDateString() === date.toDateString() && (
                <div 
                  className="time-marker" 
                  style={{ 
                    left: `calc(${getCurrentTimePercentage()}% + 144px)`,
                  }}
                >
                  <div className="time-marker-label">
                    {currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}
                  </div>
                </div>
              )}
              
              <div className="mt-11 relative">
                {displayedCarers.map((carer, index) => (
                  <div 
                    key={carer.id} 
                    className={`flex h-20 ${
                      carer.id === selectedCarerId ? 'selected-row' : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className="w-36 flex-shrink-0 p-2 border-r border-gray-200">
                      <div className="flex items-center h-full">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium mr-2">
                          {carer.initials}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium truncate">{carer.name}</p>
                          <Badge className="bg-purple-50 text-purple-700 font-normal text-xs">
                            {carer.bookingCount} bookings
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`flex-grow ${showHalfHours ? 'grid-cols-48' : 'grid-cols-24'} grid gap-0 relative`}>
                      {timeSlots.map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-full border-r ${
                            showHalfHours ? (i % 2 === 0 ? 'border-gray-200' : 'border-gray-100') : 'border-gray-200'
                          }`}
                        ></div>
                      ))}
                      
                      {carer.bookings
                        .filter(booking => booking.date === date.toISOString().split('T')[0])
                        .map((booking) => {
                          const [startHour, startMin] = booking.startTime.split(':').map(Number);
                          const [endHour, endMin] = booking.endTime.split(':').map(Number);
                          
                          const startInMinutes = startHour * 60 + startMin;
                          const endInMinutes = endHour * 60 + endMin;
                          const dayInMinutes = 24 * 60;
                          
                          const startPos = (startInMinutes / dayInMinutes) * 100;
                          const endPos = (endInMinutes / dayInMinutes) * 100;
                          const width = endPos - startPos;
                          
                          return (
                            <BookingEntry
                              key={booking.id}
                              booking={booking}
                              startPos={startPos}
                              width={width}
                              type="carer"
                              displayMode="horizontal"
                            />
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="weekly-view">
              <div className="weekly-grid-header">
                <div className="time-column">
                  <div className="time-header">Time</div>
                </div>
                {weekDates.map((day, index) => (
                  <div 
                    key={index} 
                    className={`day-column-header ${isToday(day) ? 'today' : ''}`}
                  >
                    <div className="day-name">{format(day, 'EEE')}</div>
                    <div className="day-date">{format(day, 'd MMM')}</div>
                  </div>
                ))}
              </div>
              
              {displayedCarers.map((carer) => (
                <div 
                  key={carer.id} 
                  className={`weekly-carer-row ${carer.id === selectedCarerId ? 'selected-row' : ''}`}
                >
                  <div className="carer-info">
                    <div className="carer-avatar">{carer.initials}</div>
                    <div className="carer-name">{carer.name}</div>
                  </div>
                  
                  <div className="day-columns-container">
                    {weekDates.map((day, dayIndex) => (
                      <div 
                        key={dayIndex} 
                        className={`day-column ${isToday(day) ? 'today' : ''}`}
                      >
                        {timeSlots.map((time, timeIndex) => (
                          <div key={timeIndex} className="time-cell">
                            {timeIndex === 0 && (
                              <div className="time-label">{time}</div>
                            )}
                          </div>
                        ))}
                        
                        {carer.bookings
                          .filter(booking => isBookingOnDate(booking, day))
                          .map(booking => {
                            const { top, height } = getBookingPosition(booking.startTime, booking.endTime);
                            
                            return (
                              <div
                                key={booking.id}
                                className={`weekly-booking booking-status-${booking.status}`}
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`
                                }}
                              >
                                <div className="booking-time">
                                  {booking.startTime} - {booking.endTime}
                                </div>
                                <div className="booking-client-name">
                                  {booking.clientInitials}
                                </div>
                              </div>
                            );
                          })}
                        
                        {isToday(day) && (
                          <div 
                            className="current-time-indicator" 
                            style={{ 
                              top: `${(currentTime.getHours() * 60 + currentTime.getMinutes()) / 60 * hourHeight}px` 
                            }}
                          >
                            <div className="current-time-label">
                              {currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="time-slots-container">
                {timeSlots.map((time, i) => (
                  <div key={i} className="time-slot" style={{ top: `${i * hourHeight}px` }}>
                    {time}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
