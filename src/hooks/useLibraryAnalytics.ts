
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LibraryAnalytics {
  totalResources: number;
  totalViews: number;
  totalDownloads: number;
  resourcesByCategory: Array<{ category: string; count: number }>;
  popularResources: Array<{
    id: string;
    title: string;
    views_count: number;
    downloads_count: number;
  }>;
  recentActivity: Array<{
    resource_title: string;
    access_type: string;
    accessed_at: string;
    user_name?: string;
  }>;
}

export const useLibraryAnalytics = (branchId: string) => {
  return useQuery({
    queryKey: ['library-analytics', branchId],
    queryFn: async (): Promise<LibraryAnalytics> => {
      // Get total resources
      const { count: totalResources } = await supabase
        .from('library_resources')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .eq('status', 'active');

      // Get total views and downloads
      const { data: stats } = await supabase
        .from('library_resources')
        .select('views_count, downloads_count')
        .eq('branch_id', branchId)
        .eq('status', 'active');

      const totalViews = stats?.reduce((sum, item) => sum + (item.views_count || 0), 0) || 0;
      const totalDownloads = stats?.reduce((sum, item) => sum + (item.downloads_count || 0), 0) || 0;

      // Get resources by category
      const { data: categoryData } = await supabase
        .from('library_resources')
        .select('category')
        .eq('branch_id', branchId)
        .eq('status', 'active');

      const resourcesByCategory = categoryData?.reduce((acc, item) => {
        const existing = acc.find(c => c.category === item.category);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ category: item.category, count: 1 });
        }
        return acc;
      }, [] as Array<{ category: string; count: number }>) || [];

      // Get popular resources
      const { data: popularResources } = await supabase
        .from('library_resources')
        .select('id, title, views_count, downloads_count')
        .eq('branch_id', branchId)
        .eq('status', 'active')
        .order('views_count', { ascending: false })
        .limit(5);

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('library_resource_access_logs')
        .select(`
          resource_id,
          access_type,
          accessed_at,
          library_resources!inner(title)
        `)
        .eq('branch_id', branchId)
        .order('accessed_at', { ascending: false })
        .limit(10);

      const formattedActivity = recentActivity?.map(activity => ({
        resource_title: (activity.library_resources as any)?.title || 'Unknown Resource',
        access_type: activity.access_type,
        accessed_at: activity.accessed_at,
      })) || [];

      return {
        totalResources: totalResources || 0,
        totalViews,
        totalDownloads,
        resourcesByCategory,
        popularResources: popularResources || [],
        recentActivity: formattedActivity,
      };
    },
    enabled: !!branchId,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};
