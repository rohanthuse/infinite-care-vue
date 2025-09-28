import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ArrowUpDown, Eye, PoundSterling } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useBranchInvoices, BranchInvoiceFilters, BranchInvoiceSorting } from '@/hooks/useBranchInvoices';

interface InvoicesDataTableProps {
  branchId: string;
  onViewInvoice?: (invoiceId: string) => void;
  onRecordPayment?: (invoiceId: string) => void;
}

const InvoicesDataTable: React.FC<InvoicesDataTableProps> = ({
  branchId,
  onViewInvoice,
  onRecordPayment
}) => {
  const [filters, setFilters] = useState<BranchInvoiceFilters>({});
  const [sorting, setSorting] = useState<BranchInvoiceSorting>({ field: 'due_date', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invoices, isLoading } = useBranchInvoices(branchId, { ...filters, search: searchTerm }, sorting);

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }

    const variants: Record<string, any> = {
      'draft': 'secondary',
      'sent': 'outline',
      'pending': 'outline',
      'paid': 'default',
      'cancelled': 'secondary'
    };

    return <Badge variant={variants[status] || 'outline'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const handleSort = (field: BranchInvoiceSorting['field']) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setFilters(prev => ({ 
              ...prev, 
              status: value === 'all' ? undefined : [value as any]
            }));
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="ready_to_charge">Ready to Charge</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="future_invoice">Future Invoice</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="cursor-pointer" onClick={() => handleSort('invoice_date')}>
                <div className="flex items-center gap-2">
                  Invoice #
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('client_name')}>
                <div className="flex items-center gap-2">
                  Client
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                <div className="flex items-center gap-2">
                  Amount
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('due_date')}>
                <div className="flex items-center gap-2">
                  Due Date
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices?.map((invoice) => (
              <TableRow key={invoice.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{invoice.invoice_number}</div>
                    <div className="text-sm text-gray-500 truncate max-w-32">
                      {invoice.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{invoice.client_name}</div>
                    {invoice.client_pin_code && (
                      <div className="text-sm text-gray-500">{invoice.client_pin_code}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(invoice.total_amount || invoice.amount)}</TableCell>
                <TableCell>
                  <div className={invoice.is_overdue ? 'text-red-600 font-medium' : ''}>
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(invoice.status, invoice.is_overdue)}
                </TableCell>
                <TableCell className="text-green-600 font-medium">
                  {formatCurrency(invoice.total_paid)}
                </TableCell>
                <TableCell className={invoice.remaining_amount > 0 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                  {formatCurrency(invoice.remaining_amount)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewInvoice?.(invoice.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {invoice.remaining_amount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRecordPayment?.(invoice.id)}
                      >
                        <PoundSterling className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!invoices?.length && (
        <div className="text-center py-8 text-gray-500">
          No invoices found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default InvoicesDataTable;