import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, User, MessageSquare } from "lucide-react";
import { useClientReviews } from "@/hooks/useClientReviews";
import { format, parseISO } from "date-fns";

interface ReviewsTabProps {
  clientId: string;
}

export const ReviewsTab: React.FC<ReviewsTabProps> = ({ clientId }) => {
  const { data: reviews = [], isLoading, error } = useClientReviews(clientId);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
        }`}
      />
    ));
  };

  const getServiceBadge = (serviceType: string) => {
    const colors: Record<string, string> = {
      "Personal Care": "bg-blue-100 text-blue-800",
      "Medication": "bg-green-100 text-green-800",
      "Companionship": "bg-purple-100 text-purple-800",
      "Domestic": "bg-orange-100 text-orange-800",
    };
    
    return (
      <Badge variant="secondary" className={colors[serviceType] || ""}>
        {serviceType}
      </Badge>
    );
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading reviews...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Failed to load reviews. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{reviews.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-primary">
                {averageRating.toFixed(1)}
              </span>
              <div className="flex">
                {renderStars(Math.round(averageRating))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Latest Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {reviews.length > 0
                ? format(parseISO(reviews[0].created_at), "MMM dd, yyyy")
                : "No reviews yet"
              }
            </div>
            {reviews.length > 0 && (
              <div className="flex mt-1">
                {renderStars(reviews[0].rating)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Client Reviews</span>
          </CardTitle>
          <CardDescription>
            Feedback from completed services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reviews available yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Reviews will appear after services are completed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex">
                        {renderStars(review.rating)}
                      </div>
                      <span className="font-medium">{review.rating}/5 Stars</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(parseISO(review.service_date), "MMM dd, yyyy")}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Service:</span>
                    {getServiceBadge(review.service_type)}
                  </div>

                  {review.comment && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm italic">"{review.comment}"</p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Submitted on {format(parseISO(review.created_at), "MMM dd, yyyy 'at' HH:mm")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};