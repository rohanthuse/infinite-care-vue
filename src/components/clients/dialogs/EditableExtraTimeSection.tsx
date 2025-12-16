import React from 'react';
import { Timer, Trash2, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/currencyFormatter';
import { format, parseISO, isValid } from 'date-fns';
import { InvoiceExtraTimeEntry } from '@/hooks/useInvoiceExtraTimeEntries';
import { Skeleton } from '@/components/ui/skeleton';

interface EditableExtraTimeSectionProps {
  extraTimeEntries: InvoiceExtraTimeEntry[];
  isLoading?: boolean;
  onRemove: (entryId: string) => void;
  onAddClick: () => void;
  isReadOnly?: boolean;
  isRemoving?: string | null;
}

const formatDateSafe = (dateValue: string | null): string => {
  if (!dateValue) return 'N/A';
  try {
    const date = parseISO(dateValue);
    if (!isValid(date)) return 'N/A';
    return format(date, 'dd/MM/yyyy');
  } catch {
    return 'N/A';
  }
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

export function EditableExtraTimeSection({
  extraTimeEntries,
  isLoading,
  onRemove,
  onAddClick,
  isReadOnly = false,
  isRemoving,
}: EditableExtraTimeSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const totalMinutes = extraTimeEntries.reduce((sum, e) => sum + e.extra_time_minutes, 0);
  const totalCost = extraTimeEntries.reduce((sum, e) => sum + e.total_cost, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Timer className="h-4 w-4 text-blue-600" />
          Extra Time Charges
          {extraTimeEntries.length > 0 && (
            <Badge variant="secondary" className="ml-2">{extraTimeEntries.length}</Badge>
          )}
        </h3>
        {!isReadOnly && (
          <Button type="button" onClick={onAddClick} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Extra Time
          </Button>
        )}
      </div>

      {extraTimeEntries.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {!isReadOnly && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {extraTimeEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDateSafe(entry.work_date)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {formatDuration(entry.extra_time_minutes)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={entry.reason || ''}>
                    {entry.reason || '-'}
                  </TableCell>
                  <TableCell>{entry.staff_name || '-'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(entry.total_cost)}
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(entry.id)}
                        disabled={isRemoving === entry.id}
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
          <p className="text-sm text-muted-foreground">No extra time charges</p>
          {!isReadOnly && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onAddClick}
              className="mt-2"
            >
              Add extra time from approved records
            </Button>
          )}
        </div>
      )}

      {extraTimeEntries.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm bg-blue-50 dark:bg-blue-950/30 px-4 py-2 rounded-md">
            <span className="text-muted-foreground">
              Extra Time Subtotal ({formatDuration(totalMinutes)}):
            </span>
            <span className="ml-2 font-semibold">{formatCurrency(totalCost)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
