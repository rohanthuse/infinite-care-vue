
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useCreateReview, useCheckExistingReview } from "@/hooks/useClientReviews";

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
  };
}

export function SubmitReviewDialog({ open, onOpenChange, appointment }: SubmitReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  
  const createReviewMutation = useCreateReview();
  
  // Get client ID from localStorage
  const getClientId = () => {
    const clientId = localStorage.getItem("clientId");
    return clientId || '';
  };

  const clientId = getClientId();
  
  // Check if review already exists for this appointment
  const { data: existingReview } = useCheckExistingReview(clientId, appointment.id);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || "");
    }
  }, [existingReview]);

  const handleSubmit = async () => {
    if (rating === 0) {
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
        staff_id: appointment.staff_id || '', // We'll need to get this from appointment data
        appointment_id: appointment.id,
        service_date: serviceDate,
        rating: rating,
        comment: comment.trim() || null,
        service_type: appointment.type,
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
            <div className="text-sm font-medium">{appointment?.provider}</div>
          </div>
          
          <div className="space-y-2">
            <Label>Service Date</Label>
            <div className="text-sm">{appointment?.date} at {appointment?.time}</div>
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
                      star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
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
              <p className="text-xs text-gray-500">
                Your feedback helps us improve our services. It will be shared with management but not directly with the carer.
              </p>
            )}
          </div>

          {existingReview && (
            <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
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
