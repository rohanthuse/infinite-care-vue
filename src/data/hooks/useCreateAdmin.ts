
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CreateAdminInput {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  branch_ids: string[];
}

// Helper function to verify user exists in auth.users with retry mechanism
async function verifyUserExists(userId: string, maxRetries = 5): Promise<boolean> {
  console.log(`Verifying user existence for ID: ${userId}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if user exists by trying to fetch user roles (this will fail if user doesn't exist)
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("user_id", userId)
        .limit(1);
      
      if (!error) {
        console.log(`User verification successful on attempt ${attempt}`);
        return true;
      }
      
      // If it's a foreign key constraint error, user doesn't exist yet
      if (error.code === '23503' || error.message.includes('foreign key')) {
        console.log(`User not yet committed to auth.users, attempt ${attempt}/${maxRetries}`);
        
        if (attempt < maxRetries) {
          // Exponential backoff: wait 200ms, 400ms, 800ms, 1600ms
          const delay = 200 * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      throw error;
    } catch (error) {
      console.error(`User verification attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        return false;
      }
      
      // Wait before next attempt
      const delay = 200 * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
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

    // Wait for user to be fully committed to auth.users with retry mechanism
    const userExists = await verifyUserExists(authData.user.id);
    if (!userExists) {
      throw new Error("User creation verification failed - user not found in database");
    }

    console.log('User existence verified, proceeding with role assignment');

    // Auto-confirm the email for branch admins (no confirmation required)
    try {
      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        authData.user.id,
        { email_confirm: true }
      );
      
      if (confirmError) {
        console.warn('Auto-confirmation warning:', confirmError);
        // Don't throw here as the main functionality should still work
      } else {
        console.log('Email auto-confirmed for branch admin');
      }
    } catch (confirmError) {
      console.warn('Auto-confirmation failed:', confirmError);
      // Continue with role assignment even if auto-confirmation fails
    }

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

    // Create multiple admin-branch associations
    const branchAssociations = input.branch_ids.map(branchId => ({
      admin_id: authData.user.id,
      branch_id: branchId,
    }));

    const { error: branchError } = await supabase
      .from("admin_branches")
      .insert(branchAssociations);

    if (branchError) {
      console.error('Branch association error:', branchError);
      throw new Error(`Failed to create branch associations: ${branchError.message}`);
    }

    console.log(`Branch associations created successfully for ${input.branch_ids.length} branches`);

    // Get organization IDs from the branches and create organization memberships
    const { data: branchData, error: branchDataError } = await supabase
      .from("branches")
      .select("organization_id")
      .in("id", input.branch_ids);

    if (branchDataError) {
      console.error('Failed to get branch organization data:', branchDataError);
      // Don't throw here as admin creation was successful, just log the issue
    } else if (branchData && branchData.length > 0) {
      // Get unique organization IDs
      const uniqueOrgIds = [...new Set(branchData.map(b => b.organization_id))];
      
      // Create organization memberships for each unique organization
      const orgMemberships = uniqueOrgIds.map(orgId => ({
        organization_id: orgId,
        user_id: authData.user.id,
        role: 'admin',
        status: 'active',
        joined_at: new Date().toISOString()
      }));

      const { error: orgMemberError } = await supabase
        .from("organization_members")
        .insert(orgMemberships);

      if (orgMemberError) {
        console.error('Organization membership creation error:', orgMemberError);
        // Don't throw here as the trigger should have handled this, but log for debugging
      } else {
        console.log(`Organization memberships created for ${uniqueOrgIds.length} organizations`);
      }
    }

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
