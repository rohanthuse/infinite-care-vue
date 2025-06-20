import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BranchReview {
  id: string;
  clientName: string;
  clientInitials: string;
  carerName: string;
  carerInitials: string;
  rating: number;
  comment: string | null;
  date: string;
  created_at: string;
}

interface UseBranchReviewsOptions {
  branchId: string;
  searchQuery?: string;
  ratingFilter?: string;
  page?: number;
  limit?: number;
}

export const useBranchReviews = ({ 
  branchId, 
  searchQuery = '', 
  ratingFilter = 'all',
  page = 1,
  limit = 5 
}: UseBranchReviewsOptions) => {
  return useQuery({
    queryKey: ['branch-reviews', branchId, searchQuery, ratingFilter, page, limit],
    queryFn: async () => {
      console.log('[useBranchReviews] Fetching reviews for branch:', branchId);
      
      let query = supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          clients (
            first_name,
            last_name
          ),
          staff (
            first_name,
            last_name
          )
        `)
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      // Apply rating filter with proper range handling
      if (ratingFilter === '4-5') {
        // Positive reviews: 4 stars and above
        query = query.gte('rating', 4);
      } else if (ratingFilter === '1-3') {
        // Negative reviews: 3 stars and below
        query = query.lte('rating', 3);
      } else if (ratingFilter !== 'all') {
        // Specific rating (1, 2, 3, 4, or 5)
        query = query.eq('rating', parseInt(ratingFilter));
      }

      // Apply search filter
      if (searchQuery) {
        // Note: For more complex search, we might need to use a database function
        // For now, we'll fetch all and filter in memory for client/staff names
        const { data: allReviews, error } = await query;
        
        if (error) {
          console.error('[useBranchReviews] Error fetching reviews:', error);
          throw error;
        }

        const filtered = allReviews?.filter(review => {
          const clientName = review.clients ? `${review.clients.first_name} ${review.clients.last_name}` : '';
          const staffName = review.staff ? `${review.staff.first_name} ${review.staff.last_name}` : '';
          const comment = review.comment || '';
          
          const searchLower = searchQuery.toLowerCase();
          return (
            clientName.toLowerCase().includes(searchLower) ||
            staffName.toLowerCase().includes(searchLower) ||
            comment.toLowerCase().includes(searchLower)
          );
        }) || [];

        // Apply pagination to filtered results
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filtered.slice(startIndex, endIndex);

        return {
          data: paginatedData.map(review => transformReview(review)),
          totalCount: filtered.length,
          totalPages: Math.ceil(filtered.length / limit)
        };
      }

      // Apply pagination for non-search queries
      const startIndex = (page - 1) * limit;
      query = query.range(startIndex, startIndex + limit - 1);

      const { data, error, count } = await query;
      
      if (error) {
        console.error('[useBranchReviews] Error fetching reviews:', error);
        throw error;
      }

      // Get total count for pagination
      const { count: totalCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', branchId);

      console.log('[useBranchReviews] Successfully fetched reviews:', data?.length || 0);

      return {
        data: data?.map(review => transformReview(review)) || [],
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      };
    },
    enabled: !!branchId,
  });
};

const transformReview = (review: any): BranchReview => {
  const clientFirstName = review.clients?.first_name || 'Unknown';
  const clientLastName = review.clients?.last_name || 'Client';
  const staffFirstName = review.staff?.first_name || 'Unknown';
  const staffLastName = review.staff?.last_name || 'Staff';

  return {
    id: review.id,
    clientName: `${clientLastName}, ${clientFirstName}`,
    clientInitials: `${clientFirstName[0]}${clientLastName[0]}`,
    carerName: `${staffLastName}, ${staffFirstName}`,
    carerInitials: `${staffFirstName[0]}${staffLastName[0]}`,
    rating: review.rating,
    comment: review.comment || '',
    date: new Date(review.created_at).toLocaleDateString('en-GB'),
    created_at: review.created_at
  };
};

export const useRefreshReviews = (branchId: string) => {
  return () => {
    // This will be used by the refresh button to invalidate and refetch
    import('@tanstack/react-query').then(({ useQueryClient }) => {
      const queryClient = useQueryClient();
      queryClient.invalidateQueries({ queryKey: ['branch-reviews', branchId] });
    });
  };
};
