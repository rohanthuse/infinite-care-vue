import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, DollarSign } from 'lucide-react';
import FinancialSummaryCards from './FinancialSummaryCards';
import InvoicesDataTable from './InvoicesDataTable';
import PaymentsDataTable from './PaymentsDataTable';

interface InvoicesPaymentsTabProps {
  branchId?: string;
  branchName?: string;
}

const InvoicesPaymentsTab: React.FC<InvoicesPaymentsTabProps> = ({ branchId, branchName }) => {
  const [activeSubTab, setActiveSubTab] = useState('invoices');

  if (!branchId) {
    return (
      <div className="text-center py-8 text-gray-500">
        No branch selected
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <FinancialSummaryCards branchId={branchId} />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Invoice
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Record Payment
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* Invoices and Payments Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">All Invoices</h3>
                <p className="text-sm text-gray-500">Manage and track all client invoices</p>
              </div>
            </div>
            <InvoicesDataTable 
              branchId={branchId}
              onViewInvoice={(id) => console.log('View invoice:', id)}
              onRecordPayment={(id) => console.log('Record payment for:', id)}
            />
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Payment Records</h3>
                <p className="text-sm text-gray-500">Track all payment transactions</p>
              </div>
            </div>
            <PaymentsDataTable branchId={branchId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvoicesPaymentsTab;