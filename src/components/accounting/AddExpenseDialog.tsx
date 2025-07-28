
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ExpenseRecord } from "@/hooks/useAccountingData";

interface AddExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (expense: Partial<ExpenseRecord>) => void;
  initialData?: ExpenseRecord;
  isEditing?: boolean;
  branchId?: string;
}

const formSchema = z.object({
  description: z.string().min(5, "Description must be at least 5 characters"),
  amount: z.coerce.number().positive("Amount must be positive"),
  expense_date: z.date(),
  category: z.enum([
    "office_supplies", 
    "travel", 
    "meals", 
    "equipment", 
    "utilities", 
    "rent", 
    "software", 
    "training", 
    "medical_supplies", 
    "other"
  ] as const),
  payment_method: z.enum([
    "credit_card", 
    "cash", 
    "bank_transfer", 
    "cheque", 
    "other"
  ] as const),
  receipt_url: z.string().optional(),
  notes: z.string().optional(),
});

const categoryLabels = {
  office_supplies: "Office Supplies",
  travel: "Travel",
  meals: "Meals",
  equipment: "Equipment",
  utilities: "Utilities",
  rent: "Rent",
  software: "Software",
  training: "Training",
  medical_supplies: "Medical Supplies",
  other: "Other"
};

const paymentMethodLabels = {
  credit_card: "Credit Card",
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  other: "Other"
};

const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isEditing = false
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      description: initialData.description,
      amount: initialData.amount,
      expense_date: new Date(initialData.expense_date),
      category: initialData.category as any,
      payment_method: initialData.payment_method as any,
      receipt_url: initialData.receipt_url || "",
      notes: initialData.notes || "",
    } : {
      description: "",
      amount: 0,
      expense_date: new Date(),
      category: "office_supplies",
      payment_method: "credit_card",
      receipt_url: "",
      notes: "",
    }
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    const expenseData: Partial<ExpenseRecord> = {
      description: data.description,
      amount: data.amount,
      expense_date: format(data.expense_date, "yyyy-MM-dd"),
      category: data.category,
      payment_method: data.payment_method,
      receipt_url: data.receipt_url || null,
      notes: data.notes || null,
      status: 'pending'
    };
    
    onSave(expenseData);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Expense" : "Add New Expense"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of expense" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (£)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expense_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
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
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(paymentMethodLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="receipt_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt URL (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Receipt reference or URL" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this expense"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Update Expense" : "Add Expense"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseDialog;
