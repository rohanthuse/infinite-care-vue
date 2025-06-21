import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Plus, Filter } from "lucide-react";
import { useExpenseTypes } from "@/hooks/useKeyParameters";

// Mock data for demonstration
const mockExpenses = [
  {
    id: "1",
    date: "2024-01-15",
    description: "Office supplies",
    expense_type_id: "", // Will be populated with actual expense type ID
    amount: 125.50,
    status: "approved",
    staff_member: "John Doe",
    receipt_attached: true,
  },
  {
    id: "2", 
    date: "2024-01-12",
    description: "Travel expenses",
    expense_type_id: "", // Will be populated with actual expense type ID
    amount: 85.00,
    status: "pending",
    staff_member: "Jane Smith",
    receipt_attached: false,
  },
];

export const ExpensesTableUpdated = () => {
  const [expenses] = useState(mockExpenses);
  const { data: expenseTypes, isLoading: expenseTypesLoading } = useExpenseTypes();

  // Get the first expense type ID to use as default for demo
  const defaultExpenseTypeId = expenseTypes?.[0]?.id || "";

  const getExpenseTypeName = (expenseTypeId: string) => {
    const expenseType = expenseTypes?.find(type => type.id === expenseTypeId);
    return expenseType?.title || "Unknown Type";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (expenseTypesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading expense types...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Expenses</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Staff Member</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{new Date(expense.date).toLocaleDateString('en-GB')}</TableCell>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell>
                  {getExpenseTypeName(expense.expense_type_id || defaultExpenseTypeId)}
                </TableCell>
                <TableCell>£{expense.amount.toFixed(2)}</TableCell>
                <TableCell>{expense.staff_member}</TableCell>
                <TableCell>{getStatusBadge(expense.status)}</TableCell>
                <TableCell>
                  {expense.receipt_attached ? (
                    <Badge variant="outline" className="text-green-600">Attached</Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600">Missing</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                  No expenses found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
