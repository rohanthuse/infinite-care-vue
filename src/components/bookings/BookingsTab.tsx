import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Booking } from "./BookingTimeGrid";
import { BookingTimeGrid } from "./BookingTimeGrid";
import { BookingsList } from "./BookingsList";
import { BookingReport } from "./BookingReport";
import { StaffScheduleCalendar } from "./StaffScheduleCalendar";
import { NewBookingDialog } from "./dialogs/NewBookingDialog";
import { EditBookingDialog } from "./EditBookingDialog";
import { ViewBookingDialog } from "./dialogs/ViewBookingDialog";
import { BookingOverlapAlert } from "./BookingOverlapAlert";
import { DateNavigation } from "./DateNavigation";
import { BookingFilters } from "./BookingFilters";
import { useBookingData } from "./hooks/useBookingData";
import { useBookingHandlers } from "./hooks/useBookingHandlers";
import { useAuthSafe } from "@/hooks/useAuthSafe";
import { useServices } from "@/data/hooks/useServices";
import { toast } from "sonner";
import { useRealTimeBookingSync } from "./hooks/useRealTimeBookingSync";
import { BookingValidationAlert } from "./BookingValidationAlert";
import { useSearchParams } from "react-router-dom";
import { parseISO, isValid } from "date-fns";
import { useBookingDebug } from "./hooks/useBookingDebug";

interface BookingsTabProps {
  branchId?: string;
}

export function BookingsTab({ branchId }: BookingsTabProps) {
  const { user } = useAuthSafe();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial values from URL parameters
  const dateParam = searchParams.get('date');
  const clientParam = searchParams.get('client');
  
  // Parse date parameter or default to today
  const initialDate = useMemo(() => {
    if (dateParam) {
      const parsedDate = parseISO(dateParam);
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    }
    return new Date();
  }, [dateParam]);
  
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [viewType, setViewType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedClientId, setSelectedClientId] = useState<string>(clientParam || "all-clients");
  const [selectedCarerId, setSelectedCarerId] = useState<string>("all-carers");
  const [activeView, setActiveView] = useState<string>("calendar");
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

  // Update URL parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedDate) {
      params.set('date', selectedDate.toISOString().split('T')[0]);
    }
    
    if (selectedClientId !== "all-clients") {
      params.set('client', selectedClientId);
    }
    
    // Only update URL if there are meaningful parameters to avoid cluttering
    if (params.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [selectedDate, selectedClientId, setSearchParams]);

  const { data: services = [], isLoading: isLoadingServices } = useServices();
  const { clients, carers, bookings, isLoading } = useBookingData(branchId);
  
  const { isConnected: isRealTimeConnected } = useRealTimeBookingSync(branchId);
  const { inspectCache } = useBookingDebug(branchId, bookings);
  
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
    isRefreshing,
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

  // Handle booking view from list
  const handleViewBooking = (booking: Booking) => {
    console.log("[BookingsTab] View booking from list:", booking.id);
    setViewingBooking(booking);
    setShowViewDialog(true);
  };

  // Handle edit from view dialog
  const handleEditFromView = () => {
    if (viewingBooking) {
      setShowViewDialog(false);
      handleEditBooking(viewingBooking);
    }
  };

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
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Bookings</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRealTimeConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isRealTimeConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading || isRefreshing}
                  className="transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 transition-transform duration-200 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh bookings, carers, and clients data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="outline"
            size="sm"
            onClick={inspectCache}
          >
            Debug Cache
          </Button>
          <Button onClick={handleNewBooking}>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Enhanced validation alert */}
      <BookingValidationAlert 
        isValidating={isCheckingOverlap}
        isValid={!isCheckingOverlap && !overlapAlertOpen && !updateOverlapAlertOpen}
      />

      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="staff-schedule">Staff Schedule</TabsTrigger>
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
            onViewBooking={handleViewBooking}
            onEditBooking={handleEditBooking}
            onRequestViewTypeChange={setViewType}
            isCheckingOverlap={isCheckingOverlap}
          />
        </TabsContent>
        
        <TabsContent value="list">
          <BookingsList 
            bookings={filteredBookings} 
            onEditBooking={handleEditBooking}
            onViewBooking={handleViewBooking}
          />
        </TabsContent>
        
        <TabsContent value="reports">
          <BookingReport bookings={filteredBookings} />
        </TabsContent>

        <TabsContent value="staff-schedule" className="w-full min-w-0">
          <StaffScheduleCalendar
            date={selectedDate}
            bookings={filteredBookings}
            branchId={branchId}
            onViewBooking={handleViewBooking}
            onCreateBooking={(staffId, timeSlot) => {
              // Create new booking with pre-filled staff and time (preserve exact 30-minute slot)
              handleContextMenuBooking(selectedDate, timeSlot, undefined, staffId);
            }}
            onDateChange={setSelectedDate}
            clients={clients}
            carers={carers}
            selectedClient={selectedClientId}
            selectedCarer={selectedCarerId}
            selectedStatus={statusFilter}
            onClientChange={setSelectedClientId}
            onCarerChange={setSelectedCarerId}
            onStatusChange={setStatusFilter}
          />
        </TabsContent>
      </Tabs>

      <NewBookingDialog
        open={newBookingDialogOpen}
        onOpenChange={setNewBookingDialogOpen}
        carers={carers}
        services={services}
        onCreateBooking={handleCreateBooking}
        branchId={branchId}
        prefilledData={newBookingData}
        preSelectedClientId={selectedClientId !== "all-clients" ? selectedClientId : undefined}
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

      <ViewBookingDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        booking={viewingBooking}
        services={services}
        onEdit={handleEditFromView}
      />
    </div>
  );
}
