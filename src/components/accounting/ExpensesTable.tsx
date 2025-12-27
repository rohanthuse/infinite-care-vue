
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExpenseRecord } from "@/hooks/useAccountingData";
import { Edit, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface ExpensesTableProps {
  expenses: ExpenseRecord[];
  onViewExpense: (expense: ExpenseRecord) => void;
  onEditExpense: (expense: ExpenseRecord) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const ExpensesTable: React.FC<ExpensesTableProps> = ({
  expenses,
  onViewExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  const renderStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700",
      approved: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700",
      rejected: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700",
      reimbursed: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700",
    };

    return (
      <Badge variant="outline" className={`${variants[status] || 'bg-muted text-muted-foreground'} font-medium`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      cash: "Cash",
      card: "Card",
      bank_transfer: "Bank Transfer",
      cheque: "Cheque",
      other: "Other"
    };
    return methods[method] || method;
  };

  const formatCategory = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getSourceLabel = (source?: string, bookingId?: string) => {
    switch (source) {
      case 'past_booking':
        return bookingId 
          ? `Past Booking (${bookingId.slice(0, 8)}...)` 
          : 'Past Booking';
      case 'general_claim':
        return 'Expense Claim';
      case 'travel_mileage':
        return 'Travel & Mileage';
      case 'extra_time':
        return 'Extra Time';
      default:
        return source || 'Unknown';
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-10 bg-muted rounded-md border border-border">
        <p className="text-muted-foreground">No expenses found. Add your first expense to get started.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Staff</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id} className="hover:bg-muted">
              <TableCell className="font-medium">
                {format(new Date(expense.expense_date), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>{expense.description}</TableCell>
              <TableCell>{formatCategory(expense.category)}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-muted text-muted-foreground text-xs whitespace-nowrap">
                  {getSourceLabel(expense.expense_source, expense.booking_id)}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                £{expense.amount.toFixed(2)}
              </TableCell>
              <TableCell>{formatPaymentMethod(expense.payment_method)}</TableCell>
              <TableCell>{renderStatusBadge(expense.status)}</TableCell>
              <TableCell>
                {expense.staff 
                  ? `${expense.staff.first_name} ${expense.staff.last_name}`
                  : "N/A"
                }
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onViewExpense(expense)}
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEditExpense(expense)}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDeleteExpense(expense.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExpensesTable;
