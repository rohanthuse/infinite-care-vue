
import React, { useEffect } from 'react';
import { useUpdateCarePlanAssignment } from '@/hooks/useUpdateCarePlan';
import { useBranchStaff } from '@/hooks/useBranchStaff';
import { useParams } from 'react-router-dom';

export const AutoUpdateCarePlan: React.FC = () => {
  const { id: branchId } = useParams();
  const { data: branchStaff = [], isLoading, error } = useBranchStaff(branchId || '');
  const updateAssignmentMutation = useUpdateCarePlanAssignment();

  useEffect(() => {
    console.log('[AutoUpdateCarePlan] Component mounted, branchId:', branchId);
    console.log('[AutoUpdateCarePlan] Staff loading state:', { isLoading, error });
    console.log('[AutoUpdateCarePlan] Branch staff data:', branchStaff);

    // Skip automatic update since we've manually updated CP-002 via database
    console.log('[AutoUpdateCarePlan] Skipping automatic update - CP-002 already updated to Jane Smith');
    return;

    // The rest of the code is kept for potential future use but commented out
    /*
    // Only proceed if we have staff data and no errors
    if (isLoading || error || !branchStaff.length) {
      console.log('[AutoUpdateCarePlan] Not ready to update - loading:', isLoading, 'error:', error, 'staff count:', branchStaff.length);
      return;
    }

    // Find Jane Smith in the staff list
    const janeSmith = branchStaff.find(staff => 
      staff.first_name === 'Jane' && staff.last_name === 'Smith'
    );

    console.log('[AutoUpdateCarePlan] Looking for Jane Smith in staff list...');
    console.log('[AutoUpdateCarePlan] Available staff:', branchStaff.map(s => `${s.first_name} ${s.last_name}`));

    if (janeSmith) {
      console.log('[AutoUpdateCarePlan] Found Jane Smith in staff:', janeSmith);
      
      // Update the care plan that's currently assigned to "Dr. Emily Smith"
      // Using the correct UUID from the database mapping
      const carePlanIdToUpdate = 'aba7debb-233d-436c-9f6a-3900f79df14b'; // Emily Smith's actual care plan UUID
      
      console.log('[AutoUpdateCarePlan] Updating care plan assignment:', {
        carePlanId: carePlanIdToUpdate,
        staffId: janeSmith.id,
        providerName: `${janeSmith.first_name} ${janeSmith.last_name}`,
      });

      updateAssignmentMutation.mutate({
        carePlanId: carePlanIdToUpdate,
        staffId: janeSmith.id,
        providerName: `${janeSmith.first_name} ${janeSmith.last_name}`,
      });
    } else {
      console.warn('[AutoUpdateCarePlan] Jane Smith not found in staff list');
      console.log('[AutoUpdateCarePlan] Available staff members:', branchStaff.map(s => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`
      })));
    }
    */
  }, [branchStaff, updateAssignmentMutation, isLoading, error, branchId]);

  // Show loading/error state for debugging
  if (isLoading) {
    console.log('[AutoUpdateCarePlan] Loading branch staff...');
  }
  
  if (error) {
    console.error('[AutoUpdateCarePlan] Error loading branch staff:', error);
  }

  return null; // This component doesn't render anything
};
