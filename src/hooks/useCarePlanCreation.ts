
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CarePlanCreationData {
  client_id: string;
  status: string;
  care_plan_id?: string;
  provider_name?: string;
  staff_id?: string;
  [key: string]: any;
}

export const useCarePlanCreation = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createCarePlan = async (data: CarePlanCreationData) => {
    setIsCreating(true);
    try {
      console.log('[useCarePlanCreation] Starting care plan finalization:', data);

      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the care plan to check current data
      const { data: carePlan, error: fetchError } = await supabase
        .from('client_care_plans')
        .select('*')
        .eq('id', data.care_plan_id)
        .single();

      if (fetchError) {
        console.error('[useCarePlanCreation] Error fetching care plan:', fetchError);
        throw new Error('Failed to fetch care plan details');
      }

      console.log('[useCarePlanCreation] Current care plan data:', carePlan);

      // Prepare update data with proper provider assignment
      const updateData: any = {
        status: data.status,
        finalized_at: new Date().toISOString(),
        finalized_by: user.id,
        updated_at: new Date().toISOString()
      };

      // Handle provider assignment to satisfy check_provider_assignment constraint
      // The constraint requires: (staff_id IS NOT NULL AND provider_name IS NOT NULL) OR 
      // (staff_id IS NULL AND provider_name IS NOT NULL)
      if (data.staff_id) {
        // Internal staff provider
        updateData.staff_id = data.staff_id;
        updateData.provider_name = data.provider_name || carePlan.provider_name || 'Internal Staff';
      } else {
        // External provider or use existing data
        updateData.staff_id = null;
        updateData.provider_name = data.provider_name || carePlan.provider_name || 'External Provider';
      }

      console.log('[useCarePlanCreation] Update data prepared:', updateData);

      // Update the care plan
      const { data: updatedCarePlan, error } = await supabase
        .from('client_care_plans')
        .update(updateData)
        .eq('id', data.care_plan_id)
        .select()
        .single();

      if (error) {
        console.error('[useCarePlanCreation] Error updating care plan:', error);
        
        // Provide specific error messages based on constraint violations
        if (error.message.includes('check_provider_assignment')) {
          throw new Error('Provider assignment is required. Please ensure a provider is selected.');
        } else if (error.message.includes('check_care_plan_status')) {
          throw new Error('Invalid care plan status. Please try again.');
        } else {
          throw new Error(`Failed to finalize care plan: ${error.message}`);
        }
      }

      console.log('[useCarePlanCreation] Care plan updated successfully:', updatedCarePlan);

      // Create approval record if sending for approval
      if (data.status === 'pending_approval') {
        const { error: approvalError } = await supabase
          .from('client_care_plan_approvals')
          .insert({
            care_plan_id: data.care_plan_id,
            action: 'submitted_for_approval',
            performed_by: user.id,
            performed_at: new Date().toISOString(),
            comments: 'Care plan submitted for staff approval',
            previous_status: carePlan.status,
            new_status: data.status
          });

        if (approvalError) {
          console.error('[useCarePlanCreation] Error creating approval record:', approvalError);
          // Don't fail the entire operation for this
        }

        // Create notification for staff
        try {
          const { data: clientData } = await supabase
            .from('clients')
            .select('first_name, last_name, branch_id')
            .eq('id', data.client_id)
            .single();

          if (clientData) {
            // Get branch admins to notify
            const { data: adminBranches } = await supabase
              .from('admin_branches')
              .select('admin_id')
              .eq('branch_id', clientData.branch_id);

            // Create notifications for each admin
            if (adminBranches && adminBranches.length > 0) {
              const notifications = adminBranches.map(ab => ({
                user_id: ab.admin_id,
                branch_id: clientData.branch_id,
                type: 'care_plan_approval',
                category: 'info',
                priority: 'high',
                title: 'New Care Plan Awaiting Approval',
                message: `Care plan for ${clientData.first_name} ${clientData.last_name} is ready for review`,
                data: {
                  care_plan_id: data.care_plan_id,
                  client_id: data.client_id,
                  client_name: `${clientData.first_name} ${clientData.last_name}`
                }
              }));

              await supabase.from('notifications').insert(notifications);
            }
          }
        } catch (notificationError) {
          console.error('[useCarePlanCreation] Error creating notifications:', notificationError);
          // Don't fail the operation for notification errors
        }
      }

      return { success: true, data: updatedCarePlan };
    } catch (error) {
      console.error('[useCarePlanCreation] Error finalizing care plan:', error);
      
      // Re-throw with user-friendly message
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('An unexpected error occurred while finalizing the care plan');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createCarePlan,
    isCreating
  };
};
