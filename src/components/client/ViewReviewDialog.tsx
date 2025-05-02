
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star } from "lucide-react";

interface ViewReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: any;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Feedback</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">For</div>
            <div>{review.carerName}</div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">Service Date</div>
            <div>{review.date}</div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">Your Rating</div>
            <div className="flex">
              {renderStars(review.rating)}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">Your Comments</div>
            <div className="text-sm p-3 bg-gray-50 rounded border border-gray-100">
              {review.comment}
            </div>
          </div>
          
          {review.adminComments && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500">Admin Note</div>
              <div className="text-sm p-3 bg-blue-50 rounded border border-blue-100">
                {review.adminComments}
              </div>
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
