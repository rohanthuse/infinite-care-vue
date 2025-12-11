import React, { useState, useEffect, useMemo } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";

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

export type StaffPaymentType = 'none' | 'full' | 'half' | 'custom';

export interface CancellationData {
  reason: string;
  reasonLabel: string;
  details?: string;
  removeFromInvoice: boolean;
  payStaff: boolean;
  paymentType: StaffPaymentType;
  paymentAmount: number;
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
    staffId?: string;
    clientId?: string;
    startTime?: string;
    endTime?: string;
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
  const [paymentType, setPaymentType] = useState<StaffPaymentType>('full');
  const [customAmount, setCustomAmount] = useState<string>("");
  const [sendNotification, setSendNotification] = useState(true);
  
  // Rate calculation state
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [carerFullAmount, setCarerFullAmount] = useState<number>(0);
  const [clientMaxAmount, setClientMaxAmount] = useState<number>(0);

  const selectedReasonLabel = CANCELLATION_REASONS.find(r => r.value === reason)?.label || "";
  const isOtherReason = reason === "other";
  
  // Validation for custom amount
  const customAmountNum = parseFloat(customAmount) || 0;
  const customAmountError = useMemo(() => {
    if (paymentType !== 'custom') return null;
    if (!customAmount || customAmount.trim() === '') return "Amount is required";
    if (isNaN(customAmountNum) || customAmountNum <= 0) return "Enter a valid amount";
    if (clientMaxAmount > 0 && customAmountNum > clientMaxAmount) {
      return `Cannot exceed client rate (£${clientMaxAmount.toFixed(2)})`;
    }
    return null;
  }, [paymentType, customAmount, customAmountNum, clientMaxAmount]);

  const isValid = reason && (!isOtherReason || details.trim().length > 0) && 
    (!payStaff || paymentType !== 'custom' || !customAmountError);

  // Calculate payment amount based on selection
  const calculatedPaymentAmount = useMemo(() => {
    if (!payStaff) return 0;
    switch (paymentType) {
      case 'full': return carerFullAmount;
      case 'half': return carerFullAmount / 2;
      case 'custom': return customAmountNum;
      default: return 0;
    }
  }, [payStaff, paymentType, carerFullAmount, customAmountNum]);

  // Fetch rates when dialog opens
  useEffect(() => {
    const fetchRates = async () => {
      if (!open || !bookingDetails?.staffId) {
        setCarerFullAmount(0);
        setClientMaxAmount(0);
        return;
      }

      setIsLoadingRates(true);
      try {
        // Calculate duration in minutes
        let durationMinutes = 60; // default 1 hour
        if (bookingDetails.startTime && bookingDetails.endTime) {
          const start = new Date(bookingDetails.startTime);
          const end = new Date(bookingDetails.endTime);
          durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        }
        const durationHours = durationMinutes / 60;

        // Fetch staff rate
        const { data: staffRates } = await supabase
          .from('staff_rate_schedules')
          .select('base_rate, rate_60_minutes, charge_type')
          .eq('staff_id', bookingDetails.staffId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (staffRates && staffRates.length > 0) {
          const staffRate = staffRates[0];
          // Use rate_60_minutes for hourly or base_rate
          const hourlyRate = staffRate.rate_60_minutes || staffRate.base_rate || 12;
          if (staffRate.charge_type === 'hourly' || staffRate.charge_type === 'per_hour') {
            setCarerFullAmount(hourlyRate * durationHours);
          } else {
            setCarerFullAmount(hourlyRate);
          }
        } else {
          // Default hourly rate if no schedule found
          setCarerFullAmount(12 * durationHours); // £12/hour default
        }

        // Fetch client rate for validation max
        if (bookingDetails.clientId) {
          const { data: clientRates } = await supabase
            .from('client_rate_schedules')
            .select('base_rate, rate_60_minutes, charge_type')
            .eq('client_id', bookingDetails.clientId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);

          if (clientRates && clientRates.length > 0) {
            const clientRate = clientRates[0];
            const hourlyRate = clientRate.rate_60_minutes || clientRate.base_rate || 0;
            if (clientRate.charge_type === 'hourly' || clientRate.charge_type === 'per_hour') {
              setClientMaxAmount(hourlyRate * durationHours);
            } else {
              setClientMaxAmount(hourlyRate);
            }
          } else {
            // No client rate = no max limit
            setClientMaxAmount(0);
          }
        }
      } catch (error) {
        console.error('[AdvancedCancellationDialog] Error fetching rates:', error);
        // Use defaults
        setCarerFullAmount(12); // £12 default
        setClientMaxAmount(0);
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchRates();
  }, [open, bookingDetails?.staffId, bookingDetails?.clientId, bookingDetails?.startTime, bookingDetails?.endTime]);

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
      paymentType: payStaff ? paymentType : 'none',
      paymentAmount: calculatedPaymentAmount,
      sendNotification,
    });
  };

