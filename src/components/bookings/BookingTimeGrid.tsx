
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, RefreshCw, Plus } from "lucide-react";
import { BookingsList } from "./BookingsList";
import { NewBookingDialog } from "./dialogs/NewBookingDialog";
import { EditBookingDialog } from "./dialogs/EditBookingDialog";
import { ViewBookingDialog } from "./dialogs/ViewBookingDialog";
import { BookingOverlapAlert } from "./BookingOverlapAlert";
import { useBookingData } from "./hooks/useBookingData";
import { useBookingHandlers } from "./hooks/useBookingHandlers";
import { useBranchServices } from "@/data/hooks/useBranchServices";
import { cn } from "@/lib/utils";

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  clientInitials: string;
  carerId: string;
  carerName: string;
  carerInitials: string;
  startTime: string;
  endTime: string;
  date: string;
  status: string;
  notes?: string;
  service_id?: string | null;
  serviceName?: string | null;
}

export interface Client {
  id: string;
  name: string;
  initials: string;
  bookings: Booking[];
  bookingCount: number;
}

export interface Carer {
  id: string;
  name: string;
  initials: string;
  bookings: Booking[];
  bookingCount: number;
}

interface BookingTimeGridProps {
  selectedDate: Date;
  branchId?: string;
  user?: any;
  className?: string;
}

export function BookingTimeGrid({ selectedDate, branchId, user, className }: BookingTimeGridProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedViewBooking, setSelectedViewBooking] = useState<Booking | null>(null);

  const { clients, carers, bookings, isLoading } = useBookingData(branchId);
  const { data: services = [] } = useBranchServices(branchId);
  
  const {
    newBookingDialogOpen,
    setNewBookingDialogOpen,
    editBookingDialogOpen,
    setEditBookingDialogOpen,
    selectedBooking,
    newBookingData,
    overlapAlertOpen,
    setOverlapAlertOpen,
    overlapData,
    updateOverlapAlertOpen,
    setUpdateOverlapAlertOpen,
    updateOverlapData,
    isCheckingOverlap,
    handleRefresh,
    handleNewBooking,
    handleEditBooking,
    handleContextMenuBooking,
    handleUpdateBooking,
    handleCreateBooking,
    handleOverlapChooseDifferentCarer,
    handleOverlapModifyTime,
    handleOverlapForceCreate,
    handleUpdateOverlapChooseDifferentCarer,
    handleUpdateOverlapModifyTime,
    handleUpdateOverlapForceUpdate,
    createMultipleBookingsMutation,
    updateBookingMutation
  } = useBookingHandlers(branchId, user);

  // Filter bookings for the selected date
  const todaysBookings = useMemo(() => {
    const dateStr = selectedDate.toISOString().slice(0, 10);
    return bookings.filter(booking => booking.date === dateStr);
  }, [bookings, selectedDate]);

  const handleViewBooking = (booking: Booking) => {
    setSelectedViewBooking(booking);
    setViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    if (selectedViewBooking) {
      handleEditBooking(selectedViewBooking);
      setViewDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading bookings...</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Bookings for {selectedDate.toLocaleDateString()}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleNewBooking} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <BookingsList
            bookings={todaysBookings}
            onEditBooking={handleEditBooking}
            onViewBooking={handleViewBooking}
          />
        </CardContent>
      </Card>

      <NewBookingDialog
        open={newBookingDialogOpen}
        onOpenChange={setNewBookingDialogOpen}
        clients={clients}
        carers={carers}
        services={services}
        onCreateBooking={handleCreateBooking}
        initialData={newBookingData}
        isCreating={createMultipleBookingsMutation.isPending || isCheckingOverlap}
        branchId={branchId}
      />

      <EditBookingDialog
        open={editBookingDialogOpen}
        onOpenChange={setEditBookingDialogOpen}
        booking={selectedBooking}
        services={services}
        branchId={branchId}
      />

      <ViewBookingDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        booking={selectedViewBooking}
        services={services}
        onEdit={handleEditFromView}
      />

      <BookingOverlapAlert
        open={overlapAlertOpen}
        onOpenChange={setOverlapAlertOpen}
        conflictingBookings={overlapData?.conflictingBookings || []}
        carerName={overlapData?.carerName || ""}
        proposedTime={overlapData?.proposedTime || ""}
        proposedDate={overlapData?.proposedDate || ""}
        availableCarers={overlapData?.availableCarers || []}
        onChooseDifferentCarer={handleOverlapChooseDifferentCarer}
        onModifyTime={handleOverlapModifyTime}
        onForceCreate={handleOverlapForceCreate}
      />

      <BookingOverlapAlert
        open={updateOverlapAlertOpen}
        onOpenChange={setUpdateOverlapAlertOpen}
        conflictingBookings={updateOverlapData?.conflictingBookings || []}
        carerName={updateOverlapData?.carerName || ""}
        proposedTime={updateOverlapData?.proposedTime || ""}
        proposedDate={updateOverlapData?.proposedDate || ""}
        availableCarers={updateOverlapData?.availableCarers || []}
        onChooseDifferentCarer={handleUpdateOverlapChooseDifferentCarer}
        onModifyTime={handleUpdateOverlapModifyTime}
        onForceCreate={handleUpdateOverlapForceUpdate}
      />
    </div>
  );
}
