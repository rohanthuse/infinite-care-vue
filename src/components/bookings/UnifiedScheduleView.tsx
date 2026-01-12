import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { format } from "date-fns";
import { DragDropContext, DropResult, DragStart, DragUpdate } from "react-beautiful-dnd";
import { Clock, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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

// 5-minute precision for drag-and-drop snapping
const DRAG_SNAP_INTERVAL = 5;

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
  const [isDragging, setIsDragging] = useState(false);
  const [currentDroppableId, setCurrentDroppableId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const queryClient = useQueryClient();
  const { mutate: updateBooking, isPending: isUpdating } = useUpdateBooking(branchId);
  const { mutate: updateMultipleBookings, isPending: isBatchUpdating } = useUpdateMultipleBookings(branchId);

  // Force refresh all booking-related caches
  const handleForceRefresh = useCallback(async () => {
    setIsRefreshing(true);
    console.log('[UnifiedScheduleView] 🔄 Force refreshing all booking caches for branchId:', branchId);
    
    try {
      // Invalidate with correct query key including branchId
      if (branchId) {
        await queryClient.invalidateQueries({ queryKey: ["branch-bookings", branchId] });
        await queryClient.refetchQueries({ queryKey: ["branch-bookings", branchId], type: 'active' });
        console.log('[UnifiedScheduleView] ✅ Invalidated branch-bookings for branchId:', branchId);
      } else {
        // Fallback: invalidate all branch-bookings queries using predicate
        await queryClient.invalidateQueries({ 
          predicate: (query) => query.queryKey[0] === "branch-bookings" 
        });
        await queryClient.refetchQueries({ 
          predicate: (query) => query.queryKey[0] === "branch-bookings",
          type: 'active'
        });
        console.log('[UnifiedScheduleView] ✅ Invalidated all branch-bookings queries');
      }
      
      // Also invalidate organization-level queries
      await queryClient.invalidateQueries({ queryKey: ["organization-calendar"] });
      await queryClient.invalidateQueries({ queryKey: ["organization-bookings"] });
      await queryClient.refetchQueries({ queryKey: ["organization-calendar"], type: 'active' });
      await queryClient.refetchQueries({ queryKey: ["organization-bookings"], type: 'active' });
      
      console.log('[UnifiedScheduleView] ✅ Cache refresh complete');
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('[UnifiedScheduleView] ❌ Refresh failed:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, branchId]);

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

  // Function to calculate and update drag tooltip in real-time
  const updateDragTooltip = useCallback(() => {
    if (!currentDroppableId) return;
    
    const droppableEl = document.querySelector(
      `[data-rbd-droppable-id="${currentDroppableId}"]`
    );
    if (!droppableEl) return;

    const rect = droppableEl.getBoundingClientRect();
    const xPosition = (window._dragDropPointerX || rect.left) - rect.left;
    
    // Calculate 5-minute slots within the hour for precise snapping
    // Total width per hour depends on timeInterval display (64px for hourly, 64px for 30-min)
    const PIXELS_PER_HOUR = timeInterval === 60 ? 64 : 64;
    const DRAG_SLOT_WIDTH = PIXELS_PER_HOUR / 12; // 12 slots of 5 minutes per hour
    const slotIndex = Math.floor(xPosition / DRAG_SLOT_WIDTH);
    
    // Convert slot index to time with 5-minute precision
    const totalMinutes = slotIndex * DRAG_SNAP_INTERVAL;
    const hours = Math.min(23, Math.max(0, Math.floor(totalMinutes / 60)));
    const minutes = totalMinutes % 60;
    const newStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
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
  }, [currentDroppableId, timeInterval]);

  // Animation loop for real-time tooltip updates during drag
  useEffect(() => {
    const animate = () => {
      if (isDragging) {
        updateDragTooltip();
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    if (isDragging) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, updateDragTooltip]);

  // Handler when drag starts - store duration and start animation loop
  const handleDragStart = (start: DragStart) => {
    setIsDragging(true);
    setCurrentDroppableId(start.source.droppableId);
    
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

  // Handler for drag updates - track current droppable zone
  const handleDragUpdate = (update: DragUpdate) => {
    if (update.destination) {
      setCurrentDroppableId(update.destination.droppableId);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    // Stop the animation loop and clear drag state
    setIsDragging(false);
    setCurrentDroppableId(null);
    setDragInfo(null);
    delete window._draggedBookingDuration;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

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
    
    // Calculate 5-minute slots for precise drop positioning
    const PIXELS_PER_HOUR = timeInterval === 60 ? 64 : 64;
    const DRAG_SLOT_WIDTH = PIXELS_PER_HOUR / 12; // 12 slots of 5 minutes per hour
    const slotIndex = Math.floor(xPosition / DRAG_SLOT_WIDTH);
    
    // Convert slot index to time with 5-minute precision
    const totalMinutes = slotIndex * DRAG_SNAP_INTERVAL;
    const hours = Math.min(23, Math.max(0, Math.floor(totalMinutes / 60)));
    const minutes = totalMinutes % 60;
    const newStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
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
            left: `${dragInfo.positionX + 20}px`,
            top: `${dragInfo.positionY - 65}px`,
          }}
        >
          <div className="bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-xl text-sm font-medium whitespace-nowrap border border-primary-foreground/20">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Drop booking here:</span>
              </div>
              <span className="font-bold text-base">{dragInfo.startTime} - {dragInfo.endTime}</span>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4 w-full">
      {/* Force Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleForceRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
      
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
