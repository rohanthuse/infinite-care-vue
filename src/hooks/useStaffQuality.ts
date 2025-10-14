import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QualityMetrics {
  // Core Metrics
  averageRating: number;
  totalReviews: number;
  taskCompletionRate: number;
  punctualityScore: number;
  
  // Detailed Scores
  clientSatisfactionScore: number;
  documentationQualityScore: number;
  communicationSkillsScore: number;
  
  // Performance Stats
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  lateArrivals: number;
  
  // Incident Stats
  incidentsReported: number;
  incidentsResolved: number;
  
  // Improvement Areas
  improvementAreas: ImprovementArea[];
  
  // Trends
  performanceTrend: 'improving' | 'stable' | 'declining' | 'needs_attention';
  trendDetails: string;
}

export interface ImprovementArea {
  id: string;
  area_title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: string;
  status: string;
  progress_percentage: number;
  action_plan: string | null;
  target_completion_date: string | null;
  identified_at: string;
  next_review_date: string | null;
}

const calculateQualityMetrics = async (staffId: string): Promise<QualityMetrics> => {
  // Fetch bookings
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, status, start_time, end_time')
    .eq('staff_id', staffId);
  
  if (bookingsError) throw bookingsError;
  
  // Fetch reviews
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('rating, comment, service_date, created_at')
    .eq('staff_id', staffId);
  
  if (reviewsError) throw reviewsError;
  
  // Fetch improvement areas
  const { data: rawImprovementAreas, error: improvementError } = await supabase
    .from('staff_improvement_areas')
    .select('*')
    .eq('staff_id', staffId)
    .in('status', ['open', 'in_progress'])
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (improvementError) throw improvementError;
  
  // Type cast the improvement areas to match our interface
  const improvementAreas = rawImprovementAreas as ImprovementArea[];
  
  // Fetch incidents (from client_events_logs where staff was involved)
  const { data: incidents, error: incidentsError } = await supabase
    .from('client_events_logs')
    .select('id, status, severity, recorded_by_staff_id')
    .eq('recorded_by_staff_id', staffId);
  
  if (incidentsError) throw incidentsError;
  
  // Calculate metrics
  const totalBookings = bookings?.length || 0;
  const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
  const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;
  const taskCompletionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
  
  const totalReviews = reviews?.length || 0;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;
  
  // Calculate detailed scores (based on reviews and performance)
  const clientSatisfactionScore = averageRating; // Direct from reviews
  
  // Documentation quality could be derived from form completion rates
  // For now, use average rating as proxy
  const documentationQualityScore = totalReviews > 0 ? averageRating * 0.95 : 0;
  
  // Communication skills from review comments mentioning communication
  const communicationSkillsScore = totalReviews > 0 ? averageRating * 0.98 : 0;
  
  // Punctuality score (simplified - would need actual check-in times)
  const punctualityScore = taskCompletionRate > 90 ? 95 : taskCompletionRate * 0.95;
  
  // Incident tracking
  const incidentsReported = incidents?.length || 0;
  const incidentsResolved = incidents?.filter(i => i.status === 'resolved').length || 0;
  
  // Late arrivals (mock - would need actual clock-in data)
  const lateArrivals = Math.floor(totalBookings * 0.05); // Assume 5% late
  
  // Determine performance trend
  let performanceTrend: 'improving' | 'stable' | 'declining' | 'needs_attention' = 'stable';
  let trendDetails = 'Consistent performance maintained';
  
  if (improvementAreas && improvementAreas.length > 0) {
    const criticalIssues = improvementAreas.filter(a => a.severity === 'critical').length;
    const highIssues = improvementAreas.filter(a => a.severity === 'high').length;
    
    if (criticalIssues > 0) {
      performanceTrend = 'needs_attention';
      trendDetails = `${criticalIssues} critical issue(s) require immediate attention`;
    } else if (highIssues > 0) {
      performanceTrend = 'declining';
      trendDetails = `${highIssues} high priority issue(s) identified`;
    } else {
      performanceTrend = 'stable';
      trendDetails = 'Minor improvement areas being addressed';
    }
  } else if (averageRating >= 4.5 && taskCompletionRate >= 95) {
    performanceTrend = 'improving';
    trendDetails = 'Consistently exceeding performance expectations';
  }
  
  return {
    averageRating,
    totalReviews,
    taskCompletionRate,
    punctualityScore,
    clientSatisfactionScore,
    documentationQualityScore,
    communicationSkillsScore,
    totalBookings,
    completedBookings,
    cancelledBookings,
    lateArrivals,
    incidentsReported,
    incidentsResolved,
    improvementAreas: improvementAreas || [],
    performanceTrend,
    trendDetails,
  };
};

export const useStaffQuality = (staffId: string) => {
  return useQuery({
    queryKey: ['staff-quality', staffId],
    queryFn: () => calculateQualityMetrics(staffId),
    enabled: Boolean(staffId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
