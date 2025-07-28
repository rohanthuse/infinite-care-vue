
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TravelRecord } from "@/hooks/useAccountingData";
import { toast } from "sonner";
import { createFutureDateValidation, createPositiveNumberValidation } from "@/utils/validationUtils";
import { useBranchStaffAndClients } from "@/hooks/useBranchStaffAndClients";

const travelSchema = z.object({
  travel_date: createFutureDateValidation("Travel date"),
  start_location: z.string().min(1, "Start location is required"),
  end_location: z.string().min(1, "End location is required"),
  distance_miles: createPositiveNumberValidation("Distance", 0.1),
  travel_time_minutes: z.number().min(1, "Travel time must be at least 1 minute").optional(),
  vehicle_type: z.enum(["car_personal", "car_company", "public_transport", "taxi", "other"]),
  mileage_rate: createPositiveNumberValidation("Mileage rate", 0.01),
  total_cost: createPositiveNumberValidation("Total cost"),
  purpose: z.string().min(5, "Purpose must be at least 5 characters"),
  receipt_url: z.string().optional(),
  notes: z.string().optional(),
  client_id: z.string().optional(),
  staff_id: z.string().min(1, "Staff member selection is required"),
}).refine((data) => {
  // Validate reasonable distance limits
  return data.distance_miles <= 500;
}, {
  message: "Distance cannot exceed 500 miles for a single journey",
  path: ["distance_miles"]
}).refine((data) => {
  // Validate travel time vs distance relationship (basic sanity check)
  if (!data.travel_time_minutes) return true;
  const avgSpeedMph = (data.distance_miles / data.travel_time_minutes) * 60;
  return avgSpeedMph <= 200; // Maximum reasonable speed
}, {
  message: "Travel time seems unrealistic for the distance",
  path: ["travel_time_minutes"]
}).refine((data) => {
  // Validate cost reasonableness for mileage-based vehicles
  if (data.vehicle_type === "car_personal" || data.vehicle_type === "car_company") {
    const calculatedCost = data.distance_miles * data.mileage_rate;
    const variance = Math.abs(data.total_cost - calculatedCost);
    return variance <= 1; // Allow £1 variance for rounding
  }
  return true;
}, {
  message: "Total cost should match distance × mileage rate for personal/company vehicles",
  path: ["total_cost"]
});

type TravelFormData = z.infer<typeof travelSchema>;

interface AddTravelRecordDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (travelData: Omit<TravelRecord, "id" | "status" | "created_at" | "updated_at" | "staff" | "client">) => void;
  initialData?: TravelRecord;
  isEditing?: boolean;
  branchId?: string;
}

const vehicleTypeLabels = {
  car_personal: "Personal Car",
  car_company: "Company Car",
  public_transport: "Public Transport",
  taxi: "Taxi",
  other: "Other"
};

