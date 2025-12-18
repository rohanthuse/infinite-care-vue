import { supabase } from '@/integrations/supabase/client';

export interface StaffAssignment {
  id: string;
  care_plan_id: string;
  staff_id: string;
  is_primary: boolean;
  assigned_at: string;
  assigned_by: string | null;
  staff?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    specialization?: string;
  };
}

// Fetch existing staff assignments for a care plan
export const fetchCarePlanStaffAssignments = async (carePlanId: string): Promise<StaffAssignment[]> => {
  const { data, error } = await supabase
    .from('care_plan_staff_assignments')
    .select(`
      *,
      staff:staff(id, first_name, last_name, email, specialization)
    `)
    .eq('care_plan_id', carePlanId)
    .order('is_primary', { ascending: false });

  if (error) {
    console.error('[fetchCarePlanStaffAssignments] Error:', error);
    throw error;
  }

  return data || [];
};

// Sync staff assignments - handles add/remove based on new array
export const syncCarePlanStaffAssignments = async (
  carePlanId: string,
  newStaffIds: string[],
  assignedBy: string
): Promise<{ added: string[]; removed: string[] }> => {
  console.log('[syncCarePlanStaffAssignments] Syncing staff for care plan:', carePlanId, 'New staff:', newStaffIds);

  // Get current assignments
  const { data: currentAssignments, error: fetchError } = await supabase
    .from('care_plan_staff_assignments')
    .select('staff_id')
    .eq('care_plan_id', carePlanId);

  if (fetchError) {
    console.error('[syncCarePlanStaffAssignments] Error fetching current:', fetchError);
    throw fetchError;
  }

  const currentStaffIds = (currentAssignments || []).map(a => a.staff_id);
  
  // Calculate diff
  const toAdd = newStaffIds.filter(id => !currentStaffIds.includes(id));
  const toRemove = currentStaffIds.filter(id => !newStaffIds.includes(id));

  console.log('[syncCarePlanStaffAssignments] To add:', toAdd, 'To remove:', toRemove);

  // Remove old assignments
  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('care_plan_staff_assignments')
      .delete()
      .eq('care_plan_id', carePlanId)
      .in('staff_id', toRemove);

    if (deleteError) {
      console.error('[syncCarePlanStaffAssignments] Error removing:', deleteError);
      throw deleteError;
    }
  }

  // Add new assignments
  if (toAdd.length > 0) {
    const newAssignments = toAdd.map((staffId, index) => ({
      care_plan_id: carePlanId,
      staff_id: staffId,
      is_primary: index === 0 && currentStaffIds.length === 0, // First one is primary if no existing
      assigned_by: assignedBy
    }));

    const { error: insertError } = await supabase
      .from('care_plan_staff_assignments')
      .insert(newAssignments);

    if (insertError) {
      console.error('[syncCarePlanStaffAssignments] Error adding:', insertError);
      throw insertError;
    }
  }

  // Update primary if needed (first in the new list should be primary)
  if (newStaffIds.length > 0) {
    // Set first staff as primary
    await supabase
      .from('care_plan_staff_assignments')
      .update({ is_primary: true })
      .eq('care_plan_id', carePlanId)
      .eq('staff_id', newStaffIds[0]);

    // Set others as not primary
    if (newStaffIds.length > 1) {
      await supabase
        .from('care_plan_staff_assignments')
        .update({ is_primary: false })
        .eq('care_plan_id', carePlanId)
        .in('staff_id', newStaffIds.slice(1));
    }
  }

  return { added: toAdd, removed: toRemove };
};

// Send notifications for staff assignment changes
export const sendStaffAssignmentNotifications = async (
  carePlanId: string,
  clientId: string,
  addedStaffIds: string[],
  removedStaffIds: string[],
  unchangedStaffIds: string[],
  carePlanTitle: string,
  carePlanDisplayId: string,
  notifyUnchanged: boolean = false
) => {
  console.log('[sendStaffAssignmentNotifications] Sending notifications:', {
    added: addedStaffIds,
    removed: removedStaffIds,
    unchanged: unchangedStaffIds,
    notifyUnchanged
  });

  // Get client info
  const { data: clientData } = await supabase
    .from('clients')
    .select('first_name, last_name, branch_id')
    .eq('id', clientId)
    .single();

  if (!clientData) {
    console.warn('[sendStaffAssignmentNotifications] Client not found');
    return;
  }

  const clientName = `${clientData.first_name} ${clientData.last_name}`;
  const notifications: any[] = [];

  // Get auth_user_ids for all staff
  const allStaffIds = [...addedStaffIds, ...removedStaffIds, ...(notifyUnchanged ? unchangedStaffIds : [])];
  
  if (allStaffIds.length === 0) return;

  const { data: staffData } = await supabase
    .from('staff')
    .select('id, auth_user_id')
    .in('id', allStaffIds);

  const staffAuthMap = new Map((staffData || []).map(s => [s.id, s.auth_user_id]));

  // Notifications for newly assigned staff
  for (const staffId of addedStaffIds) {
    const authUserId = staffAuthMap.get(staffId);
    if (authUserId) {
      notifications.push({
        user_id: authUserId,
        branch_id: clientData.branch_id,
        type: 'care_plan',
        category: 'info',
        priority: 'high',
        title: 'You have been assigned to a care plan',
        message: `You have been assigned to ${carePlanDisplayId || 'care plan'} for ${clientName}`,
        data: {
          care_plan_id: carePlanId,
          action: 'assigned',
          care_plan_title: carePlanTitle,
          care_plan_display_id: carePlanDisplayId,
          client_name: clientName
        }
      });
    }
  }

  // Notifications for unassigned staff
  for (const staffId of removedStaffIds) {
    const authUserId = staffAuthMap.get(staffId);
    if (authUserId) {
      notifications.push({
        user_id: authUserId,
        branch_id: clientData.branch_id,
        type: 'care_plan',
        category: 'info',
        priority: 'medium',
        title: 'You have been unassigned from a care plan',
        message: `You have been unassigned from ${carePlanDisplayId || 'care plan'} for ${clientName}`,
        data: {
          care_plan_id: carePlanId,
          action: 'unassigned',
          care_plan_title: carePlanTitle,
          care_plan_display_id: carePlanDisplayId,
          client_name: clientName
        }
      });
    }
  }

  // Notifications for unchanged staff (optional - on care plan update)
  if (notifyUnchanged) {
    for (const staffId of unchangedStaffIds) {
      const authUserId = staffAuthMap.get(staffId);
      if (authUserId) {
        notifications.push({
          user_id: authUserId,
          branch_id: clientData.branch_id,
          type: 'care_plan',
          category: 'info',
          priority: 'low',
          title: 'Care plan has been updated',
          message: `Care plan ${carePlanDisplayId || ''} for ${clientName} has been updated`,
          data: {
            care_plan_id: carePlanId,
            action: 'updated',
            care_plan_title: carePlanTitle,
            care_plan_display_id: carePlanDisplayId,
            client_name: clientName
          }
        });
      }
    }
  }

  // Insert notifications
  if (notifications.length > 0) {
    const { error } = await supabase.from('notifications').insert(notifications);
    if (error) {
      console.error('[sendStaffAssignmentNotifications] Error sending notifications:', error);
    } else {
      console.log('[sendStaffAssignmentNotifications] Sent', notifications.length, 'notifications');
    }
  }
};
