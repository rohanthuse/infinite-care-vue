import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const CANCELLATION_REASONS = [
  { value: "client_requested", label: "Client Requested" },
  { value: "client_unwell", label: "Client Unwell" },
  { value: "staff_unavailable", label: "Staff Unavailable" },
  { value: "emergency", label: "Emergency" },
  { value: "scheduling_conflict", label: "Scheduling Conflict" },
  { value: "weather", label: "Weather Conditions" },
  { value: "transport_issue", label: "Transport Issue" },
  { value: "hospitalization", label: "Hospitalization" },
  { value: "other", label: "Other" },
] as const;

export interface CancellationData {
  reason: string;
  reasonLabel: string;
  details?: string;
  removeFromInvoice: boolean;
  payStaff: boolean;
  sendNotification: boolean;
}

interface AdvancedCancellationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: CancellationData) => void;
  bookingDetails?: {
    clientName?: string;
    carerName?: string;
    date?: string;
    time?: string;
  };
  isLoading?: boolean;
}

export function AdvancedCancellationDialog({
  open,
  onOpenChange,
  onConfirm,
  bookingDetails,
  isLoading = false,
}: AdvancedCancellationDialogProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [removeFromInvoice, setRemoveFromInvoice] = useState(true);
  const [payStaff, setPayStaff] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);

  const selectedReasonLabel = CANCELLATION_REASONS.find(r => r.value === reason)?.label || "";
  const isOtherReason = reason === "other";
  const isValid = reason && (!isOtherReason || details.trim().length > 0);

  const handleConfirm = () => {
    if (!isValid) return;
    
    const fullReason = isOtherReason && details 
      ? `Other: ${details}` 
      : selectedReasonLabel;

    onConfirm({
      reason,
      reasonLabel: fullReason,
      details: details || undefined,
      removeFromInvoice,
      payStaff,
      sendNotification,
    });
  };

  const handleCancel = () => {
    setReason("");
    setDetails("");
    setRemoveFromInvoice(true);
    setPayStaff(false);
    setSendNotification(true);
    onOpenChange(false);
  };

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setReason("");
      setDetails("");
      setRemoveFromInvoice(true);
      setPayStaff(false);
      setSendNotification(true);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Cancellation Reason
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for cancelling this booking and select the applicable options.
          </DialogDescription>
        </DialogHeader>

        {bookingDetails && (bookingDetails.clientName || bookingDetails.date) && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              {bookingDetails.clientName && (
                <div>
                  <span className="text-muted-foreground">Client:</span>{" "}
                  <span className="font-medium">{bookingDetails.clientName}</span>
                </div>
              )}
              {bookingDetails.carerName && (
                <div>
                  <span className="text-muted-foreground">Carer:</span>{" "}
                  <span className="font-medium">{bookingDetails.carerName}</span>
                </div>
              )}
              {bookingDetails.date && (
                <div>
                  <span className="text-muted-foreground">Date:</span>{" "}
                  <span className="font-medium">{bookingDetails.date}</span>
                </div>
              )}
              {bookingDetails.time && (
                <div>
                  <span className="text-muted-foreground">Time:</span>{" "}
                  <span className="font-medium">{bookingDetails.time}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Why are you cancelling this booking? <span className="text-destructive">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label htmlFor="details" className="text-sm font-medium">
              Additional details {isOtherReason && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={isOtherReason ? "Please specify the reason..." : "Enter any additional notes (optional)..."}
              className="min-h-[80px] resize-none"
            />
          </div>

          <Separator />

          {/* Action Toggles */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Cancellation Options</h4>
            
            <div className="space-y-3">
              {/* Remove from Invoice */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="remove-invoice" className="text-sm font-medium cursor-pointer">
                    Remove from Invoice
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Exclude this booking from future invoices
                  </p>
                </div>
                <Switch
                  id="remove-invoice"
                  checked={removeFromInvoice}
                  onCheckedChange={setRemoveFromInvoice}
                />
              </div>

              {/* Pay Staff/Carer */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="pay-staff" className="text-sm font-medium cursor-pointer">
                    Pay Staff/Carer
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Still process payment for the assigned carer
                  </p>
                </div>
                <Switch
                  id="pay-staff"
                  checked={payStaff}
                  onCheckedChange={setPayStaff}
                />
              </div>

              {/* Send Notification */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="send-notification" className="text-sm font-medium cursor-pointer">
                    Send Notification to Staff/Carer
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notify the assigned carer about this cancellation
                  </p>
                </div>
                <Switch
                  id="send-notification"
                  checked={sendNotification}
                  onCheckedChange={setSendNotification}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
          >
            {isLoading ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
