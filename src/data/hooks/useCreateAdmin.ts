
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
  try {
    console.log('Starting admin creation process for:', input.email);
    
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

    if (authError) {
      console.error('Auth creation error:', authError);
      throw authError;
    }
    
    if (!authData.user) {
      throw new Error("Failed to create user");
    }

    console.log('User created successfully:', authData.user.id);

    // Assign branch_admin role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert([
        {
          user_id: authData.user.id,
          role: 'branch_admin',
        },
      ]);

    if (roleError) {
      console.error('Role assignment error:', roleError);
      throw new Error(`Failed to assign admin role: ${roleError.message}`);
    }

    console.log('Admin role assigned successfully');

    // Create the admin-branch association
    const { error: branchError } = await supabase
      .from("admin_branches")
      .insert([
        {
          admin_id: authData.user.id,
          branch_id: input.branch_id,
        },
      ]);

    if (branchError) {
      console.error('Branch association error:', branchError);
      throw new Error(`Failed to create branch association: ${branchError.message}`);
    }

    console.log('Branch association created successfully');

    // Ensure profile exists (should be created by trigger, but verify)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", authData.user.id)
      .single();

    if (!existingProfile) {
      console.log('Creating missing profile');
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: authData.user.id,
            email: input.email,
            first_name: input.first_name,
            last_name: input.last_name,
          },
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't throw here as this is not critical for admin functionality
      } else {
        console.log('Profile created successfully');
      }
    }

    console.log('Admin creation process completed successfully');
    return authData;

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
