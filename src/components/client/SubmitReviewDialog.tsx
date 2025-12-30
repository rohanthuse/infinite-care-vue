
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useCreateReview, useCheckExistingReview } from "@/hooks/useClientReviews";
import { useSimpleClientAuth } from "@/hooks/useSimpleClientAuth";

interface SubmitReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    type: string;
    provider: string;
    date: string;
    time: string;
    staff_id?: string;
    client_id?: string;
  } | null;
}

export function SubmitReviewDialog({ open, onOpenChange, appointment }: SubmitReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  
  // Get authenticated client data from Supabase
  const { data: authData, isLoading: authLoading, error: authError } = useSimpleClientAuth();
  const clientId = authData?.client?.id;
  const branchId = authData?.client?.branch_id;
  
  const createReviewMutation = useCreateReview();
  
  // Check if review already exists for this booking - only call when appointment exists and client is authenticated
  const { data: existingReview } = useCheckExistingReview(
    clientId || '', 
    appointment?.id || '', // This is the booking ID
    { enabled: Boolean(appointment?.id && clientId) }
  );

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || "");
    }
  }, [existingReview]);

  const handleSubmit = async () => {
    if (rating === 0 || !appointment || !clientId || !branchId) {
      console.error('Missing required data for review submission:', {
        rating,
        appointment: !!appointment,
        clientId: !!clientId,
        branchId: !!branchId
      });
      return;
    }

    if (existingReview) {
      // If review exists, show message that it's already submitted
      return;
    }

    try {
      // Parse the appointment date to get proper service_date
      const serviceDate = new Date(appointment.date).toISOString().split('T')[0];
      
      await createReviewMutation.mutateAsync({
        client_id: clientId,
        staff_id: appointment.staff_id || null,
        booking_id: appointment.id, // Changed from appointment_id to booking_id
        service_date: serviceDate,
        rating: rating,
        comment: comment.trim() || null,
        service_type: appointment.type,
        branch_id: branchId, // Use authenticated branch_id
      });

      // Reset form and close dialog
      setRating(0);
      setComment("");
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const handleClose = () => {
    if (!createReviewMutation.isPending) {
      setRating(0);
      setComment("");
      onOpenChange(false);
    }
  };

  // Show loading state while authenticating
  if (authLoading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-500 dark:text-muted-foreground">Authenticating...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show authentication error
  if (authError || !clientId) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 dark:text-muted-foreground">Please log in to submit a review.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Don't render dialog content if no appointment is selected
  if (!appointment) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>No Appointment Selected</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 dark:text-muted-foreground">Please select an appointment to leave a review.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? "Your Feedback" : "Share Your Feedback"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Carer</Label>
            <div className="text-sm font-medium">{appointment.provider}</div>
          </div>
          
          <div className="space-y-2">
            <Label>Service Date</Label>
            <div className="text-sm">{appointment.date} at {appointment.time}</div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rating">Your Rating</Label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => !existingReview && setRating(star)}
                  className="focus:outline-none"
                  disabled={!!existingReview}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comment">Your Comments</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => !existingReview && setComment(e.target.value)}
              placeholder={existingReview ? "" : "Share your experience with this carer..."}
              className="min-h-32"
              disabled={!!existingReview}
            />
            {!existingReview && (
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                Your feedback helps us improve our services. It will be shared with management but not directly with the carer.
              </p>
            )}
          </div>

          {existingReview && (
            <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded">
              <strong>Review submitted:</strong> {new Date(existingReview.created_at).toLocaleDateString()}
              {new Date(existingReview.can_edit_until) > new Date() && (
                <div className="mt-1 text-xs">
                  You can edit this review until {new Date(existingReview.can_edit_until).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={createReviewMutation.isPending}
          >
            {existingReview ? "Close" : "Cancel"}
          </Button>
          {!existingReview && (
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={createReviewMutation.isPending || rating === 0}
            >
              {createReviewMutation.isPending ? "Submitting..." : "Submit Feedback"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
