import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/currencyFormatter';
import { BillingCalculation } from '@/utils/visitBillingCalculator';

interface EnhancedInvoiceLedgerViewProps {
  lineItems: BillingCalculation[];
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  totalBillableHours: number;
  totalBillableMinutes: number;
  billToType: 'authority' | 'private';
  isConsolidated?: boolean;
  clientGroups?: { [clientId: string]: BillingCalculation[] };
}

export const EnhancedInvoiceLedgerView: React.FC<EnhancedInvoiceLedgerViewProps> = ({
  lineItems,
  netAmount,
  vatAmount,
  totalAmount,
  totalBillableHours,
  totalBillableMinutes,
  billToType,
  isConsolidated = false,
  clientGroups = {}
}) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const renderLineItem = (item: BillingCalculation, isSubItem = false) => (
    <TableRow key={item.visit_id} className={isSubItem ? 'bg-muted/20' : ''}>
      <TableCell className={isSubItem ? 'pl-8' : ''}>
        <div className="space-y-1">
          <div className="font-medium">{item.description}</div>
          <div className="text-sm text-muted-foreground">
            {item.date} • {formatDuration(item.billing_duration_minutes)}
            {item.applies_60_min_rule && (
              <Badge variant="secondary" className="ml-2 text-xs">
                60+ Min Rule
              </Badge>
            )}
            {item.is_bank_holiday && (
              <Badge variant="destructive" className="ml-2 text-xs">
                Bank Holiday {item.multiplier}x
              </Badge>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        {formatDuration(item.billing_duration_minutes)}
      </TableCell>
      <TableCell className="text-center">
        <div className="space-y-1">
          <div className="font-mono">{item.rate_type}</div>
          <div className="text-sm text-muted-foreground">
            {formatCurrency(item.unit_rate)}/hr
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        {item.multiplier !== 1 && `${item.multiplier}x`}
      </TableCell>
      <TableCell className="text-right font-mono">
        {formatCurrency(item.line_total)}
      </TableCell>
      <TableCell className="text-center">
        {item.is_vatable ? (
          <Badge variant="outline" className="text-xs">VAT</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-right font-mono">
        {item.is_vatable ? formatCurrency(item.vat_amount) : '-'}
      </TableCell>
    </TableRow>
  );

  const renderClientGroup = (clientId: string, items: BillingCalculation[]) => {
    const clientTotal = items.reduce((sum, item) => sum + item.line_total, 0);
    const clientVat = items.reduce((sum, item) => sum + item.vat_amount, 0);
    const clientTotalMinutes = items.reduce((sum, item) => sum + item.billing_duration_minutes, 0);

    return (
      <>
        {/* Client Header */}
        <TableRow className="bg-primary/5 font-medium">
          <TableCell colSpan={7}>
            <div className="flex justify-between items-center">
              <span>Client: {clientId}</span>
              <div className="flex gap-4 text-sm">
                <span>Hours: {formatDuration(clientTotalMinutes)}</span>
                <span>Subtotal: {formatCurrency(clientTotal)}</span>
                <span>VAT: {formatCurrency(clientVat)}</span>
              </div>
            </div>
          </TableCell>
        </TableRow>
        
        {/* Client Line Items */}
        {items.map(item => renderLineItem(item, true))}
        
        {/* Client Subtotal */}
        <TableRow className="border-t-2 bg-muted/10">
          <TableCell colSpan={4} className="font-medium">
            Client Subtotal
          </TableCell>
          <TableCell className="text-right font-mono font-medium">
            {formatCurrency(clientTotal)}
          </TableCell>
          <TableCell></TableCell>
          <TableCell className="text-right font-mono font-medium">
            {formatCurrency(clientVat)}
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Invoice Ledger</span>
          <div className="flex gap-4 text-sm font-normal">
            <span>Total Hours: {totalBillableHours}:{totalBillableMinutes.toString().padStart(2, '0')}</span>
            <span>Bill To: {billToType === 'authority' ? 'Authority' : 'Private Client'}</span>
          </div>
        </CardTitle>
        <CardDescription>
          {isConsolidated ? 'Consolidated invoice with client breakdown' : 'Detailed visit billing breakdown'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Qty/Hrs</TableHead>
                <TableHead className="text-center">Rate Type</TableHead>
                <TableHead className="text-center">Multiplier</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
                <TableHead className="text-center">VAT Flag</TableHead>
                <TableHead className="text-right">VAT Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isConsolidated && Object.keys(clientGroups).length > 0 ? (
                // Render consolidated view with client groups
                Object.entries(clientGroups).map(([clientId, items]) =>
                  renderClientGroup(clientId, items)
                )
              ) : (
                // Render standard view
                lineItems.map(item => renderLineItem(item))
              )}
              
              {/* Totals Section */}
              <TableRow className="border-t-2 bg-primary/5">
                <TableCell colSpan={4} className="font-bold text-lg">
                  {isConsolidated ? 'Grand Total' : 'Total'}
                </TableCell>
                <TableCell className="text-right font-bold text-lg font-mono">
                  {formatCurrency(netAmount)}
                </TableCell>
                <TableCell className="font-bold">Net</TableCell>
                <TableCell className="text-right font-bold text-lg font-mono">
                  {formatCurrency(vatAmount)}
                </TableCell>
              </TableRow>
              
              <TableRow className="bg-success/5">
                <TableCell colSpan={4} className="font-bold text-lg">
                  Total Due
                </TableCell>
                <TableCell colSpan={3} className="text-right font-bold text-xl font-mono">
                  {formatCurrency(totalAmount)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-muted/20 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold font-mono">{formatCurrency(netAmount)}</div>
            <div className="text-sm text-muted-foreground">Net Amount</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono">{formatCurrency(vatAmount)}</div>
            <div className="text-sm text-muted-foreground">VAT Amount</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-success">
              {formatCurrency(totalAmount)}
            </div>
            <div className="text-sm text-muted-foreground">Total Due</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};