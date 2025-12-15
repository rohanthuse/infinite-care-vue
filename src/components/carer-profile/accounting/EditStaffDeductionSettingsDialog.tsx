import React, { useEffect } from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  StaffDeductionSettings,
  useCreateStaffDeductionSettings,
  useUpdateStaffDeductionSettings,
} from "@/hooks/useStaffDeductionSettings";

const formSchema = z.object({
  tax_amount: z.coerce.number().min(0, "Tax must be 0 or more").default(0),
  ni_amount: z.coerce.number().min(0, "National Insurance must be 0 or more").default(0),
  pension_amount: z.coerce.number().min(0, "Pension must be 0 or more").default(0),
  other_deductions_amount: z.coerce.number().min(0, "Other Deductions must be 0 or more").default(0),
  effective_from: z.string().min(1, "Effective From date is required"),
  effective_until: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditStaffDeductionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  branchId?: string;
  organizationId?: string;
  existingSettings?: StaffDeductionSettings;
}

export const EditStaffDeductionSettingsDialog: React.FC<EditStaffDeductionSettingsDialogProps> = ({
  open,
  onOpenChange,
  staffId,
  branchId,
  organizationId,
  existingSettings,
}) => {
  const createSettings = useCreateStaffDeductionSettings();
  const updateSettings = useUpdateStaffDeductionSettings();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tax_amount: 0,
      ni_amount: 0,
      pension_amount: 0,
      other_deductions_amount: 0,
      effective_from: format(new Date(), 'yyyy-MM-dd'),
      effective_until: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (existingSettings) {
      form.reset({
        tax_amount: existingSettings.tax_amount || 0,
        ni_amount: existingSettings.ni_amount || 0,
        pension_amount: existingSettings.pension_amount || 0,
        other_deductions_amount: existingSettings.other_deductions_amount || 0,
        effective_from: existingSettings.effective_from || format(new Date(), 'yyyy-MM-dd'),
        effective_until: existingSettings.effective_until || "",
        notes: existingSettings.notes || "",
      });
    } else {
      form.reset({
        tax_amount: 0,
        ni_amount: 0,
        pension_amount: 0,
        other_deductions_amount: 0,
        effective_from: format(new Date(), 'yyyy-MM-dd'),
        effective_until: "",
        notes: "",
      });
    }
  }, [existingSettings, form, open]);

  const onSubmit = async (data: FormData) => {
    try {
      const settingsData = {
        staff_id: staffId,
        branch_id: branchId,
        organization_id: organizationId,
        tax_amount: data.tax_amount,
        ni_amount: data.ni_amount,
        pension_amount: data.pension_amount,
        other_deductions_amount: data.other_deductions_amount,
        effective_from: data.effective_from,
        effective_until: data.effective_until || undefined,
        is_active: true,
        notes: data.notes || undefined,
        // Individual active flags - preserve existing values or default to true
        tax_active: existingSettings?.tax_active ?? true,
        ni_active: existingSettings?.ni_active ?? true,
        pension_active: existingSettings?.pension_active ?? true,
        other_deductions_active: existingSettings?.other_deductions_active ?? true,
        // Keep existing fields with defaults for backward compatibility
        tax_code: "1257L",
        tax_rate: 20,
        use_custom_tax_rate: false,
        ni_category: "A",
        ni_rate: 12,
        use_custom_ni_rate: false,
        pension_opted_in: data.pension_amount > 0,
        pension_percentage: 0,
        employer_pension_percentage: 0,
        has_student_loan: false,
        other_deductions: [],
      };

      if (existingSettings?.id) {
        await updateSettings.mutateAsync({ id: existingSettings.id, ...settingsData });
      } else {
        await createSettings.mutateAsync(settingsData);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving deduction settings:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {existingSettings ? "Edit Deduction Settings" : "Set Up Deduction Settings"}
          </DialogTitle>
          <DialogDescription>
            Configure fixed monthly deduction amounts for this staff member.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Deductions Section */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-foreground">Deductions</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tax_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax (£) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ni_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>National Insurance (£) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pension_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pension (£) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="other_deductions_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Deductions (£) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Effective Dates Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="effective_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective From *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="effective_until"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective Until (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any notes about these deduction settings..."
                        className="resize-none"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createSettings.isPending || updateSettings.isPending}
              >
                {createSettings.isPending || updateSettings.isPending 
                  ? 'Saving...' 
                  : existingSettings ? 'Save Changes' : 'Create Settings'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
