import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCarerAuth } from "./useCarerAuth";

export interface CarerProfile {
  id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  experience?: string;
  specialization?: string;
  availability?: string;
  date_of_birth?: string;
  hire_date?: string;
  branch_id: string;
  first_login_completed: boolean;
  profile_completed: boolean;
  national_insurance_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  qualifications?: string[];
  certifications?: string[];
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_sort_code?: string;
  invitation_accepted_at?: string;
}

/**
 * Unified hook for fetching the current authenticated carer's profile
 * This replaces the profile management in useCarerAuth
 */
export const useCarerProfile = () => {
  const { user } = useCarerAuth();

  return useQuery({
    queryKey: ['carer-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No authenticated user');

      console.log('[useCarerProfile] Fetching profile for user:', user.id);
      
      // Use the RPC function to get profile by auth_user_id
      const { data, error } = await supabase
        .rpc('get_staff_profile_by_auth_user_id', {
          auth_user_id_param: user.id
        });

      if (error) {
        console.error('[useCarerProfile] Error fetching profile:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('[useCarerProfile] No profile found for user:', user.id);
        throw new Error('Profile not found');
      }

      const profile = data[0] as CarerProfile;
      console.log('[useCarerProfile] Profile loaded:', profile);
      return profile;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for fetching any carer's profile by their staff ID (for admin use)
 */
export const useCarerProfileById = (carerId?: string) => {
  return useQuery({
    queryKey: ['carer-profile-by-id', carerId],
    queryFn: async () => {
      if (!carerId) throw new Error('No carer ID provided');

      const { data, error } = await supabase
        .from('staff')
        .select(`
          id,
          auth_user_id,
          first_name,
          last_name,
          email,
          phone,
          address,
          status,
          experience,
          specialization,
          availability,
          date_of_birth,
          hire_date,
          branch_id,
          first_login_completed,
          profile_completed,
          national_insurance_number,
          emergency_contact_name,
          emergency_contact_phone,
          qualifications,
          certifications,
          bank_name,
          bank_account_name,
          bank_account_number,
          bank_sort_code,
          invitation_accepted_at
        `)
        .eq('id', carerId)
        .single();

      if (error) {
        console.error('[useCarerProfileById] Error fetching profile:', error);
        throw error;
      }

      return data as CarerProfile;
    },
    enabled: !!carerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};