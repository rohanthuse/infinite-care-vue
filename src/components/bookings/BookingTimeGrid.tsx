
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingEntry } from "./BookingEntry";
import { EntitySelector } from "./EntitySelector";
import { Maximize2, Minimize2, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

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
  const [currentTimePosition, setCurrentTimePosition] = useState<number>(0);
  const [showHalfHours, setShowHalfHours] = useState(true);
  
  // Generate time slots with half-hour increments if enabled
  const timeSlots = showHalfHours
    ? Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? "00" : "30";
        return `${hour.toString().padStart(2, '0')}:${minute}`;
      })
    : Array.from({ length: 24 }, (_, i) => 
        i.toString().padStart(2, '0') + ":00"
      );
  
  // Update current time position
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Calculate current time position (as percentage of day)
      const position = ((currentHour * 60 + currentMinute) / (24 * 60)) * 100;
      setCurrentTimePosition(position);
    };
    
    updateCurrentTime();
    
    // Update every minute
    const intervalId = setInterval(updateCurrentTime, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Toggle full screen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    
    // Prevent body scrolling when in full screen
    if (!isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };
  
  // Handle ESC key to exit full screen
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
  
  // Get bookings for the current date
  const dateStr = date.toISOString().split('T')[0];
  const filteredBookings = bookings.filter(booking => booking.date === dateStr);
  
  // Group bookings by client and carer
  const clientBookings = clients.map(client => {
    return {
      ...client,
      bookings: filteredBookings.filter(booking => booking.clientId === client.id)
    };
  });
  
  const carerBookings = carers.map(carer => {
    return {
      ...carer,
      bookings: filteredBookings.filter(booking => booking.carerId === carer.id)
    };
  });
  
  // Filter the client/carer lists based on selection
  const displayedClients = selectedClientId 
    ? clientBookings.filter(c => c.id === selectedClientId)
    : clientBookings;
    
  const displayedCarers = selectedCarerId
    ? carerBookings.filter(c => c.id === selectedCarerId)
    : carerBookings;
  
  return (
    <div className={`${isFullScreen ? 'booking-fullscreen' : ''} bg-white rounded-lg border border-gray-200 shadow-sm`}>
      <div className="p-4 border-b border-gray-100 flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{format(date, 'EEEE, MMMM d, yyyy')}</span>
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
        {/* Client Section */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center">
            Clients
            {selectedClientId && (
              <Badge className="ml-2 bg-blue-50 text-blue-700 hover:bg-blue-100">
                Selected: {displayedClients[0]?.name}
              </Badge>
            )}
          </h3>
          <div className="relative">
            {/* Time Indicator Line */}
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
            
            {/* Current Time Line (red vertical line) - only show on current day */}
            {new Date().toDateString() === date.toDateString() && (
              <>
                <div 
                  className="time-marker" 
                  style={{ 
                    left: `calc(${currentTimePosition}% + 144px)`,
                  }}
                >
                  <div className="time-marker-label">
                    {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
                  </div>
                </div>
              </>
            )}
            
            {/* Client Rows */}
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
                  
                  {/* Time Grid for Client */}
                  <div className={`flex-grow ${showHalfHours ? 'grid-cols-48' : 'grid-cols-24'} grid gap-0 relative`}>
                    {/* Grid Background */}
                    {timeSlots.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-full border-r ${
                          showHalfHours ? (i % 2 === 0 ? 'border-gray-200' : 'border-gray-100') : 'border-gray-200'
                        }`}
                      ></div>
                    ))}
                    
                    {/* Booking Entries */}
                    {client.bookings.map((booking) => {
                      const [startHour, startMin] = booking.startTime.split(':').map(Number);
                      const [endHour, endMin] = booking.endTime.split(':').map(Number);
                      
                      // Calculate position and width based on time (with more precision for half-hour grid)
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
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Carer Section */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center">
            Carers
            {selectedCarerId && (
              <Badge className="ml-2 bg-purple-50 text-purple-700 hover:bg-purple-100">
                Selected: {displayedCarers[0]?.name}
              </Badge>
            )}
          </h3>
          <div className="relative">
            {/* Time Indicator Line */}
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
            
            {/* Current Time Line - only show on current day */}
            {new Date().toDateString() === date.toDateString() && (
              <div 
                className="time-marker" 
                style={{ 
                  left: `calc(${currentTimePosition}% + 144px)`,
                }}
              >
                <div className="time-marker-label">
                  {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
                </div>
              </div>
            )}
            
            {/* Carer Rows */}
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
                  
                  {/* Time Grid for Carer */}
                  <div className={`flex-grow ${showHalfHours ? 'grid-cols-48' : 'grid-cols-24'} grid gap-0 relative`}>
                    {/* Grid Background */}
                    {timeSlots.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-full border-r ${
                          showHalfHours ? (i % 2 === 0 ? 'border-gray-200' : 'border-gray-100') : 'border-gray-200'
                        }`}
                      ></div>
                    ))}
                    
                    {/* Booking Entries */}
                    {carer.bookings.map((booking) => {
                      const [startHour, startMin] = booking.startTime.split(':').map(Number);
                      const [endHour, endMin] = booking.endTime.split(':').map(Number);
                      
                      // Calculate position and width based on time
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
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
