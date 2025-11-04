import React, { useState } from "react";
import { Receipt } from "lucide-react";
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
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { toast } from "@/hooks/use-toast";

interface AddInvoiceExpensesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | null;
}

export function AddInvoiceExpensesDialog({
  open,
  onOpenChange,
  invoiceId,
}: AddInvoiceExpensesDialogProps) {
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expense type options for the multi-select dropdown
  const expenseTypeOptions: MultiSelectOption[] = [
    { label: "Travel", value: "travel" },
    { label: "Equipment", value: "equipment" },
    { label: "Accommodation", value: "accommodation" },
    { label: "Food", value: "food" },
    { label: "Miscellaneous", value: "miscellaneous" },
  ];

  // Handle form submission
  const handleSave = async () => {
    if (selectedExpenses.length === 0) {
      toast({
        title: "No expense types selected",
        description: "Please select at least one expense type.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Integrate with backend API to save invoice expenses
      // For now, just show a success message
      console.log("Saving expenses for invoice:", invoiceId);
      console.log("Selected expense types:", selectedExpenses);

      toast({
        title: "Expenses added successfully!",
        description: `${selectedExpenses.length} expense type(s) added to the invoice.`,
      });

      // Reset and close
      setSelectedExpenses([]);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to add expenses",
        description: "An error occurred while saving the expenses.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    setSelectedExpenses([]);
    onOpenChange(false);
  };

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSelectedExpenses([]);
    }
  }, [open]);

  if (!invoiceId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Add Invoice Expenses
          </DialogTitle>
          <DialogDescription>
            Select expense types to associate with this invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="expense-types">
              Expense Type <span className="text-destructive">*</span>
            </Label>
            <MultiSelect
              options={expenseTypeOptions}
              selected={selectedExpenses}
              onSelectionChange={setSelectedExpenses}
              placeholder="Select expense types..."
              searchPlaceholder="Search expense types..."
              emptyText="No expense types found."
              maxDisplay={3}
            />
            <p className="text-xs text-muted-foreground">
              You can select multiple expense types
            </p>
          </div>

          {/* Show selected count */}
          {selectedExpenses.length > 0 && (
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {selectedExpenses.length}
                </span>{" "}
                expense type(s) selected
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || selectedExpenses.length === 0}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
