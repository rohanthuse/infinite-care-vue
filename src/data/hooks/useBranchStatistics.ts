
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type BookingWithDetails = {
  id: string;
  start_time: string;
  end_time: string;
  client: { first_name: string; last_name: string; } | null;
  staff: { first_name: string; last_name: string; } | null;
};

export type ExpiryAlert = {
  id: string;
  document_type: string;
  expiry_date: string | null;
  staff: { first_name: string; last_name: string; } | null;
};

export type ReviewWithDetails = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  client: { first_name: string; last_name: string; } | null;
  staff: { first_name: string; last_name: string; } | null;
};

export interface BranchStatistics {
    staffCount: number | null;
    clientsCount: number | null;
    bookingsCount: number | null;
    reviewsCount: number | null;
    todaysBookings: BookingWithDetails[];
    expiryAlerts: ExpiryAlert[];
    latestReviews: ReviewWithDetails[];
}

const fetchBranchStatistics = async (branchId: string): Promise<BranchStatistics> => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    const todayDate = new Date().toISOString().split('T')[0];

    // Core queries that must succeed - only count ACTIVE clients
    const coreQueries = [
        (supabase as any).from('staff').select('id', { count: 'exact', head: true }).eq('branch_id', branchId),
        (supabase as any).from('clients').select('id', { count: 'exact', head: true }).eq('branch_id', branchId).eq('status', 'Active').or(`active_until.is.null,active_until.gte.${todayDate}`),
        (supabase as any).from('bookings').select('id', { count: 'exact', head: true }).eq('branch_id', branchId),
        (supabase as any).from('reviews').select('id', { count: 'exact', head: true }).eq('branch_id', branchId),
        (supabase as any).from('bookings').select('id, start_time, end_time, client:clients(first_name, last_name), staff:staff(first_name, last_name)').eq('branch_id', branchId).gte('start_time', startOfDay).lte('start_time', endOfDay).order('start_time').limit(5)
    ];

    const [
        { count: staffCount, error: staffError },
        { count: clientsCount, error: clientsError },
        { count: bookingsCount, error: bookingsError },
        { count: reviewsCount, error: reviewsError },
        { data: todaysBookings, error: todaysBookingsError },
    ] = await Promise.all(coreQueries);

    // Check for critical errors that should fail the entire query
    const criticalErrors = [staffError, clientsError, bookingsError, reviewsError, todaysBookingsError].filter(Boolean);
    if (criticalErrors.length > 0) {
        throw new Error(criticalErrors.map(e => (e as Error).message).join(', '));
    }

    // Non-critical queries - handle errors gracefully
    let expiryAlerts: ExpiryAlert[] = [];
    let latestReviews: ReviewWithDetails[] = [];

    // Try to get expiry alerts - fail gracefully if RLS or table issues
    try {
        const { data: staffInBranch } = await supabase.from('staff').select('id').eq('branch_id', branchId);
        const staffIds = staffInBranch?.map(s => s.id) || [];
        
        if (staffIds.length > 0) {
            const { data: alertsData, error: alertsError } = await (supabase as any)
                .from('staff_documents')
                .select('id, document_type, expiry_date, staff:staff!inner(first_name, last_name)')
                .in('staff_id', staffIds)
                .eq('status', 'Expired')
                .limit(4);
            
            if (!alertsError && alertsData) {
                expiryAlerts = alertsData;
            }
        }
    } catch (error) {
        console.warn('Failed to load expiry alerts:', error);
    }

    // Try to get latest reviews - fail gracefully if issues
    try {
        const { data: reviewsData, error: reviewsError } = await (supabase as any)
            .from('reviews')
            .select('id, rating, comment, created_at, client:clients(first_name, last_name), staff:staff(first_name, last_name)')
            .eq('branch_id', branchId)
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (!reviewsError && reviewsData) {
            latestReviews = reviewsData;
        }
    } catch (error) {
        console.warn('Failed to load latest reviews:', error);
    }
    
    return {
        staffCount,
        clientsCount,
        bookingsCount,
        reviewsCount,
        todaysBookings: (todaysBookings || []) as BookingWithDetails[],
        expiryAlerts,
        latestReviews,
    };
};

export const useBranchStatistics = (branchId: string | undefined) => {
    return useQuery({
        queryKey: ['branch-statistics', branchId],
        queryFn: () => fetchBranchStatistics(branchId!),
        enabled: !!branchId,
    });
};
