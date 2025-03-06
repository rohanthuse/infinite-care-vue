
import React from "react";
import { Badge } from "@/components/ui/badge";
import { BookingEntry } from "./BookingEntry";

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
  // Generate time slots for the day
  const timeSlots = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0') + ":00"
  );
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Calculate current time position for the red line (as percentage of day)
  const currentTimePosition = ((currentHour * 60 + currentMinute) / (24 * 60)) * 100;
  
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
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-4 p-4">
        {/* Client Section */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Clients</h3>
          <div className="relative">
            {/* Time Indicator Line */}
            <div className="absolute top-0 left-0 w-full h-11 flex">
              <div className="w-36 flex-shrink-0"></div>
              <div className="flex-grow grid grid-cols-24 gap-0">
                {timeSlots.map((time, i) => (
                  <div key={i} className="h-full text-center text-xs text-gray-500 border-r border-gray-100">
                    {i % 2 === 0 && time}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Current Time Line (red vertical line) - only show on current day */}
            {new Date().toDateString() === date.toDateString() && (
              <div 
                className="absolute top-11 bottom-0 w-px bg-red-500 z-10" 
                style={{ 
                  left: `calc(${currentTimePosition}% + 144px)`,
                  height: 'calc(100% - 2.75rem)'
                }}
              />
            )}
            
            {/* Client Rows */}
            <div className="mt-11 relative">
              {clientBookings.map((client, index) => (
                <div 
                  key={client.id} 
                  className={`flex h-20 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
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
                  <div className="flex-grow grid grid-cols-24 gap-0 relative">
                    {/* Grid Background */}
                    {timeSlots.map((_, i) => (
                      <div key={i} className="h-full border-r border-gray-100"></div>
                    ))}
                    
                    {/* Booking Entries */}
                    {client.bookings.map((booking) => {
                      const [startHour, startMin] = booking.startTime.split(':').map(Number);
                      const [endHour, endMin] = booking.endTime.split(':').map(Number);
                      
                      // Calculate position and width based on time
                      const startPos = (startHour + startMin / 60) / 24 * 100;
                      const endPos = (endHour + endMin / 60) / 24 * 100;
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
          <h3 className="text-sm font-semibold mb-3">Carers</h3>
          <div className="relative">
            {/* Time Indicator Line */}
            <div className="absolute top-0 left-0 w-full h-11 flex">
              <div className="w-36 flex-shrink-0"></div>
              <div className="flex-grow grid grid-cols-24 gap-0">
                {timeSlots.map((time, i) => (
                  <div key={i} className="h-full text-center text-xs text-gray-500 border-r border-gray-100">
                    {i % 2 === 0 && time}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Current Time Line - only show on current day */}
            {new Date().toDateString() === date.toDateString() && (
              <div 
                className="absolute top-11 bottom-0 w-px bg-red-500 z-10" 
                style={{ 
                  left: `calc(${currentTimePosition}% + 144px)`,
                  height: 'calc(100% - 2.75rem)'
                }}
              />
            )}
            
            {/* Carer Rows */}
            <div className="mt-11 relative">
              {carerBookings.map((carer, index) => (
                <div 
                  key={carer.id} 
                  className={`flex h-20 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
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
                  <div className="flex-grow grid grid-cols-24 gap-0 relative">
                    {/* Grid Background */}
                    {timeSlots.map((_, i) => (
                      <div key={i} className="h-full border-r border-gray-100"></div>
                    ))}
                    
                    {/* Booking Entries */}
                    {carer.bookings.map((booking) => {
                      const [startHour, startMin] = booking.startTime.split(':').map(Number);
                      const [endHour, endMin] = booking.endTime.split(':').map(Number);
                      
                      // Calculate position and width based on time
                      const startPos = (startHour + startMin / 60) / 24 * 100;
                      const endPos = (endHour + endMin / 60) / 24 * 100;
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
