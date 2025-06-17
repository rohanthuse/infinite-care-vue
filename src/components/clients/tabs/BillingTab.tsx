
import React, { useState } from "react";
import { format } from "date-fns";
import { CreditCard, Clock, Plus, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddBillingDialog } from "../dialogs/AddBillingDialog";
import { useClientBilling, useCreateClientBilling } from "@/hooks/useClientBilling";

interface BillingTabProps {
  clientId: string;
  billingItems?: any[];
}

export const BillingTab: React.FC<BillingTabProps> = ({ clientId }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { data: billingItems = [], isLoading } = useClientBilling(clientId);
  const createBillingMutation = useCreateClientBilling();

  const handleAddBilling = async (billingData: any) => {
    await createBillingMutation.mutateAsync({
      client_id: clientId,
      description: billingData.description,
      amount: billingData.amount,
      invoice_number: billingData.invoice_number,
      invoice_date: billingData.invoice_date.toISOString().split('T')[0],
      due_date: billingData.due_date.toISOString().split('T')[0],
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Billing & Invoices</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Add Billing</span>
            </Button>
          </div>
          <CardDescription>Billing records and invoices for client {clientId}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {billingItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No billing records available for this client</p>
            </div>
          ) : (
            <div className="space-y-4">
              {billingItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">Invoice #{item.invoice_number}</h3>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">${item.amount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Due: {format(new Date(item.due_date), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Invoice Date: {format(new Date(item.invoice_date), 'MMM dd, yyyy')}
                        {item.paid_date && (
                          <span> • Paid: {format(new Date(item.paid_date), 'MMM dd, yyyy')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddBillingDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleAddBilling}
      />
    </div>
  );
};
