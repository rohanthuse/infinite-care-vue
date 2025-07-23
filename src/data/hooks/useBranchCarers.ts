import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Enhanced Carer interface with all new fields
export interface CarerDB {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  experience?: string;
  specialization?: string;
  availability: string;
  date_of_birth?: string;
  hire_date?: string;
  branch_id: string | null;
  created_at?: string;
  updated_at?: string;
  // New comprehensive fields
  national_insurance_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  dbs_check_date?: string;
  dbs_certificate_number?: string;
  dbs_status?: string;
  qualifications?: string[];
  certifications?: string[];
  training_records?: any;  // Changed from any[] to any to match JSON type
  contract_start_date?: string;
  contract_type?: string;
  salary_amount?: number;
  salary_frequency?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_sort_code?: string;
  bank_name?: string;
  profile_completed?: boolean;
  invitation_sent_at?: string;
  invitation_accepted_at?: string;
  first_login_completed?: boolean;
}

export interface CreateCarerData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  experience?: string;
  specialization: string;
  availability: string;
  date_of_birth?: string;
  branch_id: string;
  // New comprehensive fields
  national_insurance_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  dbs_check_date?: string;
  dbs_certificate_number?: string;
  dbs_status?: string;
  qualifications?: string[];
  certifications?: string[];
  contract_start_date?: string;
  contract_type?: string;
  salary_amount?: number;
  salary_frequency?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_sort_code?: string;
  bank_name?: string;
}

export interface UpdateCarerData extends Partial<CreateCarerData> {
  id: string;
  status?: string;
  profile_completed?: boolean;
  first_login_completed?: boolean;
}

export async function fetchBranchCarers(branchId?: string) {
  if (!branchId) return [];
  
  console.log('[fetchBranchCarers] Fetching carers for branch:', branchId);
  
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("branch_id", branchId)
    .order("first_name", { ascending: true });

  if (error) {
    console.error('[fetchBranchCarers] Error:', error);
    throw error;
  }
  
  console.log('[fetchBranchCarers] Retrieved carers:', data?.length);
  return data || [];
}

export async function fetchCarerProfile(carerId: string) {
  console.log('[fetchCarerProfile] Fetching carer profile for:', carerId);
  
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("id", carerId)
    .single();

  if (error) {
    console.error('[fetchCarerProfile] Error:', error);
    throw error;
  }
  
  console.log('[fetchCarerProfile] Retrieved carer profile:', data);
  return data;
}

export async function createCarerWithInvitation(carerData: CreateCarerData) {
  console.log('[createCarerWithInvitation] Creating carer with invitation:', carerData);
  
  // Convert CreateCarerData to a format suitable for the RPC call
  const carerDataForRPC = {
    first_name: carerData.first_name,
    last_name: carerData.last_name,
    email: carerData.email,
    phone: carerData.phone,
    address: carerData.address,
    experience: carerData.experience,
    specialization: carerData.specialization,
    availability: carerData.availability,
    date_of_birth: carerData.date_of_birth,
    national_insurance_number: carerData.national_insurance_number,
    emergency_contact_name: carerData.emergency_contact_name,
    emergency_contact_phone: carerData.emergency_contact_phone,
    emergency_contact_relationship: carerData.emergency_contact_relationship,
    dbs_check_date: carerData.dbs_check_date,
    dbs_certificate_number: carerData.dbs_certificate_number,
    dbs_status: carerData.dbs_status,
    qualifications: carerData.qualifications,
    certifications: carerData.certifications,
    contract_start_date: carerData.contract_start_date,
    contract_type: carerData.contract_type,
    salary_amount: carerData.salary_amount,
    salary_frequency: carerData.salary_frequency,
    bank_account_name: carerData.bank_account_name,
    bank_account_number: carerData.bank_account_number,
    bank_sort_code: carerData.bank_sort_code,
    bank_name: carerData.bank_name,
  };
  
  // Use the enhanced database function
  const { data, error } = await supabase.rpc('create_carer_with_invitation', {
    p_carer_data: carerDataForRPC,
    p_branch_id: carerData.branch_id
  });

  if (error) {
    console.error('[createCarerWithInvitation] Database error:', error);
    throw error;
  }
  
  // Check if the operation was successful
  if (data !== null && data !== undefined && typeof data === 'object' && data && 'success' in data) {
    const result = data as any;
    if (!result.success) {
      console.error('[createCarerWithInvitation] Operation failed:', result.error);
      throw new Error(result.error || 'Failed to create carer or send invitation');
    }
  }
  
  console.log('[createCarerWithInvitation] Operation completed:', data);
  return data;
}

