import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { HelpCircle, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  useSuspendClient, 
  useUpdateSuspension, 
  useDeleteSuspension,
  useSuspensionHistory 
} from "@/hooks/useClientSuspensions";
import { useToast } from "@/hooks/use-toast";
import { SuspensionHistoryTable } from "./SuspensionHistoryTable";
import { SuspensionDetailsDialog } from "./SuspensionDetailsDialog";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

const suspendFormSchema = z.object({
  fromDateTime: z.string().min(1, "From date is required"),
  untilDateTime: z.string().optional(),
  reason: z.string().min(1, "This field is required"),
  description: z.string().optional(),
  removeFromInvoice: z.boolean().default(false),
  payStaff: z.boolean().default(false),
});

type SuspendFormValues = z.infer<typeof suspendFormSchema>;

interface SuspendTabProps {
  clientId: string;
}

const reasonOptions = [
  "Hospital Admission",
  "Holiday", 
  "Staying with Family",
  "A Family Member Helping",
  "Other"
];

export const SuspendTab: React.FC<SuspendTabProps> = ({ clientId }) => {
  const { toast } = useToast();
  const suspendMutation = useSuspendClient();
  const updateMutation = useUpdateSuspension();
  const deleteMutation = useDeleteSuspension();
  const { data: suspensionHistory = [] } = useSuspensionHistory(clientId);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSuspension, setEditingSuspension] = useState<any>(null);
  const [viewingSuspension, setViewingSuspension] = useState<any>(null);
  const [deletingSuspension, setDeletingSuspension] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const form = useForm<SuspendFormValues>({
    resolver: zodResolver(suspendFormSchema),
    defaultValues: {
      fromDateTime: "",
      untilDateTime: "",
      reason: "",
      description: "",
      removeFromInvoice: false,
      payStaff: false,
    },
  });

  const resetForm = () => {
    form.reset();
    setIsEditMode(false);
    setEditingSuspension(null);
  };

  const onSubmit = async (values: SuspendFormValues) => {
    try {
      if (isEditMode && editingSuspension) {
        // Update existing suspension
        await updateMutation.mutateAsync({
          suspensionId: editingSuspension.id,
          clientId,
          data: {
            suspension_type: (values.untilDateTime ? "temporary" : "indefinite") as "temporary" | "indefinite",
            reason: values.reason,
            details: values.description || null,
            effective_from: values.fromDateTime,
            effective_until: values.untilDateTime || null,
          },
        });

        toast({
          title: "Success",
          description: "Suspension has been updated successfully.",
        });

        resetForm();
      } else {
        // Create new suspension
        const suspensionData = {
          suspension_type: (values.untilDateTime ? "temporary" : "indefinite") as "temporary" | "indefinite",
          reason: values.reason,
          details: values.description || null,
          effective_from: values.fromDateTime,
          effective_until: values.untilDateTime || null,
          apply_to: {
            visits: true,
            serviceActions: true,
            billing: !values.removeFromInvoice,
            messaging: true,
          },
          notify: {
            client: true,
            nextOfKin: false,
            carers: values.payStaff,
            admin: true,
            ccEmails: [],
          },
          attachments: [],
        };

        await suspendMutation.mutateAsync({
          clientId,
          data: suspensionData,
        });

        toast({
          title: "Success",
          description: "Client has been suspended successfully.",
        });

        form.reset();
      }
    } catch (error) {
      console.error("Error with suspension:", error);
      toast({
        title: "Error",
        description: isEditMode 
          ? "Failed to update suspension. Please try again." 
          : "Failed to suspend client. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleView = (suspension: any) => {
    console.log('[SuspendTab] Opening suspension details:', suspension.id);
    setViewingSuspension(suspension);
    setShowViewDialog(true);
  };

  const handleViewDialogClose = (open: boolean) => {
    console.log('[SuspendTab] Dialog state changing to:', open);
    setShowViewDialog(open);
    if (!open) {
      console.log('[SuspendTab] Clearing viewingSuspension');
      setViewingSuspension(null);
    }
  };

  // Cleanup effect to ensure no lingering scroll locks
  React.useEffect(() => {
    return () => {
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('pointer-events');
    };
  }, [showViewDialog]);

  const handleEdit = (suspension: any) => {
    setIsEditMode(true);
    setEditingSuspension(suspension);
    
    // Pre-populate form with suspension data
    const fromDate = new Date(suspension.effective_from);
    const untilDate = suspension.effective_until ? new Date(suspension.effective_until) : null;
    
    // Calculate checkbox values from suspension data
    const removeFromInvoice = suspension.apply_to?.billing === false;
    const payStaff = suspension.notify?.carers === true;
    
    form.setValue("fromDateTime", fromDate.toISOString().slice(0, 16));
    form.setValue("untilDateTime", untilDate ? untilDate.toISOString().slice(0, 16) : "");
    form.setValue("reason", suspension.reason || "");
    form.setValue("description", suspension.details || "");
    form.setValue("removeFromInvoice", removeFromInvoice);
    form.setValue("payStaff", payStaff);
  };

  const handleDelete = (suspension: any) => {
    setDeletingSuspension(suspension);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingSuspension) return;

    try {
      await deleteMutation.mutateAsync({
        suspensionId: deletingSuspension.id,
        clientId,
      });

      toast({
        title: "Success",
        description: "Suspension has been deleted successfully.",
      });

      setShowDeleteDialog(false);
      setDeletingSuspension(null);
    } catch (error) {
      console.error("Error deleting suspension:", error);
      toast({
        title: "Error",
        description: "Failed to delete suspension. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  // Calculate summary statistics
  const suspensionStats = useMemo(() => {
    const totalSuspensions = suspensionHistory.filter(s => s.action === "suspend").length;
    const activeSuspensions = suspensionHistory.filter(s => {
      if (s.action !== "suspend") return false;
      const now = new Date();
      const from = new Date(s.effective_from);
      const until = s.effective_until ? new Date(s.effective_until) : null;
      return from <= now && (!until || until > now);
    }).length;
    const totalResumed = suspensionHistory.filter(s => s.action === "resume").length;

    return { totalSuspensions, activeSuspensions, totalResumed };
  }, [suspensionHistory]);

  return (
    <div className="max-w-4xl">
      {/* Summary Cards */}
      {suspensionHistory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Suspensions</p>
                <p className="text-2xl font-bold">{suspensionStats.totalSuspensions}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Suspensions</p>
                <p className="text-2xl font-bold">{suspensionStats.activeSuspensions}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Resumed</p>
                <p className="text-2xl font-bold">{suspensionStats.totalResumed}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Suspend Form */}
      <div className="border rounded-lg">
        <div className="bg-primary text-primary-foreground px-4 py-3 rounded-t-lg">
          <h3 className="text-lg font-semibold">
            {isEditMode ? "Edit Suspension" : "New Suspend"}
          </h3>
        </div>
        
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* From Field */}
              <FormField
                control={form.control}
                name="fromDateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      From <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        placeholder="dd-mm-yyyy hh:mm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Until Field */}
              <FormField
                control={form.control}
                name="untilDateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Until</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        placeholder="dd-mm-yyyy hh:mm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reason Field */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Reason <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reasonOptions.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter additional details..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Checkboxes with Help Tooltips */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="removeFromInvoice"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <div className="flex items-center gap-2">
                          <FormLabel className="text-sm font-normal">Remove from invoice</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm">
                                  When checked, this client will be <strong>excluded from all new invoices</strong> 
                                  during the suspension period. Use this when the client is temporarily unable 
                                  to receive services and should not be billed. Existing invoices will not be affected.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payStaff"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <div className="flex items-center gap-2">
                          <FormLabel className="text-sm font-normal">Pay Staff</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm">
                                  When checked, <strong>staff will still be paid</strong> for scheduled bookings 
                                  during the suspension period, even if visits don't occur. Use this when staff 
                                  need to be compensated for short-notice cancellations (e.g., emergency hospital admission).
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="destructive"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={suspendMutation.isPending || updateMutation.isPending}
                >
                  {suspendMutation.isPending || updateMutation.isPending 
                    ? (isEditMode ? "Updating..." : "Suspending...") 
                    : (isEditMode ? "Update" : "Suspend")
                  }
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Suspension History */}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">Suspension History</h3>
        <SuspensionHistoryTable
          suspensions={suspensionHistory}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Dialogs */}
      <SuspensionDetailsDialog
        suspension={viewingSuspension}
        open={showViewDialog}
        onOpenChange={handleViewDialogClose}
      />

      <ConfirmDeleteDialog
        suspension={deletingSuspension}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};