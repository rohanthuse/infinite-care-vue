
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
import { Edit, FileText, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      reimbursed: "bg-blue-100 text-blue-800 border-blue-200",
    };

    return (
      <Badge variant="outline" className={`${variants[status] || 'bg-gray-100 text-gray-800 border-gray-200'} font-medium`}>
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

  if (expenses.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-md border border-gray-200">
        <p className="text-gray-500">No expenses found. Add your first expense to get started.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Staff</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">
                {format(new Date(expense.expense_date), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>{expense.description}</TableCell>
              <TableCell>{formatCategory(expense.category)}</TableCell>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewExpense(expense)}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>View Details</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditExpense(expense)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDeleteExpense(expense.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExpensesTable;
