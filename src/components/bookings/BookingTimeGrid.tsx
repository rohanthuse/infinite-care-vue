import React, { useState } from "react";
import { CalendarDays, UserRound } from "lucide-react";
import { format, isSameDay } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  clientInitials: string;
  carerId: string;
  carerName: string;
  carerInitials: string; // Ensure this is included in the interface
  startTime: string;
  endTime: string;
  date: string;
  status: "assigned" | "unassigned" | "done" | "in-progress" | "cancelled" | "departed" | "suspended";
  notes?: string;
}

interface BookingTimeGridProps {
  date: Date;
  bookings: Booking[];
  clients: Client[];
  carers: Carer[];
  viewType: "daily" | "weekly";
  viewMode: "client" | "group";
  onCreateBooking: (date: Date, time: string, clientId?: string, carerId?: string) => void;
  onUpdateBooking: (booking: Booking) => void;
  onBookingClick?: (booking: Booking) => void;
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
  onBookingClick
}) => {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const timeSlots = generateTimeSlots();

  const getBookingsForTimeSlot = (time: string, entityId: string, entityType: "client" | "carer"): Booking[] => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      const isSame = isSameDay(bookingDate, date);
      
      if (entityType === "client") {
        return isSame && booking.clientId === entityId && booking.startTime === time;
      } else {
        return isSame && booking.carerId === entityId && booking.startTime === time;
      }
    });
  };

  const handleContextMenu = (event: React.MouseEvent, date: Date, time: string, clientId?: string, carerId?: string) => {
    event.preventDefault();
    onCreateBooking(date, time, clientId, carerId);
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    if (onBookingClick) {
      onBookingClick(booking);
    }
  };

  const renderTimeGrid = () => {
    if (viewMode === "client") {
      return (
        <div className="grid grid-cols-[100px_repeat(auto-fit,minmax(150px,1fr))]">
          <div></div>
          {clients.map(client => (
            <div key={client.id} className="border-b border-r p-2 font-medium text-sm text-center">
              {client.name}
            </div>
          ))}
          {timeSlots.map(time => (
            <React.Fragment key={time}>
              <div className="border-r p-2 font-medium text-sm text-right">{time}</div>
              {clients.map(client => {
                const bookingsForTimeSlot = getBookingsForTimeSlot(time, client.id, "client");
                const hasBooking = bookingsForTimeSlot.length > 0;
                const booking = hasBooking ? bookingsForTimeSlot[0] : null;

                return (
                  <div
                    key={client.id + time}
                    className={`border-b border-r p-1 relative ${hasBooking ? 'bg-blue-100 cursor-pointer' : 'bg-white'}`}
                    onContextMenu={(e) => handleContextMenu(e, date, time, client.id)}
                    onClick={() => booking && handleBookingClick(booking)}
                  >
                    {hasBooking && booking ? (
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium">{booking.carerName}</div>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <UserRound className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onUpdateBooking(booking)}>
                              Edit Booking
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-xs">Available</div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-[100px_repeat(auto-fit,minmax(150px,1fr))]">
          <div></div>
          {carers.map(carer => (
            <div key={carer.id} className="border-b border-r p-2 font-medium text-sm text-center">
              {carer.name}
            </div>
          ))}
          {timeSlots.map(time => (
            <React.Fragment key={time}>
              <div className="border-r p-2 font-medium text-sm text-right">{time}</div>
              {carers.map(carer => {
                const bookingsForTimeSlot = getBookingsForTimeSlot(time, carer.id, "carer");
                const hasBooking = bookingsForTimeSlot.length > 0;
                const booking = hasBooking ? bookingsForTimeSlot[0] : null;

                return (
                  <div
                    key={carer.id + time}
                    className={`border-b border-r p-1 relative ${hasBooking ? 'bg-purple-100 cursor-pointer' : 'bg-white'}`}
                    onContextMenu={(e) => handleContextMenu(e, date, time, undefined, carer.id)}
                    onClick={() => booking && handleBookingClick(booking)}
                  >
                    {hasBooking && booking ? (
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium">{booking.clientName}</div>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <CalendarDays className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onUpdateBooking(booking)}>
                              Edit Booking
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-xs">Available</div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="overflow-x-auto">
      {renderTimeGrid()}
    </div>
  );
};

const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 6; hour <= 21; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};
