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
  staff: { first_name: string; last_name: string; } | null;
};

export type ReviewWithDetails = {
  id: string;
  rating: number;
  comment: string | null;
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

    const staffQuery = (supabase as any).from('staff').select('id', { count: 'exact', head: true }).eq('branch_id', branchId);
    const clientsQuery = (supabase as any).from('clients').select('id', { count: 'exact', head: true }).eq('branch_id', branchId);
    const bookingsQuery = (supabase as any).from('bookings').select('id', { count: 'exact', head: true }).eq('branch_id', branchId);
    const reviewsQuery = (supabase as any).from('reviews').select('id', { count: 'exact', head: true }).eq('branch_id', branchId);
    
    const todaysBookingsQuery = (supabase as any).from('bookings').select('id, start_time, end_time, client:clients(first_name, last_name), staff:staff(first_name, last_name)').eq('branch_id', branchId).gte('start_time', startOfDay).lte('start_time', endOfDay).order('start_time').limit(5);
    
    // First, get staff IDs for the given branch
    const { data: staffInBranch, error: staffErrorForDocs } = await supabase.from('staff').select('id').eq('branch_id', branchId);
    if (staffErrorForDocs) throw staffErrorForDocs;
    const staffIds = staffInBranch?.map(s => s.id) || [];

    // Then, query for expired documents for those staff members
    const expiryAlertsQuery = staffIds.length > 0
        ? (supabase as any).from('staff_documents').select('id, document_type, staff:staff!inner(first_name, last_name)').in('staff_id', staffIds).eq('status', 'Expired').limit(3)
        : Promise.resolve({ data: [], error: null });

    const latestReviewsQuery = (supabase as any).from('reviews').select('id, rating, comment, client:clients(first_name, last_name), staff:staff(first_name, last_name)').eq('branch_id', branchId).order('created_at', { ascending: false }).limit(3);

    const [
        { count: staffCount, error: staffError },
        { count: clientsCount, error: clientsError },
        { count: bookingsCount, error: bookingsError },
        { count: reviewsCount, error: reviewsError },
        { data: todaysBookings, error: todaysBookingsError },
        { data: expiryAlerts, error: expiryAlertsError },
        { data: latestReviews, error: latestReviewsError },
    ] = await Promise.all([
        staffQuery,
        clientsQuery,
        bookingsQuery,
        reviewsQuery,
        todaysBookingsQuery,
        expiryAlertsQuery,
        latestReviewsQuery
    ]);

    const errors = [staffError, clientsError, bookingsError, reviewsError, todaysBookingsError, expiryAlertsError, latestReviewsError].filter(Boolean);
    if (errors.length > 0) {
        throw new Error(errors.map(e => (e as Error).message).join(', '));
    }
    
    return {
        staffCount,
        clientsCount,
        bookingsCount,
        reviewsCount,
        todaysBookings: (todaysBookings || []) as BookingWithDetails[],
        expiryAlerts: (expiryAlerts || []) as ExpiryAlert[],
        latestReviews: (latestReviews || []) as ReviewWithDetails[],
    };
};

export const useBranchStatistics = (branchId: string | undefined) => {
    return useQuery({
        queryKey: ['branch-statistics', branchId],
        queryFn: () => fetchBranchStatistics(branchId!),
        enabled: !!branchId,
    });
};
