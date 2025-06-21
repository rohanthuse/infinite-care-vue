import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStaffList, useClientsList, ExtraTimeRecord, CreateExtraTimeRecord } from "@/hooks/useAccountingData";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { createFutureDateValidation, createTimeValidation, createOptionalTimeValidation, createPositiveNumberValidation } from "@/utils/validationUtils";

const extraTimeSchema = z.object({
  staff_id: z.string().min(1, "Staff member is required"),
  client_id: z.string().optional(),
  work_date: createFutureDateValidation("Work date"),
  scheduled_start_time: createTimeValidation("Scheduled start time"),
  scheduled_end_time: createTimeValidation("Scheduled end time"),
  actual_start_time: createOptionalTimeValidation("Actual start time"),
  actual_end_time: createOptionalTimeValidation("Actual end time"),
  hourly_rate: createPositiveNumberValidation("Hourly rate", 0.01),
  extra_time_rate: z.number().min(0, "Extra time rate must be positive").optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Validate scheduled time range
  const scheduledStart = new Date(`2000-01-01T${data.scheduled_start_time}`);
  const scheduledEnd = new Date(`2000-01-01T${data.scheduled_end_time}`);
  return scheduledStart < scheduledEnd;
}, {
  message: "Scheduled start time must be before scheduled end time",
  path: ["scheduled_end_time"]
}).refine((data) => {
  // Validate actual time range if both are provided
  if (!data.actual_start_time || !data.actual_end_time) return true;
  
  const actualStart = new Date(`2000-01-01T${data.actual_start_time}`);
  const actualEnd = new Date(`2000-01-01T${data.actual_end_time}`);
  return actualStart < actualEnd;
}, {
  message: "Actual start time must be before actual end time",
  path: ["actual_end_time"]
}).refine((data) => {
  // Validate minimum scheduled duration (at least 15 minutes)
  const scheduledStart = new Date(`2000-01-01T${data.scheduled_start_time}`);
  const scheduledEnd = new Date(`2000-01-01T${data.scheduled_end_time}`);
  const durationMinutes = (scheduledEnd.getTime() - scheduledStart.getTime()) / (1000 * 60);
  return durationMinutes >= 15;
}, {
  message: "Scheduled duration must be at least 15 minutes",
  path: ["scheduled_end_time"]
});

type ExtraTimeFormData = z.infer<typeof extraTimeSchema>;

interface AddExtraTimeDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateExtraTimeRecord) => Promise<void>;
  initialData?: ExtraTimeRecord;
  isEditing?: boolean;
  branchId?: string;
}

// Helper function to determine initial status based on creator role
const determineInitialStatus = (creatorRole: UserRole | undefined): string => {
  switch (creatorRole) {
    case 'super_admin':
      return 'approved'; // Auto-approved
    case 'branch_admin':
      return 'pending'; // Needs super admin approval
    case 'carer':
      return 'pending'; // Needs admin approval
    default:
      return 'pending';
  }
};

// Helper function to get approval message based on role
const getApprovalMessage = (creatorRole: UserRole | undefined): string => {
  switch (creatorRole) {
    case 'super_admin':
      return 'This record will be automatically approved as you are a Super Admin.';
    case 'branch_admin':
      return 'This record will require Super Admin approval.';
    case 'carer':
      return 'This record will require Branch Admin or Super Admin approval.';
    default:
      return 'This record will require approval.';
  }
};

