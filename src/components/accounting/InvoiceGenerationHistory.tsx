import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar,
  TrendingUp,
  FileText,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { useBulkInvoiceHistory, type BatchHistoryFilters } from "@/hooks/useBulkInvoiceHistory";
import { formatCurrency } from "@/utils/currencyFormatter";

interface InvoiceGenerationHistoryProps {
  branchId: string;
}

export const InvoiceGenerationHistory: React.FC<InvoiceGenerationHistoryProps> = ({
  branchId,
}) => {
  const [filters, setFilters] = useState<BatchHistoryFilters>({});
  const { data: history, isLoading } = useBulkInvoiceHistory(branchId, filters);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="gap-1 bg-green-500">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="gap-1 bg-yellow-500">
            <AlertCircle className="h-3 w-3" />
            Partial
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPeriodTypeBadge = (type: string) => {
    const colors = {
      weekly: 'bg-blue-500',
      fortnightly: 'bg-purple-500',
      monthly: 'bg-indigo-500',
    };
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-500'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generation History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No bulk invoice generation history found</p>
            <p className="text-sm text-muted-foreground mt-2">
              History will appear here after you generate invoices in bulk
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Generation History</span>
          <Badge variant="outline">{history.length} batch{history.length !== 1 ? 'es' : ''}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {history.map((batch) => {
              const successRate = batch.clients_processed > 0
                ? ((batch.invoices_created / batch.clients_processed) * 100).toFixed(1)
                : '0';

              return (
                <Card key={batch.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header Row */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(batch.generated_at), 'PPP p')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPeriodTypeBadge(batch.period_type)}
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(batch.period_start_date), 'MMM d')} - {format(new Date(batch.period_end_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(batch.status)}
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Clients Processed</p>
                          <p className="text-2xl font-bold">{batch.clients_processed}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Invoices Created</p>
                          <p className="text-2xl font-bold text-green-600">{batch.invoices_created}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Failed</p>
                          <p className="text-2xl font-bold text-red-600">{batch.invoices_failed}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Success Rate</p>
                          <div className="flex items-baseline gap-1">
                            <p className="text-2xl font-bold">{successRate}%</p>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          </div>
                        </div>
                      </div>

                      {/* Financial Summary */}
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                          <p className="text-xl font-bold">{formatCurrency(batch.total_amount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Net</p>
                          <p className="text-lg font-medium">{formatCurrency(batch.total_net_amount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">VAT</p>
                          <p className="text-lg font-medium">{formatCurrency(batch.total_vat_amount)}</p>
                        </div>
                      </div>

                      {/* Execution Time */}
                      {batch.execution_time_ms && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Completed in {(batch.execution_time_ms / 1000).toFixed(2)}s</span>
                        </div>
                      )}

                      {/* Errors */}
                      {batch.error_details && Array.isArray(batch.error_details) && batch.error_details.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-destructive">Errors:</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {batch.error_details.map((error: any, idx: number) => (
                              <p key={idx} className="text-xs text-muted-foreground pl-4">
                                • {error.clientName}: {error.reason}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
