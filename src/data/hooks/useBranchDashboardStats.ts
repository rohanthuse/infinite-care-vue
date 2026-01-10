
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
    
    // Today's date for active client filtering
    const todayDate = new Date().toISOString().split('T')[0];

    // Current period queries - only count ACTIVE clients
    const clientsQuery = supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .eq('status', 'Active')
        .or(`active_until.is.null,active_until.gte.${todayDate}`);

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

    // Monthly revenue queries - current month
    const currentMonthRevenueQuery = supabase
        .from('payment_records')
        .select(`
            payment_amount,
            client_billing!inner(
                client_id,
                clients!inner(
                    branch_id
                )
            )
        `)
        .gte('payment_date', startOfCurrentMonth.split('T')[0])
        .eq('client_billing.clients.branch_id', branchId);

    // Fallback to bookings revenue for current month if no payments
    const currentMonthBookingsQuery = supabase
        .from('bookings')
        .select('revenue')
        .eq('branch_id', branchId)
        .gte('start_time', startOfCurrentMonth);

    // Previous period queries for comparison
    const yesterdaysBookingsQuery = supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .gte('start_time', startOfYesterday)
        .lte('start_time', endOfYesterday);

    // Previous month active clients count (for comparison)
    const previousMonthClientsQuery = supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .eq('status', 'Active')
        .or(`active_until.is.null,active_until.gte.${todayDate}`)
        .lt('created_at', startOfCurrentMonth);

    const previousMonthReviewsQuery = supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .gte('created_at', startOfPreviousMonth)
        .lt('created_at', startOfCurrentMonth);

    // Previous month revenue queries
    const previousMonthRevenueQuery = supabase
        .from('payment_records')
        .select(`
            payment_amount,
            client_billing!inner(
                client_id,
                clients!inner(
                    branch_id
                )
            )
        `)
        .gte('payment_date', startOfPreviousMonth.split('T')[0])
        .lt('payment_date', startOfCurrentMonth.split('T')[0])
        .eq('client_billing.clients.branch_id', branchId);

    // Fallback to bookings revenue for previous month if no payments
    const previousMonthBookingsQuery = supabase
        .from('bookings')
        .select('revenue')
        .eq('branch_id', branchId)
        .gte('start_time', startOfPreviousMonth)
        .lt('start_time', startOfCurrentMonth);

    const [
        { count: clientsCount, error: clientsError },
        { count: todaysBookingsCount, error: todaysBookingsError },
        { count: pendingReviewsCount, error: reviewsError },
        { count: yesterdaysBookingsCount, error: yesterdaysBookingsError },
        { count: previousMonthClientsCount, error: previousMonthClientsError },
        { count: previousMonthReviewsCount, error: previousMonthReviewsError },
        { data: currentMonthPayments, error: currentMonthRevenueError },
        { data: currentMonthBookings, error: currentMonthBookingsError },
        { data: previousMonthPayments, error: previousMonthRevenueError },
        { data: previousMonthBookings, error: previousMonthBookingsError },
    ] = await Promise.all([
        clientsQuery,
        todaysBookingsQuery,
        pendingReviewsQuery,
        yesterdaysBookingsQuery,
        previousMonthClientsQuery,
        previousMonthReviewsQuery,
        currentMonthRevenueQuery,
        currentMonthBookingsQuery,
        previousMonthRevenueQuery,
        previousMonthBookingsQuery,
    ]);

    const errors = [
        clientsError, 
        todaysBookingsError, 
        reviewsError, 
        yesterdaysBookingsError, 
        previousMonthClientsError, 
        previousMonthReviewsError,
        currentMonthRevenueError,
        currentMonthBookingsError,
        previousMonthRevenueError,
        previousMonthBookingsError
    ].filter(Boolean);
    
    if (errors.length > 0) {
        throw new Error(errors.map(e => (e as any).message).join(', '));
    }

    // Calculate monthly revenue from payment records with fallback to bookings
    const calculateRevenue = (payments: any[], bookings: any[]) => {
        // Primary: Sum up actual payments
        const paymentsTotal = payments?.reduce((sum, payment) => sum + (payment.payment_amount || 0), 0) || 0;
        
        // Fallback: Sum up bookings revenue if no payments
        if (paymentsTotal === 0) {
            return bookings?.reduce((sum, booking) => sum + (booking.revenue || 0), 0) || 0;
        }
        
        return paymentsTotal;
    };

    const monthlyRevenue = calculateRevenue(currentMonthPayments, currentMonthBookings);
    const previousMonthRevenue = calculateRevenue(previousMonthPayments, previousMonthBookings);

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

    const revenueChangeData = calculatePercentageChange(monthlyRevenue, previousMonthRevenue);

    return {
        clientsCount,
        todaysBookingsCount,
        pendingReviewsCount,
        monthlyRevenue,
        clientsChange: clientsChangeData.change,
        todaysBookingsChange: bookingsChangeData.change,
        pendingReviewsChange: reviewsChangeData.change,
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
