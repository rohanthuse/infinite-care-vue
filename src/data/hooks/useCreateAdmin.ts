
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CreateAdminInput {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  branch_id: string;
}

export async function createAdmin(input: CreateAdminInput) {
  // First create the user account
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        first_name: input.first_name,
        last_name: input.last_name,
      },
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("Failed to create user");

  // Create the admin-branch association
  const { error: branchError } = await supabase
    .from("admin_branches")
    .insert([
      {
        admin_id: authData.user.id,
        branch_id: input.branch_id,
      },
    ]);

  if (branchError) throw branchError;

  return authData;
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}
