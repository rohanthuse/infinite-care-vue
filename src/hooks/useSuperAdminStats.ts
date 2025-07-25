import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SuperAdminStats {
  totalClientsCount: number;
  totalClientsChange: string;
  totalClientsChangePositive: boolean;
  todaysBookingsCount: number;
  todaysBookingsChange: string;
  todaysBookingsChangePositive: boolean;
  pendingReviewsCount: number;
  pendingReviewsChange: string;
  pendingReviewsChangePositive: boolean;
  monthlyRevenue: number;
  monthlyRevenueChange: string;
  monthlyRevenueChangePositive: boolean;
}

export const useSuperAdminStats = () => {
  return useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: async (): Promise<SuperAdminStats> => {
      // Get total clients across all branches
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Get today's bookings across all branches
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const { count: todaysBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString());

      // Get pending reviews across all branches (placeholder since reviews table might not exist)
      const pendingReviews = 0; // Placeholder - in real implementation you'd query the reviews table

      // Get monthly revenue across all branches
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const { data: monthlyBookings } = await supabase
        .from('bookings')
        .select('revenue')
        .gte('start_time', startOfMonth.toISOString())
        .eq('status', 'completed');

      const monthlyRevenue = monthlyBookings?.reduce((sum, booking) => sum + (booking.revenue || 0), 0) || 0;

      // Calculate mock changes (in real app, you'd compare with previous periods)
      const mockChanges = {
        clients: { change: '+12%', positive: true },
        bookings: { change: '+8%', positive: true },
        reviews: { change: '-3%', positive: false },
        revenue: { change: '+15%', positive: true }
      };

      return {
        totalClientsCount: totalClients || 0,
        totalClientsChange: mockChanges.clients.change,
        totalClientsChangePositive: mockChanges.clients.positive,
        todaysBookingsCount: todaysBookings || 0,
        todaysBookingsChange: mockChanges.bookings.change,
        todaysBookingsChangePositive: mockChanges.bookings.positive,
        pendingReviewsCount: pendingReviews,
        pendingReviewsChange: mockChanges.reviews.change,
        pendingReviewsChangePositive: mockChanges.reviews.positive,
        monthlyRevenue: monthlyRevenue,
        monthlyRevenueChange: mockChanges.revenue.change,
        monthlyRevenueChangePositive: mockChanges.revenue.positive
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};