
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CreateAdminInput {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  branch_ids: string[];
}

export async function createAdmin(input: CreateAdminInput) {
  try {
    console.log('Creating branch admin via Edge Function:', input.email);
    
    // Call the Edge Function with service role privileges
    const { data, error } = await supabase.functions.invoke('create-branch-admin', {
      body: {
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        password: input.password,
        branch_ids: input.branch_ids,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      throw new Error(error.message || 'Failed to create branch admin');
    }

    if (!data?.success) {
      console.error('Branch admin creation failed:', data);
      throw new Error(data?.error || 'Failed to create branch admin');
    }

    console.log('Branch admin created successfully:', data);
    return data;

  } catch (error) {
    console.error('Admin creation failed:', error);
    throw error;
  }
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdmin,
    onSuccess: () => {
      // Invalidate multiple queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["branch-admins"] });
    },
  });
}
