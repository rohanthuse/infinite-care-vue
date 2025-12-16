import React from 'react';
import { Receipt, Trash2, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/currencyFormatter';
import { format, parseISO, isValid } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export interface InvoiceExpenseEntry {
  id: string;
  expense_type_name?: string;
  date?: string;
  amount: number;
  description?: string;
  staff_name?: string;
}

interface EditableExpensesSectionProps {
  expenses: InvoiceExpenseEntry[];
  isLoading?: boolean;
  onRemove: (entryId: string) => void;
  onAddClick: () => void;
  isReadOnly?: boolean;
  isRemoving?: string | null;
}

const formatDateSafe = (dateValue: string | null | undefined): string => {
  if (!dateValue) return 'N/A';
  try {
    const date = parseISO(dateValue);
    if (!isValid(date)) return 'N/A';
    return format(date, 'dd/MM/yyyy');
  } catch {
    return 'N/A';
  }
};

export function EditableExpensesSection({
  expenses,
  isLoading,
  onRemove,
  onAddClick,
  isReadOnly = false,
  isRemoving,
}: EditableExpensesSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Receipt className="h-4 w-4 text-amber-600" />
          Additional Expenses
          {expenses.length > 0 && (
            <Badge variant="secondary" className="ml-2">{expenses.length}</Badge>
          )}
        </h3>
        {!isReadOnly && (
          <Button type="button" onClick={onAddClick} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        )}
      </div>

      {expenses.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {!isReadOnly && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDateSafe(expense.date)}</TableCell>
                  <TableCell>{expense.expense_type_name || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={expense.description || ''}>
                    {expense.description || '-'}
                  </TableCell>
                  <TableCell>{expense.staff_name || '-'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(expense.amount || 0)}
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(expense.id)}
                        disabled={isRemoving === expense.id}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No additional expenses</p>
          {!isReadOnly && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onAddClick}
              className="mt-2"
            >
              Add expenses from approved claims
            </Button>
          )}
        </div>
      )}

      {expenses.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-md">
            <span className="text-muted-foreground">Expenses Subtotal:</span>
            <span className="ml-2 font-semibold">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
