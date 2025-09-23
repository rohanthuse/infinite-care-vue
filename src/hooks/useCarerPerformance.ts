
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CarerPerformanceData {
  totalBookings: number;
  completedBookings: number;
  completionRate: number;
  averageRating: number;
  totalReviews: number;
  monthlyEarnings: number;
  punctualityScore: number;
  clientRetentionRate: number;
}

const fetchCarerPerformance = async (carerId: string): Promise<CarerPerformanceData> => {
  console.log('[fetchCarerPerformance] Fetching performance data for carer:', carerId);
  
  // Get total bookings
  const { data: allBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, status, revenue, start_time')
    .eq('staff_id', carerId);

  if (bookingsError) {
    console.error('[fetchCarerPerformance] Bookings error:', bookingsError);
    throw bookingsError;
  }

  // Get reviews
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('rating')
    .eq('staff_id', carerId);

  if (reviewsError) {
    console.error('[fetchCarerPerformance] Reviews error:', reviewsError);
    throw reviewsError;
  }

  const totalBookings = allBookings?.length || 0;
  const completedBookings = allBookings?.filter(b => b.status === 'completed').length || 0;
  const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

  const totalReviews = reviews?.length || 0;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
    : 0;

  // Calculate monthly earnings (current month)
  const currentMonth = new Date();
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthlyEarnings = allBookings
    ?.filter(b => 
      b.status === 'completed' && 
      new Date(b.start_time) >= monthStart &&
      b.revenue
    )
    .reduce((sum, b) => sum + (Number(b.revenue) || 0), 0) || 0;

  // Mock punctuality and retention scores (would be calculated from real data)
  const punctualityScore = Math.max(85, Math.min(100, 90 + Math.random() * 10));
  const clientRetentionRate = Math.max(75, Math.min(100, 80 + Math.random() * 20));

  return {
    totalBookings,
    completedBookings,
    completionRate,
    averageRating,
    totalReviews,
    monthlyEarnings,
    punctualityScore,
    clientRetentionRate
  };
};

export const useCarerPerformance = (carerId: string) => {
  return useQuery({
    queryKey: ['carer-performance', carerId],
    queryFn: () => fetchCarerPerformance(carerId),
    enabled: Boolean(carerId) && carerId.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