const AddTravelRecordDialog: React.FC<AddTravelRecordDialogProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isEditing = false,
  branchId,
}) => {
  // Fetch staff and clients for the branch
  const { staff, clients, isLoading } = useBranchStaffAndClients(branchId || "");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TravelFormData>({
    resolver: zodResolver(travelSchema),
  });

  // Reset form when dialog opens/closes or when initialData changes
  React.useEffect(() => {
    if (open) {
      if (initialData && isEditing) {
        // Convert string numbers to actual numbers for editing
        reset({
          travel_date: initialData.travel_date,
          start_location: initialData.start_location,
          end_location: initialData.end_location,
          distance_miles: typeof initialData.distance_miles === 'string' 
            ? parseFloat(initialData.distance_miles) 
            : initialData.distance_miles,
          travel_time_minutes: initialData.travel_time_minutes || undefined,
          vehicle_type: initialData.vehicle_type as any,
          mileage_rate: typeof initialData.mileage_rate === 'string' 
            ? parseFloat(initialData.mileage_rate) 
            : initialData.mileage_rate,
          total_cost: typeof initialData.total_cost === 'string' 
            ? parseFloat(initialData.total_cost) 
            : initialData.total_cost,
          purpose: initialData.purpose,
          receipt_url: initialData.receipt_url || "",
          notes: initialData.notes || "",
          client_id: initialData.client_id || "",
          staff_id: initialData.staff_id || "",
        });
      } else {
        // Reset to default values for new record
        reset({
          travel_date: new Date().toISOString().split('T')[0],
          start_location: "",
          end_location: "",
          distance_miles: 0,
          travel_time_minutes: undefined,
          vehicle_type: "car_personal",
          mileage_rate: 0.45,
          total_cost: 0,
          purpose: "",
          receipt_url: "",
          notes: "",
          client_id: "",
          staff_id: "",
        });
      }
    }
  }, [open, initialData, isEditing, reset]);

  const watchedValues = watch();

  // Auto-calculate total cost for mileage-based vehicles
  React.useEffect(() => {
    if (watchedValues.vehicle_type === 'car_personal' || watchedValues.vehicle_type === 'car_company') {
      const calculatedCost = (watchedValues.distance_miles || 0) * (watchedValues.mileage_rate || 0);
      setValue("total_cost", parseFloat(calculatedCost.toFixed(2)));
    }
  }, [watchedValues.distance_miles, watchedValues.mileage_rate, watchedValues.vehicle_type, setValue]);

  const onSubmit = async (data: TravelFormData) => {
    try {
      if (!branchId) {
        toast.error('Branch ID is required');
        return;
      }

      const travelData: Omit<TravelRecord, "id" | "status" | "created_at" | "updated_at" | "staff" | "client"> = {
        branch_id: branchId,
        staff_id: data.staff_id,
        client_id: data.client_id || null,
        booking_id: initialData?.booking_id || null,
        travel_date: data.travel_date,
        start_location: data.start_location,
        end_location: data.end_location,
        distance_miles: data.distance_miles,
        travel_time_minutes: data.travel_time_minutes || null,
        vehicle_type: data.vehicle_type,
        mileage_rate: data.mileage_rate,
        total_cost: data.total_cost,
        purpose: data.purpose,
        receipt_url: data.receipt_url || null,
        notes: data.notes || null,
        // Preserve existing approval status when editing
        approved_by: initialData?.approved_by || null,
        approved_at: initialData?.approved_at || null,
        reimbursed_at: initialData?.reimbursed_at || null,
      };

      await onSave(travelData);
      if (!isEditing) {
        reset();
      }
      onClose();
    } catch (error) {
      console.error('Error saving travel record:', error);
      toast.error('Failed to save travel record');
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
          <DialogTitle>
            {isEditing ? "Edit Travel Record" : "Add New Travel Record"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="travel_date">Date *</Label>
              <Input
                id="travel_date"
                type="date"
                {...register("travel_date")}
                className={errors.travel_date ? "border-red-500" : ""}
              />
              {errors.travel_date && (
                <p className="text-sm text-red-600">{errors.travel_date.message}</p>
              )}
            </div>

            {/* Vehicle Type */}
            <div className="space-y-2">
              <Label htmlFor="vehicle_type">Vehicle Type *</Label>
              <Select 
                value={watchedValues.vehicle_type} 
                onValueChange={(value) => setValue("vehicle_type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(vehicleTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicle_type && (
                <p className="text-sm text-red-600">{errors.vehicle_type.message}</p>
              )}
            </div>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_location">Start Location *</Label>
              <Input
                id="start_location"
                {...register("start_location")}
                placeholder="Starting point"
                className={errors.start_location ? "border-red-500" : ""}
              />
              {errors.start_location && (
                <p className="text-sm text-red-600">{errors.start_location.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_location">End Location *</Label>
              <Input
                id="end_location"
                {...register("end_location")}
                placeholder="Destination"
                className={errors.end_location ? "border-red-500" : ""}
              />
              {errors.end_location && (
                <p className="text-sm text-red-600">{errors.end_location.message}</p>
              )}
            </div>
          </div>

          {/* Distance and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distance_miles">Distance (miles) *</Label>
              <Input
                id="distance_miles"
                type="number"
                step="0.1"
                min="0"
                {...register("distance_miles", { valueAsNumber: true })}
                className={errors.distance_miles ? "border-red-500" : ""}
              />
              {errors.distance_miles && (
                <p className="text-sm text-red-600">{errors.distance_miles.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="travel_time_minutes">Duration (minutes)</Label>
              <Input
                id="travel_time_minutes"
                type="number"
                step="1"
                min="0"
                {...register("travel_time_minutes", { valueAsNumber: true })}
                className={errors.travel_time_minutes ? "border-red-500" : ""}
              />
              {errors.travel_time_minutes && (
                <p className="text-sm text-red-600">{errors.travel_time_minutes.message}</p>
              )}
            </div>

            {/* Cost section */}
            {(watchedValues.vehicle_type === 'car_personal' || watchedValues.vehicle_type === 'car_company') ? (
              <div className="space-y-2">
                <Label htmlFor="mileage_rate">Rate per Mile (£) *</Label>
                <Input
                  id="mileage_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("mileage_rate", { valueAsNumber: true })}
                  className={errors.mileage_rate ? "border-red-500" : ""}
                />
                {errors.mileage_rate && (
                  <p className="text-sm text-red-600">{errors.mileage_rate.message}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="total_cost">Total Cost (£) *</Label>
                <Input
                  id="total_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("total_cost", { valueAsNumber: true })}
                  className={errors.total_cost ? "border-red-500" : ""}
                />
                {errors.total_cost && (
                  <p className="text-sm text-red-600">{errors.total_cost.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose *</Label>
            <Input
              id="purpose"
              {...register("purpose")}
              placeholder="Reason for travel"
              className={errors.purpose ? "border-red-500" : ""}
            />
            {errors.purpose && (
              <p className="text-sm text-red-600">{errors.purpose.message}</p>
            )}
          </div>

          {/* Client and Carer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client Name (if applicable)</Label>
              {isLoading ? (
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
              ) : (
                <Select
                  value={watchedValues.client_id || ""}
                  onValueChange={(value) => setValue("client_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.last_name}, {client.first_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff_id">Staff Member *</Label>
              {isLoading ? (
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
              ) : (
                <Select
                  value={watchedValues.staff_id || ""}
                  onValueChange={(value) => setValue("staff_id", value)}
                >
                  <SelectTrigger className={errors.staff_id ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.last_name}, {member.first_name}
                        {member.specialization && ` (${member.specialization})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.staff_id && (
                <p className="text-sm text-red-600">{errors.staff_id.message}</p>
              )}
            </div>
          </div>

          {/* Receipt URL */}
          <div className="space-y-2">
            <Label htmlFor="receipt_url">Receipt URL (optional)</Label>
            <Input
              id="receipt_url"
              {...register("receipt_url")}
              placeholder="Receipt reference or URL"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Any additional details"
              rows={3}
            />
          </div>

          {/* Calculated total */}
          {(watchedValues.vehicle_type === 'car_personal' || watchedValues.vehicle_type === 'car_company') && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Cost:</span>
                <span className="font-bold">£{(watchedValues.total_cost || 0).toFixed(2)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Calculated as {(watchedValues.distance_miles || 0).toFixed(1)} miles × £{(watchedValues.mileage_rate || 0).toFixed(2)} per mile
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? "Update" : "Save"} Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTravelRecordDialog;
