import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CarePlanCreationData {
  client_id: string;
  status: string;
  care_plan_id?: string;
  provider_name?: string;
  staff_id?: string;
  clear_change_request?: boolean;
  [key: string]: any;
}

export const useCarePlanCreation = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createCarePlan = async (data: CarePlanCreationData) => {
    setIsCreating(true);
    try {
      console.log('[useCarePlanCreation] Starting care plan finalization:', data);

      // Validate required data
      if (!data.care_plan_id) {
        throw new Error('Care plan ID is required');
      }
      if (!data.status) {
        throw new Error('Care plan status is required');
      }

      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated. Please log in and try again.');
      }

      // Get the care plan to check current data
      const { data: carePlan, error: fetchError } = await supabase
        .from('client_care_plans')
        .select('*')
        .eq('id', data.care_plan_id)
        .single();

      if (fetchError) {
        console.error('[useCarePlanCreation] Error fetching care plan:', fetchError);
        throw new Error('Failed to fetch care plan details. Please refresh and try again.');
      }

      if (!carePlan) {
        throw new Error('Care plan not found. Please refresh the page and try again.');
      }

      console.log('[useCarePlanCreation] Current care plan data:', carePlan);

      // Validate provider assignment data before proceeding
      const hasStaffId = data.staff_id && data.staff_id.trim() !== '';
      const hasProviderName = (data.provider_name && data.provider_name.trim() !== '') || 
                             (carePlan.provider_name && carePlan.provider_name.trim() !== '');

      if (!hasStaffId && !hasProviderName) {
        throw new Error('Provider assignment is required. Please select a staff member or specify a provider name.');
      }

       // Prepare update data with proper provider assignment
      const updateData: any = {
        status: data.status,
        finalized_at: new Date().toISOString(),
        finalized_by: user.id,
        updated_at: new Date().toISOString()
      };

      // Clear change request fields if requested (when editing change requests)
      if (data.clear_change_request) {
        updateData.changes_requested_at = null;
        updateData.changes_requested_by = null;
        updateData.change_request_comments = null;
      }

      // Handle provider assignment to satisfy check_provider_assignment constraint
      // The constraint requires: (staff_id IS NOT NULL AND provider_name IS NOT NULL) OR 
      // (staff_id IS NULL AND provider_name IS NOT NULL)
      if (hasStaffId) {
        // Internal staff provider - both staff_id and provider_name must be set
        updateData.staff_id = data.staff_id;
        updateData.provider_name = data.provider_name || carePlan.provider_name || 'Internal Staff';
        
        // Validate that we have both required fields
        if (!updateData.provider_name || updateData.provider_name.trim() === '') {
          throw new Error('Provider name is required when assigning to staff member.');
        }
      } else {
        // External provider - staff_id must be NULL and provider_name must be set
        updateData.staff_id = null;
        updateData.provider_name = data.provider_name || carePlan.provider_name;
        
        // Validate that we have provider name
        if (!updateData.provider_name || updateData.provider_name.trim() === '') {
          throw new Error('Provider name is required for external providers.');
        }
      }

      console.log('[useCarePlanCreation] Update data prepared:', updateData);
      
      // Final validation before database update
      if (!updateData.provider_name || updateData.provider_name.trim() === '') {
        throw new Error('Provider assignment validation failed. Please ensure all required fields are filled.');
      }

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

      // Create approval record and notifications if sending for client approval
      if (data.status === 'pending_client_approval') {
        const { error: approvalError } = await supabase
          .from('client_care_plan_approvals')
          .insert({
            care_plan_id: data.care_plan_id,
            action: 'submitted_for_approval',
            performed_by: user.id,
            performed_at: new Date().toISOString(),
            comments: 'Care plan submitted for client approval',
            previous_status: carePlan.status,
            new_status: data.status
          });

        if (approvalError) {
          console.error('[useCarePlanCreation] Error creating approval record:', approvalError);
          // Don't fail the entire operation for this
        }
      }

      // Create notifications for client (for all relevant statuses)
      try {
        const { data: clientData } = await supabase
          .from('clients')
          .select('first_name, last_name, branch_id, auth_user_id')
          .eq('id', data.client_id)
          .single();

        console.log('[useCarePlanCreation] Client data for notification:', clientData);

        if (clientData && clientData.auth_user_id) {
          let notification = null;
          
          if (data.status === 'pending_client_approval') {
            notification = {
              user_id: clientData.auth_user_id,
              branch_id: clientData.branch_id,
              type: 'care_plan',
              category: 'info',
              priority: 'high',
              title: 'Care Plan Ready for Your Review',
              message: `Your care plan is ready for review and approval`,
              data: {
                care_plan_id: data.care_plan_id,
                action: 'approval_required',
                care_plan_title: updatedCarePlan.title || 'Care Plan',
                care_plan_display_id: updatedCarePlan.display_id,
                client_name: `${clientData.first_name} ${clientData.last_name}`
              }
            };
          } else if (data.status === 'active' || data.status === 'approved') {
            notification = {
              user_id: clientData.auth_user_id,
              branch_id: clientData.branch_id,
              type: 'care_plan',
              category: 'success',
              priority: 'medium',
              title: 'New Care Plan Available',
              message: `Your care plan ${updatedCarePlan.display_id || 'CP-XXX'} is now active and available`,
              data: {
                care_plan_id: data.care_plan_id,
                action: 'activation',
                care_plan_title: updatedCarePlan.title || 'Care Plan',
                care_plan_display_id: updatedCarePlan.display_id,
                client_name: `${clientData.first_name} ${clientData.last_name}`
              }
            };
          }

          if (notification) {
            console.log('[useCarePlanCreation] Creating client notification:', notification);
            await supabase.from('notifications').insert([notification]);
          }
        } else {
          console.warn('[useCarePlanCreation] Client has no auth_user_id, cannot send notification');
        }
      } catch (notificationError) {
        console.error('[useCarePlanCreation] Error creating client notifications:', notificationError);
        // Don't fail the operation for notification errors
      }

      // Create notification for assigned staff (if any)
      if (updatedCarePlan.staff_id) {
        try {
          const { data: clientData } = await supabase
            .from('clients')
            .select('first_name, last_name, branch_id')
            .eq('id', data.client_id)
            .single();

          // Get staff auth_user_id for notification
          const { data: staffData } = await supabase
            .from('staff')
            .select('auth_user_id')
            .eq('id', updatedCarePlan.staff_id)
            .single();

          if (clientData && staffData?.auth_user_id) {
            const isActive = data.status === 'active';
            const notification = {
              user_id: staffData.auth_user_id,
              branch_id: clientData.branch_id,
              type: 'care_plan',
              category: 'info',
              priority: 'medium',
              title: isActive ? 'New Care Plan Assigned' : 'Care Plan Assignment Updated',
              message: `You have been assigned to ${updatedCarePlan.display_id || 'care plan'} for ${clientData.first_name} ${clientData.last_name}`,
              data: {
                care_plan_id: data.care_plan_id,
                action: isActive ? 'activation' : 'status_change',
                care_plan_title: updatedCarePlan.title || 'Care Plan',
                care_plan_display_id: updatedCarePlan.display_id,
                client_name: `${clientData.first_name} ${clientData.last_name}`
              }
            };

            await supabase.from('notifications').insert([notification]);
            console.log('[useCarePlanCreation] Staff notification created successfully');
          } else {
            console.warn('[useCarePlanCreation] Staff has no auth_user_id, cannot send notification');
          }
        } catch (notificationError) {
          console.error('[useCarePlanCreation] Error creating staff notification:', notificationError);
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