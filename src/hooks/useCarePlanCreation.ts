import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { syncCarePlanStaffAssignments, sendStaffAssignmentNotifications } from "./useCarePlanStaffAssignments";
import { syncCarePlanToClientProfile } from "@/utils/syncCarePlanToClientProfile";

interface CarePlanCreationData {
  client_id: string;
  status: string;
  care_plan_id?: string;
  provider_name?: string;
  staff_id?: string;
  staff_ids?: string[];
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

      // Clear client approval fields when re-sending for approval
      // This ensures the client can approve the updated care plan
      if (data.status === 'pending_client_approval') {
        updateData.client_acknowledged_at = null;
        updateData.client_signature_data = null;
        updateData.client_comments = null;
        updateData.acknowledgment_method = null;
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

      // Handle NEWS2 monitoring enrollment/deactivation
      if (updatedCarePlan.news2_monitoring_enabled !== undefined) {
        try {
          console.log('[useCarePlanCreation] Processing NEWS2 monitoring:', {
            enabled: updatedCarePlan.news2_monitoring_enabled,
            frequency: updatedCarePlan.news2_monitoring_frequency,
            clientId: data.client_id
          });

          // Get client branch_id for NEWS2 patient creation
          const { data: clientData } = await supabase
            .from('clients')
            .select('branch_id')
            .eq('id', data.client_id)
            .single();

          if (!clientData) {
            console.error('[useCarePlanCreation] Could not find client branch_id for NEWS2 setup');
            throw new Error('Client not found for NEWS2 setup');
          }

          if (updatedCarePlan.news2_monitoring_enabled) {
            // Enable NEWS2 monitoring - create or update patient record
            const { data: existingPatient } = await supabase
              .from('news2_patients')
              .select('id')
              .eq('client_id', data.client_id)
              .eq('is_active', true)
              .maybeSingle();

            if (!existingPatient) {
              // Create new NEWS2 patient record
              const { error: news2Error } = await supabase
                .from('news2_patients')
                .insert({
                  client_id: data.client_id,
                  branch_id: clientData.branch_id,
                  assigned_carer_id: updatedCarePlan.staff_id,
                  monitoring_frequency: updatedCarePlan.news2_monitoring_frequency || 'daily',
                  notes: updatedCarePlan.news2_monitoring_notes,
                  risk_category: 'low',
                  is_active: true
                });

              if (news2Error) {
                console.error('[useCarePlanCreation] Error creating NEWS2 patient:', news2Error);
              } else {
                console.log('[useCarePlanCreation] NEWS2 patient record created successfully');
              }
            } else {
              // Update existing NEWS2 patient record
              const { error: news2UpdateError } = await supabase
                .from('news2_patients')
                .update({
                  assigned_carer_id: updatedCarePlan.staff_id,
                  monitoring_frequency: updatedCarePlan.news2_monitoring_frequency || 'daily',
                  notes: updatedCarePlan.news2_monitoring_notes,
                  is_active: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingPatient.id);

              if (news2UpdateError) {
                console.error('[useCarePlanCreation] Error updating NEWS2 patient:', news2UpdateError);
              } else {
                console.log('[useCarePlanCreation] NEWS2 patient record updated successfully');
              }
            }
          } else {
            // Disable NEWS2 monitoring - deactivate patient record
            const { error: deactivateError } = await supabase
              .from('news2_patients')
              .update({
                is_active: false,
                updated_at: new Date().toISOString()
              })
              .eq('client_id', data.client_id)
              .eq('is_active', true);

            if (deactivateError) {
              console.error('[useCarePlanCreation] Error deactivating NEWS2 patient:', deactivateError);
            } else {
              console.log('[useCarePlanCreation] NEWS2 patient record deactivated successfully');
            }
          }
        } catch (news2Error) {
          console.error('[useCarePlanCreation] Error processing NEWS2 monitoring:', news2Error);
          // Don't fail the entire operation for NEWS2 errors
        }
      }

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

      // Handle multi-staff assignments
      const staffIds = data.staff_ids || (data.staff_id ? [data.staff_id] : []);
      if (staffIds.length > 0 && user) {
        try {
          console.log('[useCarePlanCreation] Syncing staff assignments:', staffIds);
          
          // Sync staff assignments to junction table
          const { added, removed } = await syncCarePlanStaffAssignments(
            data.care_plan_id,
            staffIds,
            user.id
          );

          // Send notifications to all assigned staff
          await sendStaffAssignmentNotifications(
            data.care_plan_id,
            data.client_id,
            added,
            removed,
            staffIds.filter(id => !added.includes(id)), // unchanged staff
            updatedCarePlan.title || 'Care Plan',
            updatedCarePlan.display_id || '',
            false // Don't notify unchanged on creation
          );

          console.log('[useCarePlanCreation] Staff assignments synced successfully');
        } catch (staffError) {
          console.error('[useCarePlanCreation] Error syncing staff assignments:', staffError);
          // Don't fail the operation for staff assignment errors
        }
      }

      // Sync care plan data to client profile
      try {
        console.log('[useCarePlanCreation] Syncing care plan data to client profile');
        const syncResult = await syncCarePlanToClientProfile(data.care_plan_id, data.client_id);
        if (!syncResult.success) {
          console.error('[useCarePlanCreation] Error syncing to client profile:', syncResult.error);
          // Don't fail the operation for sync errors
        } else {
          console.log('[useCarePlanCreation] Successfully synced care plan data to client profile');
        }
      } catch (syncError) {
        console.error('[useCarePlanCreation] Error during client profile sync:', syncError);
        // Don't fail the operation for sync errors
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