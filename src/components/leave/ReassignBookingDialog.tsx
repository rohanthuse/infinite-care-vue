import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, User, Calendar, Clock } from "lucide-react";
import { AffectedBooking } from "@/hooks/useLeaveBookingConflicts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBranchCarers } from "@/data/hooks/useBranchCarers";

interface ReassignBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: AffectedBooking | null;
  branchId: string;
  excludeStaffId: string;
  onSuccess: (bookingId: string) => void;
}

export function ReassignBookingDialog({
  open,
  onOpenChange,
  booking,
  branchId,
  excludeStaffId,
  onSuccess
}: ReassignBookingDialogProps) {
  const [selectedCarerId, setSelectedCarerId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  // Fetch available carers (excluding the one on leave)
  const { data: carers = [], isLoading: carersLoading } = useBranchCarers(branchId);
  
  const availableCarers = carers.filter(carer => 
    carer.id !== excludeStaffId && carer.status === 'active'
  );

  const reassignMutation = useMutation({
    mutationFn: async ({ bookingId, newStaffId }: { bookingId: string; newStaffId: string }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          staff_id: newStaffId,
          notes: notes ? `[Reassigned due to carer leave] ${notes}` : undefined
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Booking reassigned successfully');
      queryClient.invalidateQueries({ queryKey: ['leave-booking-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['branch-bookings'] });
      onSuccess(variables.bookingId);
      handleClose();
    },
    onError: (error) => {
      console.error('Error reassigning booking:', error);
      toast.error('Failed to reassign booking');
    }
  });

  const handleClose = () => {
    setSelectedCarerId("");
    setNotes("");
    onOpenChange(false);
  };

  const handleReassign = () => {
    if (!booking || !selectedCarerId) return;
    reassignMutation.mutate({ 
      bookingId: booking.id, 
      newStaffId: selectedCarerId 
    });
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            Reassign Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Booking Details */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Booking Details</h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{booking.client_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{booking.formatted_date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{booking.scheduled_time}</span>
              </div>
              {booking.service_name && (
                <div>
                  <Badge variant="outline">{booking.service_name}</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Carer Selection */}
          <div className="space-y-2">
            <Label htmlFor="carer-select">Select New Carer *</Label>
            <Select value={selectedCarerId} onValueChange={setSelectedCarerId}>
              <SelectTrigger id="carer-select">
                <SelectValue placeholder="Choose an available carer..." />
              </SelectTrigger>
              <SelectContent>
                {carersLoading ? (
                  <SelectItem value="loading" disabled>Loading carers...</SelectItem>
                ) : availableCarers.length === 0 ? (
                  <SelectItem value="none" disabled>No available carers</SelectItem>
                ) : (
                  availableCarers.map(carer => (
                    <SelectItem key={carer.id} value={carer.id}>
                      {carer.first_name} {carer.last_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only active carers from this branch are shown
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="reassign-notes">Notes (Optional)</Label>
            <Textarea
              id="reassign-notes"
              placeholder="Add any notes about this reassignment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleReassign}
            disabled={!selectedCarerId || reassignMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {reassignMutation.isPending ? 'Reassigning...' : 'Reassign Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
