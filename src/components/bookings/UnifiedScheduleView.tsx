import React from "react";
import { ClientScheduleCalendar } from "./ClientScheduleCalendar";
import { StaffScheduleCalendar } from "./StaffScheduleCalendar";
import { DateNavigation } from "./DateNavigation";
import { BookingFilters } from "./BookingFilters";
import { Booking, Client, Carer } from "./BookingTimeGrid";
import { cn } from "@/lib/utils";

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
  onViewTypeChange: (viewType: "daily" | "weekly" | "monthly") => void;
  onClientChange: (clientId: string) => void;
  onCarerChange: (carerId: string) => void;
  onStatusChange: (status: string) => void;
  onDateChange: (date: Date) => void;
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
  onViewTypeChange,
  onClientChange,
  onCarerChange,
  onStatusChange,
  onDateChange,
  onViewBooking,
  onCreateBooking,
}: UnifiedScheduleViewProps) {
  return (
    <div className={cn(
      "space-y-4 unified-schedule-container",
      viewType === "weekly" && "weekly-view",
      viewType === "daily" && "daily-view",
      viewType === "monthly" && "monthly-view"
    )}>
      {/* Shared Controls at Top */}
      <div className="space-y-4 bg-background p-4 rounded-lg border">
        <DateNavigation
          currentDate={date}
          onDateChange={onDateChange}
          viewType={viewType}
          onViewTypeChange={onViewTypeChange}
        />
        
        <BookingFilters
          statusFilter={selectedStatus}
          onStatusFilterChange={onStatusChange}
          selectedClientId={selectedClient}
          onClientChange={onClientChange}
          selectedCarerId={selectedCarer}
          onCarerChange={onCarerChange}
          clients={clients}
          carers={carers}
        />
      </div>

      {/* Horizontal Split View - Top/Bottom */}
      <div className="space-y-4">
        {/* Top Panel - Client Schedule */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b">
            <h3 className="text-lg font-semibold">Client Schedule</h3>
            <p className="text-sm text-muted-foreground">View all client appointments</p>
          </div>
          <div className="h-[28vh] overflow-auto pr-20 time-grid">
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
              onClientChange={onClientChange}
              onCarerChange={onCarerChange}
              onStatusChange={onStatusChange}
              onDateChange={onDateChange}
              onViewBooking={onViewBooking}
              onCreateBooking={(clientId, timeSlot) => onCreateBooking(clientId, undefined, timeSlot)}
              hideControls={true}
              timeInterval={60}
            />
          </div>
        </div>

        {/* Bottom Panel - Staff Schedule */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b">
            <h3 className="text-lg font-semibold">Staff Schedule</h3>
            <p className="text-sm text-muted-foreground">View all staff assignments</p>
          </div>
          <div className="h-[28vh] overflow-auto pr-20 time-grid">
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
              onClientChange={onClientChange}
              onCarerChange={onCarerChange}
              onStatusChange={onStatusChange}
              onDateChange={onDateChange}
              onViewBooking={onViewBooking}
              onCreateBooking={(staffId, timeSlot) => onCreateBooking(undefined, staffId, timeSlot)}
              hideControls={true}
              timeInterval={60}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
