
import React, { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SubmitReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
}

export function SubmitReviewDialog({ open, onOpenChange, appointment }: SubmitReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating before submitting your feedback.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // In a real app, this would be an API call
    setTimeout(() => {
      // Mock successful submission
      toast({
        title: "Feedback submitted",
        description: "Thank you! Your feedback has been submitted successfully.",
      });
      setIsSubmitting(false);
      setRating(0);
      setComment("");
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Feedback</DialogTitle>
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
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
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
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this carer..."
              className="min-h-32"
            />
            <p className="text-xs text-gray-500">Your feedback helps us improve our services. It will be shared with management but not directly with the carer.</p>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setRating(0);
              setComment("");
              onOpenChange(false);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
