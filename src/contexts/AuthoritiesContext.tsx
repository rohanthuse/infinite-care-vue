import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AuthorityData {
  id: string;
  organization_id?: string;
  branch_id?: string;
  
  // Authority Info
  organization: string;
  telephone: string;
  email?: string;
  address: string;
  
  // Key Contact
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  
  // Invoice Configuration
  invoiceSetting?: string;
  invoiceNameDisplay?: string;
  billingAddress?: string;
  invoiceEmail?: string;
  
  // CM2000
  needsCM2000: boolean;
  
  // Status
  status?: string;
}

interface AuthoritiesContextType {
  authorities: AuthorityData[];
  isLoading: boolean;
  addAuthority: (data: AuthorityData) => Promise<void>;
  updateAuthority: (data: AuthorityData) => Promise<void>;
  removeAuthority: (id: string) => Promise<void>;
  refetch: () => void;
}

const AuthoritiesContext = createContext<AuthoritiesContextType | undefined>(undefined);

// Transform database row to AuthorityData
const transformDbToAuthority = (row: any): AuthorityData => ({
  id: row.id,
  organization_id: row.organization_id,
  branch_id: row.branch_id,
  organization: row.organization_name,
  telephone: row.telephone || '',
  email: row.email || '',
  address: row.address || '',
  contactName: row.contact_name || '',
  contactPhone: row.contact_phone || '',
  contactEmail: row.contact_email || '',
  invoiceSetting: row.invoice_setting || '',
  invoiceNameDisplay: row.invoice_name_display || '',
  billingAddress: row.billing_address || '',
  invoiceEmail: row.invoice_email || '',
  needsCM2000: row.needs_cm2000 || false,
  status: row.status || 'active',
});

// Transform AuthorityData to database row
const transformAuthorityToDb = (data: AuthorityData, organizationId: string) => ({
  organization_id: organizationId,
  organization_name: data.organization,
  telephone: data.telephone || null,
  email: data.email || null,
  address: data.address || null,
  contact_name: data.contactName || null,
  contact_phone: data.contactPhone || null,
  contact_email: data.contactEmail || null,
  invoice_setting: data.invoiceSetting || null,
  invoice_name_display: data.invoiceNameDisplay || null,
  billing_address: data.billingAddress || null,
  invoice_email: data.invoiceEmail || null,
  needs_cm2000: data.needsCM2000 || false,
  status: 'active',
});

export const AuthoritiesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  // Get the current user's organization ID
  const getOrganizationId = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Try organization_members first
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (orgMember?.organization_id) return orgMember.organization_id;

    // Fallback: try admin_branches
    const { data: adminBranch } = await supabase
      .from('admin_branches')
      .select('branch_id')
      .eq('admin_id', user.id)
      .limit(1)
      .single();

    if (adminBranch?.branch_id) {
      const { data: branch } = await supabase
        .from('branches')
        .select('organization_id')
        .eq('id', adminBranch.branch_id)
        .single();
      return branch?.organization_id || null;
    }

    return null;
  };

  // Fetch authorities from database
  const { data: authorities = [], isLoading, refetch } = useQuery({
    queryKey: ['authorities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorities')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching authorities:', error);
        throw error;
      }

      return (data || []).map(transformDbToAuthority);
    },
  });

  // Add authority mutation
  const addMutation = useMutation({
    mutationFn: async (data: AuthorityData) => {
      const organizationId = await getOrganizationId();
      if (!organizationId) {
        throw new Error('Unable to determine organization');
      }

      const dbData = transformAuthorityToDb(data, organizationId);
      const { error } = await supabase
        .from('authorities')
        .insert(dbData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorities'] });
    },
    onError: (error) => {
      console.error('Error adding authority:', error);
      toast.error('Failed to add authority');
    },
  });

  // Update authority mutation
  const updateMutation = useMutation({
    mutationFn: async (data: AuthorityData) => {
      const organizationId = await getOrganizationId();
      if (!organizationId) {
        throw new Error('Unable to determine organization');
      }

      const dbData = transformAuthorityToDb(data, organizationId);
      const { error } = await supabase
        .from('authorities')
        .update(dbData)
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorities'] });
    },
    onError: (error) => {
      console.error('Error updating authority:', error);
      toast.error('Failed to update authority');
    },
  });

  // Remove authority mutation (soft delete with cascade)
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      // Step 1: Delete client rate assignments linked to this authority
      const { error: assignmentError } = await supabase
        .from('client_rate_assignments')
        .delete()
        .eq('authority_id', id);

      if (assignmentError) {
        console.error('Error deleting client rate assignments:', assignmentError);
        throw assignmentError;
      }

      // Step 2: Delete service rates where funding_source matches authority ID
      const { error: ratesError } = await supabase
        .from('service_rates')
        .delete()
        .eq('funding_source', id);

      if (ratesError) {
        console.error('Error deleting service rates:', ratesError);
        throw ratesError;
      }

      // Step 3: Soft delete the authority
      const { error } = await supabase
        .from('authorities')
        .update({ status: 'deleted' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['authorities'] });
      queryClient.invalidateQueries({ queryKey: ['service-rates'] });
      queryClient.invalidateQueries({ queryKey: ['client-rate-assignments'] });
    },
    onError: (error) => {
      console.error('Error removing authority:', error);
      toast.error('Failed to remove authority');
    },
  });

  const addAuthority = async (data: AuthorityData) => {
    await addMutation.mutateAsync(data);
  };

  const updateAuthority = async (data: AuthorityData) => {
    await updateMutation.mutateAsync(data);
  };

  const removeAuthority = async (id: string) => {
    await removeMutation.mutateAsync(id);
  };

  return (
    <AuthoritiesContext.Provider value={{ 
      authorities, 
      isLoading, 
      addAuthority, 
      updateAuthority, 
      removeAuthority,
      refetch 
    }}>
      {children}
    </AuthoritiesContext.Provider>
  );
};

export const useAuthorities = (): AuthoritiesContextType => {
  const context = useContext(AuthoritiesContext);
  if (!context) {
    throw new Error('useAuthorities must be used within an AuthoritiesProvider');
  }
  return context;
};
