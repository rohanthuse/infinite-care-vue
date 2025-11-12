import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface CancellationReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, details?: string) => void;
  status: 'cancelled' | 'no-show';
}

const CANCELLATION_REASONS = {
  cancelled: [
    { value: 'client_request', label: 'Client Requested' },
    { value: 'client_unwell', label: 'Client Unwell' },
    { value: 'staff_unavailable', label: 'Staff Unavailable' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'scheduling_conflict', label: 'Scheduling Conflict' },
    { value: 'weather', label: 'Weather Conditions' },
    { value: 'transport_issue', label: 'Transport Issue' },
    { value: 'other', label: 'Other' },
  ],
  'no-show': [
    { value: 'no_answer', label: 'No Answer at Door' },
    { value: 'client_forgot', label: 'Client Forgot' },
    { value: 'client_away', label: 'Client Away/Out' },
    { value: 'wrong_address', label: 'Wrong Address' },
    { value: 'access_denied', label: 'Access Denied' },
    { value: 'other', label: 'Other' },
  ],
};

export const CancellationReasonDialog: React.FC<CancellationReasonDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  status,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [additionalDetails, setAdditionalDetails] = useState<string>("");

  const handleConfirm = () => {
    if (!selectedReason) return;
    
    const fullReason = selectedReason === 'other' && additionalDetails
      ? `Other: ${additionalDetails}`
      : selectedReason;
    
    onConfirm(fullReason, additionalDetails || undefined);
    
    // Reset state
    setSelectedReason("");
    setAdditionalDetails("");
  };

  const handleCancel = () => {
    setSelectedReason("");
    setAdditionalDetails("");
    onOpenChange(false);
  };

  const reasons = CANCELLATION_REASONS[status];
  const title = status === 'cancelled' ? 'Cancellation Reason' : 'No-Show Reason';
  const description = status === 'cancelled' 
    ? 'Please provide a reason for cancelling this booking'
    : 'Please provide a reason for this no-show';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason *</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReason === 'other' && (
            <div className="grid gap-2">
              <Label htmlFor="details">Please specify</Label>
              <Textarea
                id="details"
                placeholder="Enter details..."
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {selectedReason && selectedReason !== 'other' && (
            <div className="grid gap-2">
              <Label htmlFor="details">Additional details (optional)</Label>
              <Textarea
                id="details"
                placeholder="Add any additional information..."
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedReason || (selectedReason === 'other' && !additionalDetails.trim())}
          >
            Confirm {status === 'cancelled' ? 'Cancellation' : 'No-Show'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
