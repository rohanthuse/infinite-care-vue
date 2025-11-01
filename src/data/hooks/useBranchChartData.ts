
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WeeklyStat {
    day: string;
    visits: number;
    bookings: number;
    revenue: number;
}

export interface ClientDistribution {
    name: 'Active' | 'New Enquiries' | 'Actively Assessing' | 'Closed Enquiries' | 'Former' | 'Unknown';
    value: number;
}

export interface MonthlyRevenue {
    name: string;
    revenue: number;
}

export interface ServiceUsage {
    name: string;
    usage: number;
}

export interface BranchChartData {
    weeklyStats: WeeklyStat[];
    clientDistribution: ClientDistribution[];
    monthlyRevenue: MonthlyRevenue[];
    serviceUsage: ServiceUsage[];
}

const fetchBranchChartData = async (branchId: string): Promise<BranchChartData> => {
    const { data, error } = await supabase.rpc('get_branch_chart_data', {
        p_branch_id: branchId,
    });

    if (error) {
        console.error('Error fetching chart data:', error);
        throw new Error('Could not fetch chart data');
    }
    
    return data as unknown as BranchChartData;
};

export const useBranchChartData = (branchId: string | undefined) => {
    return useQuery<BranchChartData>({
        queryKey: ['branch-chart-data', branchId],
        queryFn: () => fetchBranchChartData(branchId!),
        enabled: !!branchId,
    });
};
