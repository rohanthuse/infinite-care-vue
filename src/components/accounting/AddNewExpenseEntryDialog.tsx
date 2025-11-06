import React, { useState, useEffect } from "react";
import { CalendarIcon, Receipt } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useExpenseTypes } from "@/hooks/useKeyParameters";
import { useStaffList } from "@/hooks/useAccountingData";
import { InvoiceExpenseEntry } from "@/types/invoiceExpense";
import { cn } from "@/lib/utils";

// Validation schema
const expenseEntrySchema = z
  .object({
    expense_type_id: z.string().min(1, "Expense type is required"),
    date: z.string().optional().nullable(),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    admin_cost_percentage: z.coerce
      .number()
      .min(0, "Admin cost must be at least 0")
      .max(100, "Admin cost cannot exceed 100%"),
    description: z.string().optional(),
    pay_staff: z.boolean(),
    staff_id: z.string().optional().nullable(),
    pay_staff_amount: z.coerce.number().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.pay_staff) {
        return data.staff_id && data.staff_id.length > 0;
      }
      return true;
    },
    {
      message: "Staff is required when Pay Staff is checked",
      path: ["staff_id"],
    }
  )
  .refine(
    (data) => {
      if (data.pay_staff) {
        return data.pay_staff_amount && data.pay_staff_amount > 0;
      }
      return true;
    },
    {
      message: "Pay Staff Amount is required when Pay Staff is checked",
      path: ["pay_staff_amount"],
    }
  );

type ExpenseEntryFormData = z.infer<typeof expenseEntrySchema>;

interface AddNewExpenseEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: InvoiceExpenseEntry) => void;
  editingExpense?: InvoiceExpenseEntry | null;
  branchId: string;
}

export function AddNewExpenseEntryDialog({
  open,
  onOpenChange,
  onSave,
  editingExpense,
  branchId,
}: AddNewExpenseEntryDialogProps) {
  const [payStaffChecked, setPayStaffChecked] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const { data: expenseTypes, isLoading: isLoadingExpenseTypes } = useExpenseTypes();
  const { data: staffList, isLoading: isLoadingStaff } = useStaffList(branchId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ExpenseEntryFormData>({
    resolver: zodResolver(expenseEntrySchema),
    defaultValues: {
      expense_type_id: "",
      date: null,
      amount: 0,
      admin_cost_percentage: 0,
      description: "",
      pay_staff: false,
      staff_id: null,
      pay_staff_amount: null,
    },
  });

  const watchExpenseTypeId = watch("expense_type_id");
  const watchStaffId = watch("staff_id");

  // Pre-fill form when editing
  useEffect(() => {
    if (editingExpense && open) {
      setValue("expense_type_id", editingExpense.expense_type_id);
      setValue("date", editingExpense.date);
      setValue("amount", editingExpense.amount);
      setValue("admin_cost_percentage", editingExpense.admin_cost_percentage);
      setValue("description", editingExpense.description);
      setValue("pay_staff", editingExpense.pay_staff);
      setValue("staff_id", editingExpense.staff_id);
      setValue("pay_staff_amount", editingExpense.pay_staff_amount);
      setPayStaffChecked(editingExpense.pay_staff);
      
      if (editingExpense.date) {
        setSelectedDate(new Date(editingExpense.date));
      }
    }
  }, [editingExpense, open, setValue]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setPayStaffChecked(false);
      setSelectedDate(undefined);
    }
  }, [open, reset]);

  const handlePayStaffChange = (checked: boolean) => {
    setPayStaffChecked(checked);
    setValue("pay_staff", checked);
    if (!checked) {
      setValue("staff_id", null);
      setValue("pay_staff_amount", null);
    }
  };

  const onSubmit = (data: ExpenseEntryFormData) => {
    const expenseTypeName =
      expenseTypes?.find((et) => et.id === data.expense_type_id)?.title || "";
    const staffName = data.staff_id
      ? staffList?.find((s) => s.id === data.staff_id)
        ? `${staffList.find((s) => s.id === data.staff_id)?.first_name} ${staffList.find((s) => s.id === data.staff_id)?.last_name}`
        : null
      : null;

    const expenseEntry: InvoiceExpenseEntry = {
      id: editingExpense?.id || uuidv4(),
      expense_type_id: data.expense_type_id,
      expense_type_name: expenseTypeName,
      date: data.date || null,
      amount: data.amount,
      admin_cost_percentage: data.admin_cost_percentage,
      description: data.description || "",
      pay_staff: data.pay_staff,
      staff_id: data.staff_id || null,
      staff_name: staffName,
      pay_staff_amount: data.pay_staff_amount || null,
    };

    onSave(expenseEntry);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            {editingExpense ? "Edit Expense" : "Add New Expense"}
          </DialogTitle>
          <DialogDescription>
            {editingExpense
              ? "Update the expense details below."
              : "Enter the details for the new expense entry."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Expense Type */}
          <div className="space-y-2">
            <Label htmlFor="expense_type_id">
              Expense Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watchExpenseTypeId}
              onValueChange={(value) => setValue("expense_type_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select expense type" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingExpenseTypes ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : expenseTypes && expenseTypes.length > 0 ? (
                  expenseTypes
                    .filter((et) => et.status === "Active")
                    .map((expenseType) => (
                      <SelectItem key={expenseType.id} value={expenseType.id}>
                        {expenseType.title}
                      </SelectItem>
                    ))
                ) : (
                  <SelectItem value="none" disabled>
                    No expense types available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.expense_type_id && (
              <p className="text-sm text-destructive">
                {errors.expense_type_id.message}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "dd/MM/yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setValue("date", date ? format(date, "yyyy-MM-dd") : null);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount (£) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Admin Cost Percentage */}
          <div className="space-y-2">
            <Label htmlFor="admin_cost_percentage">
              Admin Cost Percentage (%) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="admin_cost_percentage"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="0"
              {...register("admin_cost_percentage")}
            />
            {errors.admin_cost_percentage && (
              <p className="text-sm text-destructive">
                {errors.admin_cost_percentage.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter expense details..."
              rows={3}
              maxLength={500}
              {...register("description")}
            />
          </div>

          {/* Pay Staff Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pay_staff"
              checked={payStaffChecked}
              onCheckedChange={handlePayStaffChange}
            />
            <Label htmlFor="pay_staff" className="cursor-pointer">
              Pay Staff?
            </Label>
          </div>

          {/* Conditional Staff Fields */}
          {payStaffChecked && (
            <>
              {/* Staff Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="staff_id">
                  Staff <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watchStaffId || ""}
                  onValueChange={(value) => setValue("staff_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingStaff ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : staffList && staffList.length > 0 ? (
                      staffList.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.first_name} {staff.last_name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No staff available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {errors.staff_id && (
                  <p className="text-sm text-destructive">
                    {errors.staff_id.message}
                  </p>
                )}
              </div>

              {/* Pay Staff Amount */}
              <div className="space-y-2">
                <Label htmlFor="pay_staff_amount">
                  Pay Staff Amount (£) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pay_staff_amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...register("pay_staff_amount")}
                />
                {errors.pay_staff_amount && (
                  <p className="text-sm text-destructive">
                    {errors.pay_staff_amount.message}
                  </p>
                )}
              </div>
            </>
          )}

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingExpense ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
