import React, { useState } from "react";
import { ChevronDown, ChevronUp, Receipt, AlertCircle, Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useExpensesByBooking, BookingExpense } from "@/hooks/useExpensesByBooking";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import ViewBookingExpenseDialog from "./ViewBookingExpenseDialog";
import EditBookingExpenseDialog from "./EditBookingExpenseDialog";

interface AppointmentExpensesListProps {
  bookingId: string;
}

const AppointmentExpensesList: React.FC<AppointmentExpensesListProps> = ({
  bookingId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<BookingExpense | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const queryClient = useQueryClient();
  const { data: expenses = [], isLoading } = useExpensesByBooking(bookingId);

  if (isLoading) {
    return (
      <div className="space-y-1">
        <Skeleton className="h-6 w-24" />
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        No expenses added
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5">Pending</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const handleView = (expense: BookingExpense, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedExpense(expense);
    setShowViewDialog(true);
  };

  const handleEdit = (expense: BookingExpense, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedExpense(expense);
    setShowEditDialog(true);
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses-by-booking', bookingId] });
  };

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between h-7 px-2 hover:bg-muted/50"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
      >
        <div className="flex items-center gap-2">
          <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Expenses ({expenses.length})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </Button>

      {isExpanded && (
        <div className="space-y-1.5">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className={cn(
                "p-2 rounded-md border bg-card transition-colors",
                expense.status === 'rejected' && "border-red-200 bg-red-50/50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xs font-medium capitalize truncate">
                    {expense.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(expense.amount)}
                  </span>
                  {getStatusBadge(expense.status)}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => handleView(expense, e)}
                    title="View Details"
                  >
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  {expense.status?.toLowerCase() === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => handleEdit(expense, e)}
                      title="Edit Expense"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
              
              {expense.status === 'rejected' && expense.rejection_reason && (
                <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-red-600">
                  <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{expense.rejection_reason}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <ViewBookingExpenseDialog
        expense={selectedExpense}
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        onEdit={(expense) => handleEdit(expense)}
      />

      {/* Edit Dialog */}
      <EditBookingExpenseDialog
        expense={selectedExpense}
        bookingId={bookingId}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default AppointmentExpensesList;
