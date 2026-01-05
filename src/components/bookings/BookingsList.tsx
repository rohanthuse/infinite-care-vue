import React, { useState, useMemo, useEffect } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronLeft, ChevronRight, Search, Filter, Eye, Edit, Clock, MapPin, Calendar, User, Trash2, AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Booking } from "./BookingTimeGrid";
import { format } from "date-fns";
import { ReportExporter } from "@/utils/reportExporter";
import { toast } from "sonner";
import { useDeleteBooking } from "@/data/hooks/useDeleteBooking";
import { useDeleteMultipleBookings } from "@/hooks/useDeleteMultipleBookings";
import { useForceDeleteBooking } from "@/hooks/useForceDeleteBooking";
import { useBookingRelatedRecords, BookingRelatedRecords } from "@/hooks/useBookingRelatedRecords";
import { useUserRole } from "@/hooks/useUserRole";
import { BookingBulkActionsBar } from "./BookingBulkActionsBar";
import { cn } from "@/lib/utils";
import { forceModalCleanup } from "@/lib/modal-cleanup";
import { getEffectiveBookingStatus, getBookingStatusLabel } from "./utils/bookingColors";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BookingsListProps {
  bookings: Booking[];
  onEditBooking?: (booking: Booking) => void;
  onViewBooking?: (booking: Booking) => void;
  branchId?: string;
}

