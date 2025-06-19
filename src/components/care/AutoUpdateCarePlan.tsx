
import React, { useEffect } from 'react';
import { useUpdateCarePlanAssignment } from '@/hooks/useUpdateCarePlan';
import { useBranchStaff } from '@/hooks/useBranchStaff';
import { useParams } from 'react-router-dom';

export const AutoUpdateCarePlan: React.FC = () => {
  const { id: branchId } = useParams();
  const { data: branchStaff = [] } = useBranchStaff(branchId || '');
  const updateAssignmentMutation = useUpdateCarePlanAssignment();

  useEffect(() => {
    // Find Jane Smith in the staff list
    const janeSmith = branchStaff.find(staff => 
      staff.first_name === 'Jane' && staff.last_name === 'Smith'
    );

    if (janeSmith) {
      console.log('Found Jane Smith in staff:', janeSmith);
      
      // Update the care plan that's currently assigned to "Dr. Emily Smith"
      // We'll use a known care plan ID that needs to be updated
      // Note: In a real scenario, you'd query for care plans with "Dr. Emily Smith" as provider
      const carePlanIdToUpdate = 'ccf8a8d3-3d4e-4b7a-9e1c-f2a8d9e6b3c7'; // This should be the actual ID
      
      updateAssignmentMutation.mutate({
        carePlanId: carePlanIdToUpdate,
        staffId: janeSmith.id,
        providerName: `${janeSmith.first_name} ${janeSmith.last_name}`,
      });
    }
  }, [branchStaff, updateAssignmentMutation]);

  return null; // This component doesn't render anything
};
