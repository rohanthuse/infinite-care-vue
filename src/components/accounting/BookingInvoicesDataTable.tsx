import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download, Edit, ArrowUpDown } from 'lucide-react';
import { ComprehensiveInvoiceFilters } from './ComprehensiveInvoiceFilters';
import { useBranchBookingInvoices } from '@/hooks/useBranchBookingInvoices';
import { formatCurrency } from '@/utils/currencyFormatter';
import type { BranchInvoiceFilters, BranchInvoiceSorting } from '@/hooks/useBranchInvoices';

interface BookingInvoicesDataTableProps {
  branchId: string;
  onViewInvoice?: (invoiceId: string) => void;
  onEditInvoice?: (invoiceId: string) => void;
  onDownloadInvoice?: (invoiceId: string) => void;
}

const BookingInvoicesDataTable: React.FC<BookingInvoicesDataTableProps> = ({
  branchId,
  onViewInvoice,
  onEditInvoice,
  onDownloadInvoice,
}) => {
  const [filters, setFilters] = useState<BranchInvoiceFilters>({});
  const [sorting, setSorting] = useState<BranchInvoiceSorting>({
    field: 'invoice_date',
    direction: 'desc'
  });

  const { data: invoices, isLoading } = useBranchBookingInvoices(branchId, filters, sorting);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resetFilters = () => {
    setFilters({});
  };

  const handleSort = (field: BranchInvoiceSorting['field']) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue) return <Badge variant="destructive">Overdue</Badge>;
    
    const variants: Record<string, any> = {
      'draft': 'secondary',
      'pending': 'outline',
      'paid': 'default',
      'confirmed': 'default',
      'cancelled': 'destructive',
    };
    
    return <Badge variant={variants[status] || 'outline'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>;
  };

  const getBookingStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'completed': 'default',
      'done': 'default',
      'cancelled': 'destructive',
      'pending': 'outline',
    };
    
    return <Badge variant={variants[status] || 'secondary'} className="text-xs">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>;
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 bg-muted rounded w-full mb-4"></div>
      <div className="h-64 bg-muted rounded"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Invoices Against Bookings</h2>
          <p className="text-sm text-muted-foreground">
            Showing {invoices?.length || 0} invoice{invoices?.length !== 1 ? 's' : ''} generated from bookings
          </p>
        </div>
        <Button variant="outline" onClick={resetFilters}>
          Reset Filters
        </Button>
      </div>

      {/* Filters */}
      <ComprehensiveInvoiceFilters 
        branchId={branchId} 
        filters={filters} 
        onFiltersChange={setFilters} 
        onReset={resetFilters} 
      />

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="cursor-pointer" onClick={() => handleSort('invoice_number')}>
                <div className="flex items-center gap-2">
                  Invoice No.
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Booking ID</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('client_name')}>
                <div className="flex items-center gap-2">
                  Client Name
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('invoice_date')}>
                <div className="flex items-center gap-2">
                  Invoice Date
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Booking Date</TableHead>
              <TableHead>Booking Status</TableHead>
              <TableHead>Invoice Status</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('total_amount')}>
                <div className="flex items-center gap-2">
                  Amount
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No booking-linked invoices found. Adjust filters or create bookings first.
                </TableCell>
              </TableRow>
            ) : (
              invoices?.map(invoice => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {invoice.booking_id.slice(0, 8)}...
                    </span>
                  </TableCell>
                  <TableCell>{invoice.client_name}</TableCell>
                  <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                  <TableCell>{formatDateTime(invoice.booking.start_time)}</TableCell>
                  <TableCell>{getBookingStatusBadge(invoice.booking.status)}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status, invoice.is_overdue)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(invoice.total_amount || invoice.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onViewInvoice?.(invoice.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {invoice.status === 'draft' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onEditInvoice?.(invoice.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onDownloadInvoice?.(invoice.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BookingInvoicesDataTable;
