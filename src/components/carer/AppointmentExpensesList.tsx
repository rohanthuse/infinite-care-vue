import React, { useState } from "react";
import { ChevronDown, ChevronUp, Receipt, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useExpensesByBooking, BookingExpense } from "@/hooks/useExpensesByBooking";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface AppointmentExpensesListProps {
  bookingId: string;
  onExpenseClick?: (expense: BookingExpense) => void;
}

const AppointmentExpensesList: React.FC<AppointmentExpensesListProps> = ({
  bookingId,
  onExpenseClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: expenses = [], isLoading } = useExpensesByBooking(bookingId);

  if (isLoading) {
    return (
      <div className="mt-3 pt-3 border-t border-border/50">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (expenses.length === 0) {
    return null;
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

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between h-8 px-2 hover:bg-muted/50"
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
        <div className="mt-2 space-y-2">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className={cn(
                "p-2 rounded-md border bg-card cursor-pointer transition-colors hover:bg-muted/50",
                expense.status === 'rejected' && "border-red-200 bg-red-50/50"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onExpenseClick?.(expense);
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium capitalize truncate">
                    {expense.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
                {getStatusBadge(expense.status)}
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
    </div>
  );
};

export default AppointmentExpensesList;
