import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { useBranchStaff } from '@/hooks/useBranchStaff';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';


interface ShareWithCarerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    name: string;
    file_path: string;
    type: string;
    category: string;
    client_id?: string;
    uploaded_by?: string;
    uploaded_by_name?: string;
  } | null;
  branchId: string;
  onSuccess: () => void;
}

export function ShareWithCarerDialog({
  open,
  onOpenChange,
  document,
  branchId,
  onSuccess,
}: ShareWithCarerDialogProps) {
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  // Fetch branch staff
  const { data: staff = [], isLoading } = useBranchStaff(branchId);

  // Convert staff data to MultiSelect options
  const staffOptions: MultiSelectOption[] = staff.map(member => ({
    value: member.id,
    label: `${member.first_name} ${member.last_name}`,
    description: member.email || undefined,
  }));

  const handleShare = async () => {
    if (!document || selectedStaffIds.length === 0) {
      toast.error('Please select at least one carer to share with');
      return;
    }

    setIsSharing(true);
    try {
      // Create document records for each selected staff member using Promise.allSettled for proper error handling
      const sharePromises = selectedStaffIds.map(staffId => 
        supabase
          .from('documents')
          .insert({
            name: document.name,
            type: document.type,
            category: `${document.category} (Shared)`,
            description: note || `Document shared from client uploads`,
            file_path: document.file_path,
            staff_id: staffId,
            client_id: document.client_id,
            branch_id: branchId,
            status: 'active',
            access_level: 'staff',
            uploaded_by: document.uploaded_by,
            uploaded_by_name: document.uploaded_by_name || 'Admin (Shared)',
          })
      );

      const results = await Promise.allSettled(sharePromises);
      const successful = results.filter(result => result.status === 'fulfilled' && !result.value.error);
      const failed = results.filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && result.value.error));

      if (successful.length > 0) {
        toast.success(`Document shared with ${successful.length} carer(s)`);
        onSuccess();
        onOpenChange(false);
        
        // Reset form
        setSelectedStaffIds([]);
        setNote('');
      }

      if (failed.length > 0) {
        console.error('Some shares failed:', failed);
        toast.error(`Failed to share with ${failed.length} carer(s). Please try again.`);
      }
    } catch (error) {
      console.error('Error sharing document:', error);
      toast.error('Failed to share document');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share with Carer</DialogTitle>
          <DialogDescription>
            Share "{document?.name}" with selected carers. They will be able to view and download this document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Staff Selection */}
          <div>
            <Label className="text-sm font-medium">Select Carers</Label>
            <div className="mt-2">
              <MultiSelect
                options={staffOptions}
                selected={selectedStaffIds}
                onSelectionChange={setSelectedStaffIds}
                placeholder={isLoading ? "Loading carers..." : "Select carers to share with..."}
                searchPlaceholder="Search carers..."
                emptyText="No carers found"
                disabled={isLoading}
              />
            </div>
            {selectedStaffIds.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {selectedStaffIds.length} carer(s) selected
              </div>
            )}
          </div>

          {/* Optional Note */}
          <div>
            <Label htmlFor="note" className="text-sm font-medium">
              Note (Optional)
            </Label>
            <Textarea
              id="note"
              placeholder="Add a note about this shared document..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSharing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSharing || selectedStaffIds.length === 0}
          >
            {isSharing ? 'Sharing...' : `Share with ${selectedStaffIds.length || 0} Carer(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}