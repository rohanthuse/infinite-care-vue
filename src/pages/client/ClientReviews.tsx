
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Calendar, User } from "lucide-react";
import { ViewReviewDialog } from "@/components/client/ViewReviewDialog";

const ClientReviews = () => {
  const [activeTab, setActiveTab] = useState("all");
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
      status: "Published",
      submittedAt: "April 20, 2025",
      publishedAt: "April 21, 2025"
    },
    {
      id: "review-102",
      appointmentId: 102,
      appointmentType: "Weekly Check-in",
      carerName: "Nurse Johnson",
      date: "April 12, 2025",
      rating: 5,
      comment: "Excellent service! Very caring and attentive to all my concerns.",
      status: "Under Review",
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
      status: "Published",
      submittedAt: "March 28, 2025",
      publishedAt: "March 30, 2025"
    }
  ];

  // Filter reviews based on active tab
  const filteredReviews = mockReviews.filter(review => {
    if (activeTab === "all") return true;
    if (activeTab === "published") return review.status === "Published";
    if (activeTab === "pending") return review.status === "Under Review";
    return true;
  });

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

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Published": return "bg-green-100 text-green-800";
      case "Under Review": return "bg-yellow-100 text-yellow-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold mb-6">My Reviews</h2>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Reviews</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <Card key={review.id} className="mb-4">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between md:justify-start">
                          <h3 className="text-lg font-medium">{review.appointmentType}</h3>
                          <Badge className={`ml-3 ${getStatusBadge(review.status)}`}>
                            {review.status}
                          </Badge>
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
                          {review.publishedAt && ` • Published on ${review.publishedAt}`}
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
                <p className="text-gray-500">No reviews found for this category.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
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
