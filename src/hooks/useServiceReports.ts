import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type ServiceReport = Database['public']['Tables']['client_service_reports']['Row'];
type ServiceReportInsert = Database['public']['Tables']['client_service_reports']['Insert'];
type ServiceReportUpdate = Database['public']['Tables']['client_service_reports']['Update'];

// Hook to fetch service reports for a client
export const useClientServiceReports = (clientId?: string) => {
  return useQuery({
    queryKey: ['client-service-reports', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('Client ID is required');
      
      const { data, error } = await supabase
        .from('client_service_reports')
        .select(`
          *,
          clients (
            first_name,
            last_name,
            email
          ),
          staff (
            first_name,
            last_name,
            email
          )
        `)
        .eq('client_id', clientId)
        .order('service_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: Boolean(clientId),
  });
};

// Hook to fetch service reports for carer (their own reports)
export const useCarerServiceReports = (staffId?: string) => {
  return useQuery({
    queryKey: ['carer-service-reports', staffId],
    queryFn: async () => {
      // Return empty array instead of throwing when staffId is missing
      // This prevents errors during initialization when context is still loading
      if (!staffId) {
        console.log('[useCarerServiceReports] No staff ID provided, returning empty array');
        return [];
      }
      
      console.log('[useCarerServiceReports] Fetching reports for staffId:', staffId);
      
      const { data, error } = await supabase
        .from('client_service_reports')
        .select(`
          *,
          clients (
            first_name,
            last_name,
            email
          ),
          staff (
            first_name,
            last_name,
            email
          )
        `)
        .eq('staff_id', staffId)
        .order('service_date', { ascending: false });

      if (error) {
        console.error('[useCarerServiceReports] Query error:', error);
        throw error;
      }
      
      console.log('[useCarerServiceReports] Fetched', data?.length || 0, 'reports for staffId:', staffId);
      return data || [];
    },
    enabled: Boolean(staffId),
    retry: 2,
    staleTime: 30000, // 30 seconds
  });
};

// Hook to fetch pending service reports for admin review
export const usePendingServiceReports = (branchId?: string) => {
  return useQuery({
    queryKey: ['pending-service-reports', branchId],
    queryFn: async () => {
      if (!branchId) throw new Error('Branch ID is required');
      
      const { data, error } = await supabase
        .from('client_service_reports')
        .select(`
          *,
          clients (
            first_name,
            last_name,
            email
          ),
          staff (
            first_name,
            last_name,
            email
          )
        `)
        .eq('branch_id', branchId)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: Boolean(branchId),
  });
};

// Hook to create a new service report
export const useCreateServiceReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (report: ServiceReportInsert) => {
      const { data, error } = await supabase
        .from('client_service_reports')
        .insert(report)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate ALL relevant queries for data consistency
      queryClient.invalidateQueries({ queryKey: ['client-service-reports'] });
      queryClient.invalidateQueries({ queryKey: ['carer-service-reports'] });
      queryClient.invalidateQueries({ queryKey: ['pending-service-reports'] });
      queryClient.invalidateQueries({ queryKey: ['carer-completed-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['service-report-detail'] });
      queryClient.invalidateQueries({ queryKey: ['carer-service-reports-summary'] });
      
      toast.success('Service report saved successfully');
    },
    onError: (error) => {
      toast.error(`Failed to submit service report: ${error.message}`);
    },
  });
};

// Hook to update a service report
export const useUpdateServiceReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ServiceReportUpdate }) => {
      const { data, error } = await supabase
        .from('client_service_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate ALL service report queries
      queryClient.invalidateQueries({ queryKey: ['client-service-reports'] });
      queryClient.invalidateQueries({ queryKey: ['carer-service-reports'] });
      queryClient.invalidateQueries({ queryKey: ['pending-service-reports'] });
      queryClient.invalidateQueries({ queryKey: ['service-report-detail'] });
      queryClient.invalidateQueries({ queryKey: ['carer-service-reports-summary'] });
      queryClient.invalidateQueries({ queryKey: ['branch-service-reports'] });
      queryClient.invalidateQueries({ queryKey: ['approved-service-reports'] });
      
      // Also invalidate specific report detail if ID is available
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['service-report-detail', data.id] });
      }
      
      // Invalidate visit-related data if visit_record_id exists
      if (data?.visit_record_id) {
        queryClient.invalidateQueries({ queryKey: ['visit-tasks', data.visit_record_id] });
        queryClient.invalidateQueries({ queryKey: ['visit-medications', data.visit_record_id] });
        queryClient.invalidateQueries({ queryKey: ['visit-vitals', data.visit_record_id] });
        queryClient.invalidateQueries({ queryKey: ['visit-events', data.visit_record_id] });
        queryClient.invalidateQueries({ queryKey: ['visit-record', data.visit_record_id] });
      }
      
      toast.success('Service report updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update service report: ${error.message}`);
    },
  });
};

