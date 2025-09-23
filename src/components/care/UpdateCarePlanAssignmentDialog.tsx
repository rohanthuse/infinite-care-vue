
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
import { useControlledDialog } from '@/hooks/useDialogManager';

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
  const dialogId = `update-care-plan-assignment-${carePlanId}`;
  const controlledDialog = useControlledDialog(dialogId, open);
  
  // Sync with external props
  React.useEffect(() => {
    if (open !== controlledDialog.open) {
      controlledDialog.onOpenChange(open);
    }
  }, [open, controlledDialog.open, controlledDialog.onOpenChange]);
  
  React.useEffect(() => {
    onOpenChange(controlledDialog.open);
  }, [controlledDialog.open, onOpenChange]);

  const handleUpdate = async () => {
    try {
      await updateAssignmentMutation.mutateAsync({
        carePlanId,
        staffId: newStaffId,
        providerName: newProviderName,
      });
      controlledDialog.onOpenChange(false);
    } catch (error) {
      console.error('Failed to update care plan assignment:', error);
    }
  };

  return (
    <Dialog open={controlledDialog.open} onOpenChange={controlledDialog.onOpenChange}>
      <DialogContent
        onEscapeKeyDown={() => controlledDialog.onOpenChange(false)}
        onPointerDownOutside={() => controlledDialog.onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle>Update Care Plan Assignment</DialogTitle>
          <DialogDescription>
            Are you sure you want to reassign this care plan from "{currentProvider}" to "{newProviderName}"?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => controlledDialog.onOpenChange(false)}>
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
