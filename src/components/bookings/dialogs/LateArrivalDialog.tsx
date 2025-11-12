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
import { Clock, AlertTriangle } from "lucide-react";

interface LateArrivalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, details?: string) => void;
  minutesLate: number;
  staffName?: string;
}

const LATE_ARRIVAL_REASONS = [
  { value: 'traffic', label: 'Traffic/Road Conditions' },
  { value: 'previous_visit_overrun', label: 'Previous Visit Overran' },
  { value: 'transport_issue', label: 'Transport Issue' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'personal_issue', label: 'Personal Issue' },
  { value: 'incorrect_address', label: 'Incorrect Address' },
  { value: 'parking_difficulty', label: 'Parking Difficulty' },
  { value: 'weather', label: 'Weather Conditions' },
  { value: 'other', label: 'Other' },
];

export const LateArrivalDialog: React.FC<LateArrivalDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  minutesLate,
  staffName,
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

  const handleSkip = () => {
    // Allow continuing without reason
    onConfirm('not_specified', undefined);
    setSelectedReason("");
    setAdditionalDetails("");
  };

  const handleCancel = () => {
    setSelectedReason("");
    setAdditionalDetails("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Late Arrival Detected
          </DialogTitle>
          <DialogDescription>
            {staffName && `${staffName} arrived `}
            <strong>{minutesLate} minutes late</strong> for this visit. 
            Please provide a reason for the late arrival.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for Late Arrival</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {LATE_ARRIVAL_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReason === 'other' && (
            <div className="grid gap-2">
              <Label htmlFor="details">Please specify *</Label>
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

          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-amber-700 dark:text-amber-300">
              Recording late arrivals helps improve scheduling and service quality
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleSkip} className="w-full sm:w-auto">
            Skip for Now
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleCancel} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!selectedReason || (selectedReason === 'other' && !additionalDetails.trim())}
              className="flex-1 sm:flex-none"
            >
              Confirm
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
