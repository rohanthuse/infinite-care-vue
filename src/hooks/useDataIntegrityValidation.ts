import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IntegrityIssue {
  system_user_id: string;
  email: string;
  missing_in_system_user_organizations: boolean;
  missing_in_organization_members: boolean;
  organization_id: string;
  organization_name: string;
}

const validateIntegrity = async (): Promise<IntegrityIssue[]> => {
  const { data, error } = await supabase.rpc('validate_system_user_organization_integrity');
  
  if (error) {
    console.error('Integrity validation error:', error);
    throw error;
  }
  
  return data || [];
};

interface RepairResult {
  success: boolean;
  repaired_count: number;
  timestamp: string;
}

const repairSync = async (): Promise<RepairResult> => {
  const { data, error } = await supabase.rpc('repair_system_user_organization_sync');
  
  if (error) {
    console.error('Sync repair error:', error);
    throw error;
  }
  
  // Cast through unknown to handle Supabase Json type
  return data as unknown as RepairResult;
};

export const useDataIntegrityValidation = () => {
  return useQuery({
    queryKey: ['data-integrity-validation'],
    queryFn: validateIntegrity,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-check every 5 minutes
  });
};

export const useRepairDataIntegrity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: repairSync,
    onSuccess: (data) => {
      const repairedCount = data?.repaired_count || 0;
      toast.success(`Repaired ${repairedCount} organization assignment${repairedCount !== 1 ? 's' : ''}`);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['data-integrity-validation'] });
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      queryClient.invalidateQueries({ queryKey: ['organizations-with-users'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to repair data integrity: ${error.message}`);
    }
  });
};
