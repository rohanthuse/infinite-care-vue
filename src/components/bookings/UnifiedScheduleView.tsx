import React, { useState } from "react";
import { format } from "date-fns";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { toast } from "sonner";
import { ClientScheduleCalendar } from "./ClientScheduleCalendar";
import { StaffScheduleCalendar } from "./StaffScheduleCalendar";
import { BookingReassignDialog } from "./drag-drop/BookingReassignDialog";
import { BookingReassignActionsBar } from "./BookingReassignActionsBar";
import { BookingBatchReassignDialog } from "./BookingBatchReassignDialog";
import { Booking, Client, Carer } from "./BookingTimeGrid";
import { 
  calculateTimeFromPosition, 
  calculateDuration, 
  addMinutesToTime,
  extractStaffIdFromDroppableId,
  extractClientIdFromDroppableId,
  doBookingsOverlap
} from "./drag-drop/dragDropHelpers";
import { createBookingDateTime } from "./utils/dateUtils";
import { useUpdateBooking } from "@/data/hooks/useUpdateBooking";
import { useUpdateMultipleBookings } from "@/hooks/useUpdateMultipleBookings";

interface UnifiedScheduleViewProps {
  date: Date;
  bookings: Booking[];
  branchId?: string;
  clients: Client[];
  carers: Carer[];
  selectedClientIds: string[];
  selectedCarerIds: string[];
  selectedStatus: string;
  viewType: "daily" | "weekly" | "monthly";
  timeInterval?: 30 | 60;
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
    _dragDropPointerX?: number;
  }
}

