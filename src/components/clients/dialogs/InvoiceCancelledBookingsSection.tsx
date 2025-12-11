import React from 'react';
import { XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, parseISO, isValid } from 'date-fns';
import { useInvoiceCancelledBookings, CancelledBookingData } from '@/hooks/useInvoiceCancelledBookings';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Skeleton } from '@/components/ui/skeleton';

interface InvoiceCancelledBookingsSectionProps {
  invoiceId: string;
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

const getCancelledByLabel = (cancelledBy: string | null): string => {
  if (!cancelledBy) return 'Unknown';
  
  // Check if it's a known type
  const lowerValue = cancelledBy.toLowerCase();
  if (lowerValue === 'admin') return 'Admin';
  if (lowerValue === 'client') return 'Client';
  if (lowerValue === 'staff' || lowerValue === 'carer') return 'Staff';
  
  // If it looks like a UUID, it's likely a user ID
  if (cancelledBy.includes('-') && cancelledBy.length > 30) {
    return 'Admin';
  }
  
  return cancelledBy;
};

const getChargesDisplay = (booking: CancelledBookingData): string => {
  if (!booking.suspension_honor_staff_payment) {
    return 'No staff payment';
  }
  
  const paymentType = booking.staff_payment_type;
  const amount = booking.staff_payment_amount;
  
  if (paymentType === 'full' && amount) {
    return `Full (${formatCurrency(amount)})`;
  }
  if (paymentType === 'half' && amount) {
    return `Half (${formatCurrency(amount)})`;
  }
  if (paymentType === 'custom' && amount) {
    return `Custom (${formatCurrency(amount)})`;
  }
  
  return 'Staff payment applied';
};

const getInvoiceStatusDisplay = (booking: CancelledBookingData): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
  if (booking.is_invoiced === false) {
    return { label: 'Removed from Invoice', variant: 'destructive' };
  }
  return { label: 'Kept on Invoice', variant: 'secondary' };
};

export function InvoiceCancelledBookingsSection({ invoiceId }: InvoiceCancelledBookingsSectionProps) {
  const { data: cancelledBookings, isLoading, error } = useInvoiceCancelledBookings(invoiceId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-3 bg-destructive/10 rounded-md">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Failed to load cancelled bookings</span>
      </div>
    );
  }

  const count = cancelledBookings?.length || 0;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="cancelled-bookings" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:no-underline">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="font-semibold">Cancelled Bookings</span>
            {count > 0 && (
              <Badge variant="destructive" className="ml-2">
                {count}
              </Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          {count === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No cancelled bookings for this invoice.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead>Booking Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Carer/Staff</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Staff Payment</TableHead>
                    <TableHead>Invoice Status</TableHead>
                    <TableHead>Cancelled By</TableHead>
                    <TableHead>Cancelled At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cancelledBookings?.map((booking) => {
                    const invoiceStatus = getInvoiceStatusDisplay(booking);
                    const staffName = booking.staff_first_name && booking.staff_last_name
                      ? `${booking.staff_first_name} ${booking.staff_last_name}`
                      : 'Unassigned';

                    return (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <Badge variant="destructive" className="text-xs">
                            Cancelled
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDateTimeSafe(booking.start_time, 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDateTimeSafe(booking.start_time, 'HH:mm')} – {formatDateTimeSafe(booking.end_time, 'HH:mm')}
                        </TableCell>
                        <TableCell>{staffName}</TableCell>
                        <TableCell className="max-w-[150px] truncate" title={booking.cancellation_reason || 'Not specified'}>
                          {booking.cancellation_reason || 'Not specified'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {getChargesDisplay(booking)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={invoiceStatus.variant} className="text-xs">
                            {invoiceStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{getCancelledByLabel(booking.cancelled_by)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDateTimeSafe(booking.cancelled_at, 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
