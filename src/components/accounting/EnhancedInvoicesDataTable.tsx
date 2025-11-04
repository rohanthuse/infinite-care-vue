import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Eye, PoundSterling, Edit, Lock, Unlock, Send, Download, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useBranchInvoices, BranchInvoiceFilters, BranchInvoiceSorting } from '@/hooks/useBranchInvoices';
import { useDeleteInvoice } from '@/hooks/useEnhancedClientBilling';
import { DeleteInvoiceDialog } from '@/components/clients/tabs/DeleteInvoiceDialog';
import { ComprehensiveInvoiceFilters } from './ComprehensiveInvoiceFilters';
interface EnhancedInvoicesDataTableProps {
  branchId: string;
  branchName?: string;
  onViewInvoice?: (invoiceId: string) => void;
  onEditInvoice?: (invoiceId: string) => void;
  onRecordPayment?: (invoiceId: string) => void;
  onCreateInvoice?: () => void;
  onLockInvoice?: (invoiceId: string) => void;
  onUnlockInvoice?: (invoiceId: string) => void;
  onSendInvoice?: (invoiceId: string) => void;
  onExportInvoice?: (invoiceId: string) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
}
const EnhancedInvoicesDataTable: React.FC<EnhancedInvoicesDataTableProps> = ({
  branchId,
  branchName,
  onViewInvoice,
  onEditInvoice,
  onRecordPayment,
  onCreateInvoice,
  onLockInvoice,
  onUnlockInvoice,
  onSendInvoice,
  onExportInvoice,
  onDeleteInvoice
}) => {
  const [filters, setFilters] = useState<BranchInvoiceFilters>({});
  const [sorting, setSorting] = useState<BranchInvoiceSorting>({
    field: 'due_date',
    direction: 'desc'
  });
  const [deleteInvoice, setDeleteInvoice] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const {
    data: invoices,
    isLoading
  } = useBranchInvoices(branchId, filters, sorting);
  const deleteInvoiceMutation = useDeleteInvoice();
  const getStatusBadge = (status: string, isOverdue: boolean, isLocked: boolean) => {
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    const variants: Record<string, any> = {
      'draft': 'secondary',
      'ready_to_charge': 'outline',
      'confirmed': isLocked ? 'default' : 'outline',
      'future_invoice': 'secondary',
      'pending': 'outline',
      'paid': 'default',
      'cancelled': 'destructive',
      'deleted': 'secondary'
    };
    const displayText = status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return <div className="flex items-center gap-1">
        <Badge variant={variants[status] || 'outline'}>{displayText}</Badge>
        {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
      </div>;
  };
  const handleSort = (field: BranchInvoiceSorting['field']) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  const resetFilters = () => {
    setFilters({});
  };
  const handleDeleteInvoice = (invoice: any) => {
    setDeleteInvoice(invoice);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = () => {
    if (deleteInvoice) {
      deleteInvoiceMutation.mutate(deleteInvoice.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setDeleteInvoice(null);
          onDeleteInvoice?.(deleteInvoice.id);
        }
      });
    }
  };
  const formatDate = (dateString: string) => {
    return dateString ? new Date(dateString).toLocaleDateString('en-GB') : '-';
  };
  const formatTime = (minutes: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  if (isLoading) {
    return <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded w-full mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Invoices</h2>
          {branchName && <p className="text-sm text-muted-foreground">Managing invoices for {branchName}</p>}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
        </div>
      </div>

      {/* Comprehensive Filters */}
      <ComprehensiveInvoiceFilters branchId={branchId} filters={filters} onFiltersChange={setFilters} onReset={resetFilters} />

      {/* Enhanced Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="cursor-pointer min-w-[120px]" onClick={() => handleSort('invoice_number')}>
                <div className="flex items-center gap-2">
                  Client
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer min-w-[100px]" onClick={() => handleSort('start_date')}>
                <div className="flex items-center gap-2">
                  Start Date
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer min-w-[100px]" onClick={() => handleSort('end_date')}>
                <div className="flex items-center gap-2">
                  End Date
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="min-w-[100px]">Booked Time</TableHead>
              <TableHead className="min-w-[100px]">Actual Time</TableHead>
              <TableHead className="cursor-pointer min-w-[120px]" onClick={() => handleSort('invoice_number')}>
                <div className="flex items-center gap-2">
                  Invoice No.
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer min-w-[100px]" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-2">
                  Status
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer min-w-[120px]" onClick={() => handleSort('total_amount')}>
                <div className="flex items-center gap-2">
                  Total Amount (£)
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="min-w-[120px]">Pay Method</TableHead>
              <TableHead className="text-center min-w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices?.map(invoice => {
            const isLocked = invoice.is_locked || invoice.status === 'confirmed';
            const canEdit = !isLocked && ['draft', 'ready_to_charge'].includes(invoice.status);
            const canLock = !isLocked && invoice.status === 'ready_to_charge';
            const canSend = !isLocked && ['ready_to_charge', 'confirmed'].includes(invoice.status);
            return <TableRow key={invoice.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.client_name}</div>
                      {invoice.client_pin_code && <div className="text-sm text-muted-foreground">{invoice.client_pin_code}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(invoice.start_date)}</TableCell>
                  <TableCell>{formatDate(invoice.end_date)}</TableCell>
                  <TableCell className="text-center">
                    {formatTime(invoice.booked_time_minutes)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatTime(invoice.actual_time_minutes)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {invoice.invoice_number || <span className="text-muted-foreground italic">Draft</span>}
                      </div>
                      {invoice.description && <div className="text-sm text-muted-foreground truncate max-w-32">
                          {invoice.description}
                        </div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(invoice.status, invoice.is_overdue, isLocked)}
                  </TableCell>
                  <TableCell>
                    <div className={invoice.is_overdue ? 'text-destructive font-medium' : ''}>
                      {formatCurrency(invoice.total_amount || invoice.amount)}
                    </div>
                    {invoice.remaining_amount > 0 && <div className="text-sm text-muted-foreground">
                        Remaining: {formatCurrency(invoice.remaining_amount)}
                      </div>}
                  </TableCell>
                  <TableCell>
                    {invoice.pay_method ? <span className="capitalize">
                        {invoice.pay_method.replace('_', ' ')}
                      </span> : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1 flex-wrap">
                      {/* Lock/Unlock */}
                      {canLock ? <Button variant="ghost" size="sm" onClick={() => onLockInvoice?.(invoice.id)} title="Lock Invoice">
                          <Lock className="h-4 w-4" />
                        </Button> : isLocked && onUnlockInvoice ? <Button variant="ghost" size="sm" onClick={() => onUnlockInvoice?.(invoice.id)} title="Unlock Invoice">
                          <Unlock className="h-4 w-4" />
                        </Button> : null}

                      {/* Edit */}
                      {canEdit && <Button variant="ghost" size="sm" onClick={() => onEditInvoice?.(invoice.id)} title="Edit Invoice">
                          <Edit className="h-4 w-4" />
                        </Button>}

                      {/* View */}
                      <Button variant="ghost" size="sm" onClick={() => onViewInvoice?.(invoice.id)} title="View Invoice">
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Send/Export */}
                      {canSend && <Button variant="ghost" size="sm" onClick={() => onSendInvoice?.(invoice.id)} title="Send Invoice">
                          <Send className="h-4 w-4" />
                        </Button>}

                      <Button variant="ghost" size="sm" onClick={() => onExportInvoice?.(invoice.id)} title="Export PDF">
                        <Download className="h-4 w-4" />
                      </Button>

                      {/* Record Payment */}
                      {invoice.remaining_amount > 0 && <Button variant="ghost" size="sm" onClick={() => onRecordPayment?.(invoice.id)} title="Record Payment" className="text-green-600 hover:text-green-700">
                          <PoundSterling className="h-4 w-4" />
                        </Button>}

                      {/* Delete */}
                      {(invoice.status === 'draft' || invoice.status === 'cancelled') && <Button variant="ghost" size="sm" onClick={() => handleDeleteInvoice(invoice)} title="Delete Invoice" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>}
                    </div>
                  </TableCell>
                </TableRow>;
          })}
          </TableBody>
        </Table>
      </div>

      <DeleteInvoiceDialog invoice={deleteInvoice} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} isLoading={deleteInvoiceMutation.isPending} />

      {/* Empty State */}
      {!invoices?.length && <div className="text-center py-12 border rounded-lg bg-muted/20">
          <div className="text-muted-foreground">
            <h3 className="text-lg font-medium mb-2">No invoices found</h3>
            <p className="text-sm mb-4">
              {Object.keys(filters).length > 0 ? "No invoices match your current filter criteria." : "Get started by creating your first invoice."}
            </p>
            {Object.keys(filters).length > 0 ? <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button> : <Button onClick={onCreateInvoice}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Invoice
              </Button>}
          </div>
        </div>}

      {/* Summary Stats */}
      {invoices?.length ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-semibold">{invoices.length}</div>
            <div className="text-sm text-muted-foreground">Total Invoices</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600">
              {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.total_amount || inv.amount), 0))}
            </div>
            <div className="text-sm text-muted-foreground">Total Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-orange-600">
              {formatCurrency(invoices.reduce((sum, inv) => sum + inv.remaining_amount, 0))}
            </div>
            <div className="text-sm text-muted-foreground">Outstanding</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-red-600">
              {invoices.filter(inv => inv.is_overdue).length}
            </div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </div>
        </div> : null}
    </div>;
};
export default EnhancedInvoicesDataTable;