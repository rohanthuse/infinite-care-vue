import React from 'react';
import { format } from 'date-fns';
import { Check, AlertCircle, FileText, Car, Clock, Timer } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EligibleExpense } from '@/hooks/useEligibleInvoiceExpenses';
import { EligibleExtraTime, formatExtraTimeMinutes } from '@/hooks/useEligibleExtraTimeForInvoice';
import { Skeleton } from '@/components/ui/skeleton';

interface EligibleExpensesSectionProps {
  bookingExpenses: EligibleExpense[];
  travelExpenses: EligibleExpense[];
  otherExpenses: EligibleExpense[];
  extraTimeRecords?: EligibleExtraTime[];
  selectedExpenseIds: string[];
  selectedExtraTimeIds?: string[];
  onToggleExpense: (expenseId: string) => void;
  onToggleExtraTime?: (extraTimeId: string) => void;
  isLoading?: boolean;
  isLoadingExtraTime?: boolean;
}

export function EligibleExpensesSection({
  bookingExpenses,
  travelExpenses,
  otherExpenses,
  extraTimeRecords = [],
  selectedExpenseIds,
  selectedExtraTimeIds = [],
  onToggleExpense,
  onToggleExtraTime,
  isLoading,
  isLoadingExtraTime,
}: EligibleExpensesSectionProps) {
  // Validation: warn if onToggleExtraTime is missing when extra time records are provided
  if (!onToggleExtraTime && extraTimeRecords.length > 0) {
    console.warn('EligibleExpensesSection: onToggleExtraTime is required when extraTimeRecords are provided');
  }
  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;
  
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy');
    } catch {
      return '-';
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

  const getSourceBadge = (expense: EligibleExpense) => {
    if (expense.booking_id) {
      return <Badge variant="outline" className="text-xs">Booking</Badge>;
    }
    if (expense.category === 'travel_expenses' || expense.category === 'mileage') {
      return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Travel</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Claim</Badge>;
  };

  const renderExpenseTable = (expenses: EligibleExpense[], emptyMessage: string) => {
    if (isLoading) {
      return (
        <div className="space-y-2 p-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    if (expenses.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Select</TableHead>
              <TableHead className="w-[100px]">Booking Date</TableHead>
              <TableHead className="w-[100px]">Expense Type</TableHead>
              <TableHead className="w-[100px]">Reference</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[120px]">Staff</TableHead>
              <TableHead className="w-[100px] text-right">Amount</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => {
              const isDisabled = expense.is_invoiced;
              const isSelected = selectedExpenseIds.includes(expense.id);

              return (
                <TableRow 
                  key={expense.id} 
                  className={isDisabled ? 'opacity-50 bg-muted/30' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleExpense(expense.id)}
                      disabled={isDisabled}
                      aria-label={`Select expense ${expense.description}`}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(expense.expense_date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {getCategoryLabel(expense.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getSourceBadge(expense)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {expense.description}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {expense.staff_name || '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    {isDisabled ? (
                      <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                        <Check className="h-3 w-3 mr-1" />
                        Invoiced
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Available
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  const availableBooking = bookingExpenses.filter(e => !e.is_invoiced).length;
  const availableTravel = travelExpenses.filter(e => !e.is_invoiced).length;
  const availableOther = otherExpenses.filter(e => !e.is_invoiced).length;
  const availableExtraTime = extraTimeRecords.filter(e => !e.invoiced).length;

  const totalSelected = selectedExpenseIds.length + selectedExtraTimeIds.length;

  // Render extra time table
  const renderExtraTimeTable = () => {
    if (isLoadingExtraTime) {
      return (
        <div className="space-y-2 p-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    if (extraTimeRecords.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">No extra time records found for this invoice period</p>
        </div>
      );
    }

    // Handler for extra time checkbox click
    const handleExtraTimeToggle = (recordId: string) => {
      if (onToggleExtraTime) {
        console.log('Toggling extra time:', recordId);
        onToggleExtraTime(recordId);
      } else {
        console.error('onToggleExtraTime handler is not provided');
      }
    };

    return (
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Select</TableHead>
              <TableHead className="w-[100px]">Work Date</TableHead>
              <TableHead className="w-[100px]">Booking Ref</TableHead>
              <TableHead className="w-[100px]">Extra Time</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="w-[120px]">Staff</TableHead>
              <TableHead className="w-[100px] text-right">Amount</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {extraTimeRecords.map((record) => {
              const isDisabled = record.invoiced;
              const isSelected = selectedExtraTimeIds.includes(record.id);

              return (
                <TableRow 
                  key={record.id} 
                  className={isDisabled ? 'opacity-50 bg-muted/30' : 'cursor-pointer hover:bg-muted/50'}
                  onClick={() => !isDisabled && handleExtraTimeToggle(record.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleExtraTimeToggle(record.id)}
                      disabled={isDisabled}
                      aria-label={`Select extra time ${record.reason || 'record'}`}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(record.work_date)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {record.booking_id ? (
                      <Badge variant="outline" className="text-xs">
                        Booking
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {formatExtraTimeMinutes(record.extra_time_minutes)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {record.reason || record.notes || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {record.staff_name || '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(record.total_cost)}
                  </TableCell>
                  <TableCell>
                    {isDisabled ? (
                      <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                        <Check className="h-3 w-3 mr-1" />
                        Invoiced
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Available
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Approved Expenses & Extra Time (Select to Add)</h3>
        <div className="text-xs text-muted-foreground">
          {totalSelected} selected
        </div>
      </div>

      <Tabs defaultValue="booking" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="booking" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Booking ({availableBooking})
          </TabsTrigger>
          <TabsTrigger value="travel" className="flex items-center gap-1">
            <Car className="h-3 w-3" />
            Travel ({availableTravel})
          </TabsTrigger>
          <TabsTrigger value="other" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Other ({availableOther})
          </TabsTrigger>
          <TabsTrigger value="extratime" className="flex items-center gap-1">
            <Timer className="h-3 w-3" />
            Extra Time ({availableExtraTime})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="booking" className="mt-4">
          {renderExpenseTable(
            bookingExpenses,
            'No booking-related expenses found for this invoice period'
          )}
        </TabsContent>

        <TabsContent value="travel" className="mt-4">
          {renderExpenseTable(
            travelExpenses,
            'No travel expenses found for this invoice period'
          )}
        </TabsContent>

        <TabsContent value="other" className="mt-4">
          {renderExpenseTable(
            otherExpenses,
            'No other expense claims found for this invoice period'
          )}
        </TabsContent>

        <TabsContent value="extratime" className="mt-4">
          {renderExtraTimeTable()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
