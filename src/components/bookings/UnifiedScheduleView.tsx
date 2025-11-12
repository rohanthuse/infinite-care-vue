import React, { useState } from "react";
import { format } from "date-fns";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { toast } from "sonner";
import { ClientScheduleCalendar } from "./ClientScheduleCalendar";
import { StaffScheduleCalendar } from "./StaffScheduleCalendar";
import { BookingReassignDialog } from "./drag-drop/BookingReassignDialog";
import { Booking, Client, Carer } from "./BookingTimeGrid";
import { 
  calculateTimeFromPosition, 
  calculateDuration, 
  addMinutesToTime,
  extractStaffIdFromDroppableId,
  doBookingsOverlap
} from "./drag-drop/dragDropHelpers";
import { useUpdateBooking } from "@/data/hooks/useUpdateBooking";

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

interface PendingBookingMove {
  booking: Booking;
  newStaffId: string;
  newStaffName: string;
  newStartTime: string;
  newEndTime: string;
  hasConflict: boolean;
  conflictMessage?: string;
}

// Track mouse position for drag-and-drop
declare global {
  interface Window {
    _dragDropPointerY?: number;
  }
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
  const [pendingMove, setPendingMove] = useState<PendingBookingMove | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { mutate: updateBooking, isPending: isUpdating } = useUpdateBooking(branchId);

  // Track mouse position for precise drop detection
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      window._dragDropPointerY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      delete window._dragDropPointerY;
    };
  }, []);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    
    // Find the booking being dragged
    const booking = bookings.find(b => b.id === draggableId);
    if (!booking) return;

    // Extract staff IDs
    const sourceStaffId = extractStaffIdFromDroppableId(source.droppableId);
    const destStaffId = extractStaffIdFromDroppableId(destination.droppableId);
    
    if (!destStaffId) return;

    // Get droppable element to calculate Y position
    const droppableEl = document.querySelector(`[data-rbd-droppable-id="${destination.droppableId}"]`);
    if (!droppableEl) return;

    const rect = droppableEl.getBoundingClientRect();
    const yPosition = (window._dragDropPointerY || rect.top) - rect.top;
    
    // Calculate new start time from Y position (60px per hour, 30min intervals)
    const newStartTime = calculateTimeFromPosition(yPosition, 60, 30);
    
    // Calculate duration and new end time
    const duration = calculateDuration(booking.startTime, booking.endTime);
    const newEndTime = addMinutesToTime(newStartTime, duration);
    
    // Get staff name
    const newStaff = carers.find(c => c.id === destStaffId);
    if (!newStaff) return;

    // Check for conflicts with other bookings for this staff
    const dateString = format(date, 'yyyy-MM-dd');
    const conflictingBookings = bookings.filter(b => 
      b.carerId === destStaffId && 
      b.id !== booking.id &&
      b.date === dateString &&
      doBookingsOverlap(newStartTime, newEndTime, b.startTime, b.endTime)
    );

    const hasConflict = conflictingBookings.length > 0;
    const conflictMessage = hasConflict 
      ? `${newStaff.name} already has ${conflictingBookings.length} booking(s) at this time`
      : undefined;

    // Show confirmation dialog
    setPendingMove({
      booking,
      newStaffId: destStaffId,
      newStaffName: newStaff.name,
      newStartTime,
      newEndTime,
      hasConflict,
      conflictMessage
    });
    setDialogOpen(true);
  };

  const handleConfirmMove = () => {
    if (!pendingMove || isUpdating) return;

    const { booking, newStaffId, newStartTime, newEndTime } = pendingMove;

    updateBooking({
      bookingId: booking.id,
      updatedData: {
        staff_id: newStaffId,
        start_time: newStartTime,
        end_time: newEndTime,
      }
    });

    setDialogOpen(false);
    setPendingMove(null);
    delete window._dragDropPointerY;
  };

  const handleCancelMove = () => {
    setDialogOpen(false);
    setPendingMove(null);
    delete window._dragDropPointerY;
  };

  const oldStaff = pendingMove 
    ? carers.find(c => c.id === pendingMove.booking.carerId)
    : null;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4 w-full">
      {/* Left Panel - Client Schedule */}
      <div className="border-2 border-blue-500 rounded-lg flex flex-col h-[500px] max-w-full overflow-hidden">
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
      <div className="border-2 border-green-500 rounded-lg flex flex-col h-[500px] max-w-full overflow-hidden">
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
            enableDragDrop={true}
          />
        </div>
      </div>

      {/* Booking Reassignment Confirmation Dialog */}
      <BookingReassignDialog
        open={dialogOpen}
        booking={pendingMove?.booking || null}
        oldStaffName={oldStaff?.name || ""}
        newStaffName={pendingMove?.newStaffName || ""}
        oldStartTime={pendingMove?.booking.startTime || ""}
        oldEndTime={pendingMove?.booking.endTime || ""}
        newStartTime={pendingMove?.newStartTime || ""}
        newEndTime={pendingMove?.newEndTime || ""}
        hasConflict={pendingMove?.hasConflict || false}
        conflictMessage={pendingMove?.conflictMessage}
        onConfirm={handleConfirmMove}
        onCancel={handleCancelMove}
      />
    </div>
    </DragDropContext>
  );
}
