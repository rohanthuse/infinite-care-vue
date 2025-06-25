
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BranchDashboardStats {
    clientsCount: number | null;
    todaysBookingsCount: number | null;
    pendingReviewsCount: number | null;
    monthlyRevenue: number | null;
    clientsChange: string | null;
    todaysBookingsChange: string | null;
    pendingReviewsChange: string | null;
    monthlyRevenueChange: string | null;
    clientsChangePositive: boolean;
    todaysBookingsChangePositive: boolean;
    pendingReviewsChangePositive: boolean;
    monthlyRevenueChangePositive: boolean;
}

const calculatePercentageChange = (current: number, previous: number): { change: string, isPositive: boolean } => {
    if (previous === 0) {
        return current > 0 ? { change: '∞%', isPositive: true } : { change: '0%', isPositive: true };
    }
    
    const percentageChange = ((current - previous) / previous) * 100;
    const isPositive = percentageChange >= 0;
    const formattedChange = `${isPositive ? '+' : ''}${percentageChange.toFixed(1)}%`;
    
    return { change: formattedChange, isPositive };
};

const fetchBranchDashboardStats = async (branchId: string): Promise<BranchDashboardStats> => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfToday = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();

    // Current month vs previous month
    const currentMonth = new Date();
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    const startOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
    const startOfPreviousMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1).toISOString();
    const endOfPreviousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0, 23, 59, 59, 999).toISOString();

    // Current period queries
    const clientsQuery = supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId);

    const todaysBookingsQuery = supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .gte('start_time', startOfToday)
        .lte('start_time', endOfToday);

    const pendingReviewsQuery = supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId);

    // Previous period queries for comparison
    const yesterdaysBookingsQuery = supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .gte('start_time', startOfYesterday)
        .lte('start_time', endOfYesterday);

    const previousMonthClientsQuery = supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .lt('created_at', startOfCurrentMonth);

    const previousMonthReviewsQuery = supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .gte('created_at', startOfPreviousMonth)
        .lt('created_at', startOfCurrentMonth);

    const [
        { count: clientsCount, error: clientsError },
        { count: todaysBookingsCount, error: todaysBookingsError },
        { count: pendingReviewsCount, error: reviewsError },
        { count: yesterdaysBookingsCount, error: yesterdaysBookingsError },
        { count: previousMonthClientsCount, error: previousMonthClientsError },
        { count: previousMonthReviewsCount, error: previousMonthReviewsError },
    ] = await Promise.all([
        clientsQuery,
        todaysBookingsQuery,
        pendingReviewsQuery,
        yesterdaysBookingsQuery,
        previousMonthClientsQuery,
        previousMonthReviewsQuery,
    ]);

    const errors = [
        clientsError, 
        todaysBookingsError, 
        reviewsError, 
        yesterdaysBookingsError, 
        previousMonthClientsError, 
        previousMonthReviewsError
    ].filter(Boolean);
    
    if (errors.length > 0) {
        throw new Error(errors.map(e => (e as any).message).join(', '));
    }

    // Calculate percentage changes
    const clientsChangeData = calculatePercentageChange(
        clientsCount || 0, 
        previousMonthClientsCount || 0
    );
    
    const bookingsChangeData = calculatePercentageChange(
        todaysBookingsCount || 0, 
        yesterdaysBookingsCount || 0
    );
    
    const reviewsChangeData = calculatePercentageChange(
        pendingReviewsCount || 0, 
        previousMonthReviewsCount || 0
    );

    // Monthly revenue is still placeholder - calculate change based on mock previous value
    const monthlyRevenue = 18947;
    const previousMonthRevenue = 16500; // Mock previous month revenue
    const revenueChangeData = calculatePercentageChange(monthlyRevenue, previousMonthRevenue);

    return {
        clientsCount,
        todaysBookingsCount,
        pendingReviewsCount,
        monthlyRevenue,
        clientsChange: clientsChangeData.change,
        todaysBookingsChange: bookingsChangeData.change,
        pendingRevenuesChange: reviewsChangeData.change,
        monthlyRevenueChange: revenueChangeData.change,
        clientsChangePositive: clientsChangeData.isPositive,
        todaysBookingsChangePositive: bookingsChangeData.isPositive,
        pendingReviewsChangePositive: reviewsChangeData.isPositive,
        monthlyRevenueChangePositive: revenueChangeData.isPositive,
    };
};

export const useBranchDashboardStats = (branchId: string | undefined) => {
    return useQuery<BranchDashboardStats>({
        queryKey: ['branch-dashboard-stats', branchId],
        queryFn: () => fetchBranchDashboardStats(branchId!),
        enabled: !!branchId,
    });
};
