
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Enhanced Carer interface with all staff table fields
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
}

export interface UpdateCarerData extends Partial<CreateCarerData> {
  id: string;
  status?: string;
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

export async function createCarer(carerData: CreateCarerData) {
  console.log('[createCarer] Creating carer:', carerData);
  
  const { data, error } = await supabase
    .from("staff")
    .insert({
      first_name: carerData.first_name,
      last_name: carerData.last_name,
      email: carerData.email,
      phone: carerData.phone,
      address: carerData.address,
      experience: carerData.experience,
      specialization: carerData.specialization,
      availability: carerData.availability,
      date_of_birth: carerData.date_of_birth,
      branch_id: carerData.branch_id,
      status: 'Active'
    })
    .select()
    .single();

  if (error) {
    console.error('[createCarer] Error:', error);
    throw error;
  }
  
  console.log('[createCarer] Created carer:', data);
  return data;
}

export async function updateCarer(carerData: UpdateCarerData) {
  console.log('[updateCarer] Updating carer:', carerData);
  
  const { id, ...updateData } = carerData;
  
  const { data, error } = await supabase
    .from("staff")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error('[updateCarer] Error:', error);
    throw error;
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

export function useCreateCarer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createCarer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["branch-carers", data.branch_id] });
      toast.success("Carer created successfully", {
        description: `${data.first_name} ${data.last_name} has been added to the system.`
      });
    },
    onError: (error) => {
      console.error('[useCreateCarer] Error:', error);
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
          queryClient.setQueryData(query.queryKey, (old: CarerDB[] | undefined) => {
            if (!old) return [];
            return old.filter(carer => carer.id !== variables);
          });
        }
      });
      
      toast.success("Carer deleted successfully");
    },
    onError: (error) => {
      console.error('[useDeleteCarer] Error:', error);
      toast.error("Failed to delete carer", {
        description: error.message || "An error occurred while deleting the carer."
      });
    }
  });
}

// Hook for carers to get their own profile
export function useCarerProfile(carerId?: string) {
  return useQuery({
    queryKey: ["staff-profile", carerId],
    queryFn: async () => {
      if (!carerId) throw new Error('No carer ID provided');
      
      const { data, error } = await supabase
        .rpc('get_staff_profile', { staff_user_id: carerId });
      
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!carerId,
  });
}
