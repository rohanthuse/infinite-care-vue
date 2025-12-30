import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { ServiceActionForm } from "@/components/care/forms/ServiceActionForm";
import { ServiceActionData, getDefaultServiceAction } from "@/types/serviceAction";
import { useBranchServices } from "@/data/hooks/useBranchServices";
import { useTenant } from "@/contexts/TenantContext";
import { useUserRole } from "@/hooks/useUserRole";
import { getUserDisplayName } from "@/utils/userDisplayName";

interface AddServiceActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  clientId: string;
  carePlanId?: string;
  branchId?: string;
  isLoading?: boolean;
}

export const AddServiceActionDialog: React.FC<AddServiceActionDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  clientId,
  carePlanId,
  branchId,
  isLoading = false,
}) => {
  const { organization } = useTenant();
  const { data: services } = useBranchServices(branchId, organization?.id);
  const { data: currentUser } = useUserRole();

  const form = useForm<{ temp_service_action: ServiceActionData }>({
    defaultValues: {
      temp_service_action: getDefaultServiceAction(),
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        temp_service_action: getDefaultServiceAction(),
      });
    }
  }, [open, form]);

  const formatDuration = (action: ServiceActionData): string => {
    if (action.schedule_type === 'shift' && action.shift_times?.length) {
      return action.shift_times.join(', ');
    }
    if (action.start_time && action.end_time) {
      return `${action.start_time} - ${action.end_time}`;
    }
    return 'As needed';
  };

  const formatScheduleDetails = (action: ServiceActionData): string => {
    const parts: string[] = [];
    
    if (action.schedule_type === 'shift' && action.shift_times?.length) {
      parts.push(`Shifts: ${action.shift_times.join(', ')}`);
    } else if (action.schedule_type === 'time_specific') {
      if (action.start_time || action.end_time) {
        parts.push(`Time: ${action.start_time || '--'} - ${action.end_time || '--'}`);
      }
    }
    
    if (action.selected_days?.length) {
      parts.push(`Days: ${action.selected_days.join(', ')}`);
    }
    
    if (action.instructions) {
      parts.push(`Instructions: ${action.instructions}`);
    }
    
    return parts.join(' | ') || '';
  };

  const formatDate = (date: Date | string | null): string | null => {
    if (!date) return null;
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    return date.toISOString().split('T')[0];
  };

  const handleSave = () => {
    const actionData = form.getValues("temp_service_action");
    
    // Validate required field
    if (!actionData?.action_name) {
      return;
    }

    // Transform ServiceActionData to database format
    const formattedData = {
      client_id: clientId,
      care_plan_id: carePlanId || null,
      service_name: actionData.action_name,
      service_category: actionData.action_type || 'new',
      provider_name: getUserDisplayName(currentUser) || 'Care Team',
      frequency: actionData.frequency || 'As needed',
      duration: formatDuration(actionData),
      schedule_details: formatScheduleDetails(actionData),
      goals: actionData.required_written_outcome && actionData.written_outcome 
        ? [actionData.written_outcome] 
        : null,
      progress_status: actionData.status || 'active',
      start_date: formatDate(actionData.start_date) || new Date().toISOString().split('T')[0],
      end_date: formatDate(actionData.end_date),
      notes: actionData.notes || null,
    };
    
    onSave(formattedData);
  };

  const handleCancel = () => {
    form.reset({
      temp_service_action: getDefaultServiceAction(),
    });
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset({
        temp_service_action: getDefaultServiceAction(),
      });
    }
    onOpenChange(newOpen);
  };

  // Transform services to the format expected by ServiceActionForm
  const formattedServices = services?.map(service => ({
    id: service.id,
    title: service.title,
  })) || [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Service Action</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <ServiceActionForm
              form={form}
              fieldPrefix="temp_service_action"
              services={formattedServices}
              onSave={handleSave}
              onCancel={handleCancel}
              isEditing={false}
              actionNumber={1}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
