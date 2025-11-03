import React from "react";
import { ClientScheduleCalendar } from "./ClientScheduleCalendar";
import { StaffScheduleCalendar } from "./StaffScheduleCalendar";
import { Booking, Client, Carer } from "./BookingTimeGrid";

interface UnifiedScheduleViewProps {
  date: Date;
  bookings: Booking[];
  branchId?: string;
  clients: Client[];
  carers: Carer[];
  selectedClient: string;
  selectedCarer: string;
  selectedStatus: string;
  viewType: "daily" | "weekly" | "monthly";
  onViewBooking: (booking: Booking) => void;
  onCreateBooking: (clientId: string | undefined, staffId: string | undefined, timeSlot: string) => void;
}

export function UnifiedScheduleView({
  date,
  bookings,
  branchId,
  clients,
  carers,
  selectedClient,
  selectedCarer,
  selectedStatus,
  viewType,
  onViewBooking,
  onCreateBooking,
}: UnifiedScheduleViewProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Left Panel - Client Schedule */}
      <div className="border-2 border-blue-500 rounded-lg flex flex-col h-[500px] overflow-hidden">
        <div className="bg-muted/50 px-4 py-2 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold">Client Schedule</h3>
          <p className="text-sm text-muted-foreground">View all client appointments</p>
        </div>
        <div className="flex-1 min-h-0">
          <ClientScheduleCalendar
            date={date}
            bookings={bookings}
            branchId={branchId}
            clients={clients}
            carers={carers}
            selectedClient={selectedClient}
            selectedCarer={selectedCarer}
            selectedStatus={selectedStatus}
            viewType={viewType}
            onClientChange={() => {}}
            onCarerChange={() => {}}
            onStatusChange={() => {}}
            onDateChange={() => {}}
            onViewBooking={onViewBooking}
            onCreateBooking={(clientId, timeSlot) => onCreateBooking(clientId, undefined, timeSlot)}
            hideControls={true}
            timeInterval={60}
          />
        </div>
      </div>

      {/* Right Panel - Staff Schedule */}
      <div className="border-2 border-green-500 rounded-lg flex flex-col h-[500px] overflow-hidden">
        <div className="bg-muted/50 px-4 py-2 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold">Staff Schedule</h3>
          <p className="text-sm text-muted-foreground">View all staff assignments</p>
        </div>
        <div className="flex-1 min-h-0">
          <StaffScheduleCalendar
            date={date}
            bookings={bookings}
            branchId={branchId}
            clients={clients}
            carers={carers}
            selectedClient={selectedClient}
            selectedCarer={selectedCarer}
            selectedStatus={selectedStatus}
            viewType={viewType}
            onClientChange={() => {}}
            onCarerChange={() => {}}
            onStatusChange={() => {}}
            onDateChange={() => {}}
            onViewBooking={onViewBooking}
            onCreateBooking={(staffId, timeSlot) => onCreateBooking(undefined, staffId, timeSlot)}
            hideControls={true}
            timeInterval={60}
          />
        </div>
      </div>
    </div>
  );
}