  const handleCancel = () => {
    setReason("");
    setDetails("");
    setRemoveFromInvoice(true);
    setPayStaff(false);
    setPaymentType('full');
    setCustomAmount("");
    setSendNotification(true);
    onOpenChange(false);
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setReason("");
      setDetails("");
      setRemoveFromInvoice(true);
      setPayStaff(false);
      setPaymentType('full');
      setCustomAmount("");
      setSendNotification(true);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
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
              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pay-staff" className="text-sm font-medium cursor-pointer">
                      Pay Staff/Carer
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Process payment for the assigned carer
                    </p>
                  </div>
                  <Switch
                    id="pay-staff"
                    checked={payStaff}
                    onCheckedChange={setPayStaff}
                  />
                </div>

                {/* Payment Options - Show when payStaff is enabled */}
                {payStaff && (
                  <div className="ml-4 pt-2 border-t space-y-3">
                    {isLoadingRates ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Calculating rates...
                      </div>
                    ) : (
                      <RadioGroup 
                        value={paymentType} 
                        onValueChange={(val) => setPaymentType(val as StaffPaymentType)}
                        className="space-y-2"
                      >
                        {/* Full Amount */}
                        <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                          <RadioGroupItem value="full" id="payment-full" />
                          <Label htmlFor="payment-full" className="flex-1 cursor-pointer">
                            <span className="font-medium">Pay Full Amount</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              (£{carerFullAmount.toFixed(2)})
                            </span>
                          </Label>
                        </div>

                        {/* Half Amount */}
                        <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                          <RadioGroupItem value="half" id="payment-half" />
                          <Label htmlFor="payment-half" className="flex-1 cursor-pointer">
                            <span className="font-medium">Pay Half Amount</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              (£{(carerFullAmount / 2).toFixed(2)})
                            </span>
                          </Label>
                        </div>

                        {/* Custom Amount */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                            <RadioGroupItem value="custom" id="payment-custom" />
                            <Label htmlFor="payment-custom" className="flex-1 cursor-pointer">
                              <span className="font-medium">Custom Amount</span>
                            </Label>
                          </div>
                          
                          {paymentType === 'custom' && (
                            <div className="ml-8 space-y-1">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={clientMaxAmount > 0 ? clientMaxAmount : undefined}
                                  value={customAmount}
                                  onChange={(e) => setCustomAmount(e.target.value)}
                                  placeholder="Enter amount"
                                  className="pl-7"
                                />
                              </div>
                              {customAmountError && (
                                <p className="text-xs text-destructive">{customAmountError}</p>
                              )}
                              {clientMaxAmount > 0 && !customAmountError && (
                                <p className="text-xs text-muted-foreground">
                                  Maximum: £{clientMaxAmount.toFixed(2)} (client rate)
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </RadioGroup>
                    )}

                    {/* Payment Summary */}
                    {!isLoadingRates && paymentType && (
                      <div className="bg-muted/50 rounded-md p-2 text-sm">
                        <span className="text-muted-foreground">Payment to carer: </span>
                        <span className="font-medium text-primary">
                          £{calculatedPaymentAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
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
            disabled={!isValid || isLoading || isLoadingRates}
          >
            {isLoading ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}