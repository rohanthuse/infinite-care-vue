import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, FileText, Percent, PiggyBank, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import {
  StaffDeductionSettings,
  useCreateStaffDeductionSettings,
  useUpdateStaffDeductionSettings,
  TAX_CODES,
  NI_CATEGORIES,
  STUDENT_LOAN_PLANS,
} from "@/hooks/useStaffDeductionSettings";

const otherDeductionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["fixed", "percentage"]),
  amount: z.coerce.number().min(0, "Amount must be positive"),
});

const formSchema = z.object({
  // Tax
  tax_code: z.string().default("1257L"),
  tax_rate: z.coerce.number().min(0).max(100).default(20),
  use_custom_tax_rate: z.boolean().default(false),
  
  // NI
  ni_category: z.string().default("A"),
  ni_rate: z.coerce.number().min(0).max(100).default(12),
  use_custom_ni_rate: z.boolean().default(false),
  
  // Pension
  pension_opted_in: z.boolean().default(true),
  pension_percentage: z.coerce.number().min(0).max(100).default(3),
  employer_pension_percentage: z.coerce.number().min(0).max(100).default(5),
  pension_provider: z.string().optional(),
  
  // Student Loan
  has_student_loan: z.boolean().default(false),
  student_loan_plan: z.string().optional(),
  
  // Other
  other_deductions: z.array(otherDeductionSchema).default([]),
  
  // Dates
  effective_from: z.string().default(() => format(new Date(), 'yyyy-MM-dd')),
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
      tax_code: "1257L",
      tax_rate: 20,
      use_custom_tax_rate: false,
      ni_category: "A",
      ni_rate: 12,
      use_custom_ni_rate: false,
      pension_opted_in: true,
      pension_percentage: 3,
      employer_pension_percentage: 5,
      pension_provider: "",
      has_student_loan: false,
      student_loan_plan: "",
      other_deductions: [],
      effective_from: format(new Date(), 'yyyy-MM-dd'),
      effective_until: "",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "other_deductions",
  });

  useEffect(() => {
    if (existingSettings) {
      form.reset({
        tax_code: existingSettings.tax_code || "1257L",
        tax_rate: existingSettings.tax_rate || 20,
        use_custom_tax_rate: existingSettings.use_custom_tax_rate || false,
        ni_category: existingSettings.ni_category || "A",
        ni_rate: existingSettings.ni_rate || 12,
        use_custom_ni_rate: existingSettings.use_custom_ni_rate || false,
        pension_opted_in: existingSettings.pension_opted_in ?? true,
        pension_percentage: existingSettings.pension_percentage || 3,
        employer_pension_percentage: existingSettings.employer_pension_percentage || 5,
        pension_provider: existingSettings.pension_provider || "",
        has_student_loan: existingSettings.has_student_loan || false,
        student_loan_plan: existingSettings.student_loan_plan || "",
        other_deductions: existingSettings.other_deductions || [],
        effective_from: existingSettings.effective_from || format(new Date(), 'yyyy-MM-dd'),
        effective_until: existingSettings.effective_until || "",
        notes: existingSettings.notes || "",
      });
    } else {
      form.reset({
        tax_code: "1257L",
        tax_rate: 20,
        use_custom_tax_rate: false,
        ni_category: "A",
        ni_rate: 12,
        use_custom_ni_rate: false,
        pension_opted_in: true,
        pension_percentage: 3,
        employer_pension_percentage: 5,
        pension_provider: "",
        has_student_loan: false,
        student_loan_plan: "",
        other_deductions: [],
        effective_from: format(new Date(), 'yyyy-MM-dd'),
        effective_until: "",
        notes: "",
      });
    }
  }, [existingSettings, form, open]);

  const onSubmit = async (data: FormData) => {
    try {
      // Filter out incomplete deductions and ensure all fields are defined
      const validDeductions = data.other_deductions
        .filter(d => d.name && d.type && d.amount !== undefined)
        .map(d => ({
          name: d.name,
          type: d.type as 'fixed' | 'percentage',
          amount: d.amount
        }));

      const settingsData = {
        staff_id: staffId,
        branch_id: branchId,
        organization_id: organizationId,
        tax_code: data.tax_code,
        tax_rate: data.tax_rate,
        use_custom_tax_rate: data.use_custom_tax_rate,
        ni_category: data.ni_category,
        ni_rate: data.ni_rate,
        use_custom_ni_rate: data.use_custom_ni_rate,
        pension_opted_in: data.pension_opted_in,
        pension_percentage: data.pension_percentage,
        employer_pension_percentage: data.employer_pension_percentage,
        pension_provider: data.pension_provider || undefined,
        has_student_loan: data.has_student_loan,
        student_loan_plan: data.has_student_loan ? data.student_loan_plan : undefined,
        other_deductions: validDeductions,
        effective_from: data.effective_from,
        effective_until: data.effective_until || undefined,
        is_active: true,
        notes: data.notes || undefined,
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

  const watchUseCustomTax = form.watch("use_custom_tax_rate");
  const watchUseCustomNI = form.watch("use_custom_ni_rate");
  const watchPensionOptedIn = form.watch("pension_opted_in");
  const watchHasStudentLoan = form.watch("has_student_loan");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingSettings ? "Edit Deduction Settings" : "Set Up Deduction Settings"}
          </DialogTitle>
          <DialogDescription>
            Configure tax, national insurance, pension, and other payroll deductions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tax Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="font-medium">Tax Settings</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tax_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Code</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tax code" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TAX_CODES.map((tc) => (
                            <SelectItem key={tc.code} value={tc.code}>
                              {tc.code} - {tc.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="use_custom_tax_rate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Custom Tax Rate</FormLabel>
                        <FormDescription className="text-xs">
                          Override standard rate
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {watchUseCustomTax && (
                <FormField
                  control={form.control}
                  name="tax_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Separator />

            {/* NI Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-purple-600" />
                <h3 className="font-medium">National Insurance</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ni_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NI Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select NI category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {NI_CATEGORIES.map((ni) => (
                            <SelectItem key={ni.category} value={ni.category}>
                              {ni.category} - {ni.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="use_custom_ni_rate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Custom NI Rate</FormLabel>
                        <FormDescription className="text-xs">
                          Override standard rate
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {watchUseCustomNI && (
                <FormField
                  control={form.control}
                  name="ni_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom NI Rate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Separator />

            {/* Pension Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-green-600" />
                <h3 className="font-medium">Pension</h3>
              </div>

              <FormField
                control={form.control}
                name="pension_opted_in"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Enrolled in Pension Scheme</FormLabel>
                      <FormDescription className="text-xs">
                        Auto-enrolment workplace pension
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchPensionOptedIn && (
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="pension_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee %</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employer_pension_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer %</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pension_provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. NEST" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Student Loan Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-amber-600" />
                <h3 className="font-medium">Student Loan</h3>
              </div>

              <FormField
                control={form.control}
                name="has_student_loan"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Has Student Loan</FormLabel>
                      <FormDescription className="text-xs">
                        Deduct student loan repayments
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchHasStudentLoan && (
                <FormField
                  control={form.control}
                  name="student_loan_plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Plan</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select loan plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STUDENT_LOAN_PLANS.map((plan) => (
                            <SelectItem key={plan.plan} value={plan.plan}>
                              {plan.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Separator />

            {/* Other Deductions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Other Deductions</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: "", type: "fixed", amount: 0 })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Deduction
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-start p-3 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`other_deductions.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Union Fees" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`other_deductions.${index}.type`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormLabel className="text-xs">Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed (£)</SelectItem>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`other_deductions.${index}.amount`}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormLabel className="text-xs">Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-6 text-red-600 hover:text-red-700"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            {/* Effective Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effective_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective From</FormLabel>
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
                    <Input placeholder="Any additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createSettings.isPending || updateSettings.isPending}
              >
                {createSettings.isPending || updateSettings.isPending
                  ? "Saving..."
                  : existingSettings ? "Update Settings" : "Create Settings"
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
