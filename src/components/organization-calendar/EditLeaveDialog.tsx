import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useUpdateAnnualLeave } from '@/hooks/useLeaveManagement';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenant } from '@/contexts/TenantContext';

interface EditLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leave: any;
  branchId?: string;
}

export const EditLeaveDialog: React.FC<EditLeaveDialogProps> = ({
  open,
  onOpenChange,
  leave,
  branchId
}) => {
  const [leaveName, setLeaveName] = useState(leave?.leave_name || '');
  const [leaveDate, setLeaveDate] = useState(
    leave?.leave_date ? format(new Date(leave.leave_date), 'yyyy-MM-dd') : ''
  );
  const [isCompanyWide, setIsCompanyWide] = useState(leave?.is_company_wide || false);
  const [isRecurring, setIsRecurring] = useState(leave?.is_recurring || false);
  const [selectedBranchId, setSelectedBranchId] = useState(leave?.branch_id || branchId || '');
  const [branches, setBranches] = useState<any[]>([]);

  const { organization } = useTenant();
  const updateAnnualLeave = useUpdateAnnualLeave();

  // Fetch branches for selection
  useEffect(() => {
    const fetchBranches = async () => {
      if (!organization?.id) return;

      const { data: branchesData } = await supabase
        .from('branches')
        .select('id, name')
        .eq('organization_id', organization.id)
        .order('name');

      if (branchesData) {
        setBranches(branchesData);
      }
    };

    if (open) {
      fetchBranches();
    }
  }, [open, organization?.id]);

  // Update form when leave prop changes
  useEffect(() => {
    if (leave) {
      setLeaveName(leave.leave_name || '');
      setLeaveDate(leave.leave_date ? format(new Date(leave.leave_date), 'yyyy-MM-dd') : '');
      setIsCompanyWide(leave.is_company_wide || false);
      setIsRecurring(leave.is_recurring || false);
      setSelectedBranchId(leave.branch_id || branchId || '');
    }
  }, [leave, branchId]);

  const resetForm = () => {
    if (leave) {
      setLeaveName(leave.leave_name || '');
      setLeaveDate(leave.leave_date ? format(new Date(leave.leave_date), 'yyyy-MM-dd') : '');
      setIsCompanyWide(leave.is_company_wide || false);
      setIsRecurring(leave.is_recurring || false);
      setSelectedBranchId(leave.branch_id || branchId || '');
    }
  };

  const handleUpdateLeave = async () => {
    if (!leaveName || !leaveDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!isCompanyWide && !selectedBranchId) {
      toast.error('Please select a branch or make it company-wide');
      return;
    }

    try {
      await updateAnnualLeave.mutateAsync({
        leaveId: leave.id,
        updates: {
          leave_name: leaveName,
          leave_date: leaveDate,
          is_company_wide: isCompanyWide,
          is_recurring: isRecurring,
          branch_id: isCompanyWide ? null : selectedBranchId
        }
      });

      // Wait for cache update
      await new Promise(resolve => setTimeout(resolve, 100));

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating leave:', error);
    }
  };

  const handleClose = useCallback(() => {
    try {
      resetForm();
      onOpenChange(false);
      
      // Cleanup to prevent UI freezing
      setTimeout(() => {
        const elementsToCleanup = [
          document.getElementById('root'),
          document.querySelector('.group\\/sidebar-wrapper'),
          ...document.querySelectorAll('[data-radix-popper-content-wrapper]'),
          ...document.querySelectorAll('[aria-hidden="true"]')
        ];
        
        elementsToCleanup.forEach(element => {
          if (element) {
            element.removeAttribute('aria-hidden');
            element.removeAttribute('inert');
          }
        });
        
        document.querySelectorAll('[data-radix-popper-content-wrapper]:empty').forEach(el => el.remove());
        document.body.style.removeProperty('overflow');
        document.documentElement.style.removeProperty('overflow');
        document.body.style.removeProperty('pointer-events');
      }, 50);
    } catch (error) {
      console.error('Error closing edit leave dialog:', error);
      onOpenChange(false);
    }
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Leave/Holiday</DialogTitle>
          <DialogDescription>Update leave entry details.</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="leaveName">Leave Name *</Label>
            <Input
              id="leaveName"
              value={leaveName}
              onChange={(e) => setLeaveName(e.target.value)}
              placeholder="e.g., Summer Holiday, Christmas Break"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="leaveDate">Date *</Label>
            <Input
              id="leaveDate"
              type="date"
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
            />
          </div>

          <div className="grid gap-3">
            <Label>Scope *</Label>
            <RadioGroup 
              value={isCompanyWide ? 'company' : 'branch'} 
              onValueChange={(value) => setIsCompanyWide(value === 'company')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="company" id="company" />
                <Label htmlFor="company" className="font-normal cursor-pointer">
                  Company-wide (All Branches)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="branch" id="branch" />
                <Label htmlFor="branch" className="font-normal cursor-pointer">
                  Branch-specific
                </Label>
              </div>
            </RadioGroup>
          </div>

          {!isCompanyWide && (
            <div className="grid gap-2">
              <Label htmlFor="branchSelect">Select Branch *</Label>
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger id="branchSelect">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="recurring" 
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
            />
            <Label 
              htmlFor="recurring" 
              className="font-normal cursor-pointer"
            >
              Recurring Annually
            </Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateLeave}
            disabled={!leaveName || !leaveDate || (!isCompanyWide && !selectedBranchId) || updateAnnualLeave.isPending}
          >
            {updateAnnualLeave.isPending ? 'Updating...' : 'Update Leave'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
