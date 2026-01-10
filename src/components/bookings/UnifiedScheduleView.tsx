import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { DragDropContext, DropResult, DragStart, DragUpdate } from "react-beautiful-dnd";
import { Clock } from "lucide-react";
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
import { validateBookingAgainstClientActiveDate } from "@/utils/clientActiveValidation";

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
    _dragDropPointerY?: number;
    _draggedBookingDuration?: number;
  }
}

interface DragTimeInfo {
  startTime: string;
  endTime: string;
  positionX: number;
  positionY: number;
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
  const [dragInfo, setDragInfo] = useState<DragTimeInfo | null>(null);
  const { mutate: updateBooking, isPending: isUpdating } = useUpdateBooking(branchId);
  const { mutate: updateMultipleBookings, isPending: isBatchUpdating } = useUpdateMultipleBookings(branchId);

  // Build client active_until map for drag-drop validation
  const clientActiveMap = useMemo(() => {
    const map = new Map<string, string | null>();
    clients.forEach(c => {
      map.set(c.id, (c as any).active_until || null);
    });
    return map;
  }, [clients]);

  // Track mouse position for precise drop detection
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      window._dragDropPointerX = e.clientX;
      window._dragDropPointerY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      delete window._dragDropPointerX;
      delete window._dragDropPointerY;
    };
  }, []);

  // Handler when drag starts - store duration of dragged booking
  const handleDragStart = (start: DragStart) => {
    const { draggableId } = start;
    
    // Extract actual booking ID from prefixed draggableId
    const bookingIdMatch = draggableId.match(/^(?:client|staff)-(.+)-\d+$/);
    const actualBookingId = bookingIdMatch ? bookingIdMatch[1] : draggableId;
    
    // Find the booking and store its duration
    const booking = bookings.find(b => b.id === actualBookingId);
    if (booking) {
      window._draggedBookingDuration = calculateDuration(booking.startTime, booking.endTime);
    }
  };

  // Handler for drag updates - calculate and show time tooltip
  const handleDragUpdate = (update: DragUpdate) => {
    if (!update.destination) {
      setDragInfo(null);
      return;
    }

    const droppableEl = document.querySelector(
      `[data-rbd-droppable-id="${update.destination.droppableId}"]`
    );
    if (!droppableEl) {
      setDragInfo(null);
      return;
    }

    const rect = droppableEl.getBoundingClientRect();
    const xPosition = (window._dragDropPointerX || rect.left) - rect.left;
    
    // Calculate slot index based on X position
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
    
    // Calculate end time using stored booking duration
    const duration = window._draggedBookingDuration || 60;
    const newEndTime = addMinutesToTime(newStartTime, duration);
    
    // Update tooltip position and content
    setDragInfo({
      startTime: newStartTime,
      endTime: newEndTime,
      positionX: window._dragDropPointerX || 0,
      positionY: window._dragDropPointerY || 0
    });
  };

  const handleDragEnd = (result: DropResult) => {
    // Clear drag tooltip immediately
    setDragInfo(null);
    delete window._draggedBookingDuration;

    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    
    // Extract actual booking ID from prefixed draggableId
    const bookingIdMatch = draggableId.match(/^(?:client|staff)-(.+)-\d+$/);
    const actualBookingId = bookingIdMatch ? bookingIdMatch[1] : draggableId;
    
    // Find the booking being dragged
    const booking = bookings.find(b => b.id === actualBookingId);
    if (!booking) return;

    // Get date for validation
    const dateString = format(date, 'yyyy-MM-dd');

    // VALIDATE CLIENT ACTIVE DATE before allowing reschedule
    if (booking.clientId) {
      const clientActiveUntil = clientActiveMap.get(booking.clientId);
      const validation = validateBookingAgainstClientActiveDate(dateString, clientActiveUntil);
      if (!validation.isValid) {
        toast.error("Cannot Reschedule", {
          description: validation.error
        });
        return;
      }
    }

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
    setDragInfo(null);
    delete window._dragDropPointerX;
    delete window._dragDropPointerY;
    delete window._draggedBookingDuration;
    
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
    <DragDropContext 
      key={dragDropKey} 
      onDragStart={handleDragStart}
      onDragUpdate={handleDragUpdate}
      onDragEnd={handleDragEnd}
    >
      {/* Drag Time Tooltip */}
      {dragInfo && (
        <div 
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${dragInfo.positionX + 15}px`,
            top: `${dragInfo.positionY - 45}px`,
          }}
        >
          <div className="bg-primary text-primary-foreground px-3 py-2 rounded-md shadow-lg text-sm font-medium whitespace-nowrap">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{dragInfo.startTime} - {dragInfo.endTime}</span>
            </div>
          </div>
        </div>
      )}
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
