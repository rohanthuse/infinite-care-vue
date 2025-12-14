import React, { useState } from "react";
import { ChevronDown, ChevronUp, Receipt, AlertCircle, Eye, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useExpensesByBooking, BookingExpense } from "@/hooks/useExpensesByBooking";
import { useBookingExtraTime } from "@/hooks/useBookingExtraTime";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import ViewBookingExpenseDialog from "./ViewBookingExpenseDialog";

interface AppointmentExpensesListProps {
  bookingId: string;
}

const AppointmentExpensesList: React.FC<AppointmentExpensesListProps> = ({
  bookingId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<BookingExpense | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  
  const { data: expenses = [], isLoading: expensesLoading } = useExpensesByBooking(bookingId);
  const { data: extraTime, isLoading: extraTimeLoading } = useBookingExtraTime(bookingId);

  if (expensesLoading || extraTimeLoading) {
    return (
      <div className="space-y-1">
        <Skeleton className="h-6 w-24" />
      </div>
    );
  }

  const hasExpenses = expenses.length > 0;
  const hasExtraTime = !!extraTime;

  // Only show "No expenses added" when BOTH are empty
  if (!hasExpenses && !hasExtraTime) {
    return (
      <div className="text-xs text-muted-foreground italic">
        No expenses added
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <Badge variant="custom" className="bg-green-100 text-green-700 text-[10px] px-1.5">Approved</Badge>;
      case 'rejected':
        return <Badge variant="custom" className="bg-red-100 text-red-700 text-[10px] px-1.5">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="custom" className="bg-amber-100 text-amber-700 text-[10px] px-1.5">Pending</Badge>;
    }
  };

  const getExtraTimeStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <Badge variant="custom" className="bg-green-100 text-green-700 text-[10px] px-1.5">Approved</Badge>;
      case 'rejected':
        return <Badge variant="custom" className="bg-red-100 text-red-700 text-[10px] px-1.5">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="custom" className="bg-amber-100 text-amber-700 text-[10px] px-1.5">Pending</Badge>;
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

  // Calculate summary counts
  const totalItems = expenses.length + (hasExtraTime ? 1 : 0);

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
          <span className="text-xs font-medium">
            {hasExpenses && hasExtraTime
              ? `Expenses (${expenses.length}) + Extra Time`
              : hasExpenses
                ? `Expenses (${expenses.length})`
                : 'Extra Time'}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </Button>

      {isExpanded && (
        <div className="space-y-1.5">
          {/* Extra Time Record */}
          {hasExtraTime && (
            <div
              className={cn(
                "p-2 rounded-md border bg-card transition-colors",
                extraTime.status === 'rejected' && "border-red-200 bg-red-50/50",
                extraTime.status === 'approved' && "border-green-200 bg-green-50/50",
                extraTime.status === 'pending' && "border-amber-200 bg-amber-50/50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-medium">Extra Time</span>
                  <span className="text-xs text-muted-foreground">
                    {extraTime.extra_time_minutes} mins
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(extraTime.total_cost)}
                  </span>
                  {getExtraTimeStatusBadge(extraTime.status)}
                </div>
              </div>
              {extraTime.reason && (
                <div className="mt-1.5 text-[10px] text-muted-foreground line-clamp-2">
                  {extraTime.reason}
                </div>
              )}
            </div>
          )}

          {/* Expense Records */}
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
      />
    </div>
  );
};

export default AppointmentExpensesList;
