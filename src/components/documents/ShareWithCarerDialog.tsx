import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User } from 'lucide-react';

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

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
  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['branch-staff', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email')
        .eq('branch_id', branchId)
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      return data as Staff[];
    },
    enabled: open && Boolean(branchId),
  });

  const handleStaffSelection = (staffId: string, checked: boolean) => {
    if (checked) {
      setSelectedStaffIds(prev => [...prev, staffId]);
    } else {
      setSelectedStaffIds(prev => prev.filter(id => id !== staffId));
    }
  };

  const handleShare = async () => {
    if (!document || selectedStaffIds.length === 0) {
      toast.error('Please select at least one carer to share with');
      return;
    }

    setIsSharing(true);
    try {
      // Create document records for each selected staff member
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
            uploaded_by_name: 'Admin (Shared)',
          })
      );

      await Promise.all(sharePromises);
      
      toast.success(`Document shared with ${selectedStaffIds.length} carer(s)`);
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setSelectedStaffIds([]);
      setNote('');
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
            <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading carers...</div>
              ) : staff.length === 0 ? (
                <div className="text-sm text-muted-foreground">No carers found</div>
              ) : (
                staff.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={member.id}
                      checked={selectedStaffIds.includes(member.id)}
                      onCheckedChange={(checked) => 
                        handleStaffSelection(member.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={member.id} 
                      className="flex items-center space-x-2 text-sm cursor-pointer flex-1"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{member.first_name} {member.last_name}</span>
                      <span className="text-xs text-muted-foreground">({member.email})</span>
                    </Label>
                  </div>
                ))
              )}
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