export async function updateCarer(carerData: UpdateCarerData) {
  console.log('[updateCarer] Updating carer:', carerData);
  
  const { id, ...updateData } = carerData;
  
  // Get current user info for better error reporting
  const { data: { user } } = await supabase.auth.getUser();
  console.log('[updateCarer] Current user:', user?.id);
  
  const { data, error } = await supabase
    .from("staff")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error('[updateCarer] Error details:', error);
    
    // Provide more specific error messages based on error code
    if (error.code === 'PGRST116') {
      throw new Error('Access denied: You do not have permission to update this carer. Please check that you are assigned to the correct branch or contact your administrator.');
    } else if (error.code === '42501') {
      throw new Error('Permission denied: Your user role does not allow updating carer records.');
    } else if (error.message.includes('row-level security')) {
      throw new Error('Security policy violation: Unable to update carer. Please verify your permissions.');
    } else {
      throw new Error(`Failed to update carer: ${error.message}`);
    }
  }
  
  if (!data) {
    throw new Error('No carer was updated. The carer may not exist or you may not have permission to update it.');
  }
  
  console.log('[updateCarer] Updated carer:', data);
  return data;
}

export async function deleteCarer(carerId: string) {
  console.log('[deleteCarer] Deleting carer:', carerId);
  
  const { error } = await supabase
    .from("staff")
    .delete()
    .eq("id", carerId);

  if (error) {
    console.error('[deleteCarer] Error:', error);
    throw error;
  }
  
  console.log('[deleteCarer] Deleted carer successfully');
  return { id: carerId };
}

export function useBranchCarers(branchId?: string) {
  return useQuery({
    queryKey: ["branch-carers", branchId],
    queryFn: () => fetchBranchCarers(branchId),
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching individual carer profile
export function useCarerProfile(carerId?: string) {
  return useQuery({
    queryKey: ["carer-profile", carerId],
    queryFn: () => fetchCarerProfile(carerId!),
    enabled: !!carerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCreateCarerWithInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createCarerWithInvitation,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["branch-carers", variables.branch_id] });
      
      // Show appropriate success message based on email status
      if (data !== null && data !== undefined && typeof data === 'object' && data && 'success' in data) {
        const result = data as any;
        if (result.success) {
          toast.success("Carer created and invitation sent!", {
            description: `${variables.first_name} ${variables.last_name} has been added and will receive an invitation email.`
          });
        } else {
          toast.warning("Carer created but email failed", {
            description: `${variables.first_name} ${variables.last_name} has been added but the invitation email could not be sent. Please contact them manually.`
          });
        }
      }
    },
    onError: (error) => {
      console.error('[useCreateCarerWithInvitation] Error:', error);
      toast.error("Failed to create carer", {
        description: error.message || "An error occurred while creating the carer."
      });
    }
  });
}

export function useUpdateCarer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateCarer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["branch-carers", data.branch_id] });
      queryClient.invalidateQueries({ queryKey: ["staff-profile", data.id] });
      queryClient.invalidateQueries({ queryKey: ["carer-profile", data.id] });
      toast.success("Carer updated successfully");
    },
    onError: (error) => {
      console.error('[useUpdateCarer] Error:', error);
      toast.error("Failed to update carer", {
        description: error.message || "An error occurred while updating the carer."
      });
    }
  });
}

export function useDeleteCarer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteCarer,
    onSuccess: (result, variables) => {
      // Update cache by removing the deleted carer
      const allQueries = queryClient.getQueryCache().getAll();
      
      allQueries.forEach(query => {
        if (query.queryKey[0] === 'branch-carers' && query.queryKey[1]) {
          queryClient.setQueryData(query.queryKey, (old: any[] | undefined) => {
            if (!old) return [];
            return old.filter(carer => carer.id !== variables);
          });
        }
      });
      
      toast.success("Carer deleted successfully");
    },
    onError: (error) => {
      console.error('[useDeleteCarer] Error:', error);
      
      // Provide specific error messages for delete operations
      let errorMessage = "Failed to delete carer";
      if (error.message.includes('permission') || error.message.includes('access')) {
        errorMessage = "Access denied: You do not have permission to delete this carer";
      }
      
      toast.error(errorMessage, {
        description: error.message || "An error occurred while deleting the carer."
      });
    }
  });
}
