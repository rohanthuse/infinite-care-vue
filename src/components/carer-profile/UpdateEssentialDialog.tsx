import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffEssential } from "@/hooks/useStaffEssentials";

interface UpdateEssentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  essential: StaffEssential | null;
  onUpdate: (id: string, data: any) => void;
}

export const UpdateEssentialDialog: React.FC<UpdateEssentialDialogProps> = ({
  open,
  onOpenChange,
  essential,
  onUpdate,
}) => {
  const [status, setStatus] = useState<string>('');
  const [completionDate, setCompletionDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (essential) {
      setStatus(essential.status);
      setCompletionDate(essential.completion_date || '');
      setExpiryDate(essential.expiry_date || '');
      setNotes(essential.notes || '');
    }
  }, [essential]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!essential) return;

    onUpdate(essential.id, {
      status,
      completion_date: completionDate || null,
      expiry_date: expiryDate || null,
      notes: notes || null,
      verified_at: new Date().toISOString(),
    });

    onOpenChange(false);
  };

  if (!essential) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Essential: {essential.display_name}</DialogTitle>
          <DialogDescription>
            Update the status and details of this essential requirement
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={setStatus} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="not_required">Not Required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(status === 'complete' || status === 'expiring' || status === 'expired') && (
            <div className="space-y-2">
              <Label htmlFor="completionDate">Completion Date</Label>
              <Input
                id="completionDate"
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty if this item doesn't expire
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any verification notes or additional information"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Update Essential
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};