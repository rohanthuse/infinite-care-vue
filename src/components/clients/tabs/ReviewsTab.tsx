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

  const getServiceBadge = (serviceType: string | null) => {
    const displayType = serviceType || "General Service";
    const colors: Record<string, string> = {
      "Personal Care": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      "Medication": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      "Companionship": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      "Domestic": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      "General Service": "bg-muted text-muted-foreground",
    };
    
    return (
      <Badge variant="secondary" className={colors[displayType] || "bg-muted text-muted-foreground"}>
        {displayType}
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
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Reviews</p>
                <p className="text-2xl font-bold text-primary">{reviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Average Rating</p>
                <div className="flex items-center space-x-1">
                  <p className="text-2xl font-bold text-primary">{averageRating.toFixed(1)}</p>
                  <div className="flex">
                    {renderStars(Math.round(averageRating))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Latest Review</p>
                <p className="text-lg font-bold">
                  {reviews.length > 0
                    ? format(parseISO(reviews[0].created_at), "MMM dd, yyyy")
                    : "No reviews yet"
                  }
                </p>
                {reviews.length > 0 && (
                  <div className="flex mt-1">
                    {renderStars(reviews[0].rating)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Client Reviews</CardTitle>
          </div>
          <CardDescription>Feedback from completed services</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm">No reviews available yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Reviews will appear after services are completed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex">
                          {renderStars(review.rating)}
                        </div>
                        <span className="font-medium">{review.rating}/5 Stars</span>
                        {getServiceBadge(review.service_type)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Service: {format(parseISO(review.service_date), "MMM dd, yyyy")}</span>
                        </div>
                      </div>

                      {review.comment && (
                        <div className="bg-muted/30 rounded-lg p-3 mt-2">
                          <p className="text-sm italic">"{review.comment}"</p>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Submitted on {format(parseISO(review.created_at), "MMM dd, yyyy 'at' HH:mm")}
                      </div>
                    </div>
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