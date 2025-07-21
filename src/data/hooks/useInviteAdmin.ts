
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InviteAdminInput {
  email: string;
  firstName: string;
  lastName: string;
  branchId: string;
  permissions: {
    system: boolean;
    finance: boolean;
    under_review_care_plan: boolean;
    confirmed_care_plan: boolean;
    reviews: boolean;
    third_party: boolean;
    report_accounting: boolean;
    report_total_working_hours: boolean;
    report_staff: boolean;
    report_client: boolean;
    report_service: boolean;
    accounting_extra_time: boolean;
    accounting_expense: boolean;
    accounting_travel: boolean;
    accounting_invoices: boolean;
    accounting_gross_payslip: boolean;
    accounting_travel_management: boolean;
    accounting_client_rate: boolean;
    accounting_authority_rate: boolean;
    accounting_staff_rate: boolean;
    accounting_rate_management: boolean;
    accounting_staff_bank_detail: boolean;
  };
}

export interface InviteAdminResponse {
  message: string;
  error?: string;
}

export async function inviteAdmin(input: InviteAdminInput): Promise<InviteAdminResponse> {
  try {
    console.log('Starting admin invitation process for:', input.email);
    
    const { data, error } = await supabase.functions.invoke('invite-admin', {
      body: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        branchId: input.branchId,
        permissions: input.permissions
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to invite admin');
    }

    if (data?.error) {
      console.error('Invitation error:', data.error);
      throw new Error(data.error);
    }

    console.log('Admin invitation successful:', data);
    return data;
  } catch (error: any) {
    console.error('Admin invitation failed:', error);
    throw error;
  }
}

export function useInviteAdmin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: inviteAdmin,
    onSuccess: (data) => {
      // Invalidate queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["branch-admins"] });
      
      toast.success("Admin invitation sent successfully!", {
        description: data.message || "The new admin can now log in immediately."
      });
    },
    onError: (error: any) => {
      console.error('Invite admin mutation error:', error);
      
      let errorMessage = "Failed to invite admin";
      let description = "An error occurred while sending the invitation.";
      
      if (error.message.includes('already an administrator')) {
        errorMessage = "User already exists";
        description = "This user is already an administrator for this branch.";
      } else if (error.message.includes('Invalid email')) {
        errorMessage = "Invalid email address";
        description = "Please enter a valid email address.";
      } else if (error.message) {
        description = error.message;
      }
      
      toast.error(errorMessage, { description });
    }
  });
}
