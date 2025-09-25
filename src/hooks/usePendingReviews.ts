
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
  completed_at?: string;
}

export const usePendingReviews = (clientId: string) => {
  const { data: completedAppointments } = useCompletedAppointments(clientId);
  const { data: existingReviews } = useClientReviews(clientId);

  const pendingReviews = useMemo(() => {
    if (!completedAppointments || !existingReviews) return [];

    // Get booking IDs that already have reviews (changed from appointment_id to booking_id)
    const reviewedBookingIds = new Set(
      existingReviews.map(review => review.booking_id)
    );

    // Filter completed appointments that don't have reviews and are within the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return completedAppointments
      .filter(appointment => {
        // Check if appointment doesn't have a review (using booking ID)
        const hasNoReview = !reviewedBookingIds.has(appointment.id);
        
        // Check if appointment was completed within the last 30 days
        const appointmentDate = new Date(appointment.appointment_date);
        const isRecent = appointmentDate >= thirtyDaysAgo;
        
        return hasNoReview && isRecent;
      })
      .map(appointment => ({
        id: appointment.id,
        type: appointment.appointment_type,
        provider: appointment.provider_name,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        client_id: appointment.client_id,
        completed_at: appointment.appointment_date // Using appointment_date as completed_at fallback
      }));
  }, [completedAppointments, existingReviews]);

  return {
    data: pendingReviews,
    isLoading: false, // Since we're using derived data
    count: pendingReviews.length
  };
};
