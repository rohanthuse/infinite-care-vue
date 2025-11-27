
import { useMemo } from 'react';
import { useCompletedAppointments } from '@/hooks/useClientAppointments';
import { useClientReviews } from '@/hooks/useClientReviews';

export interface PendingReviewAppointment {
  id: string;
  type: string;
  provider: string;
  date: string;
  time: string;
  client_id?: string;
  staff_id?: string;
  completed_at?: string;
}

export const usePendingReviews = (clientId: string | undefined) => {
  const { data: completedAppointments, isLoading: appointmentsLoading } = useCompletedAppointments(clientId || '');
  const { data: existingReviews, isLoading: reviewsLoading } = useClientReviews(clientId || '');

  const isLoading = appointmentsLoading || reviewsLoading;

  const pendingReviews = useMemo(() => {
    console.log('[usePendingReviews] Starting with clientId:', clientId);
    console.log('[usePendingReviews] Loading state:', { appointmentsLoading, reviewsLoading });
    console.log('[usePendingReviews] Completed appointments:', completedAppointments?.length);
    console.log('[usePendingReviews] Existing reviews:', existingReviews?.length);

    // Return empty if still loading or no data
    if (isLoading) return [];
    if (!completedAppointments) return [];
    
    // Treat missing reviews as empty array (no reviews yet)
    const reviews = existingReviews || [];

    // Get booking IDs that already have reviews (changed from appointment_id to booking_id)
    const reviewedBookingIds = new Set(
      reviews.map(review => review.booking_id)
    );

    console.log('[usePendingReviews] Already reviewed booking IDs:', Array.from(reviewedBookingIds));

    // Filter completed appointments that don't have reviews and are within the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const filtered = completedAppointments
      .filter(appointment => {
        // Check if appointment doesn't have a review (using booking ID)
        const hasNoReview = !reviewedBookingIds.has(appointment.id);
        
        // Check if appointment was completed within the last 90 days
        const appointmentDate = new Date(appointment.appointment_date);
        const isRecent = appointmentDate >= ninetyDaysAgo;
        
        console.log('[usePendingReviews] Checking appointment:', {
          id: appointment.id,
          date: appointment.appointment_date,
          hasNoReview,
          isRecent
        });
        
        return hasNoReview && isRecent;
      })
      .map(appointment => ({
        id: appointment.id,
        type: appointment.appointment_type,
        provider: appointment.provider_name,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        client_id: appointment.client_id,
        staff_id: (appointment as any)._booking_data?.staff_id || null,
        completed_at: appointment.appointment_date // Using appointment_date as completed_at fallback
      }));

    console.log('[usePendingReviews] Pending reviews after filter:', filtered.length);
    return filtered;
  }, [completedAppointments, existingReviews, isLoading, appointmentsLoading, reviewsLoading]);

  return {
    data: pendingReviews,
    isLoading,
    count: pendingReviews.length
  };
};
