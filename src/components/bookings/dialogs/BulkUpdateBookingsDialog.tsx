import React, { useState, useMemo } from "react";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Loader2, 
  User, 
  Users,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { StaffMultiSelect } from "@/components/ui/staff-multi-select";
import type { EnhancedStaff } from "@/hooks/useSearchableStaff";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateMultipleBookings } from "@/hooks/useUpdateMultipleBookings";
import { getBookingStatusColor } from "../utils/bookingColors";
import { cn } from "@/lib/utils";

const BOOKING_STATUSES = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'departed', label: 'Departed' },
  { value: 'suspended', label: 'Suspended' },
];

interface FetchedBooking {
  id: string;
  start_time: string;
  end_time: string;
  status: string | null;
  client_id: string | null;
  staff_id: string | null;
  clients: { first_name: string | null; last_name: string | null } | null;
  staff: { first_name: string | null; last_name: string | null } | null;
  services: { title: string | null } | null;
}

interface BulkUpdateBookingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  carers: Array<{ id: string; first_name?: string | null; last_name?: string | null; name?: string }>;
  clients: Array<{ id: string; first_name?: string | null; last_name?: string | null; name?: string }>;
  onUpdateComplete?: () => void;
}

export function BulkUpdateBookingsDialog({
  open,
  onOpenChange,
  branchId,
  carers,
  clients,
  onUpdateComplete,
}: BulkUpdateBookingsDialogProps) {
  // Client selection state
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  
  // Date range selection state
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [fetchedBookings, setFetchedBookings] = useState<FetchedBooking[]>([]);
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Update options state
  const [updateCarer, setUpdateCarer] = useState(false);
  const [selectedCarerIds, setSelectedCarerIds] = useState<string[]>([]);
  const [selectedCarerData, setSelectedCarerData] = useState<EnhancedStaff[]>([]);
  const [updateTime, setUpdateTime] = useState(false);
  const [newStartTime, setNewStartTime] = useState<string>("09:00");
  const [newEndTime, setNewEndTime] = useState<string>("10:00");
  const [updateStatus, setUpdateStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");

  const updateMultipleBookings = useUpdateMultipleBookings(branchId);

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedClientId("");
      setDateRange({ from: null, to: null });
      setFetchedBookings([]);
      setSelectedBookingIds([]);
      setHasFetched(false);
      setUpdateCarer(false);
      setSelectedCarerIds([]);
      setSelectedCarerData([]);
      setUpdateTime(false);
      setNewStartTime("09:00");
      setNewEndTime("10:00");
      setUpdateStatus(false);
      setNewStatus("");
    }
    onOpenChange(newOpen);
  };

  const fetchBookingsByDateRange = async () => {
    if (!dateRange.from || !dateRange.to || !branchId) return;
    
    setIsLoadingBookings(true);
    setHasFetched(false);
    
    try {
      let query = supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          end_time,
          status,
          client_id,
          staff_id,
          clients (first_name, last_name),
          staff (first_name, last_name),
          services (title)
        `)
        .eq('branch_id', branchId)
        .gte('start_time', startOfDay(dateRange.from).toISOString())
        .lte('start_time', endOfDay(dateRange.to).toISOString())
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true });
      
      // Filter by client if selected
      if (selectedClientId && selectedClientId !== 'all') {
        query = query.eq('client_id', selectedClientId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[BulkUpdateBookingsDialog] Error fetching bookings:', error);
        return;
      }
      
      if (data) {
        setFetchedBookings(data as FetchedBooking[]);
        setSelectedBookingIds(data.map(b => b.id));
      }
    } finally {
      setIsLoadingBookings(false);
      setHasFetched(true);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookingIds(fetchedBookings.map(b => b.id));
    } else {
      setSelectedBookingIds([]);
    }
  };

  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookingIds(prev => 
      prev.includes(bookingId)
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const formatTime = (isoString: string) => {
    try {
      const date = toZonedTime(parseISO(isoString), 'Europe/London');
      return format(date, "HH:mm");
    } catch {
      return "N/A";
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = toZonedTime(parseISO(isoString), 'Europe/London');
      return format(date, "MMM dd");
    } catch {
      return "N/A";
    }
  };

  const getClientName = (booking: FetchedBooking) => {
    if (booking.clients) {
      return `${booking.clients.first_name || ''} ${booking.clients.last_name || ''}`.trim() || 'Unknown';
    }
    return 'Unknown';
  };

  const getCarerName = (booking: FetchedBooking) => {
    if (booking.staff) {
      return `${booking.staff.first_name || ''} ${booking.staff.last_name || ''}`.trim() || 'Unassigned';
    }
    return 'Unassigned';
  };

  const selectedBookings = useMemo(() => {
    return fetchedBookings.filter(b => selectedBookingIds.includes(b.id));
  }, [fetchedBookings, selectedBookingIds]);

  const hasAnyUpdateOption = updateCarer || updateTime || updateStatus;
  const isValidUpdate = hasAnyUpdateOption && (
    (!updateCarer || selectedCarerIds.length > 0) &&
    (!updateTime || (newStartTime && newEndTime)) &&
    (!updateStatus || newStatus)
  );

  const handleApplyChanges = async () => {
    if (selectedBookingIds.length === 0 || !isValidUpdate) return;

    try {
      // Handle multi-carer assignments - need to create booking records for each carer
      if (updateCarer && selectedCarerIds.length > 0) {
        for (const booking of selectedBookings) {
          const bookingDate = format(parseISO(booking.start_time), 'yyyy-MM-dd');
          
          // For the first carer, update the existing booking
          const firstCarerId = selectedCarerIds[0];
          const updateData: Record<string, string> = {};
          
          if (updateTime && newStartTime && newEndTime) {
            updateData.start_time = `${bookingDate}T${newStartTime}:00`;
            updateData.end_time = `${bookingDate}T${newEndTime}:00`;
          }
          
          updateData.staff_id = firstCarerId;
          
          if (updateStatus && newStatus) {
            updateData.status = newStatus;
          }
          
          await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', booking.id);
          
          // For additional carers, create new booking records (duplicates with different staff_id)
          if (selectedCarerIds.length > 1) {
            const additionalCarerIds = selectedCarerIds.slice(1);
            
            for (const carerId of additionalCarerIds) {
              const newBooking = {
                branch_id: branchId,
                client_id: booking.client_id,
                staff_id: carerId,
                start_time: updateTime && newStartTime 
                  ? `${bookingDate}T${newStartTime}:00` 
                  : booking.start_time,
                end_time: updateTime && newEndTime 
                  ? `${bookingDate}T${newEndTime}:00` 
                  : booking.end_time,
                status: updateStatus && newStatus ? newStatus : booking.status,
                notes: null,
              };
              
              await supabase.from('bookings').insert(newBooking);
            }
          }
        }
        
        // Trigger refetch
        await updateMultipleBookings.mutateAsync({
          bookingIds: [],
          bookings: [],
          updatedData: {}
        }).catch(() => {
          // Empty call just to trigger refetch
        });
      } else if (updateTime && newStartTime && newEndTime) {
        // Time-only updates (no carer change)
        for (const booking of selectedBookings) {
          const bookingDate = format(parseISO(booking.start_time), 'yyyy-MM-dd');
          
          const updateData: Record<string, string> = {
            start_time: `${bookingDate}T${newStartTime}:00`,
            end_time: `${bookingDate}T${newEndTime}:00`,
          };
          
          if (updateStatus && newStatus) {
            updateData.status = newStatus;
          }
          
          await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', booking.id);
        }
        
        // Trigger refetch
        await updateMultipleBookings.mutateAsync({
          bookingIds: [],
          bookings: [],
          updatedData: {}
        }).catch(() => {
          // Empty call just to trigger refetch
        });
      } else {
        // Status-only changes
        const updatedData: { status?: string } = {};
        
        if (updateStatus && newStatus) {
          updatedData.status = newStatus;
        }
        
        const bookings = selectedBookings.map(b => ({
          id: b.id,
          clientId: b.client_id || undefined,
          staffId: b.staff_id || undefined,
        }));
        
        await updateMultipleBookings.mutateAsync({
          bookingIds: selectedBookingIds,
          bookings,
          updatedData,
        });
      }
      
      handleOpenChange(false);
      onUpdateComplete?.();
    } catch (error) {
      console.error('[BulkUpdateBookingsDialog] Error applying changes:', error);
    }
  };

  const carerOptions = useMemo(() => {
    return carers.map(c => ({
      id: c.id,
      name: c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown',
    }));
  }, [carers]);

  const clientOptions = useMemo(() => {
    return clients.map(c => ({
      id: c.id,
      name: c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown',
    }));
  }, [clients]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Update Bookings
          </DialogTitle>
          <DialogDescription>
            Select a client and date range, then apply bulk updates to carer, time, or status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client Selection */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Select Client (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clientOptions.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Leave empty to fetch bookings for all clients in the date range.
              </p>
            </CardContent>
          </Card>

          {/* Date Range Selection */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Select Date Range
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Date</Label>
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
                        onSelect={(date) => setDateRange(prev => ({ ...prev, from: date || null }))}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>To Date</Label>
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
                        onSelect={(date) => setDateRange(prev => ({ ...prev, to: date || null }))}
                        disabled={(date) => dateRange.from ? date < dateRange.from : false}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <Button 
                onClick={fetchBookingsByDateRange}
                disabled={!dateRange.from || !dateRange.to || isLoadingBookings}
                className="w-full"
              >
                {isLoadingBookings ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Find Bookings"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Bookings Preview List */}
          {hasFetched && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>Bookings Found ({fetchedBookings.length})</span>
                  {selectedBookingIds.length > 0 && (
                    <Badge variant="secondary">
                      {selectedBookingIds.length} selected
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {fetchedBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 px-4">
                    No bookings found for the selected criteria.
                  </p>
                ) : (
                  <div className="border-t">
                    {/* Select All header - sticky */}
                    <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
                      <Checkbox 
                        id="select-all"
                        checked={selectedBookingIds.length === fetchedBookings.length}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      />
                      <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                        Select All ({fetchedBookings.length})
                      </Label>
                    </div>
                    
                    {/* Scrollable bookings list with fixed height */}
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-1 p-2">
                        {fetchedBookings.map((booking) => (
                          <div 
                            key={booking.id} 
                            className="flex items-center gap-2 py-2 px-2 hover:bg-muted/50 rounded"
                          >
                            <Checkbox
                              checked={selectedBookingIds.includes(booking.id)}
                              onCheckedChange={() => toggleBookingSelection(booking.id)}
                            />
                            <div className="flex-1 text-sm grid grid-cols-4 gap-2">
                              <span className="font-medium">
                                {formatDate(booking.start_time)}
                              </span>
                              <span className="text-muted-foreground">
                                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                              </span>
                              <span className="truncate" title={getClientName(booking)}>
                                {getClientName(booking)}
                              </span>
                              <span className="text-muted-foreground truncate" title={getCarerName(booking)}>
                                {getCarerName(booking)}
                              </span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", getBookingStatusColor(booking.status || 'unassigned'))}
                            >
                              {booking.status || 'unassigned'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bulk Update Options */}
          {selectedBookingIds.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">Update Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Update Carer */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="update-carer"
                      checked={updateCarer}
                      onCheckedChange={(checked) => setUpdateCarer(!!checked)}
                    />
                    <Label htmlFor="update-carer" className="font-medium cursor-pointer flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Update Assigned Carer
                    </Label>
                  </div>
                {updateCarer && (
                    <div className="ml-6">
                      <StaffMultiSelect
                        branchId={branchId}
                        selectedIds={selectedCarerIds}
                        onChange={(ids, staffData) => {
                          setSelectedCarerIds(ids);
                          setSelectedCarerData(staffData);
                        }}
                        placeholder="Select carers..."
                      />
                      {selectedCarerIds.length > 1 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedCarerIds.length} carers selected - a separate booking will be created for each carer
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Update Time */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="update-time"
                      checked={updateTime}
                      onCheckedChange={(checked) => setUpdateTime(!!checked)}
                    />
                    <Label htmlFor="update-time" className="font-medium cursor-pointer flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Update Visit Time
                    </Label>
                  </div>
                  {updateTime && (
                    <div className="ml-6 grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Start Time</Label>
                        <Input
                          type="time"
                          value={newStartTime}
                          onChange={(e) => setNewStartTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">End Time</Label>
                        <Input
                          type="time"
                          value={newEndTime}
                          onChange={(e) => setNewEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Update Status */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="update-status"
                      checked={updateStatus}
                      onCheckedChange={(checked) => setUpdateStatus(!!checked)}
                    />
                    <Label htmlFor="update-status" className="font-medium cursor-pointer flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Update Booking Status
                    </Label>
                  </div>
                  {updateStatus && (
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="ml-6">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        {BOOKING_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning Alert */}
          {selectedBookingIds.length > 0 && hasAnyUpdateOption && (
            <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                This will update {selectedBookingIds.length} booking{selectedBookingIds.length > 1 ? 's' : ''}. 
                This action cannot be undone.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={updateMultipleBookings.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApplyChanges}
            disabled={
              selectedBookingIds.length === 0 || 
              !isValidUpdate ||
              updateMultipleBookings.isPending
            }
          >
            {updateMultipleBookings.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              `Apply Changes to ${selectedBookingIds.length} Booking${selectedBookingIds.length > 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
