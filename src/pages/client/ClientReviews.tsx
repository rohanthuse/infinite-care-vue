
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Calendar, User } from "lucide-react";
import { ViewReviewDialog } from "@/components/client/ViewReviewDialog";

const ClientReviews = () => {
  const [isViewingReview, setIsViewingReview] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);

  // Mock reviews data
  const mockReviews = [
    {
      id: "review-101",
      appointmentId: 101,
      appointmentType: "Therapy Session",
      carerName: "Dr. Smith, Physical Therapist",
      date: "April 19, 2025",
      rating: 4,
      comment: "Very professional and thorough. Explained everything clearly and gave me helpful exercises to do at home.",
      submittedAt: "April 20, 2025"
    },
    {
      id: "review-102",
      appointmentId: 102,
      appointmentType: "Weekly Check-in",
      carerName: "Nurse Johnson",
      date: "April 12, 2025",
      rating: 5,
      comment: "Excellent service! Very caring and attentive to all my concerns.",
      submittedAt: "April 13, 2025"
    },
    {
      id: "review-103",
      appointmentId: 104,
      appointmentType: "Home Visit",
      carerName: "Dr. Williams, GP",
      date: "March 27, 2025",
      rating: 3,
      comment: "Service was okay, but arrived late and seemed rushed.",
      submittedAt: "March 28, 2025"
    }
  ];

  // Handle view review
  const handleViewReview = (review: any) => {
    setSelectedReview(review);
    setIsViewingReview(true);
  };

  // Render stars for a rating
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold mb-6">My Feedback History</h2>

        <div className="space-y-4">
          {mockReviews.length > 0 ? (
            mockReviews.map((review) => (
              <Card key={review.id} className="mb-4">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between md:justify-start">
                        <h3 className="text-lg font-medium">{review.appointmentType}</h3>
                      </div>
                      
                      <div className="text-sm text-gray-600 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        {review.carerName}
                      </div>
                      
                      <div className="text-sm text-gray-600 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Service on {review.date}
                      </div>
                      
                      <div className="flex items-center mt-2">
                        {renderStars(review.rating)}
                      </div>
                      
                      <div className="text-sm mt-2 bg-gray-50 p-3 rounded border border-gray-100">
                        {review.comment}
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-2">
                        Submitted on {review.submittedAt}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4 md:mt-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewReview(review)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">You haven't submitted any feedback yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Review Dialog */}
      {selectedReview && (
        <ViewReviewDialog
          open={isViewingReview}
          onOpenChange={setIsViewingReview}
          review={selectedReview}
        />
      )}
    </div>
  );
};

export default ClientReviews;
