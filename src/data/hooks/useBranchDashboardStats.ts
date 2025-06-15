
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BranchDashboardStats {
    clientsCount: number | null;
    todaysBookingsCount: number | null;
    pendingReviewsCount: number | null;
    monthlyRevenue: number | null; // This is a placeholder for now
}

const fetchBranchDashboardStats = async (branchId: string): Promise<BranchDashboardStats> => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const clientsQuery = supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId);

    const todaysBookingsQuery = supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay);
        
    // Note: "Pending Reviews" logic is not defined. Using total reviews count for now.
    const pendingReviewsQuery = supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId);

    const [
        { count: clientsCount, error: clientsError },
        { count: todaysBookingsCount, error: todaysBookingsError },
        { count: pendingReviewsCount, error: reviewsError },
    ] = await Promise.all([
        clientsQuery,
        todaysBookingsQuery,
        pendingReviewsQuery,
    ]);

    const errors = [clientsError, todaysBookingsError, reviewsError].filter(Boolean);
    if (errors.length > 0) {
        throw new Error(errors.map(e => (e as any).message).join(', '));
    }

    // Note: Monthly revenue calculation is not yet possible as there is no financial data.
    // Using a placeholder value.
    const monthlyRevenue = 18947;

    return {
        clientsCount,
        todaysBookingsCount,
        pendingReviewsCount,
        monthlyRevenue,
    };
};

export const useBranchDashboardStats = (branchId: string | undefined) => {
    return useQuery<BranchDashboardStats>({
        queryKey: ['branch-dashboard-stats', branchId],
        queryFn: () => fetchBranchDashboardStats(branchId!),
        enabled: !!branchId,
    });
};
