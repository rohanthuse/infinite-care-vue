import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, differenceInDays } from 'date-fns';

interface CarePlanNeedingReview {
  id: string;
  display_id: string;
  title: string | null;
  review_date: string;
  status: string;
  care_plan_type: string | null;
  client: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  daysUntilReview: number;
  isOverdue: boolean;
}

export const useCarePlansNeedingReview = (staffId: string) => {
  return useQuery({
    queryKey: ['care-plans-needing-review', staffId],
    queryFn: async (): Promise<CarePlanNeedingReview[]> => {
      if (!staffId) return [];

      const now = new Date();
      const sevenDaysFromNow = addDays(now, 7);

      // Query via junction table for multi-staff assignments
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('care_plan_staff_assignments')
        .select(`
          care_plan_id,
          client_care_plans:care_plan_id (
            id,
            display_id,
            title,
            review_date,
            status,
            care_plan_type,
            client:client_id (
              id,
              first_name,
              last_name
            )
          )
        `)
        .eq('staff_id', staffId);

      if (assignmentError) {
        console.error('[useCarePlansNeedingReview] Error fetching assignments:', assignmentError);
        throw assignmentError;
      }

      // Also check legacy staff_id field for backwards compatibility
      const { data: legacyData, error: legacyError } = await supabase
        .from('client_care_plans')
        .select(`
          id,
          display_id,
          title,
          review_date,
          status,
          care_plan_type,
          client:client_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('staff_id', staffId)
        .eq('status', 'active')
        .not('review_date', 'is', null);

      if (legacyError) {
        console.error('[useCarePlansNeedingReview] Error fetching legacy plans:', legacyError);
      }

      // Combine and dedupe by care plan id
      const carePlanMap = new Map<string, any>();

      // Add from junction table
      assignmentData?.forEach(assignment => {
        const plan = assignment.client_care_plans as any;
        if (plan && plan.status === 'active' && plan.review_date) {
          carePlanMap.set(plan.id, plan);
        }
      });

      // Add from legacy field
      legacyData?.forEach(plan => {
        if (!carePlanMap.has(plan.id)) {
          carePlanMap.set(plan.id, plan);
        }
      });

      // Filter for upcoming/overdue reviews and calculate days
      const carePlansNeedingReview: CarePlanNeedingReview[] = [];

      carePlanMap.forEach(plan => {
        const reviewDate = new Date(plan.review_date);
        if (reviewDate <= sevenDaysFromNow) {
          const daysUntilReview = differenceInDays(reviewDate, now);
          carePlansNeedingReview.push({
            id: plan.id,
            display_id: plan.display_id,
            title: plan.title,
            review_date: plan.review_date,
            status: plan.status,
            care_plan_type: plan.care_plan_type,
            client: plan.client,
            daysUntilReview,
            isOverdue: daysUntilReview < 0
          });
        }
      });

      // Sort by urgency (overdue first, then by days until review)
      carePlansNeedingReview.sort((a, b) => a.daysUntilReview - b.daysUntilReview);

      return carePlansNeedingReview;
    },
    enabled: !!staffId,
    refetchInterval: 60000, // Refetch every minute
  });
};

// Count of care plans needing review for badges
export const useCarePlansNeedingReviewCount = (staffId: string) => {
  const { data, isLoading } = useCarePlansNeedingReview(staffId);
  
  return {
    total: data?.length || 0,
    overdue: data?.filter(p => p.isOverdue).length || 0,
    upcoming: data?.filter(p => !p.isOverdue).length || 0,
    isLoading
  };
};
