import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientKeyContact {
  id: string;
  client_id: string;
  first_name: string;
  surname: string;
  relationship?: string;
  is_next_of_kin: boolean;
  gender?: string;
  email?: string;
  phone?: string;
  contact_type: string;
  address?: string;
  preferred_communication?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientKeyContactData {
  client_id: string;
  first_name: string;
  surname: string;
  relationship?: string;
  is_next_of_kin?: boolean;
  gender?: string;
  email?: string;
  phone?: string;
  contact_type: string;
  address?: string;
  preferred_communication?: string;
  notes?: string;
}

export const useClientKeyContacts = (clientId: string) => {
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading, error } = useQuery({
    queryKey: ['client-key-contacts', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_key_contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClientKeyContact[];
    },
    enabled: !!clientId,
  });

  const createMutation = useMutation({
    mutationFn: async (contactData: CreateClientKeyContactData) => {
      const { data, error } = await supabase
        .from('client_key_contacts')
        .insert(contactData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-key-contacts', clientId] });
      toast.success('Contact added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add contact: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClientKeyContact> & { id: string }) => {
      const { data, error } = await supabase
        .from('client_key_contacts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-key-contacts', clientId] });
      toast.success('Contact updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update contact: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('client_key_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-key-contacts', clientId] });
      toast.success('Contact deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete contact: ${error.message}`);
    },
  });

  return {
    contacts,
    isLoading,
    error,
    createContact: createMutation.mutate,
    updateContact: updateMutation.mutate,
    deleteContact: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
