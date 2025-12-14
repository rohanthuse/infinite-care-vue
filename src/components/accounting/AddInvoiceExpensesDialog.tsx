import React, { useState, useEffect, useMemo } from "react";
import { Receipt, Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
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
import { EligibleExpensesSection } from "./EligibleExpensesSection";
import { InvoiceExpenseEntry } from "@/types/invoiceExpense";
import { useCreateInvoiceExpenseEntries, useInvoiceExpenseEntries } from "@/hooks/useInvoiceExpenses";
import { useEligibleInvoiceExpenses, EligibleExpense } from "@/hooks/useEligibleInvoiceExpenses";
import { useEligibleExtraTimeForInvoice } from "@/hooks/useEligibleExtraTimeForInvoice";
import { useMarkExtraTimeAsInvoiced } from "@/hooks/useInvoiceExtraTimeEntries";
import { useTenant } from "@/contexts/TenantContext";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddInvoiceExpensesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | null;
  branchId: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
}

export function AddInvoiceExpensesDialog({
  open,
  onOpenChange,
  invoiceId,
  branchId,
  clientId,
  startDate,
  endDate,
}: AddInvoiceExpensesDialogProps) {
  const { organization } = useTenant();
  const [expenses, setExpenses] = useState<InvoiceExpenseEntry[]>([]);
  const [selectedEligibleExpenseIds, setSelectedEligibleExpenseIds] = useState<string[]>([]);
  const [selectedExtraTimeIds, setSelectedExtraTimeIds] = useState<string[]>([]);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<InvoiceExpenseEntry | null>(null);
  
  const createInvoiceExpenseEntries = useCreateInvoiceExpenseEntries();
  const markExtraTimeAsInvoiced = useMarkExtraTimeAsInvoiced();
  
  // Fetch existing expense entries for this invoice
  const { data: existingEntries = [] } = useInvoiceExpenseEntries(invoiceId || undefined);
  
  // Fetch eligible expenses for this client/period
  const { data: eligibleExpenses, isLoading: isLoadingEligible } = useEligibleInvoiceExpenses(
    clientId,
    startDate,
    endDate
  );

  // Fetch eligible extra time for this client/period
  const { data: eligibleExtraTime, isLoading: isLoadingExtraTime } = useEligibleExtraTimeForInvoice(
    clientId,
    startDate,
    endDate
  );

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setExpenses([]);
      setSelectedEligibleExpenseIds([]);
      setSelectedExtraTimeIds([]);
      setEditingExpense(null);
    }
  }, [open]);

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

  // Calculate totals for manually added expenses
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalStaffPayment = expenses.reduce(
    (sum, exp) => sum + (exp.pay_staff_amount || 0),
    0
  );
  const totalAdminCost = expenses.reduce(
    (sum, exp) => sum + (exp.amount * exp.admin_cost_percentage) / 100,
    0
  );

  // Calculate total for selected eligible expenses
  const selectedEligibleTotal = useMemo(() => {
    if (!eligibleExpenses) return 0;
    return eligibleExpenses.allExpenses
      .filter(e => selectedEligibleExpenseIds.includes(e.id) && !e.is_invoiced)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [eligibleExpenses, selectedEligibleExpenseIds]);

  // Calculate total for selected extra time
  const selectedExtraTimeTotal = useMemo(() => {
    if (!eligibleExtraTime) return 0;
    return eligibleExtraTime.extraTimeRecords
      .filter(r => selectedExtraTimeIds.includes(r.id) && !r.invoiced)
      .reduce((sum, r) => sum + r.total_cost, 0);
  }, [eligibleExtraTime, selectedExtraTimeIds]);

  const grandTotal = totalAmount + selectedEligibleTotal + selectedExtraTimeTotal;

  // CRUD operations for manual expenses
  const handleAddExpense = (newExpense: InvoiceExpenseEntry) => {
    setExpenses((prev) => [...prev, newExpense]);
    setAddExpenseDialogOpen(false);
    toast({
      title: "Expense added",
      description: "The expense has been added to the list.",
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
      description: "The expense has been updated.",
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== expenseId));
    toast({
      title: "Expense removed",
      description: "The expense has been removed from the list.",
    });
  };

  // Toggle eligible expense selection
  const handleToggleEligibleExpense = (expenseId: string) => {
    setSelectedEligibleExpenseIds(prev =>
      prev.includes(expenseId)
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  // Toggle extra time selection
  const handleToggleExtraTime = (extraTimeId: string) => {
    setSelectedExtraTimeIds(prev =>
      prev.includes(extraTimeId)
        ? prev.filter(id => id !== extraTimeId)
        : [...prev, extraTimeId]
    );
  };

  // Save all expenses to invoice
  const handleSaveToInvoice = async () => {
    const hasManualExpenses = expenses.length > 0;
    const hasSelectedExpenses = selectedEligibleExpenseIds.length > 0;
    const hasSelectedExtraTime = selectedExtraTimeIds.length > 0;

    if (!hasManualExpenses && !hasSelectedExpenses && !hasSelectedExtraTime) {
      toast({
        title: "No expenses added",
        description: "Please add or select at least one expense or extra time before saving.",
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
      // Convert selected eligible expenses to InvoiceExpenseEntry format
      const selectedEligibleExpenses: InvoiceExpenseEntry[] = eligibleExpenses?.allExpenses
        .filter(e => selectedEligibleExpenseIds.includes(e.id) && !e.is_invoiced)
        .map(e => ({
          id: uuidv4(),
          expense_id: e.id,
          expense_type_id: e.category,
          expense_type_name: getCategoryLabel(e.category),
          date: e.expense_date,
          amount: e.amount,
          admin_cost_percentage: 0,
          description: e.description,
          pay_staff: !!e.staff_id,
          staff_id: e.staff_id,
          staff_name: e.staff_name || null,
          pay_staff_amount: null,
          booking_reference: e.booking_id ? `Booking` : undefined,
          source_type: e.booking_id ? 'booking' : (e.category === 'travel_expenses' || e.category === 'mileage' ? 'travel' : 'claim'),
        })) || [];

      // Combine manual and selected expenses
      const allExpenses = [...expenses, ...selectedEligibleExpenses];
      const sourceExpenseIds = selectedEligibleExpenses.map(e => e.expense_id).filter(Boolean) as string[];

      // Save expenses if any
      if (allExpenses.length > 0) {
        await createInvoiceExpenseEntries.mutateAsync({
          invoiceId,
          expenses: allExpenses,
          organizationId: organization?.id || undefined,
          sourceExpenseIds,
        });
      }

      // Mark extra time as invoiced if any selected
      if (hasSelectedExtraTime) {
        await markExtraTimeAsInvoiced.mutateAsync({
          extraTimeIds: selectedExtraTimeIds,
          invoiceId,
        });
      }

      // Reset and close
      setExpenses([]);
      setSelectedEligibleExpenseIds([]);
      setSelectedExtraTimeIds([]);
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
    setSelectedEligibleExpenseIds([]);
    setSelectedExtraTimeIds([]);
    setEditingExpense(null);
    onOpenChange(false);
  };

  const handleNestedDialogClose = (open: boolean) => {
    setAddExpenseDialogOpen(open);
    if (!open) {
      setEditingExpense(null);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      travel_expenses: 'Travel',
      mileage: 'Mileage',
      equipment_purchase: 'Equipment',
      training_costs: 'Training',
      client_visit_: 'Client Visit',
      medical_supplies: 'Medical',
      office_supplies: 'Office',
    };
    return labels[category] || category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (!invoiceId) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Add Invoice Expenses
            </DialogTitle>
            <DialogDescription>
              Select from approved expenses or add new expense entries to this invoice.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 overflow-hidden">
            <div className="space-y-6 pr-4">
              {/* Eligible Expenses Section */}
              {clientId && (
                <>
                  <EligibleExpensesSection
                    bookingExpenses={eligibleExpenses?.bookingExpenses || []}
                    travelExpenses={eligibleExpenses?.travelExpenses || []}
                    otherExpenses={eligibleExpenses?.otherExpenses || []}
                    extraTimeRecords={eligibleExtraTime?.extraTimeRecords || []}
                    selectedExpenseIds={selectedEligibleExpenseIds}
                    selectedExtraTimeIds={selectedExtraTimeIds}
                    onToggleExpense={handleToggleEligibleExpense}
                    onToggleExtraTime={handleToggleExtraTime}
                    isLoading={isLoadingEligible}
                    isLoadingExtraTime={isLoadingExtraTime}
                  />
                  
                  <Separator />
                </>
              )}

              {/* Manual Expense Entry Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Manual Expense Entries</h3>
                  <Button
                    onClick={() => setAddExpenseDialogOpen(true)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Manual Expense
                  </Button>
                </div>

                {/* Empty State */}
                {expenses.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/10">
                    <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-3 text-muted-foreground text-sm">
                      No manual expenses added
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click "Add Manual Expense" for custom entries
                    </p>
                  </div>
                )}

                {/* Manual Expenses Table */}
                {expenses.length > 0 && (
                  <>
                    {/* Summary Bar */}
                    <div className="flex flex-wrap gap-4 justify-between items-center px-4 py-3 bg-muted/50 rounded-md border">
                      <div className="text-sm">
                        <span className="font-medium">{expenses.length}</span> manual expense(s)
                      </div>
                      <div className="text-sm">
                        Amount:{" "}
                        <span className="font-bold">{formatCurrency(totalAmount)}</span>
                      </div>
                      <div className="text-sm">
                        Staff Payment:{" "}
                        <span className="font-bold">{formatCurrency(totalStaffPayment)}</span>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[150px]">Expense Type</TableHead>
                            <TableHead className="w-[100px]">Date</TableHead>
                            <TableHead className="w-[100px]">Amount</TableHead>
                            <TableHead className="w-[200px]">Description</TableHead>
                            <TableHead className="w-[120px]">Staff</TableHead>
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
                              <TableCell>
                                {truncateText(expense.description, 40)}
                              </TableCell>
                              <TableCell>{expense.staff_name || "-"}</TableCell>
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

              {/* Grand Total Summary */}
              {(expenses.length > 0 || selectedEligibleExpenseIds.length > 0 || selectedExtraTimeIds.length > 0) && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total to Add to Invoice:</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    {selectedEligibleExpenseIds.length > 0 && (
                      <span>• {selectedEligibleExpenseIds.length} approved expense(s): {formatCurrency(selectedEligibleTotal)}</span>
                    )}
                    {selectedExtraTimeIds.length > 0 && (
                      <span>• {selectedExtraTimeIds.length} extra time record(s): {formatCurrency(selectedExtraTimeTotal)}</span>
                    )}
                    {expenses.length > 0 && (
                      <span>• {expenses.length} manual expense(s): {formatCurrency(totalAmount)}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel} disabled={createInvoiceExpenseEntries.isPending || markExtraTimeAsInvoiced.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveToInvoice}
              disabled={createInvoiceExpenseEntries.isPending || markExtraTimeAsInvoiced.isPending || (expenses.length === 0 && selectedEligibleExpenseIds.length === 0 && selectedExtraTimeIds.length === 0)}
            >
              {(createInvoiceExpenseEntries.isPending || markExtraTimeAsInvoiced.isPending) ? "Saving..." : "Save to Invoice"}
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
