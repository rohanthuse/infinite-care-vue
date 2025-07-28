
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ServiceRate } from "@/hooks/useAccountingData";
import { toast } from "sonner";
import { createDateValidation, createPositiveNumberValidation } from "@/utils/validationUtils";
import { useUserRole } from "@/hooks/useUserRole";

const rateSchema = z.object({
  service_name: z.string().min(1, "Service name is required"),
  service_code: z.string().min(1, "Service code is required"),
  rate_type: z.enum(["hourly", "daily", "weekly", "monthly", "fixed"]),
  amount: createPositiveNumberValidation("Amount", 0.01),
  effective_from: createDateValidation("Effective from date"),
  effective_to: z.string().optional(),
  client_type: z.enum(["private", "local_authority", "nhs", "insurance", "other"]),
  funding_source: z.enum(["self_funded", "direct_payment", "local_authority", "nhs", "insurance", "other"]),
  applicable_days: z.array(z.string()).min(1, "At least one day must be selected"),
  status: z.enum(["active", "pending", "expired", "discontinued"]),
  description: z.string().optional(),
  is_default: z.boolean(),
}).refine((data) => {
  // Validate effective date range
  if (!data.effective_to) return true;
  const fromDate = new Date(data.effective_from);
  const toDate = new Date(data.effective_to);
  return fromDate <= toDate;
}, {
  message: "Effective from date must be before or equal to effective to date",
  path: ["effective_to"]
}).refine((data) => {
  // Validate effective period is not too long (max 5 years)
  if (!data.effective_to) return true;
  const fromDate = new Date(data.effective_from);
  const toDate = new Date(data.effective_to);
  const diffYears = (toDate.getTime() - fromDate.getTime()) / (1000 * 3600 * 24 * 365);
  return diffYears <= 5;
}, {
  message: "Effective period cannot exceed 5 years",
  path: ["effective_to"]
});

type RateFormData = z.infer<typeof rateSchema>;

interface AddRateDialogProps {
  open: boolean;
  onClose: () => void;
  onAddRate: (rate: ServiceRate) => void;
  initialRate?: ServiceRate;
  branchId?: string;
}

const rateTypeLabels = {
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  fixed: "Fixed Rate"
};

const clientTypeLabels = {
  private: "Private",
  local_authority: "Local Authority",
  nhs: "NHS",
  insurance: "Insurance",
  other: "Other"
};

const fundingSourceLabels = {
  self_funded: "Self-funded",
  direct_payment: "Direct Payment",
  local_authority: "Local Authority",
  nhs: "NHS",
  insurance: "Insurance",
  other: "Other"
};

