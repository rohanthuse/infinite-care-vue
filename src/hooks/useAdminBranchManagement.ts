import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddBranchParams {
  adminId: string;
  branchId: string;
}

interface RemoveBranchParams {
  adminId: string;
  branchId: string;
}

export function useAddBranchToAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ adminId, branchId }: AddBranchParams) => {
      // Check if already exists
      const { data: existing } = await supabase
        .from('admin_branches')
        .select('admin_id')
        .eq('admin_id', adminId)
        .eq('branch_id', branchId)
        .maybeSingle();

      if (existing) {
        throw new Error('Admin already has access to this branch');
      }

      // Add to admin_branches
      const { error } = await supabase
        .from('admin_branches')
        .insert({ admin_id: adminId, branch_id: branchId });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-admins'] });
      toast.success("Branch added successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add branch");
    }
  });
}

export function useRemoveBranchFromAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ adminId, branchId }: RemoveBranchParams) => {
      // Remove from admin_branches
      const { error: branchError } = await supabase
        .from('admin_branches')
        .delete()
        .eq('admin_id', adminId)
        .eq('branch_id', branchId);

      if (branchError) throw branchError;

      // Also remove associated permissions
      const { error: permError } = await supabase
        .from('admin_permissions')
        .delete()
        .eq('admin_id', adminId)
        .eq('branch_id', branchId);

      if (permError) console.warn("Failed to remove permissions:", permError);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-admins'] });
      toast.success("Branch removed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove branch");
    }
  });
}
