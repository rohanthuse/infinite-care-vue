
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { ClientReview } from "@/hooks/useClientReviews";

interface ViewReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: ClientReview | null;
}

export function ViewReviewDialog({ open, onOpenChange, review }: ViewReviewDialogProps) {
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Feedback</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">Service Type</div>
            <div>{review.service_type || 'Care Service'}</div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">Service Date</div>
            <div>{new Date(review.service_date).toLocaleDateString()}</div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">Your Rating</div>
            <div className="flex">
              {renderStars(review.rating)}
            </div>
          </div>
          
          {review.comment && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500">Your Comments</div>
              <div className="text-sm p-3 bg-gray-50 rounded border border-gray-100">
                {review.comment}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">Submitted On</div>
            <div className="text-sm text-gray-600">
              {new Date(review.created_at).toLocaleDateString()} at {new Date(review.created_at).toLocaleTimeString()}
            </div>
          </div>

          {new Date(review.can_edit_until) > new Date() && (
            <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
              <strong>Note:</strong> You can edit this review until {new Date(review.can_edit_until).toLocaleString()}
            </div>
          )}
          
          <div className="text-sm text-gray-500 italic">
            Thank you for your feedback. It helps us improve our services.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
