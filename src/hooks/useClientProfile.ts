
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { toast } from 'sonner';

export interface ClientProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile_number?: string;
  telephone_number?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  preferred_name?: string;
  title?: string;
  middle_name?: string;
  pronouns?: string;
  avatar_initials?: string;
  status?: string;
  branch_id?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  communication_preferences?: string;
  additional_information?: string;
}

export interface ClientPersonalInfo {
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_relationship?: string;
  gp_name?: string;
  gp_practice?: string;
  gp_phone?: string;
  preferred_communication?: string;
  cultural_preferences?: string;
  language_preferences?: string;
  religion?: string;
  marital_status?: string;
}

export interface ClientMedicalInfo {
  allergies?: string[];
  current_medications?: string[];
  medical_conditions?: string[];
  medical_history?: string;
  mobility_status?: string;
  cognitive_status?: string;
  communication_needs?: string;
  sensory_impairments?: string[];
  mental_health_status?: string;
}

// Get client profile data
export const useClientProfile = () => {
  const { clientProfile, isAuthenticated } = useClientAuth();
  
  return useQuery({
    queryKey: ['client-profile', clientProfile?.id],
    queryFn: async (): Promise<ClientProfileData | null> => {
      if (!clientProfile?.id) return null;

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientProfile.id)
        .single();

      if (error) {
        console.error('Error fetching client profile:', error);
        throw error;
      }

      return data;
    },
    enabled: !!clientProfile?.id && isAuthenticated,
    staleTime: 300000, // 5 minutes
  });
};

// Get client personal information
export const useClientPersonalInfo = () => {
  const { clientProfile } = useClientAuth();
  
  return useQuery({
    queryKey: ['client-personal-info', clientProfile?.id],
    queryFn: async (): Promise<ClientPersonalInfo | null> => {
      if (!clientProfile?.id) return null;

      const { data, error } = await supabase
        .from('client_personal_info')
        .select('*')
        .eq('client_id', clientProfile.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching client personal info:', error);
        throw error;
      }

      return data || null;
    },
    enabled: !!clientProfile?.id,
  });
};

// Get client medical information
export const useClientMedicalInfo = () => {
  const { clientProfile } = useClientAuth();
  
  return useQuery({
    queryKey: ['client-medical-info', clientProfile?.id],
    queryFn: async (): Promise<ClientMedicalInfo | null> => {
      if (!clientProfile?.id) return null;

      const { data, error } = await supabase
        .from('client_medical_info')
        .select('*')
        .eq('client_id', clientProfile.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching client medical info:', error);
        throw error;
      }

      return data || null;
    },
    enabled: !!clientProfile?.id,
  });
};

// Update client profile
export const useUpdateClientProfile = () => {
  const queryClient = useQueryClient();
  const { clientProfile } = useClientAuth();

  return useMutation({
    mutationFn: async (updates: Partial<ClientProfileData>) => {
      if (!clientProfile?.id) throw new Error('Client not authenticated');

      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientProfile.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    }
  });
};

// Update client personal information
export const useUpdateClientPersonalInfo = () => {
  const queryClient = useQueryClient();
  const { clientProfile } = useClientAuth();

  return useMutation({
    mutationFn: async (updates: Partial<ClientPersonalInfo>) => {
      if (!clientProfile?.id) throw new Error('Client not authenticated');

      // Check if record exists
      const { data: existing } = await supabase
        .from('client_personal_info')
        .select('id')
        .eq('client_id', clientProfile.id)
        .single();

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('client_personal_info')
          .update(updates)
          .eq('client_id', clientProfile.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('client_personal_info')
          .insert({ ...updates, client_id: clientProfile.id })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-personal-info'] });
      toast.success('Personal information updated successfully');
    },
    onError: (error) => {
      console.error('Personal info update error:', error);
      toast.error('Failed to update personal information');
    }
  });
};

// Update client medical information
export const useUpdateClientMedicalInfo = () => {
  const queryClient = useQueryClient();
  const { clientProfile } = useClientAuth();

  return useMutation({
    mutationFn: async (updates: Partial<ClientMedicalInfo>) => {
      if (!clientProfile?.id) throw new Error('Client not authenticated');

      // Check if record exists
      const { data: existing } = await supabase
        .from('client_medical_info')
        .select('id')
        .eq('client_id', clientProfile.id)
        .single();

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('client_medical_info')
          .update(updates)
          .eq('client_id', clientProfile.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('client_medical_info')
          .insert({ ...updates, client_id: clientProfile.id })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-medical-info'] });
      toast.success('Medical information updated successfully');
    },
    onError: (error) => {
      console.error('Medical info update error:', error);
      toast.error('Failed to update medical information');
    }
  });
};

// Change client password
export const useChangeClientPassword = () => {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      console.error('Password change error:', error);
      toast.error('Failed to change password');
    }
  });
};