const AddExtraTimeDialog: React.FC<AddExtraTimeDialogProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isEditing = false,
  branchId,
}) => {
  const { data: staffList = [], isLoading: staffLoading } = useStaffList(branchId);
  const { data: clientsList = [], isLoading: clientsLoading } = useClientsList(branchId);
  const { data: userRole } = useUserRole();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExtraTimeFormData>({
    resolver: zodResolver(extraTimeSchema),
    defaultValues: initialData ? {
      staff_id: initialData.staff_id,
      client_id: initialData.client_id || "no-client",
      work_date: initialData.work_date,
      scheduled_start_time: initialData.scheduled_start_time,
      scheduled_end_time: initialData.scheduled_end_time,
      actual_start_time: initialData.actual_start_time || "",
      actual_end_time: initialData.actual_end_time || "",
      hourly_rate: initialData.hourly_rate,
      extra_time_rate: initialData.extra_time_rate || initialData.hourly_rate,
      reason: initialData.reason || "",
      notes: initialData.notes || "",
    } : {
      hourly_rate: 15.00,
      extra_time_rate: 22.50,
      client_id: "no-client",
    },
  });

  const watchedValues = watch();

  // Calculate extra time and cost
  const calculateExtraTime = () => {
    const { scheduled_start_time, scheduled_end_time, actual_start_time, actual_end_time, hourly_rate, extra_time_rate } = watchedValues;
    
    if (!scheduled_start_time || !scheduled_end_time) return { extraMinutes: 0, totalCost: 0 };
    
    const scheduledStart = new Date(`2000-01-01T${scheduled_start_time}`);
    const scheduledEnd = new Date(`2000-01-01T${scheduled_end_time}`);
    const scheduledMinutes = (scheduledEnd.getTime() - scheduledStart.getTime()) / (1000 * 60);
    
    let actualMinutes = scheduledMinutes;
    if (actual_start_time && actual_end_time) {
      const actualStart = new Date(`2000-01-01T${actual_start_time}`);
      const actualEndTime = new Date(`2000-01-01T${actual_end_time}`);
      actualMinutes = (actualEndTime.getTime() - actualStart.getTime()) / (1000 * 60);
    }
    
    const extraMinutes = Math.max(0, actualMinutes - scheduledMinutes);
    const rate = extra_time_rate || hourly_rate || 0;
    const totalCost = (extraMinutes / 60) * rate;
    
    return { extraMinutes, totalCost };
  };

  const { extraMinutes, totalCost } = calculateExtraTime();
  
  // Get initial status and approval message based on user role
  const initialStatus = determineInitialStatus(userRole?.role);
  const approvalMessage = getApprovalMessage(userRole?.role);

  const onSubmit = async (data: ExtraTimeFormData) => {
    try {
      if (!branchId) {
        toast.error('Branch ID is required');
        return;
      }

      const { extraMinutes, totalCost } = calculateExtraTime();
      
      // Calculate scheduled duration
      const scheduledStart = new Date(`2000-01-01T${data.scheduled_start_time}`);
      const scheduledEnd = new Date(`2000-01-01T${data.scheduled_end_time}`);
      const scheduledDurationMinutes = (scheduledEnd.getTime() - scheduledStart.getTime()) / (1000 * 60);
      
      // Calculate actual duration if provided
      let actualDurationMinutes = scheduledDurationMinutes;
      if (data.actual_start_time && data.actual_end_time) {
        const actualStart = new Date(`2000-01-01T${data.actual_start_time}`);
        const actualEnd = new Date(`2000-01-01T${data.actual_end_time}`);
        actualDurationMinutes = (actualEnd.getTime() - actualStart.getTime()) / (1000 * 60);
      }

      const extraTimeData: CreateExtraTimeRecord = {
        branch_id: branchId,
        staff_id: data.staff_id,
        client_id: data.client_id === "no-client" ? null : data.client_id || null,
        booking_id: null,
        work_date: data.work_date,
        scheduled_start_time: data.scheduled_start_time,
        scheduled_end_time: data.scheduled_end_time,
        actual_start_time: data.actual_start_time || null,
        actual_end_time: data.actual_end_time || null,
        scheduled_duration_minutes: Math.round(scheduledDurationMinutes),
        actual_duration_minutes: Math.round(actualDurationMinutes),
        extra_time_minutes: Math.round(extraMinutes),
        hourly_rate: data.hourly_rate,
        extra_time_rate: data.extra_time_rate || data.hourly_rate,
        total_cost: totalCost,
        reason: data.reason || null,
        notes: data.notes || null,
        status: isEditing ? initialData?.status || 'pending' : initialStatus,
        approved_by: null,
        approved_at: null,
        invoiced: false,
        invoice_id: null,
        created_by: userRole?.id || null,
        creator_role: userRole?.role || null,
      };

      // Add auto-approval for super admin
      if (!isEditing && userRole?.role === 'super_admin') {
        extraTimeData.approved_by = userRole.id;
        extraTimeData.approved_at = new Date().toISOString();
      }

      await onSave(extraTimeData);
      reset();
      onClose();
    } catch (error) {
      console.error('Error saving extra time record:', error);
      toast.error('Failed to save extra time record');
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
          <DialogTitle>{isEditing ? 'Edit Extra Time Record' : 'Add Extra Time Record'}</DialogTitle>
          <DialogDescription>
            Record additional hours worked by a carer for approval.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Role-based approval information */}
          {!isEditing && userRole?.role && (
            <div className={`p-3 rounded-lg border ${
              userRole.role === 'super_admin' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className={`text-sm font-medium ${
                userRole.role === 'super_admin' ? 'text-green-800' : 'text-blue-800'
              }`}>
                Approval Status
              </div>
              <div className={`text-sm ${
                userRole.role === 'super_admin' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {approvalMessage}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="staff_id">Staff Member *</Label>
              <Select
                value={watchedValues.staff_id || ""}
                onValueChange={(value) => setValue("staff_id", value)}
                disabled={staffLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.first_name} {staff.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.staff_id && (
                <p className="text-sm text-red-600">{errors.staff_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_id">Client (Optional)</Label>
              <Select
                value={watchedValues.client_id || "no-client"}
                onValueChange={(value) => setValue("client_id", value)}
                disabled={clientsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-client">No specific client</SelectItem>
                  {clientsList.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="work_date">Work Date *</Label>
            <Input
              id="work_date"
              type="date"
              {...register("work_date")}
              className={errors.work_date ? "border-red-500" : ""}
            />
            {errors.work_date && (
              <p className="text-sm text-red-600">{errors.work_date.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_start_time">Scheduled Start Time *</Label>
              <Input
                id="scheduled_start_time"
                type="time"
                {...register("scheduled_start_time")}
                className={errors.scheduled_start_time ? "border-red-500" : ""}
              />
              {errors.scheduled_start_time && (
                <p className="text-sm text-red-600">{errors.scheduled_start_time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_end_time">Scheduled End Time *</Label>
              <Input
                id="scheduled_end_time"
                type="time"
                {...register("scheduled_end_time")}
                className={errors.scheduled_end_time ? "border-red-500" : ""}
              />
              {errors.scheduled_end_time && (
                <p className="text-sm text-red-600">{errors.scheduled_end_time.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actual_start_time">Actual Start Time</Label>
              <Input
                id="actual_start_time"
                type="time"
                {...register("actual_start_time")}
                className={errors.actual_start_time ? "border-red-500" : ""}
              />
              {errors.actual_start_time && (
                <p className="text-sm text-red-600">{errors.actual_start_time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_end_time">Actual End Time</Label>
              <Input
                id="actual_end_time"
                type="time"
                {...register("actual_end_time")}
                className={errors.actual_end_time ? "border-red-500" : ""}
              />
              {errors.actual_end_time && (
                <p className="text-sm text-red-600">{errors.actual_end_time.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Regular Hourly Rate (£) *</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                min="0"
                {...register("hourly_rate", { valueAsNumber: true })}
                className={errors.hourly_rate ? "border-red-500" : ""}
              />
              {errors.hourly_rate && (
                <p className="text-sm text-red-600">{errors.hourly_rate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="extra_time_rate">Extra Time Rate (£)</Label>
              <Input
                id="extra_time_rate"
                type="number"
                step="0.01"
                min="0"
                {...register("extra_time_rate", { valueAsNumber: true })}
              />
            </div>
          </div>

          {extraMinutes > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-800">Extra Time Calculation:</div>
              <div className="text-sm text-blue-600">
                Extra time: {Math.floor(extraMinutes / 60)}h {extraMinutes % 60}m
              </div>
              <div className="text-sm text-blue-600">
                Total cost: £{totalCost.toFixed(2)}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Extra Time</Label>
            <Textarea
              id="reason"
              placeholder="Explain why extra time was necessary..."
              {...register("reason")}
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              {...register("notes")}
              className="min-h-[60px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Record' : 'Add Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExtraTimeDialog;
