
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, UserPlus } from "lucide-react";
import { DateNavigation } from "./DateNavigation";
import { BookingFilters } from "./BookingFilters";
import { BookingTimeGrid } from "./BookingTimeGrid";
import { BookingsList } from "./BookingsList";
import { BookingReport } from "./BookingReport";
import { NewBookingDialog } from "./NewBookingDialog";
import { EditBookingDialog } from "./EditBookingDialog";
import { CreateAdminDialog } from "./CreateAdminDialog";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "@/data/hooks/useServices";
import { useBookingData } from "./hooks/useBookingData";
import { useBookingHandlers } from "./hooks/useBookingHandlers";
import { filterBookings, getStatusCounts } from "./utils/bookingUtils";

export interface BookingsTabProps {
  branchId?: string;
  branchName?: string;
}

export const BookingsTab: React.FC<BookingsTabProps> = ({
  branchId,
  branchName,
}) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<"daily" | "weekly">("weekly");
  const [activeTab, setActiveTab] = useState<string>("planning");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"client" | "group">("client");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["assigned", "in-progress"]);
  const [createAdminDialogOpen, setCreateAdminDialogOpen] = useState<boolean>(false);

  // Use custom hooks for data and handlers
  const { clients, carers, bookings, isLoading } = useBookingData(branchId);
  const {
    newBookingDialogOpen,
    setNewBookingDialogOpen,
    editBookingDialogOpen,
    setEditBookingDialogOpen,
    selectedBooking,
    newBookingData,
    handleRefresh,
    handleNewBooking,
    handleEditBooking,
    handleContextMenuBooking,
    handleUpdateBooking,
    handleCreateBooking,
    createMultipleBookingsMutation,
    updateBookingMutation
  } = useBookingHandlers(branchId, user);

  // Add service fetching
  const { data: services = [] } = useServices();

  // Filter bookings and get status counts
  const filteredBookings = filterBookings(bookings, searchQuery, selectedStatuses);
  const statusCounts = getStatusCounts(bookings);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-lg w-full lg:w-auto">
            <TabsTrigger value="planning" className="flex-1 lg:flex-initial data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Planning
            </TabsTrigger>
            <TabsTrigger value="list" className="flex-1 lg:flex-initial data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              List
            </TabsTrigger>
            <TabsTrigger value="report" className="flex-1 lg:flex-initial data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Report
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-3 w-full lg:w-auto justify-between">
          {activeTab === "planning" && <DateNavigation currentDate={currentDate} onDateChange={setCurrentDate} viewType={viewType} onViewTypeChange={setViewType} />}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8 w-8 p-0" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {!user && (
              <Button
                onClick={() => setCreateAdminDialogOpen(true)}
                variant="outline"
                className="h-9 border-orange-500 text-orange-600 hover:bg-orange-50 rounded-full px-3 shadow-sm"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                <span>Create Admin</span>
              </Button>
            )}
            <Button
              onClick={handleNewBooking}
              variant="default"
              className="h-9 bg-blue-600 hover:bg-blue-700 rounded-full px-3 shadow-sm"
              disabled={!user}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>New Booking</span>
            </Button>
          </div>
        </div>
      </div>
      
      {activeTab === "planning" && (
        <>
          <BookingFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedStatuses={selectedStatuses}
            onStatusChange={setSelectedStatuses}
            statusCounts={statusCounts}
          />
          <BookingTimeGrid
            date={currentDate}
            bookings={filteredBookings}
            clients={clients}
            carers={carers}
            viewType={viewType}
            viewMode={viewMode}
            onCreateBooking={handleContextMenuBooking}
            onUpdateBooking={handleUpdateBooking}
            onEditBooking={handleEditBooking}
            isUpdatingBooking={updateBookingMutation.isPending}
          />
        </>
      )}
      {activeTab === "list" && <BookingsList bookings={filteredBookings} />}
      {activeTab === "report" && <BookingReport bookings={filteredBookings} branchName={branchName} />}
      
      <NewBookingDialog
        open={newBookingDialogOpen}
        onOpenChange={setNewBookingDialogOpen}
        clients={clients}
        carers={carers}
        services={services}
        onCreateBooking={handleCreateBooking}
        initialData={newBookingData}
        isLoading={createMultipleBookingsMutation.isPending}
        error={createMultipleBookingsMutation.error}
      />
      <EditBookingDialog
        open={editBookingDialogOpen}
        onOpenChange={setEditBookingDialogOpen}
        booking={selectedBooking}
        clients={clients}
        carers={carers}
        onUpdateBooking={handleUpdateBooking}
      />
      <CreateAdminDialog
        open={createAdminDialogOpen}
        onOpenChange={setCreateAdminDialogOpen}
        branchId={branchId || ""}
      />
    </div>
  );
};
