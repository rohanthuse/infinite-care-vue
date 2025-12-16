import React from 'react';
import { XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/currencyFormatter';
import { format, parseISO, isValid } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { CancelledBookingData } from '@/hooks/useInvoiceCancelledBookings';

interface EditableCancelledBookingsSectionProps {
  cancelledBookings: CancelledBookingData[];
  isLoading?: boolean;
  onToggleInclude: (bookingId: string, isIncluded: boolean) => void;
  isReadOnly?: boolean;
  isUpdating?: string | null;
}

const formatDateTimeSafe = (dateValue: string | null, formatStr: string): string => {
  if (!dateValue) return 'N/A';
  try {
    const date = parseISO(dateValue);
    if (!isValid(date)) return 'N/A';
    return format(date, formatStr);
  } catch {
    return 'N/A';
  }
};

const getChargesDisplay = (booking: CancelledBookingData): { amount: number; label: string } => {
  if (!booking.suspension_honor_staff_payment) {
    return { amount: 0, label: 'No charge' };
  }

  const amount = booking.staff_payment_amount || 0;
  const paymentType = booking.staff_payment_type;

  if (paymentType === 'full') {
    return { amount, label: `Full (${formatCurrency(amount)})` };
  }
  if (paymentType === 'half') {
    return { amount, label: `Half (${formatCurrency(amount)})` };
  }
  if (paymentType === 'custom') {
    return { amount, label: `Custom (${formatCurrency(amount)})` };
  }

  return { amount, label: formatCurrency(amount) };
};

export function EditableCancelledBookingsSection({
  cancelledBookings,
  isLoading,
  onToggleInclude,
  isReadOnly = false,
  isUpdating,
}: EditableCancelledBookingsSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // Filter to only show bookings with charges
  const chargeableBookings = cancelledBookings.filter(
    (b) => b.suspension_honor_staff_payment && b.staff_payment_amount
  );

  // Calculate total of included bookings
  const includedTotal = chargeableBookings
    .filter((b) => b.is_invoiced !== false)
    .reduce((sum, b) => sum + (b.staff_payment_amount || 0), 0);

  const allBookingsCount = cancelledBookings.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <XCircle className="h-4 w-4 text-destructive" />
          Cancelled Bookings
          {allBookingsCount > 0 && (
            <Badge variant="destructive" className="ml-2">{allBookingsCount}</Badge>
          )}
        </h3>
      </div>

      {chargeableBookings.length > 0 ? (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {!isReadOnly && <TableHead className="w-[50px]">Include</TableHead>}
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Staff Payment</TableHead>
                  <TableHead className="text-right">Charge Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chargeableBookings.map((booking) => {
                  const chargeInfo = getChargesDisplay(booking);
                  const isIncluded = booking.is_invoiced !== false;
                  const staffName =
                    booking.staff_first_name && booking.staff_last_name
                      ? `${booking.staff_first_name} ${booking.staff_last_name}`
                      : 'Unassigned';

                  return (
                    <TableRow key={booking.id} className={!isIncluded ? 'opacity-50' : ''}>
                      {!isReadOnly && (
                        <TableCell>
                          <Checkbox
                            checked={isIncluded}
                            onCheckedChange={(checked) =>
                              onToggleInclude(booking.id, checked as boolean)
                            }
                            disabled={isUpdating === booking.id}
                          />
                        </TableCell>
                      )}
                      <TableCell className="whitespace-nowrap">
                        {formatDateTimeSafe(booking.start_time, 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTimeSafe(booking.start_time, 'HH:mm')} –{' '}
                        {formatDateTimeSafe(booking.end_time, 'HH:mm')}
                      </TableCell>
                      <TableCell>{staffName}</TableCell>
                      <TableCell
                        className="max-w-[150px] truncate"
                        title={booking.cancellation_reason || 'Not specified'}
                      >
                        {booking.cancellation_reason || 'Not specified'}
                      </TableCell>
                      <TableCell>{chargeInfo.label}</TableCell>
                      <TableCell className="text-right font-medium">
                        {isIncluded ? formatCurrency(chargeInfo.amount) : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <div className="text-sm bg-red-50 dark:bg-red-950/30 px-4 py-2 rounded-md">
              <span className="text-muted-foreground">Cancelled Booking Fees:</span>
              <span className="ml-2 font-semibold">{formatCurrency(includedTotal)}</span>
            </div>
          </div>
        </>
      ) : allBookingsCount > 0 ? (
        <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {allBookingsCount} cancelled booking(s) with no charges
          </p>
        </div>
      ) : (
        <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">No cancelled bookings for this invoice period</p>
        </div>
      )}
    </div>
  );
}
