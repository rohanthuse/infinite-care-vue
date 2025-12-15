import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, Pencil, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useEditLeaveRequest, type LeaveRequest } from "@/hooks/useLeaveManagement";
import { useLeaveBookingConflicts, type AffectedBooking } from "@/hooks/useLeaveBookingConflicts";
import { AffectedBookingsSection } from "./AffectedBookingsSection";
import { ReassignBookingDialog } from "./ReassignBookingDialog";
import { CancelBookingDialog } from "./CancelBookingDialog";

interface EditLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequest: LeaveRequest | null;
  branchId: string;
}

const leaveTypes = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'personal', label: 'Personal Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'emergency', label: 'Emergency Leave' },
];

export function EditLeaveDialog({ open, onOpenChange, leaveRequest, branchId }: EditLeaveDialogProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [leaveType, setLeaveType] = useState('annual');
  const [reason, setReason] = useState('');
  const [resolvedBookingIds, setResolvedBookingIds] = useState<Set<string>>(new Set());
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AffectedBooking | null>(null);

  const editLeaveRequest = useEditLeaveRequest();

  // Initialize form when dialog opens
  useEffect(() => {
    if (leaveRequest && open) {
      setStartDate(parseISO(leaveRequest.start_date));
      setEndDate(parseISO(leaveRequest.end_date));
      setLeaveType(leaveRequest.leave_type);
      setReason(leaveRequest.reason || '');
      setResolvedBookingIds(new Set());
    }
  }, [leaveRequest, open]);

  // Check for conflicts with new dates
  const { 
    affectedBookings, 
    totalConflicts, 
    isLoading: conflictsLoading 
  } = useLeaveBookingConflicts(
    leaveRequest?.staff_id,
    startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    open && !!startDate && !!endDate
  );

  const unresolvedConflictsCount = affectedBookings.filter(b => !resolvedBookingIds.has(b.id)).length;
  const canSave = unresolvedConflictsCount === 0 && startDate && endDate;

  const handleReassignBooking = (booking: AffectedBooking) => {
    setSelectedBooking(booking);
    setReassignDialogOpen(true);
  };

  const handleCancelBooking = (booking: AffectedBooking) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleBookingResolved = (bookingId: string) => {
    setResolvedBookingIds(prev => new Set([...prev, bookingId]));
  };

  const handleSave = () => {
    if (!leaveRequest || !startDate || !endDate) return;

    editLeaveRequest.mutate({
      id: leaveRequest.id,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      leave_type: leaveType,
      reason: reason || undefined
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  if (!leaveRequest) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-600" />
              Edit Approved Leave
            </DialogTitle>
            <DialogDescription>
              Update leave details. Booking conflicts must be resolved before saving.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className={totalConflicts > 0 ? "max-h-[60vh]" : ""}>
            <div className="space-y-4 pr-4">
              {/* Staff Info */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Staff Member:</span>
                <span className="ml-2 font-medium">{leaveRequest.staff_name}</span>
              </div>

              {/* Leave Type */}
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => startDate ? date < startDate : false}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>Reason (Optional)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for leave..."
                  rows={2}
                />
              </div>

              {/* Affected Bookings */}
              <AffectedBookingsSection
                affectedBookings={affectedBookings}
                resolvedBookingIds={resolvedBookingIds}
                isLoading={conflictsLoading}
                onReassign={handleReassignBooking}
                onCancel={handleCancelBooking}
              />
            </div>
          </ScrollArea>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {!canSave && unresolvedConflictsCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-red-600 mr-auto">
                <AlertTriangle className="h-4 w-4" />
                <span>Resolve all conflicts to save</span>
              </div>
            )}
            
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={editLeaveRequest.isPending || !canSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editLeaveRequest.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nested Dialogs */}
      <ReassignBookingDialog
        open={reassignDialogOpen}
        onOpenChange={setReassignDialogOpen}
        booking={selectedBooking}
        branchId={branchId}
        excludeStaffId={leaveRequest?.staff_id || ''}
        onSuccess={handleBookingResolved}
      />

      <CancelBookingDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        booking={selectedBooking}
        carerName={leaveRequest?.staff_name || ''}
        onSuccess={handleBookingResolved}
      />
    </>
  );
}
