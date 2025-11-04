import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { useInvoiceQueueStats } from '@/hooks/useInvoiceGenerationQueue';
import { formatCurrency } from '@/utils/currencyFormatter';
import { billingFrequencyLabels } from '@/types/clientAccounting';

interface InvoiceGenerationWidgetProps {
  branchId: string;
  onViewReadyClients: () => void;
}

export const InvoiceGenerationWidget: React.FC<InvoiceGenerationWidgetProps> = ({
  branchId,
  onViewReadyClients,
}) => {
  const { stats, isLoading } = useInvoiceQueueStats(branchId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Generation Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoice Generation Queue
        </CardTitle>
        <CardDescription>
          Clients with completed bookings ready for invoicing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Ready to Invoice</p>
            <p className="text-2xl font-bold">{stats.totalReady}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-destructive">{stats.overdueClients}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Action Required</p>
            <Badge variant={stats.totalReady > 0 ? 'destructive' : 'secondary'}>
              {stats.totalReady > 0 ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>

        {/* Breakdown by Frequency */}
        {stats.totalReady > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">By Billing Frequency</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(stats.byFrequency).map(([frequency, count]) => (
                count > 0 && (
                  <div key={frequency} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span className="text-xs text-muted-foreground">
                      {billingFrequencyLabels[frequency as keyof typeof billingFrequencyLabels]}
                    </span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Warning for overdue clients */}
        {stats.overdueClients > 0 && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">
              {stats.overdueClients} {stats.overdueClients === 1 ? 'client is' : 'clients are'} overdue for invoicing
            </p>
          </div>
        )}

        {/* Action Button */}
        {stats.totalReady > 0 ? (
          <Button onClick={onViewReadyClients} className="w-full">
            <Clock className="mr-2 h-4 w-4" />
            Review {stats.totalReady} Ready {stats.totalReady === 1 ? 'Client' : 'Clients'}
          </Button>
        ) : (
          <div className="text-center py-4">
            <DollarSign className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              All clients are up to date. No invoices pending.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
