
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Calendar, User, AlertCircle, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useClientReviews, useUpdateReview } from "@/hooks/useClientReviews";
import { useSimpleClientAuth } from "@/hooks/useSimpleClientAuth";
import { format } from "date-fns";

const ClientReviews = () => {
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");

  // Get authenticated client data from Supabase
  const { data: authData, isLoading: authLoading, error: authError } = useSimpleClientAuth();
  const clientId = authData?.client?.id;

  const { data: reviews, isLoading: reviewsLoading, error: reviewsError } = useClientReviews(clientId || '');
  const updateReviewMutation = useUpdateReview();

  const handleEditStart = (review: any) => {
    setEditingReview(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
  };

  const handleEditSave = async (reviewId: string) => {
    try {
      await updateReviewMutation.mutateAsync({
        reviewId,
        updateData: {
          rating: editRating,
          comment: editComment.trim() || undefined,
        }
      });
      setEditingReview(null);
      setEditRating(0);
      setEditComment("");
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const handleEditCancel = () => {
    setEditingReview(null);
    setEditRating(0);
    setEditComment("");
  };

  const renderStars = (rating: number, editable: boolean = false, onRatingChange?: (rating: number) => void) => {
    return Array(5).fill(0).map((_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => editable && onRatingChange && onRatingChange(i + 1)}
        className={`h-5 w-5 ${editable ? 'cursor-pointer' : 'cursor-default'}`}
        disabled={!editable}
      >
        <Star 
          className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
        />
      </button>
    ));
  };

  // Show loading state while checking authentication or loading reviews
  if (authLoading || reviewsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  // Show authentication error or not logged in as client
  if (authError || !clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please log in to view your reviews.</p>
        </div>
      </div>
    );
  }

  if (reviewsError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading reviews</h3>
        <p className="text-gray-600">Unable to load your reviews. Please try refreshing the page.</p>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
        <p className="text-gray-600">You haven't submitted any reviews yet. After completing appointments, you'll be able to leave feedback about your care experience.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold mb-6">Your Reviews & Feedback</h2>
        <p className="text-gray-600 mb-6">
          Here are all the reviews you've submitted for your care services. You can edit recent reviews if needed.
        </p>

        <div className="space-y-4">
          {reviews.map((review) => {
            const isEditing = editingReview === review.id;
            const canEdit = new Date(review.can_edit_until) > new Date();
            
            return (
              <Card key={review.id}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{review.service_type || 'Care Service'}</CardTitle>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        Service Date: {format(new Date(review.service_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canEdit && !isEditing && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditStart(review)}
                          className="gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      )}
                      <Badge variant="secondary">
                        Submitted {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-2">Your Rating</div>
                    <div className="flex items-center">
                      {renderStars(
                        isEditing ? editRating : review.rating, 
                        isEditing, 
                        setEditRating
                      )}
                      <span className="ml-2 text-sm text-gray-600">
                        ({isEditing ? editRating : review.rating}/5 stars)
                      </span>
                    </div>
                  </div>

                  {(review.comment || isEditing) && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-2">Your Comments</div>
                      {isEditing ? (
                        <textarea
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="Share your experience..."
                        />
                      ) : (
                        <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded border border-gray-100">
                          {review.comment}
                        </div>
                      )}
                    </div>
                  )}

                  {canEdit && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      You can edit this review until {format(new Date(review.can_edit_until), 'MMM d, yyyy \'at\' h:mm a')}
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleEditSave(review.id)}
                        disabled={updateReviewMutation.isPending || editRating === 0}
                      >
                        {updateReviewMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleEditCancel}
                        disabled={updateReviewMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ClientReviews;