export const BookingsList: React.FC<BookingsListProps> = ({ 
  bookings, 
  onEditBooking,
  onViewBooking,
  branchId
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [showForceDeleteConfirm, setShowForceDeleteConfirm] = useState(false);
  const [relatedRecordsInfo, setRelatedRecordsInfo] = useState<BookingRelatedRecords | null>(null);
  const itemsPerPage = 10;
  
  const deleteBooking = useDeleteBooking(branchId);
  const deleteMultipleBookings = useDeleteMultipleBookings(branchId);
  const forceDeleteBooking = useForceDeleteBooking(branchId);
  const { isLoading: isCheckingRelated, checkRelatedRecords, reset: resetRelatedRecords } = useBookingRelatedRecords();
  const { data: userRole } = useUserRole();
  
  // Check if user can delete bookings (admins only)
  const canDelete = userRole?.role && ['super_admin', 'branch_admin'].includes(userRole.role);

  // Compute actual filter counts
  const statusCounts = bookings.reduce<Record<string, number>>((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    // Also count late and missed bookings
    if (booking.is_late_start === true && !booking.is_missed) {
      acc['late'] = (acc['late'] || 0) + 1;
    }
    if (booking.is_missed === true) {
      acc['missed'] = (acc['missed'] || 0) + 1;
    }
    return acc;
  }, {});

  // Pre-calculate related carer counts for each booking (multi-carer detection)
  const relatedCarerCounts = useMemo(() => {
    const counts = new Map<string, { count: number; carerNames: string[] }>();
    
    bookings.forEach(booking => {
      const relatedBookings = bookings.filter(b => 
        b.clientId === booking.clientId &&
        b.date === booking.date &&
        b.startTime === booking.startTime &&
        b.endTime === booking.endTime
      );
      
      counts.set(booking.id, {
        count: relatedBookings.length,
        carerNames: relatedBookings
          .map(b => b.carerName)
          .filter((name): name is string => !!name && name !== 'Not Assigned')
      });
    });
    
    return counts;
  }, [bookings]);

  // Sort bookings by date and time
  const sortedBookings = [...bookings].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  // Filter bookings based on search and status
  const filteredBookings = sortedBookings.filter(booking => {
    const matchesSearch = 
      booking.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.carerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Handle special late/missed status filters
    let matchesStatus = false;
    if (statusFilter === "all") {
      matchesStatus = true;
    } else if (statusFilter === "late") {
      matchesStatus = booking.is_late_start === true && !booking.is_missed;
    } else if (statusFilter === "missed") {
      matchesStatus = booking.is_missed === true;
    } else {
      matchesStatus = booking.status === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Paginate bookings
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Multi-select computed values
  const currentPageBookingIds = useMemo(
    () => paginatedBookings.map(b => b.id),
    [paginatedBookings]
  );

  const allCurrentPageSelected = currentPageBookingIds.length > 0 && 
    currentPageBookingIds.every(id => selectedBookingIds.includes(id));

  const someSelected = selectedBookingIds.length > 0 && !allCurrentPageSelected;
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle edit booking click
  const handleEditClick = (booking: Booking) => {
    console.log("[BookingsList] Edit clicked for booking:", booking.id);
    if (onEditBooking) {
      onEditBooking(booking);
    }
  };

  // Handle view booking click
  const handleViewClick = (booking: Booking) => {
    console.log("[BookingsList] View clicked for booking:", booking.id);
    if (onViewBooking) {
      onViewBooking(booking);
    } else if (onEditBooking) {
      // Fallback to edit if view handler not provided
      onEditBooking(booking);
    }
  };

  // Handle delete booking click - check for related records first
  const handleDeleteClick = async (booking: Booking) => {
    setDeleteBookingId(booking.id);
    setShowForceDeleteConfirm(false);
    setRelatedRecordsInfo(null);
    
    // Check for related records
    const records = await checkRelatedRecords(booking.id);
    if (records?.hasRelatedRecords) {
      setRelatedRecordsInfo(records);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteBookingId) {
      console.log('[BookingsList] No booking ID to delete');
      return;
    }
    
    const booking = bookings.find(b => b.id === deleteBookingId);
    if (!booking) {
      console.log('[BookingsList] Booking not found in list');
      setDeleteBookingId(null);
      resetRelatedRecords();
      return;
    }
    
    // If there are related records and user hasn't confirmed force delete yet
    if (relatedRecordsInfo?.hasRelatedRecords && !showForceDeleteConfirm) {
      setShowForceDeleteConfirm(true);
      return;
    }
    
    console.log('[BookingsList] Starting delete for booking:', booking.id);
    
    // Safety timeout to force close dialog if deletion hangs (increased to 15s)
    const safetyTimeout = setTimeout(() => {
      console.warn('[BookingsList] Delete operation timed out, forcing dialog close');
      setDeleteBookingId(null);
      resetRelatedRecords();
    }, 15000); // 15 second timeout
    
    try {
      // Use force delete if there are related records, otherwise use normal delete
      if (relatedRecordsInfo?.hasRelatedRecords) {
        await forceDeleteBooking.mutateAsync({
          bookingId: booking.id,
          clientId: booking.clientId,
          staffId: booking.carerId,
        });
      } else {
        await deleteBooking.mutateAsync({
          bookingId: booking.id,
          clientId: booking.clientId,
          staffId: booking.carerId,
        });
      }
      
      console.log('[BookingsList] Delete mutation and refetches completed successfully');
      clearTimeout(safetyTimeout);
      
      // Close dialog and reset state
      setDeleteBookingId(null);
      setShowForceDeleteConfirm(false);
      setRelatedRecordsInfo(null);
      resetRelatedRecords();
      
      // Force cleanup of any lingering Radix UI state
      setTimeout(() => {
        forceModalCleanup();
        console.log('[BookingsList] Modal cleanup executed');
      }, 100);
      
      console.log('[BookingsList] Dialog closed, delete complete');
    } catch (error) {
      console.error('[BookingsList] Delete mutation failed:', error);
      clearTimeout(safetyTimeout);
      setDeleteBookingId(null);
      setShowForceDeleteConfirm(false);
      setRelatedRecordsInfo(null);
      resetRelatedRecords();
      forceModalCleanup();
    }
  };

  // Multi-select handlers
  const handleSelectBooking = (bookingId: string, checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedBookingIds(prev => [...prev, bookingId]);
    } else {
      setSelectedBookingIds(prev => prev.filter(id => id !== bookingId));
    }
  };

  const handleSelectAllCurrentPage = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      // Add all current page IDs that aren't already selected
      setSelectedBookingIds(prev => {
        const newIds = currentPageBookingIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
    } else {
      // Remove all current page IDs from selection
      setSelectedBookingIds(prev => 
        prev.filter(id => !currentPageBookingIds.includes(id))
      );
    }
  };

  const handleClearSelection = () => {
    setSelectedBookingIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedBookingIds.length === 0) {
      console.log('[BookingsList] No bookings selected for bulk delete');
      return;
    }
    
    console.log('[BookingsList] Starting bulk delete for', selectedBookingIds.length, 'bookings');
    setIsDeleting(true);
    
    // Get full booking objects for selected IDs (needed for refetch queries)
    const selectedBookings = bookings
      .filter(b => selectedBookingIds.includes(b.id))
      .map(b => ({
        id: b.id,
        clientId: b.clientId,
        staffId: b.carerId
      }));
    
    try {
      await deleteMultipleBookings.mutateAsync({
        bookingIds: selectedBookingIds,
        bookings: selectedBookings
      });
      
      console.log('[BookingsList] Bulk delete completed successfully');
      
      // Clear selection and close dialog
      setSelectedBookingIds([]);
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error('[BookingsList] Bulk delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-500/10 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-0";
      case "assigned":
        return "bg-blue-500/10 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-0";
      case "unassigned":
        return "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 border-0";
      case "in-progress":
        return "bg-purple-500/10 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-0";
      case "departed":
        return "bg-teal-500/10 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 border-0";
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-0";
      case "late":
        return "bg-orange-500/10 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-0";
      case "missed":
        return "bg-red-500/10 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-0";
      default:
        return "bg-muted text-muted-foreground border-0";
    }
  };

  const formatBookingDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Handle export schedule click
  const handleExportSchedule = () => {
    if (filteredBookings.length === 0) {
      toast.error("No bookings to export");
      return;
    }

    try {
      // Format bookings data for export
      const exportData = filteredBookings.map(booking => {
        // Calculate duration (handle overnight bookings)
        const startParts = booking.startTime.split(':').map(Number);
        const endParts = booking.endTime.split(':').map(Number);
        const startMins = startParts[0] * 60 + startParts[1];
        const endMins = endParts[0] * 60 + endParts[1];
        
        let durationMins = endMins - startMins;
        // Handle overnight bookings
        if (durationMins < 0) {
          durationMins += 1440; // Add 24 hours
        }
        
        const hours = Math.floor(durationMins / 60);
        const mins = durationMins % 60;
        const duration = `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();

        const visitRecord = booking.visit_records?.[0];
        const actualStartTime = visitRecord?.visit_start_time 
          ? format(new Date(visitRecord.visit_start_time), 'HH:mm') 
          : '';
        const actualEndTime = visitRecord?.visit_end_time 
          ? format(new Date(visitRecord.visit_end_time), 'HH:mm') 
          : '';

        return {
          'Date': formatBookingDate(booking.date),
          'Start Time': booking.startTime,
          'End Time': booking.endTime,
          'Booked Time': duration,
          'Actual Start': actualStartTime,
          'Actual End': actualEndTime,
          'Client': booking.clientName || '',
          'Carer': booking.carerName || '',
          'Status': getBookingStatusLabel(getEffectiveBookingStatus(booking)),
          'Notes': booking.notes || ''
        };
      });

      const columns = [
        'Date', 'Start Time', 'End Time', 'Booked Time', 'Actual Start', 'Actual End',
        'Client', 'Carer', 'Status', 'Notes'
      ];

      ReportExporter.exportToCSV({
        title: 'Bookings Schedule',
        data: exportData,
        columns: columns,
        fileName: `bookings-schedule-${format(new Date(), 'yyyy-MM-dd')}.csv`
      });

      toast.success(`Successfully exported ${filteredBookings.length} bookings`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export schedule");
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Bookings List</h2>
            <p className="text-muted-foreground text-sm mt-1">
              View and manage all booked appointments
            </p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90 rounded-md w-full md:w-auto"
            onClick={handleExportSchedule}
            disabled={filteredBookings.length === 0}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Export Schedule
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[240px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search client, carer or booking ID" 
              className="pl-10 pr-4 py-2 rounded-md bg-background border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          </div>
          <div className="w-[200px]">
            <Select 
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full rounded-md border-border">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Status
                  {typeof statusCounts === "object" ? (
                    <Badge className="ml-2">{Object.values(statusCounts).reduce((a, b) => a + b, 0)}</Badge>
                  ) : null}
                </SelectItem>
                <SelectItem value="late">
                  Late Arrivals <Badge className="ml-2 bg-amber-500">{statusCounts.late || 0}</Badge>
                </SelectItem>
                <SelectItem value="missed">
                  Missed <Badge className="ml-2 bg-red-500">{statusCounts.missed || 0}</Badge>
                </SelectItem>
                <SelectItem value="assigned">Assigned <Badge className="ml-2">{statusCounts.assigned || 0}</Badge></SelectItem>
                <SelectItem value="in-progress">In Progress <Badge className="ml-2">{statusCounts["in-progress"] || 0}</Badge></SelectItem>
                <SelectItem value="done">Done <Badge className="ml-2">{statusCounts.done || 0}</Badge></SelectItem>
                <SelectItem value="departed">Departed <Badge className="ml-2">{statusCounts.departed || 0}</Badge></SelectItem>
                <SelectItem value="cancelled">Cancelled <Badge className="ml-2">{statusCounts.cancelled || 0}</Badge></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              {canDelete && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allCurrentPageSelected}
                    onCheckedChange={handleSelectAllCurrentPage}
                    aria-label="Select all bookings on this page"
                    className="ml-2"
                    disabled={isDeleting}
                  />
                </TableHead>
              )}
              <TableHead className="font-medium">Date</TableHead>
              <TableHead className="font-medium">Time</TableHead>
              <TableHead className="font-medium">Client</TableHead>
              <TableHead className="font-medium">Carer</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium">Booked Time</TableHead>
              <TableHead className="font-medium">Actual Time</TableHead>
              <TableHead className="font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBookings.length > 0 ? (
              paginatedBookings.map((booking) => {
                // Calculate duration in minutes (handle overnight bookings)
                const startParts = booking.startTime.split(':').map(Number);
                const endParts = booking.endTime.split(':').map(Number);
                const startMins = startParts[0] * 60 + startParts[1];
                const endMins = endParts[0] * 60 + endParts[1];
                
                let durationMins = endMins - startMins;
                // Handle overnight bookings
                if (durationMins < 0) {
                  durationMins += 1440; // Add 24 hours
                }
                
                const hours = Math.floor(durationMins / 60);
                const mins = durationMins % 60;
                const durationText = `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
                
                return (
                  <TableRow 
                    key={booking.id} 
                    className={cn(
                      "hover:bg-muted/50",
                      selectedBookingIds.includes(booking.id) && "bg-blue-50 dark:bg-blue-950/20"
                    )}
                  >
                    {canDelete && (
                      <TableCell className="w-12">
                        <Checkbox
                          checked={selectedBookingIds.includes(booking.id)}
                          onCheckedChange={(checked) => handleSelectBooking(booking.id, checked)}
                          aria-label={`Select booking ${booking.id}`}
                          onClick={(e) => e.stopPropagation()}
                          disabled={isDeleting}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {formatBookingDate(booking.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        {booking.startTime} - {booking.endTime}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm mr-2">
                          {booking.clientInitials}
                        </div>
                        {booking.clientName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        {(() => {
                          const related = relatedCarerCounts.get(booking.id);
                          if (related && related.count > 1 && related.carerNames.length > 1) {
                            return (
                              <div className="flex items-center gap-2">
                                <span>{booking.carerName}</span>
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                                  +{related.count - 1} more
                                </Badge>
                              </div>
                            );
                          }
                          return booking.carerName || 'Not Assigned';
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const effectiveStatus = getEffectiveBookingStatus(booking);
                        return (
                          <Badge variant="outline" 
                            className={`px-2 py-1 rounded-full ${getStatusBadgeClass(effectiveStatus)}`}
                          >
                            {getBookingStatusLabel(effectiveStatus)}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>{durationText}</TableCell>
                    <TableCell>
                      {(() => {
                        const visitRecord = booking.visit_records?.[0];
                        if (!visitRecord?.visit_start_time) {
                          return <span className="text-muted-foreground">-</span>;
                        }
                        
                        const actualStart = format(new Date(visitRecord.visit_start_time), 'HH:mm');
                        const actualEnd = visitRecord.visit_end_time 
                          ? format(new Date(visitRecord.visit_end_time), 'HH:mm')
                          : null;
                        
                        return (
                          <div className="flex items-center text-sm">
                            <span className="font-medium">{actualStart}</span>
                            <span className="mx-1">-</span>
                            <span className={actualEnd ? 'font-medium' : 'text-amber-600 font-medium'}>
                              {actualEnd || 'In Progress'}
                            </span>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleViewClick(booking)}
                          title="View booking details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEditClick(booking)}
                          title="Edit booking"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(booking)}
                            title="Delete booking"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={canDelete ? 9 : 8} className="text-center py-6 text-muted-foreground">
                  No bookings found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {paginatedBookings.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="h-8"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!deleteBookingId} 
        onOpenChange={(open) => {
          // Only allow closing if not pending
          const isPending = deleteBooking.isPending || forceDeleteBooking.isPending || isCheckingRelated;
          if (!open && !isPending) {
            setDeleteBookingId(null);
            setShowForceDeleteConfirm(false);
            setRelatedRecordsInfo(null);
            resetRelatedRecords();
          } else if (!open && isPending) {
            console.log('[BookingsList] Preventing dialog close during deletion');
          }
        }}
      >
        <AlertDialogContent>
          {(deleteBooking.isPending || forceDeleteBooking.isPending || isCheckingRelated) && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <p className="text-sm text-muted-foreground">
                  {isCheckingRelated ? "Checking related records..." : "Deleting booking..."}
                </p>
              </div>
            </div>
          )}
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {relatedRecordsInfo?.hasRelatedRecords && (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              {relatedRecordsInfo?.hasRelatedRecords ? "Cannot Delete Booking" : "Delete Booking"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {relatedRecordsInfo?.hasRelatedRecords ? (
                  <>
                    <p>This booking has related records that prevent it from being deleted:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm bg-muted/50 p-3 rounded-md">
                      {relatedRecordsInfo.bookingServicesCount > 0 && (
                        <li>{relatedRecordsInfo.bookingServicesCount} Booking Service record{relatedRecordsInfo.bookingServicesCount > 1 ? 's' : ''}</li>
                      )}
                      {relatedRecordsInfo.expensesCount > 0 && (
                        <li>{relatedRecordsInfo.expensesCount} Expense record{relatedRecordsInfo.expensesCount > 1 ? 's' : ''}</li>
                      )}
                      {relatedRecordsInfo.extraTimeRecordsCount > 0 && (
                        <li>{relatedRecordsInfo.extraTimeRecordsCount} Extra Time record{relatedRecordsInfo.extraTimeRecordsCount > 1 ? 's' : ''}</li>
                      )}
                    </ul>
                    {showForceDeleteConfirm ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Warning:</strong> You are about to permanently delete this booking and ALL related records. This action cannot be undone!
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <p className="font-medium">Do you still want to delete this booking? All related records will be permanently deleted.</p>
                    )}
                  </>
                ) : (
                  <p>
                    Are you sure you want to delete this booking? This action cannot be undone.
                    The booking will be permanently removed from the system.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={deleteBooking.isPending || forceDeleteBooking.isPending}
              onClick={() => {
                setShowForceDeleteConfirm(false);
                setRelatedRecordsInfo(null);
                resetRelatedRecords();
              }}
            >
              {relatedRecordsInfo?.hasRelatedRecords ? "No, Cancel" : "Cancel"}
            </AlertDialogCancel>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleteBooking.isPending || forceDeleteBooking.isPending || isCheckingRelated}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {(deleteBooking.isPending || forceDeleteBooking.isPending) 
                ? "Deleting..." 
                : relatedRecordsInfo?.hasRelatedRecords 
                  ? "Yes, Force Delete" 
                  : "Delete Booking"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog 
        open={bulkDeleteDialogOpen} 
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setBulkDeleteDialogOpen(false);
          }
        }}
      >
        <AlertDialogContent>
          {isDeleting && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <p className="text-sm text-muted-foreground">
                  Deleting {selectedBookingIds.length} booking{selectedBookingIds.length > 1 ? 's' : ''}...
                </p>
              </div>
            </div>
          )}
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Bookings</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedBookingIds.length}</strong> selected booking{selectedBookingIds.length > 1 ? 's' : ''}? 
              This action cannot be undone.
              <br /><br />
              The bookings will be permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : `Delete ${selectedBookingIds.length} Booking${selectedBookingIds.length > 1 ? 's' : ''}`}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Actions Toolbar */}
      {canDelete && (
        <BookingBulkActionsBar
          selectedCount={selectedBookingIds.length}
          onClearSelection={handleClearSelection}
          onBulkDelete={() => setBulkDeleteDialogOpen(true)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};
