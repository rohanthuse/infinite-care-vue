
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Calendar, User, AlertCircle, Edit, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useClientReviews, useUpdateReview } from "@/hooks/useClientReviews";
import { useSimpleClientAuth } from "@/hooks/useSimpleClientAuth";
import { usePendingReviews } from "@/hooks/usePendingReviews";
import { SubmitReviewDialog } from "@/components/client/SubmitReviewDialog";
import { format } from "date-fns";

const ClientReviews = () => {
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  const location = useLocation();

  // Get authenticated client data from Supabase
  const { data: authData, isLoading: authLoading, error: authError } = useSimpleClientAuth();
  const clientId = authData?.client?.id;

  const { data: reviews, isLoading: reviewsLoading, error: reviewsError } = useClientReviews(clientId || '');
  const { data: pendingReviews, isLoading: pendingLoading } = usePendingReviews(clientId || '');
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

  const handleLeaveReview = (appointment: any) => {
    const appointmentData = {
      id: appointment.id,
      type: appointment.type,
      provider: appointment.provider,
      date: appointment.date,
      time: appointment.time,
      client_id: appointment.client_id,
      staff_id: appointment.staff_id
    };
    setSelectedAppointment(appointmentData);
    setReviewDialogOpen(true);
  };

  // Handle navigation from ReviewPrompt
  useEffect(() => {
    if (location.state?.appointment) {
      handleLeaveReview(location.state.appointment);
      // Clear the state to prevent re-opening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
          className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} 
        />
      </button>
    ));
  };

  // Show loading state while checking authentication or loading reviews
  if (authLoading || reviewsLoading || pendingLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-muted-foreground">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  // Show authentication error or not logged in as client
  if (authError || !clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">Authentication Required</h3>
          <p className="text-gray-500 dark:text-muted-foreground">Please log in to view your reviews.</p>
        </div>
      </div>
    );
  }

  if (reviewsError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">Error loading reviews</h3>
        <p className="text-gray-600 dark:text-muted-foreground">Unable to load your reviews. Please try refreshing the page.</p>
      </div>
    );
  }

  const hasContent = (reviews && reviews.length > 0) || (pendingReviews && pendingReviews.length > 0);
  
  if (!hasContent) {
    return (
      <div className="text-center py-12">
        <Star className="h-12 w-12 text-gray-400 dark:text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">No reviews yet</h3>
        <p className="text-gray-600 dark:text-muted-foreground">You haven't submitted any reviews yet. After completing appointments, you'll be able to leave feedback about your care experience.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Feedback Section */}
      {pendingReviews && pendingReviews.length > 0 && (
        <div className="bg-white dark:bg-card p-6 rounded-xl border border-gray-200 dark:border-border">
          <h2 className="text-xl font-bold mb-6 text-blue-600 dark:text-blue-400">Pending Feedback</h2>
          <p className="text-gray-600 dark:text-muted-foreground mb-6">
            You have recent appointments waiting for your review. Share your experience to help us improve our services.
          </p>

          <div className="space-y-4">
            {pendingReviews.map((appointment) => (
              <Card key={appointment.id} className="border-blue-100 dark:border-blue-900/30">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{appointment.type}</CardTitle>
                      <div className="flex items-center text-sm text-gray-500 dark:text-muted-foreground mt-1">
                        <User className="h-4 w-4 mr-1" />
                        {appointment.provider}
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleLeaveReview(appointment)}
                      className="gap-1"
                    >
                      <Star className="h-4 w-4" />
                      Leave Review
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center text-sm text-gray-500 dark:text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(appointment.date), 'MMM d, yyyy')} at {appointment.time}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Submitted Reviews Section */}
      {reviews && reviews.length > 0 && (
        <div className="bg-white dark:bg-card p-6 rounded-xl border border-gray-200 dark:border-border">
          <h2 className="text-xl font-bold mb-6 text-foreground">Your Submitted Reviews</h2>
          <p className="text-gray-600 dark:text-muted-foreground mb-6">
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
                      <div className="flex items-center text-sm text-gray-500 dark:text-muted-foreground mt-1">
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
                    <div className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-2">Your Rating</div>
                    <div className="flex items-center">
                      {renderStars(
                        isEditing ? editRating : review.rating, 
                        isEditing, 
                        setEditRating
                      )}
                      <span className="ml-2 text-sm text-gray-600 dark:text-muted-foreground">
                        ({isEditing ? editRating : review.rating}/5 stars)
                      </span>
                    </div>
                  </div>

                  {(review.comment || isEditing) && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-2">Your Comments</div>
                      {isEditing ? (
                        <textarea
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          className="w-full p-3 border border-gray-300 dark:border-border dark:bg-muted dark:text-foreground rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="Share your experience..."
                        />
                      ) : (
                        <div className="text-sm text-gray-700 dark:text-foreground p-3 bg-gray-50 dark:bg-muted rounded border border-gray-100 dark:border-border">
                          {review.comment}
                        </div>
                      )}
                    </div>
                  )}

                  {canEdit && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
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
      )}

      {/* Submit Review Dialog */}
      <SubmitReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        appointment={selectedAppointment}
      />
    </div>
  );
};

export default ClientReviews;
