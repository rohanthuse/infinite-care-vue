
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateCarePlanAssignment } from '@/hooks/useUpdateCarePlan';

interface UpdateCarePlanAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carePlanId: string;
  currentProvider: string;
  newStaffId: string;
  newProviderName: string;
}

export const UpdateCarePlanAssignmentDialog: React.FC<UpdateCarePlanAssignmentDialogProps> = ({
  open,
  onOpenChange,
  carePlanId,
  currentProvider,
  newStaffId,
  newProviderName,
}) => {
  const updateAssignmentMutation = useUpdateCarePlanAssignment();

  const handleUpdate = async () => {
    try {
      await updateAssignmentMutation.mutateAsync({
        carePlanId,
        staffId: newStaffId,
        providerName: newProviderName,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update care plan assignment:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Care Plan Assignment</DialogTitle>
          <DialogDescription>
            Are you sure you want to reassign this care plan from "{currentProvider}" to "{newProviderName}"?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdate} 
            disabled={updateAssignmentMutation.isPending}
          >
            {updateAssignmentMutation.isPending ? 'Updating...' : 'Update Assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
