import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AssignUserToOrganizationData {
  systemUserId: string;
  organizationId: string;
  role: string;
}

const FUNCTIONS_URL = 'https://vcrjntfjsmpoupgairep.supabase.co/functions/v1/assign-user-to-organization';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcmpudGZqc21wb3VwZ2FpcmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjcxNDAsImV4cCI6MjA2NTU0MzE0MH0.2AACIZItTsFj2-1LGMy0fRcYKvtXd9FtyrRDnkLGsP0';

const assignUserToOrganization = async (data: AssignUserToOrganizationData) => {
  const response = await fetch(FUNCTIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
    },
    body: JSON.stringify({
      system_user_id: data.systemUserId,
      organization_id: data.organizationId,
      role: data.role,
    }),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.success) {
    throw new Error(result?.error || `Failed to assign user to organization (status ${response.status})`);
  }

  return result;
};

export const useAssignUserToOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignUserToOrganization,
    onSuccess: () => {
      toast.success('User assigned to organisation successfully');
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      queryClient.invalidateQueries({ queryKey: ['organizations-with-users'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', 'system-tenants'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign user: ${error.message}`);
    }
  });
};