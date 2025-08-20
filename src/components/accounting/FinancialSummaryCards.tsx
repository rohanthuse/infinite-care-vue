import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, PoundSterling, TrendingUp, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useBranchInvoiceStats } from '@/hooks/useBranchInvoices';
import { useBranchPaymentStats } from '@/hooks/useBranchPayments';

interface FinancialSummaryCardsProps {
  branchId: string;
}

const FinancialSummaryCards: React.FC<FinancialSummaryCardsProps> = ({ branchId }) => {
  const { data: invoiceStats, isLoading: invoiceStatsLoading } = useBranchInvoiceStats(branchId);
  const { data: paymentStats, isLoading: paymentStatsLoading } = useBranchPaymentStats(branchId);

  const isLoading = invoiceStatsLoading || paymentStatsLoading;

  const cards = [
    {
      title: "Outstanding Amount",
      value: formatCurrency(invoiceStats?.totalOutstanding || 0),
      icon: PoundSterling,
      description: `${invoiceStats?.pendingCount || 0} pending invoices`,
      className: "text-orange-600"
    },
    {
      title: "Overdue Invoices",
      value: formatCurrency(invoiceStats?.totalOverdue || 0),
      icon: AlertTriangle,
      description: `${invoiceStats?.overdueCount || 0} overdue invoices`,
      className: "text-red-600"
    },
    {
      title: "Paid This Month",
      value: formatCurrency(invoiceStats?.totalPaidThisMonth || 0),
      icon: TrendingUp,
      description: "Monthly collection",
      className: "text-green-600"
    },
    {
      title: "Today's Collections",
      value: formatCurrency(paymentStats?.todayTotal || 0),
      icon: Clock,
      description: "Today's payments",
      className: "text-blue-600"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-20 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.className}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.className}`}>
                {card.value}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default FinancialSummaryCards;