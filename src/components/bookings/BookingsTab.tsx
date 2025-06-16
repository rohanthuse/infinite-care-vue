
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Booking } from "./BookingTimeGrid";
import { BookingTimeGrid } from "./BookingTimeGrid";
import { BookingsList } from "./BookingsList";
import { BookingReport } from "./BookingReport";
import { NewBookingDialog } from "./NewBookingDialog";
import { EditBookingDialog } from "./EditBookingDialog";
import { BookingOverlapAlert } from "./BookingOverlapAlert";
import { DateNavigation } from "./DateNavigation";
import { BookingFilters } from "./BookingFilters";
import { useBookingData } from "./hooks/useBookingData";
import { useBookingHandlers } from "./hooks/useBookingHandlers";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "@/data/hooks/useServices";
import { toast } from "sonner";

interface BookingsTabProps {
  branchId?: string;
}

export function BookingsTab({ branchId }: BookingsTabProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<"daily" | "weekly">("daily");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedClientId, setSelectedClientId] = useState<string>("all-clients");
  const [selectedCarerId, setSelectedCarerId] = useState<string>("all-carers");
  const [activeView, setActiveView] = useState<string>("calendar");

  const { data: services = [], isLoading: isLoadingServices } = useServices();
  const { clients, carers, bookings, isLoading } = useBookingData(branchId);
  
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

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      const matchesClient = selectedClientId === "all-clients" || booking.clientId === selectedClientId;
      const matchesCarer = selectedCarerId === "all-carers" || booking.carerId === selectedCarerId;
      return matchesStatus && matchesClient && matchesCarer;
    });
  }, [bookings, statusFilter, selectedClientId, selectedCarerId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Bookings</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleNewBooking}>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="space-y-4">
          <DateNavigation 
            currentDate={selectedDate} 
            onDateChange={setSelectedDate}
            viewType={viewType}
            onViewTypeChange={setViewType}
          />
          
          <BookingFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            selectedClientId={selectedClientId}
            onClientChange={setSelectedClientId}
            selectedCarerId={selectedCarerId}
            onCarerChange={setSelectedCarerId}
            clients={clients}
            carers={carers}
          />

          <BookingTimeGrid
            date={selectedDate}
            bookings={filteredBookings}
            clients={clients}
            carers={carers}
            viewType={viewType}
            viewMode="client"
            onCreateBooking={handleContextMenuBooking}
            onUpdateBooking={handleUpdateBooking}
            onEditBooking={handleEditBooking}
            isCheckingOverlap={isCheckingOverlap}
          />
        </TabsContent>
        
        <TabsContent value="list">
          <BookingsList bookings={filteredBookings} />
        </TabsContent>
        
        <TabsContent value="reports">
          <BookingReport bookings={filteredBookings} />
        </TabsContent>
      </Tabs>

      <NewBookingDialog
        open={newBookingDialogOpen}
        onOpenChange={setNewBookingDialogOpen}
        clients={clients}
        carers={carers}
        services={services}
        onCreateBooking={handleCreateBooking}
        isLoading={createMultipleBookingsMutation.isPending}
        initialData={newBookingData}
      />

      <EditBookingDialog
        open={editBookingDialogOpen}
        onOpenChange={setEditBookingDialogOpen}
        booking={selectedBooking}
        clients={clients}
        carers={carers}
        onUpdateBooking={handleUpdateBooking}
        isCheckingOverlap={isCheckingOverlap}
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
