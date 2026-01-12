import React, { useState, useEffect, useMemo } from "react";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { getUserTimezone } from "@/utils/timezoneUtils";
import { Calendar as CalendarIcon, Trash2, FileText, Loader2, User, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getBookingStatusColor, getBookingStatusLabel } from "../utils/bookingColors";
import { cn } from "@/lib/utils";
import { useForceDeleteBooking } from "@/hooks/useForceDeleteBooking";
import { useBookingRelatedRecords, BookingRelatedRecords } from "@/hooks/useBookingRelatedRecords";

interface DeleteBookingConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    clientId: string;
    clientName: string;
    carerId?: string;
    carerName?: string;
    start_time: string;
    end_time: string;
    serviceName?: string;
    branchId: string;
  };
  onDeleteSingle: () => Promise<void>;
  onDeleteMultiple: (bookingIds: string[], bookings: any[]) => Promise<void>;
  isDeleting: boolean;
  onForceDeleteSuccess?: () => void;
}

interface ClientBooking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  staff_id: string | null;
  service_id: string | null;
  staff: { first_name: string; last_name: string } | null;
  services: { title: string } | null;
}

export function DeleteBookingConfirmationDialog({
  open,
  onOpenChange,
  booking,
  onDeleteSingle,
  onDeleteMultiple,
  isDeleting,
  onForceDeleteSuccess,
}: DeleteBookingConfirmationDialogProps) {
  const [deleteMode, setDeleteMode] = useState<'single' | 'all-client'>('single');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [clientBookings, setClientBookings] = useState<ClientBooking[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [showForceDeleteConfirm, setShowForceDeleteConfirm] = useState(false);
  const [relatedRecordsInfo, setRelatedRecordsInfo] = useState<BookingRelatedRecords | null>(null);
  
  const forceDeleteBooking = useForceDeleteBooking(booking.branchId);
  const { isLoading: isCheckingRelated, checkRelatedRecords, reset: resetRelatedRecords } = useBookingRelatedRecords();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setDeleteMode('single');
      setDateRange({ from: null, to: null });
      setClientBookings([]);
      setSelectedBookings([]);
      setHasFetched(false);
      setShowForceDeleteConfirm(false);
      setRelatedRecordsInfo(null);
      resetRelatedRecords();
      
      // Check for related records when dialog opens
      checkRelatedRecords(booking.id).then(records => {
        if (records?.hasRelatedRecords) {
          setRelatedRecordsInfo(records);
        }
      });
    }
  }, [open, booking.id]);

  // Fetch client bookings in date range
  const fetchClientBookingsInRange = async () => {
    if (!dateRange.from || !dateRange.to || !booking.clientId) return;

    setIsLoadingBookings(true);
    setHasFetched(true);

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          end_time,
          status,
          staff_id,
          service_id,
          staff (first_name, last_name),
          services (title)
        `)
        .eq('client_id', booking.clientId)
        .gte('start_time', startOfDay(dateRange.from).toISOString())
        .lte('start_time', endOfDay(dateRange.to).toISOString())
        .order('start_time', { ascending: true });

      if (!error && data) {
        setClientBookings(data as ClientBooking[]);
        // Auto-select all bookings by default
        setSelectedBookings(data.map((b) => b.id));
      } else {
        console.error('Error fetching client bookings:', error);
        setClientBookings([]);
        setSelectedBookings([]);
      }
    } catch (error) {
      console.error('Error fetching client bookings:', error);
      setClientBookings([]);
      setSelectedBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // Format time for display
  const formatTime = (isoString: string) => {
    try {
      const parsed = parseISO(isoString);
      return formatInTimeZone(parsed, getUserTimezone(), 'HH:mm');
    } catch {
      return '--:--';
    }
  };

  // Format date for display
  const formatDate = (isoString: string) => {
    try {
      const parsed = parseISO(isoString);
      return formatInTimeZone(parsed, getUserTimezone(), 'MMM dd, yyyy');
    } catch {
      return 'Unknown date';
    }
  };

  // Toggle booking selection
  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookings((prev) =>
      prev.includes(bookingId)
        ? prev.filter((id) => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(clientBookings.map((b) => b.id));
    } else {
      setSelectedBookings([]);
    }
  };

  // Handle delete action
  const handleDelete = async () => {
    if (deleteMode === 'single') {
      // If there are related records and user hasn't confirmed force delete yet
      if (relatedRecordsInfo?.hasRelatedRecords && !showForceDeleteConfirm) {
        setShowForceDeleteConfirm(true);
        return;
      }
      
      // Use force delete if there are related records
      if (relatedRecordsInfo?.hasRelatedRecords) {
        await forceDeleteBooking.mutateAsync({
          bookingId: booking.id,
          clientId: booking.clientId,
          staffId: booking.carerId,
        });
        onOpenChange(false);
        onForceDeleteSuccess?.();
      } else {
        await onDeleteSingle();
      }
    } else {
      const bookingsToDelete = clientBookings.filter((b) =>
        selectedBookings.includes(b.id)
      );
      await onDeleteMultiple(selectedBookings, bookingsToDelete);
    }
  };

  // Check if delete button should be disabled
  const isDeleteDisabled = useMemo(() => {
    if (isDeleting || forceDeleteBooking.isPending || isCheckingRelated) return true;
    if (deleteMode === 'all-client' && selectedBookings.length === 0) return true;
    return false;
  }, [isDeleting, forceDeleteBooking.isPending, isCheckingRelated, deleteMode, selectedBookings.length]);

  // Get delete button text
  const getDeleteButtonText = () => {
    if (isDeleting || forceDeleteBooking.isPending) return "Deleting...";
    if (deleteMode === 'single') {
      if (relatedRecordsInfo?.hasRelatedRecords) {
        return showForceDeleteConfirm ? "Yes, Force Delete" : "Delete This Booking";
      }
      return "Delete This Booking";
    }
    return `Delete ${selectedBookings.length} Booking${selectedBookings.length !== 1 ? 's' : ''}`
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {(isCheckingRelated || forceDeleteBooking.isPending) && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {isCheckingRelated ? "Checking related records..." : "Deleting booking..."}
              </p>
            </div>
          </div>
        )}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {relatedRecordsInfo?.hasRelatedRecords && deleteMode === 'single' ? (
              <>
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Cannot Delete Booking
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete Booking
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {relatedRecordsInfo?.hasRelatedRecords && deleteMode === 'single'
              ? "This booking has related records that prevent it from being deleted."
              : "Choose how you want to delete bookings for this client."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Related Records Warning - Show when single mode and has related records */}
          {relatedRecordsInfo?.hasRelatedRecords && deleteMode === 'single' && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-4">
                <p className="text-sm mb-2">This booking has related records:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
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
                  <Alert variant="destructive" className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> You are about to permanently delete this booking and ALL related records. This action cannot be undone!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-sm font-medium mt-3">
                    Do you still want to delete this booking? All related records will be permanently deleted.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Current Booking Info */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {formatDate(booking.start_time)} • {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Client: {booking.clientName}</span>
                </div>
                {booking.serviceName && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Service: {booking.serviceName}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deletion Mode Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select deletion option:</Label>
            <RadioGroup
              value={deleteMode}
              onValueChange={(v) => setDeleteMode(v as 'single' | 'all-client')}
              className="space-y-3"
            >
              <div
                className={cn(
                  "flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors",
                  deleteMode === 'single' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                )}
                onClick={() => setDeleteMode('single')}
              >
                <RadioGroupItem value="single" id="single" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="single" className="font-medium cursor-pointer">
                    Delete Only This Booking
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Removes only the currently selected booking.
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors",
                  deleteMode === 'all-client' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                )}
                onClick={() => setDeleteMode('all-client')}
              >
                <RadioGroupItem value="all-client" id="all-client" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="all-client" className="font-medium cursor-pointer">
                    Delete All Bookings for This Client
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Delete multiple bookings within a date range.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Date Range Selection - Only shown when 'all-client' mode */}
          {deleteMode === 'all-client' && (
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? format(dateRange.from, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.from || undefined}
                          onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date || null }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? format(dateRange.to, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.to || undefined}
                          onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date || null }))}
                          disabled={(date) => dateRange.from ? date < dateRange.from : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Button
                  onClick={fetchClientBookingsInRange}
                  disabled={!dateRange.from || !dateRange.to || isLoadingBookings}
                  className="w-full"
                  variant="secondary"
                >
                  {isLoadingBookings ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Find Bookings"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Bookings Preview List */}
          {deleteMode === 'all-client' && hasFetched && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {clientBookings.length > 0
                    ? `Bookings found (${selectedBookings.length} of ${clientBookings.length} selected)`
                    : "No bookings found in this date range"}
                </CardTitle>
              </CardHeader>
              {clientBookings.length > 0 && (
                <CardContent className="pt-0">
                  <div className="max-h-[200px] dialog-scrollable">
                    <div className="space-y-2">
                      {/* Select All checkbox */}
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Checkbox
                          id="select-all"
                          checked={selectedBookings.length === clientBookings.length}
                          onCheckedChange={handleSelectAll}
                        />
                        <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                          Select All
                        </Label>
                      </div>

                      {clientBookings.map((b) => (
                        <div
                          key={b.id}
                          className={cn(
                            "flex items-center gap-2 py-2 px-2 rounded-md transition-colors",
                            selectedBookings.includes(b.id) ? "bg-destructive/10" : "hover:bg-muted/50"
                          )}
                        >
                          <Checkbox
                            id={`booking-${b.id}`}
                            checked={selectedBookings.includes(b.id)}
                            onCheckedChange={() => toggleBookingSelection(b.id)}
                          />
                          <div className="flex-1 text-sm">
                            <span className="font-medium">{formatDate(b.start_time)}</span>
                            <span className="text-muted-foreground">
                              {" "}• {formatTime(b.start_time)} - {formatTime(b.end_time)}
                            </span>
                            {b.services?.title && (
                              <span className="text-muted-foreground"> • {b.services.title}</span>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getBookingStatusColor(b.status || 'assigned', 'light'))}
                          >
                            {getBookingStatusLabel(b.status || 'assigned')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. The booking(s) will be permanently removed from the system.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleteDisabled}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getDeleteButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
