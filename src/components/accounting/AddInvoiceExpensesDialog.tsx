import React, { useState } from "react";
import { Receipt, Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { AddNewExpenseEntryDialog } from "./AddNewExpenseEntryDialog";
import { InvoiceExpenseEntry } from "@/types/invoiceExpense";
import { useCreateInvoiceExpenseEntries } from "@/hooks/useInvoiceExpenses";
import { useTenant } from "@/contexts/TenantContext";

interface AddInvoiceExpensesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | null;
  branchId: string;
}

export function AddInvoiceExpensesDialog({
  open,
  onOpenChange,
  invoiceId,
  branchId,
}: AddInvoiceExpensesDialogProps) {
  const { organization } = useTenant();
  const [expenses, setExpenses] = useState<InvoiceExpenseEntry[]>([]);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<InvoiceExpenseEntry | null>(null);
  const createInvoiceExpenseEntries = useCreateInvoiceExpenseEntries();

  // Formatting helpers
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return `£${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return "-";
    }
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return "-";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Calculate totals
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalStaffPayment = expenses.reduce(
    (sum, exp) => sum + (exp.pay_staff_amount || 0),
    0
  );
  const totalAdminCost = expenses.reduce(
    (sum, exp) => sum + (exp.amount * exp.admin_cost_percentage) / 100,
    0
  );

  // CRUD operations
  const handleAddExpense = (newExpense: InvoiceExpenseEntry) => {
    setExpenses((prev) => [...prev, newExpense]);
    setAddExpenseDialogOpen(false);
    toast({
      title: "Expense added",
      description: "The expense has been added successfully.",
    });
  };

  const handleEditExpense = (expense: InvoiceExpenseEntry) => {
    setEditingExpense(expense);
    setAddExpenseDialogOpen(true);
  };

  const handleUpdateExpense = (updatedExpense: InvoiceExpenseEntry) => {
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === updatedExpense.id ? updatedExpense : exp))
    );
    setEditingExpense(null);
    setAddExpenseDialogOpen(false);
    toast({
      title: "Expense updated",
      description: "The expense has been updated successfully.",
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== expenseId));
    toast({
      title: "Expense removed",
      description: "The expense has been removed from the list.",
    });
  };

  const handleSaveToInvoice = async () => {
    if (expenses.length === 0) {
      toast({
        title: "No expenses added",
        description: "Please add at least one expense before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!invoiceId) {
      toast({
        title: "No invoice selected",
        description: "Please select an invoice first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createInvoiceExpenseEntries.mutateAsync({
        invoiceId,
        expenses,
        organizationId: organization?.id || undefined,
      });

      // Reset and close
      setExpenses([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving expenses to invoice:", error);
      toast({
        title: "Failed to save expenses",
        description: "An error occurred while saving the expenses.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setExpenses([]);
    setEditingExpense(null);
    onOpenChange(false);
  };

  // Close nested dialog handler
  const handleNestedDialogClose = (open: boolean) => {
    setAddExpenseDialogOpen(open);
    if (!open) {
      setEditingExpense(null);
    }
  };

  if (!invoiceId) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Add Invoice Expenses
            </DialogTitle>
            <DialogDescription>
              Add detailed expense entries to this invoice. Each expense can include
              staff payment information.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Add New Expense Button */}
            <div className="flex justify-start">
              <Button
                onClick={() => setAddExpenseDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New Expense
              </Button>
            </div>

            {/* Empty State */}
            {expenses.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground font-medium">
                  No expenses added yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Click "Add New Expense" to get started
                </p>
              </div>
            )}

            {/* Expenses Table */}
            {expenses.length > 0 && (
              <>
                {/* Summary Bar */}
                <div className="flex flex-wrap gap-4 justify-between items-center px-4 py-3 bg-muted/50 rounded-md border">
                  <div className="text-sm">
                    <span className="font-medium">{expenses.length}</span> expense(s)
                  </div>
                  <div className="text-sm">
                    Total Amount:{" "}
                    <span className="font-bold">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="text-sm">
                    Total Staff Payment:{" "}
                    <span className="font-bold">
                      {formatCurrency(totalStaffPayment)}
                    </span>
                  </div>
                  <div className="text-sm">
                    Total Admin Cost:{" "}
                    <span className="font-bold">
                      {formatCurrency(totalAdminCost)}
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Expense Type</TableHead>
                        <TableHead className="w-[110px]">Date</TableHead>
                        <TableHead className="w-[100px]">Amount</TableHead>
                        <TableHead className="w-[110px]">Admin Cost %</TableHead>
                        <TableHead className="w-[200px]">Description</TableHead>
                        <TableHead className="w-[90px]">Pay Staff</TableHead>
                        <TableHead className="w-[150px]">Staff Name</TableHead>
                        <TableHead className="w-[130px]">Staff Amount</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">
                            {expense.expense_type_name}
                          </TableCell>
                          <TableCell>{formatDate(expense.date)}</TableCell>
                          <TableCell>{formatCurrency(expense.amount)}</TableCell>
                          <TableCell>{expense.admin_cost_percentage}%</TableCell>
                          <TableCell>
                            {truncateText(expense.description, 50)}
                          </TableCell>
                          <TableCell>
                            {expense.pay_staff ? (
                              <span className="text-green-600 font-medium">Yes</span>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </TableCell>
                          <TableCell>{expense.staff_name || "-"}</TableCell>
                          <TableCell>
                            {formatCurrency(expense.pay_staff_amount)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditExpense(expense)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={createInvoiceExpenseEntries.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveToInvoice}
              disabled={createInvoiceExpenseEntries.isPending || expenses.length === 0}
            >
              {createInvoiceExpenseEntries.isPending ? "Saving..." : "Save to Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nested Add/Edit Expense Dialog */}
      <AddNewExpenseEntryDialog
        open={addExpenseDialogOpen}
        onOpenChange={handleNestedDialogClose}
        onSave={editingExpense ? handleUpdateExpense : handleAddExpense}
        editingExpense={editingExpense}
        branchId={branchId}
      />
    </>
  );
}
