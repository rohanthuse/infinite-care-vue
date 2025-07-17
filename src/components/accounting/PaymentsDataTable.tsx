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
import { Search, Filter, ArrowUpDown, Eye } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useBranchPayments, BranchPaymentFilters, BranchPaymentSorting } from '@/hooks/useBranchPayments';

interface PaymentsDataTableProps {
  branchId: string;
  onViewPayment?: (paymentId: string) => void;
}

const PaymentsDataTable: React.FC<PaymentsDataTableProps> = ({
  branchId,
  onViewPayment
}) => {
  const [filters, setFilters] = useState<BranchPaymentFilters>({});
  const [sorting, setSorting] = useState<BranchPaymentSorting>({ field: 'payment_date', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  const { data: payments, isLoading } = useBranchPayments(branchId, { ...filters, search: searchTerm }, sorting);

  const getPaymentMethodBadge = (method: string) => {
    const variants: Record<string, any> = {
      'cash': 'default',
      'bank_transfer': 'secondary',
      'credit_card': 'outline',
      'debit_card': 'outline',
      'cheque': 'secondary'
    };

    return <Badge variant={variants[method] || 'outline'}>{method.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const handleSort = (field: BranchPaymentSorting['field']) => {
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
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select
          value={filters.paymentMethod || 'all'}
          onValueChange={(value) => setFilters(prev => ({ 
            ...prev, 
            paymentMethod: value === 'all' ? undefined : value 
          }))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="credit_card">Credit Card</SelectItem>
            <SelectItem value="debit_card">Debit Card</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>
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
              <TableHead className="cursor-pointer" onClick={() => handleSort('payment_date')}>
                <div className="flex items-center gap-2">
                  Date
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('client_name')}>
                <div className="flex items-center gap-2">
                  Client
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('payment_amount')}>
                <div className="flex items-center gap-2">
                  Amount
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('payment_method')}>
                <div className="flex items-center gap-2">
                  Method
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments?.map((payment) => (
              <TableRow key={payment.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  {new Date(payment.payment_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{payment.client_name}</div>
                    {payment.client_pin_code && (
                      <div className="text-sm text-gray-500">{payment.client_pin_code}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{payment.invoice_number}</div>
                    <div className="text-sm text-gray-500 truncate max-w-32">
                      {payment.invoice_description}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-green-600 font-medium">
                  {formatCurrency(payment.payment_amount)}
                </TableCell>
                <TableCell>
                  {getPaymentMethodBadge(payment.payment_method)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {payment.payment_reference && (
                      <div className="font-medium">{payment.payment_reference}</div>
                    )}
                    {payment.transaction_id && (
                      <div className="text-gray-500">{payment.transaction_id}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewPayment?.(payment.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!payments?.length && (
        <div className="text-center py-8 text-gray-500">
          No payments found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default PaymentsDataTable;