// Hook to approve/reject service reports (admin only)
export const useReviewServiceReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      reviewNotes, 
      visibleToClient 
    }: { 
      id: string; 
      status: 'approved' | 'rejected' | 'requires_revision';
      reviewNotes?: string;
      visibleToClient?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('client_service_reports')
        .update({
          status,
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString(),
          visible_to_client: status === 'approved' ? (visibleToClient ?? true) : false,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, { status }) => {
      // Invalidate ALL relevant queries for data consistency
      queryClient.invalidateQueries({ queryKey: ['client-service-reports'] });
      queryClient.invalidateQueries({ queryKey: ['carer-service-reports'] });
      queryClient.invalidateQueries({ queryKey: ['pending-service-reports'] });
      queryClient.invalidateQueries({ queryKey: ['service-report-detail'] });
      queryClient.invalidateQueries({ queryKey: ['carer-service-reports-summary'] });
      
      const message = status === 'approved' ? 'Service report approved' :
                     status === 'rejected' ? 'Service report rejected' :
                     'Service report requires revision';
      
      toast.success(message);
    },
    onError: (error) => {
      toast.error(`Failed to review service report: ${error.message}`);
    },
  });
};

// Hook to get approved service reports for client view
export const useApprovedServiceReports = (clientId?: string) => {
  return useQuery({
    queryKey: ['approved-service-reports', clientId],
    queryFn: async () => {
      if (!clientId) {
        console.warn('[useApprovedServiceReports] No client ID provided');
        return [];
      }
      
      console.log('[useApprovedServiceReports] Fetching reports for client:', clientId);
      
      try {
        const { data, error } = await supabase
          .from('client_service_reports')
        .select(`
          *,
          staff (
            first_name,
            last_name
          )
        `)
        .eq('client_id', clientId)
          .eq('status', 'approved')
          .eq('visible_to_client', true)
          .order('service_date', { ascending: false });

        if (error) {
          console.error('[useApprovedServiceReports] Query error:', error);
          throw error;
        }
        
        console.log('[useApprovedServiceReports] Successfully fetched', data?.length || 0, 'reports');
        return data || [];
      } catch (error) {
        console.error('[useApprovedServiceReports] Fetch error:', error);
        throw error;
      }
    },
    enabled: Boolean(clientId),
    retry: 1,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
};

// Hook to fetch ALL service reports for a branch with optional filters (admin view)
export const useBranchServiceReports = (
  branchId?: string, 
  filters?: {
    status?: string[];
    startDate?: string;
    endDate?: string;
    clientId?: string;
    staffId?: string;
  }
) => {
  return useQuery({
    queryKey: ['branch-service-reports', branchId, filters],
    queryFn: async () => {
      if (!branchId) throw new Error('Branch ID is required');
      
      let query = supabase
        .from('client_service_reports')
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name,
            email
          ),
          staff (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('branch_id', branchId);

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      
      if (filters?.startDate) {
        query = query.gte('service_date', filters.startDate);
      }
      
      if (filters?.endDate) {
        query = query.lte('service_date', filters.endDate);
      }
      
      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }
      
      if (filters?.staffId) {
        query = query.eq('staff_id', filters.staffId);
      }
      
      query = query.order('service_date', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(branchId),
    staleTime: 30000, // 30 seconds
  });
};