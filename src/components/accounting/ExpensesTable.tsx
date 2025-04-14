
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
import { Expense, expenseCategoryLabels, expenseStatusLabels, paymentMethodLabels } from "@/types/expense";
import { Edit, FileText, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface ExpensesTableProps {
  expenses: Expense[];
  onViewExpense: (expense: Expense) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const ExpensesTable: React.FC<ExpensesTableProps> = ({
  expenses,
  onViewExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  const renderStatusBadge = (status: Expense["status"]) => {
    const variants: Record<Expense["status"], string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      reimbursed: "bg-blue-100 text-blue-800 border-blue-200",
    };

    return (
      <Badge variant="outline" className={`${variants[status]} font-medium`}>
        {expenseStatusLabels[status]}
      </Badge>
    );
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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">
                {format(new Date(expense.date), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>{expense.description}</TableCell>
              <TableCell>{expenseCategoryLabels[expense.category]}</TableCell>
              <TableCell className="font-medium">
                £{expense.amount.toFixed(2)}
              </TableCell>
              <TableCell>{paymentMethodLabels[expense.paymentMethod]}</TableCell>
              <TableCell>{renderStatusBadge(expense.status)}</TableCell>
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
