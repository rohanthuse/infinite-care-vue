import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, UserCheck, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateCarePlanAssignment } from '@/hooks/useUpdateCarePlan';
import { useControlledDialog } from '@/hooks/useDialogManager';

interface AssignCarePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carePlan?: {
    id: string;
    display_id: string;
    title?: string;
    client: {
      first_name: string;
      last_name: string;
    };
    provider_name: string;
    staff?: {
      first_name: string;
      last_name: string;
    };
  } | null;
  branchId: string;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
}

export const AssignCarePlanDialog: React.FC<AssignCarePlanDialogProps> = ({
  open,
  onOpenChange,
  carePlan,
  branchId,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const updateAssignmentMutation = useUpdateCarePlanAssignment();
  
  const dialogId = `assign-care-plan-${carePlan?.id || 'new'}`;
  const controlledDialog = useControlledDialog(dialogId, open);

  // Sync with external open prop
  useEffect(() => {
    if (open !== controlledDialog.open) {
      controlledDialog.onOpenChange(open);
    }
  }, [open, controlledDialog]);

  // Sync controlled state back to parent
  useEffect(() => {
    onOpenChange(controlledDialog.open);
  }, [controlledDialog.open, onOpenChange]);

  // Fetch available staff for this branch
  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ['branch-staff', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, status')
        .eq('branch_id', branchId)
        .ilike('status', 'active')
        .order('first_name');

      if (error) throw error;
      return data as Staff[];
    },
    enabled: Boolean(branchId && open),
  });

  const handleClose = useCallback(() => {
    controlledDialog.onOpenChange(false);
    setSelectedStaffId('');
  }, [controlledDialog]);

  const handleAssign = async () => {
    if (!carePlan || !selectedStaffId) return;

    const selectedStaff = staff?.find(s => s.id === selectedStaffId);
    if (!selectedStaff) return;

    try {
      await updateAssignmentMutation.mutateAsync({
        carePlanId: carePlan.id,
        staffId: selectedStaffId,
        providerName: `${selectedStaff.first_name} ${selectedStaff.last_name}`,
      });
      handleClose();
    } catch (error) {
      console.error('Failed to assign care plan:', error);
    }
  };

  const handleUnassign = async () => {
    if (!carePlan) return;

    try {
      await updateAssignmentMutation.mutateAsync({
        carePlanId: carePlan.id,
        staffId: '',
        providerName: 'Unassigned',
      });
      handleClose();
    } catch (error) {
      console.error('Failed to unassign care plan:', error);
    }
  };

  if (!carePlan) return null;

  const currentlyAssigned = carePlan.staff;

  return (
    <Dialog open={controlledDialog.open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-md"
        onEscapeKeyDown={handleClose}
        onPointerDownOutside={handleClose}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Care Plan
          </DialogTitle>
          <DialogDescription>
            Assign or reassign this care plan to a carer in your branch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Care Plan Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{carePlan.display_id}</Badge>
            </div>
            <h4 className="font-medium">
              {carePlan.client.first_name} {carePlan.client.last_name}
            </h4>
            {carePlan.title && (
              <p className="text-sm text-muted-foreground">{carePlan.title}</p>
            )}
          </div>

          {/* Current Assignment */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Current Assignment
            </label>
            <div className="flex items-center gap-2 p-3 bg-background border rounded-md">
              {currentlyAssigned ? (
                <>
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <span>{currentlyAssigned.first_name} {currentlyAssigned.last_name}</span>
                  <Badge variant="secondary" className="ml-auto">Assigned</Badge>
                </>
              ) : (
                <>
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Unassigned</span>
                  <Badge variant="outline" className="ml-auto">Available</Badge>
                </>
              )}
            </div>
          </div>

          {/* Staff Selection */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Assign to Carer
            </label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a carer" />
              </SelectTrigger>
              <SelectContent>
                {staffLoading ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Loading carers...
                  </div>
                ) : staff && staff.length > 0 ? (
                  staff.map((staffMember) => (
                    <SelectItem key={staffMember.id} value={staffMember.id}>
                      {staffMember.first_name} {staffMember.last_name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No carers available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          
          {currentlyAssigned && (
            <Button 
              variant="outline" 
              onClick={handleUnassign}
              disabled={updateAssignmentMutation.isPending}
            >
              Unassign
            </Button>
          )}
          
          <Button 
            onClick={handleAssign}
            disabled={!selectedStaffId || updateAssignmentMutation.isPending}
          >
            {updateAssignmentMutation.isPending ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};