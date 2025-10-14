import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StaffContact {
  id: string;
  staff_id: string;
  branch_id: string | null;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  address: string | null;
  contact_type: 'emergency' | 'medical' | 'personal' | 'professional';
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStaffContactData {
  staff_id: string;
  branch_id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  contact_type: 'emergency' | 'medical' | 'personal' | 'professional';
  is_primary?: boolean;
  notes?: string;
}

export const useStaffContacts = (staffId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query to fetch contacts
  const query = useQuery({
    queryKey: ['staff-contacts', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_contacts')
        .select('*')
        .eq('staff_id', staffId)
        .order('is_primary', { ascending: false })
        .order('contact_type')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as StaffContact[];
    },
    enabled: !!staffId,
  });

  // Mutation to create contact
  const createMutation = useMutation({
    mutationFn: async (data: CreateStaffContactData) => {
      const { data: result, error } = await supabase
        .from('staff_contacts')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-contacts', staffId] });
      toast({
        title: 'Success',
        description: 'Contact added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add contact',
        variant: 'destructive',
      });
    },
  });

  // Mutation to update contact
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<StaffContact> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('staff_contacts')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-contacts', staffId] });
      toast({
        title: 'Success',
        description: 'Contact updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update contact',
        variant: 'destructive',
      });
    },
  });

  // Mutation to delete contact
  const deleteMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('staff_contacts')
        .delete()
        .eq('id', contactId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-contacts', staffId] });
      toast({
        title: 'Success',
        description: 'Contact deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete contact',
        variant: 'destructive',
      });
    },
  });

  return {
    contacts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createContact: createMutation.mutate,
    updateContact: updateMutation.mutate,
    deleteContact: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
