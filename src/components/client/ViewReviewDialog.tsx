
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface ViewReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: any;
}

export function ViewReviewDialog({ open, onOpenChange, review }: ViewReviewDialogProps) {
  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'published': return "bg-green-100 text-green-800";
      case 'under review': return "bg-yellow-100 text-yellow-800";
      case 'rejected': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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
          <DialogTitle className="flex items-center justify-between">
            <span>Your Review</span>
            <Badge className={getStatusColor(review.status)}>
              {review.status}
            </Badge>
          </DialogTitle>
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
              <div className="text-sm font-medium text-gray-500">Admin Response</div>
              <div className="text-sm p-3 bg-blue-50 rounded border border-blue-100">
                {review.adminComments}
              </div>
            </div>
          )}
          
          {review.status === "Rejected" && !review.adminComments && (
            <div className="text-sm text-red-600">
              Your review was not approved for publication. You may submit a new review if you wish.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
