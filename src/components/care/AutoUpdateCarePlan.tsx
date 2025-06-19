
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
      // Using the correct UUID from the database mapping
      const carePlanIdToUpdate = 'aba7debb-233d-436c-9f6a-3900f79df14b'; // Emily Smith's actual care plan UUID
      
      updateAssignmentMutation.mutate({
        carePlanId: carePlanIdToUpdate,
        staffId: janeSmith.id,
        providerName: `${janeSmith.first_name} ${janeSmith.last_name}`,
      });
    }
  }, [branchStaff, updateAssignmentMutation]);

  return null; // This component doesn't render anything
};
