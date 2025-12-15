import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { XCircle, User, Calendar, Clock, AlertTriangle } from "lucide-react";
import { AffectedBooking } from "@/hooks/useLeaveBookingConflicts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: AffectedBooking | null;
  carerName: string;
  onSuccess: (bookingId: string) => void;
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  booking,
  carerName,
  onSuccess
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState(`Carer (${carerName}) is on approved leave`);
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, bookingId) => {
      toast.success('Booking cancelled');
      queryClient.invalidateQueries({ queryKey: ['leave-booking-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['branch-bookings'] });
      onSuccess(bookingId);
      handleClose();
    },
    onError: (error) => {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  });

  const handleClose = () => {
    setReason(`Carer (${carerName}) is on approved leave`);
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (!booking) return;
    cancelMutation.mutate(booking.id);
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Cancel Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-800">This action cannot be undone</p>
              <p className="text-red-700 mt-1">
                The client will need to be notified about this cancellation.
              </p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Booking to Cancel</h4>
            
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

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Cancellation Reason *</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Enter reason for cancellation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Go Back
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={!reason.trim() || cancelMutation.isPending}
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