export function UnifiedScheduleView({
  date,
  bookings,
  branchId,
  clients,
  carers,
  selectedClientIds,
  selectedCarerIds,
  selectedStatus,
  viewType,
  timeInterval = 60,
  onViewBooking,
  onCreateBooking,
}: UnifiedScheduleViewProps) {
  const [pendingMove, setPendingMove] = useState<PendingBookingMove | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dragDropKey, setDragDropKey] = useState(0);
  const [selectedBookings, setSelectedBookings] = useState<Booking[]>([]);
  const [batchReassignOpen, setBatchReassignOpen] = useState(false);
  const { mutate: updateBooking, isPending: isUpdating } = useUpdateBooking(branchId);
  const { mutate: updateMultipleBookings, isPending: isBatchUpdating } = useUpdateMultipleBookings(branchId);

  // Track mouse position for precise drop detection
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      window._dragDropPointerX = e.clientX;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      delete window._dragDropPointerX;
    };
  }, []);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    
    // Extract actual booking ID from prefixed draggableId
    // Format: "client-{bookingId}-{idx}" or "staff-{bookingId}-{idx}"
    const bookingIdMatch = draggableId.match(/^(?:client|staff)-(.+)-\d+$/);
    const actualBookingId = bookingIdMatch ? bookingIdMatch[1] : draggableId;
    
    // Find the booking being dragged
    const booking = bookings.find(b => b.id === actualBookingId);
    if (!booking) return;

    // Determine if this is a staff or client drop
    const isStaffDrop = destination.droppableId.startsWith('staff-');
    const isClientDrop = destination.droppableId.startsWith('client-');

    // Get droppable element to calculate X position
    const droppableEl = document.querySelector(`[data-rbd-droppable-id="${destination.droppableId}"]`);
    if (!droppableEl) return;

    const rect = droppableEl.getBoundingClientRect();
    const xPosition = (window._dragDropPointerX || rect.left) - rect.left;
    
    // Calculate which slot was dropped on based on horizontal position
    const SLOT_WIDTH = timeInterval === 60 ? 64 : 32;
    const slotIndex = Math.floor(xPosition / SLOT_WIDTH);
    
    // Convert slot index to time
    let newStartTime: string;
    if (timeInterval === 60) {
      const hours = Math.min(23, Math.max(0, slotIndex));
      newStartTime = `${hours.toString().padStart(2, '0')}:00`;
    } else {
      const totalMinutes = slotIndex * 30;
      const hours = Math.min(23, Math.floor(totalMinutes / 60));
      const minutes = totalMinutes % 60;
      newStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Calculate duration and new end time
    const duration = calculateDuration(booking.startTime, booking.endTime);
    const newEndTime = addMinutesToTime(newStartTime, duration);
    const dateString = format(date, 'yyyy-MM-dd');

    if (isStaffDrop) {
      // Staff drop - reassign to different staff and/or time
      const destStaffId = extractStaffIdFromDroppableId(destination.droppableId);
      if (!destStaffId) return;

      // Get staff name
      const newStaff = carers.find(c => c.id === destStaffId);
      if (!newStaff) return;

      // Check for conflicts with other bookings for this staff
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
    } else if (isClientDrop) {
      // Client drop - reschedule time (keep same staff)
      const destClientId = extractClientIdFromDroppableId(destination.droppableId);
      if (!destClientId) return;

      // Get current staff name
      const currentStaff = carers.find(c => c.id === booking.carerId);
      const staffName = currentStaff?.name || booking.carerName || 'Unknown';

      // Check for conflicts - same staff at same time
      const conflictingBookings = bookings.filter(b => 
        b.carerId === booking.carerId && 
        b.id !== booking.id &&
        b.date === dateString &&
        doBookingsOverlap(newStartTime, newEndTime, b.startTime, b.endTime)
      );

      const hasConflict = conflictingBookings.length > 0;
      const conflictMessage = hasConflict 
        ? `${staffName} already has ${conflictingBookings.length} booking(s) at this time`
        : undefined;

      // Show confirmation dialog (time change only, keep same staff)
      setPendingMove({
        booking,
        newStaffId: booking.carerId,
        newStaffName: staffName,
        newStartTime,
        newEndTime,
        hasConflict,
        conflictMessage
      });
      setDialogOpen(true);
    }
  };

  const handleConfirmMove = () => {
    if (!pendingMove || isUpdating) return;

    const { booking, newStaffId, newStartTime, newEndTime } = pendingMove;
    
    // Convert date to YYYY-MM-DD format
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Create proper UTC timestamps using createBookingDateTime
    const newStartTimeUTC = createBookingDateTime(dateString, newStartTime);
    const newEndTimeUTC = createBookingDateTime(dateString, newEndTime);
    
    console.log('[UnifiedScheduleView] Converting times for update:', {
      dateString,
      newStartTime,
      newEndTime,
      newStartTimeUTC,
      newEndTimeUTC
    });

    updateBooking(
      {
        bookingId: booking.id,
        updatedData: {
          staff_id: newStaffId,
          start_time: newStartTimeUTC,
          end_time: newEndTimeUTC,
        }
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setPendingMove(null);
          delete window._dragDropPointerX;
          // Success toast is already shown by useUpdateBooking
        },
        onError: () => {
          // Reset visual position on error
          setDragDropKey(prev => prev + 1);
          setDialogOpen(false);
          setPendingMove(null);
          delete window._dragDropPointerX;
        }
      }
    );
  };

  const handleCancelMove = () => {
    setDialogOpen(false);
    setPendingMove(null);
    delete window._dragDropPointerX;
    
    // Force complete reset of drag-drop context
    setDragDropKey(prev => prev + 1);
    
    // Show feedback
    toast.info("Booking move cancelled - returned to original position");
  };

  const handleBookingSelect = (booking: Booking, selected: boolean) => {
    setSelectedBookings(prev => {
      if (selected) {
        return [...prev, booking];
      } else {
        return prev.filter(b => b.id !== booking.id);
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedBookings([]);
  };

  const handleBulkReassign = () => {
    setBatchReassignOpen(true);
  };

  const handleBatchReassignConfirm = (newStaffId: string) => {
    if (isBatchUpdating) return;

    updateMultipleBookings(
      {
        bookingIds: selectedBookings.map(b => b.id),
        bookings: selectedBookings.map(b => ({
          id: b.id,
          clientId: b.clientId,
          staffId: b.carerId
        })),
        updatedData: {
          staff_id: newStaffId
        }
      },
      {
        onSuccess: () => {
          setBatchReassignOpen(false);
          setSelectedBookings([]);
        },
        onError: () => {
          setBatchReassignOpen(false);
        }
      }
    );
  };

  const handleBatchReassignCancel = () => {
    setBatchReassignOpen(false);
  };

  const oldStaff = pendingMove 
    ? carers.find(c => c.id === pendingMove.booking.carerId)
    : null;

  return (
    <DragDropContext key={dragDropKey} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4 w-full">
      {/* Left Panel - Client Schedule */}
      <div className="border-2 border-blue-500 dark:border-blue-600/70 rounded-lg flex flex-col h-[500px] max-w-full overflow-hidden">
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
            selectedClientIds={selectedClientIds}
            selectedCarerIds={selectedCarerIds}
            selectedStatus={selectedStatus}
            viewType={viewType}
            onClientChange={() => {}}
            onCarerChange={() => {}}
            onStatusChange={() => {}}
            onDateChange={() => {}}
            onViewBooking={onViewBooking}
            onCreateBooking={(clientId, timeSlot) => onCreateBooking(clientId, undefined, timeSlot)}
            hideControls={true}
            timeInterval={timeInterval}
            selectedBookings={selectedBookings}
            onBookingSelect={handleBookingSelect}
            enableDragDrop={true}
          />
        </div>
      </div>

      {/* Right Panel - Staff Schedule */}
      <div className="border-2 border-green-500 dark:border-green-600/70 rounded-lg flex flex-col h-[500px] max-w-full overflow-hidden">
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
            selectedClientIds={selectedClientIds}
            selectedCarerIds={selectedCarerIds}
            selectedStatus={selectedStatus}
            viewType={viewType}
            onClientChange={() => {}}
            onCarerChange={() => {}}
            onStatusChange={() => {}}
            onDateChange={() => {}}
            onViewBooking={onViewBooking}
            onCreateBooking={(staffId, timeSlot) => onCreateBooking(undefined, staffId, timeSlot)}
            hideControls={true}
            timeInterval={timeInterval}
            enableDragDrop={true}
            selectedBookings={selectedBookings}
            onBookingSelect={handleBookingSelect}
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
        isLoading={isUpdating}
        onConfirm={handleConfirmMove}
        onCancel={handleCancelMove}
      />

      {/* Batch Reassignment Dialog */}
      <BookingBatchReassignDialog
        open={batchReassignOpen}
        selectedBookings={selectedBookings}
        carers={carers}
        existingBookings={bookings}
        isLoading={isBatchUpdating}
        onConfirm={handleBatchReassignConfirm}
        onCancel={handleBatchReassignCancel}
      />

      {/* Bulk Actions Bar */}
      <BookingReassignActionsBar
        selectedBookings={selectedBookings}
        onClearSelection={handleClearSelection}
        onBulkReassign={handleBulkReassign}
      />
    </div>
    </DragDropContext>
  );
}