const AddRateDialog: React.FC<AddRateDialogProps> = ({
  open,
  onClose,
  onAddRate,
  initialRate,
  branchId,
}) => {
  console.log('[AddRateDialog] Received props:', { branchId, open, initialRate });
  const isEditing = Boolean(initialRate);
  const { data: currentUser } = useUserRole();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RateFormData>({
    resolver: zodResolver(rateSchema),
    defaultValues: initialRate ? {
      service_name: initialRate.service_name,
      service_code: initialRate.service_code,
      rate_type: initialRate.rate_type as any,
      amount: initialRate.amount,
      effective_from: initialRate.effective_from,
      effective_to: initialRate.effective_to || "",
      client_type: initialRate.client_type as any,
      funding_source: initialRate.funding_source as any,
      applicable_days: initialRate.applicable_days,
      status: initialRate.status as any,
      description: initialRate.description || "",
      is_default: initialRate.is_default,
    } : {
      service_name: "",
      service_code: "",
      rate_type: "hourly",
      amount: 0,
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: "",
      client_type: "private",
      funding_source: "self_funded",
      applicable_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      status: "active",
      description: "",
      is_default: false,
    },
  });

  const watchedValues = watch();

  const dayOptions = [
    { id: "monday", label: "Monday" },
    { id: "tuesday", label: "Tuesday" },
    { id: "wednesday", label: "Wednesday" },
    { id: "thursday", label: "Thursday" },
    { id: "friday", label: "Friday" },
    { id: "saturday", label: "Saturday" },
    { id: "sunday", label: "Sunday" },
  ];

  const handleDayToggle = (day: string) => {
    const currentDays = watchedValues.applicable_days || [];
    if (currentDays.includes(day)) {
      setValue("applicable_days", currentDays.filter((d) => d !== day));
    } else {
      setValue("applicable_days", [...currentDays, day]);
    }
  };

  const selectAllDays = () => {
    setValue("applicable_days", dayOptions.map((day) => day.id));
  };

  const clearAllDays = () => {
    setValue("applicable_days", []);
  };

  const onSubmit = async (data: RateFormData) => {
    try {
      if (!branchId) {
        toast.error('Branch ID is required');
        return;
      }

      if (!currentUser?.id) {
        toast.error('User authentication required');
        return;
      }

      const newRate: ServiceRate = {
        id: initialRate?.id || crypto.randomUUID(),
        branch_id: branchId,
        service_id: undefined,
        service_name: data.service_name,
        service_code: data.service_code,
        rate_type: data.rate_type,
        amount: data.amount,
        currency: "GBP",
        effective_from: data.effective_from,
        effective_to: data.effective_to || undefined,
        client_type: data.client_type,
        funding_source: data.funding_source,
        applicable_days: data.applicable_days,
        is_default: data.is_default,
        status: data.status,
        description: data.description || undefined,
        created_by: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      onAddRate(newRate);
      reset();
      onClose();
    } catch (error) {
      console.error('Error saving service rate:', error);
      toast.error('Failed to save service rate');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Rate" : "Add New Rate"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service_name">Service Name *</Label>
              <Input
                id="service_name"
                {...register("service_name")}
                placeholder="e.g. Standard Care"
                className={errors.service_name ? "border-red-500" : ""}
              />
              {errors.service_name && (
                <p className="text-sm text-red-600">{errors.service_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_code">Service Code *</Label>
              <Input
                id="service_code"
                {...register("service_code")}
                placeholder="e.g. SC001"
                className={errors.service_code ? "border-red-500" : ""}
              />
              {errors.service_code && (
                <p className="text-sm text-red-600">{errors.service_code.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate_type">Rate Type *</Label>
              <Select
                value={watchedValues.rate_type}
                onValueChange={(value) => setValue("rate_type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rate type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(rateTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rate_type && (
                <p className="text-sm text-red-600">{errors.rate_type.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (£) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                {...register("amount", { valueAsNumber: true })}
                placeholder="0.00"
                className={errors.amount ? "border-red-500" : ""}
              />
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effective_from">Effective From *</Label>
              <Input
                id="effective_from"
                type="date"
                {...register("effective_from")}
                className={errors.effective_from ? "border-red-500" : ""}
              />
              {errors.effective_from && (
                <p className="text-sm text-red-600">{errors.effective_from.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="effective_to">Effective To</Label>
              <Input
                id="effective_to"
                type="date"
                {...register("effective_to")}
                className={errors.effective_to ? "border-red-500" : ""}
              />
              {errors.effective_to && (
                <p className="text-sm text-red-600">{errors.effective_to.message}</p>
              )}
              <div className="text-xs text-gray-500">Leave blank if no end date</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_type">Client Type *</Label>
              <Select
                value={watchedValues.client_type}
                onValueChange={(value) => setValue("client_type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(clientTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_type && (
                <p className="text-sm text-red-600">{errors.client_type.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="funding_source">Funding Source *</Label>
              <Select
                value={watchedValues.funding_source}
                onValueChange={(value) => setValue("funding_source", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select funding source" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(fundingSourceLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.funding_source && (
                <p className="text-sm text-red-600">{errors.funding_source.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Applicable Days *</Label>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Select the days this rate applies to</span>
              <div className="space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllDays}>
                  Select All
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearAllDays}>
                  Clear All
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {dayOptions.map((day) => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.id}`}
                    checked={(watchedValues.applicable_days || []).includes(day.id)}
                    onCheckedChange={() => handleDayToggle(day.id)}
                  />
                  <Label htmlFor={`day-${day.id}`} className="cursor-pointer">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
            {errors.applicable_days && (
              <p className="text-sm text-red-600">{errors.applicable_days.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={watchedValues.status}
              onValueChange={(value) => setValue("status", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter additional details about this rate"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id="is_default"
              checked={watchedValues.is_default}
              onCheckedChange={(checked) => setValue("is_default", !!checked)}
            />
            <Label htmlFor="is_default" className="cursor-pointer">
              Set as default rate for this service and client type
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? "Save Changes" : "Add Rate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRateDialog;
