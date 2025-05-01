
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Download, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const ClientPayments = () => {
  const [activeTab, setActiveTab] = useState("invoices");

  // Mock data
  const invoices = [
    {
      id: "INV-2025-0003",
      date: "May 1, 2025",
      dueDate: "May 15, 2025",
      amount: 150.00,
      status: "pending",
      description: "Weekly therapy sessions (4)"
    },
    {
      id: "INV-2025-0002",
      date: "April 1, 2025",
      dueDate: "April 15, 2025",
      amount: 150.00,
      status: "paid",
      description: "Weekly therapy sessions (4)",
      paidDate: "April 10, 2025"
    },
    {
      id: "INV-2025-0001",
      date: "March 1, 2025",
      dueDate: "March 15, 2025",
      amount: 175.00,
      status: "paid",
      description: "Initial assessment and therapy sessions (3)",
      paidDate: "March 12, 2025"
    }
  ];

  const paymentMethods = [
    {
      id: 1,
      type: "credit_card",
      last4: "4242",
      expMonth: 12,
      expYear: 26,
      cardholderName: "Prasad K",
      isDefault: true
    }
  ];

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span>Paid</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center text-yellow-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Pending</span>
          </div>
        );
      case "overdue":
        return (
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Overdue</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold mb-6">Payments & Billing</h2>
        
        <Tabs defaultValue="invoices" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b pb-4">
            <TabsList>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Invoices Tab */}
          <TabsContent value="invoices" className="pt-6 space-y-4">
            {/* Upcoming Payments Summary */}
            {invoices.some(inv => inv.status === "pending") && (
              <Card className="mb-6 bg-blue-50 border-blue-100">
                <CardContent className="p-6">
                  <h3 className="font-medium text-blue-900 mb-2">Upcoming Payments</h3>
                  <p className="text-blue-700 text-sm mb-4">
                    You have {invoices.filter(inv => inv.status === "pending").length} pending {invoices.filter(inv => inv.status === "pending").length === 1 ? 'invoice' : 'invoices'} that require action.
                  </p>
                  <Button>Pay All</Button>
                </CardContent>
              </Card>
            )}
            
            {/* Invoices List */}
            <div className="space-y-4">
              {invoices.map(invoice => (
                <div key={invoice.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-4 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium">{invoice.id}</h4>
                        <span className="mx-2 text-gray-400">•</span>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{invoice.description}</p>
                    </div>
                    <div className="text-lg font-bold">${invoice.amount.toFixed(2)}</div>
                  </div>
                  <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-gray-500">Invoice Date:</span> {invoice.date}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Due Date:</span> {invoice.dueDate}
                      </div>
                      {invoice.status === "paid" && (
                        <div className="text-sm">
                          <span className="text-gray-500">Paid Date:</span> {invoice.paidDate}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {invoice.status === "pending" && (
                        <Button>Pay Now</Button>
                      )}
                      <Button variant="outline" size="icon" title="Download Invoice">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods" className="pt-6">
            <div className="space-y-6">
              {/* Saved Payment Methods */}
              <div>
                <h3 className="text-lg font-medium mb-4">Saved Payment Methods</h3>
                {paymentMethods.length > 0 ? (
                  <div className="space-y-4">
                    {paymentMethods.map(method => (
                      <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-blue-600 text-white p-2 rounded mr-4">
                              <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">
                                •••• {method.last4} 
                                {method.isDefault && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
                                    Default
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-600">
                                {method.cardholderName} • Expires {method.expMonth}/{method.expYear}
                              </p>
                            </div>
                          </div>
                          <div>
                            <Button variant="outline" size="sm">Edit</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 mb-4">No payment methods saved.</p>
                    <Button>Add Payment Method</Button>
                  </div>
                )}
              </div>
              
              {/* Add New Payment Method */}
              <div className="mt-8">
                <Button>Add New Payment Method</Button>
              </div>
              
              <Separator className="my-6" />
              
              {/* Billing Address */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Billing Address</h3>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p>Prasad K</p>
                      <p className="text-gray-600">123 Main Street</p>
                      <p className="text-gray-600">Apartment 4B</p>
                      <p className="text-gray-600">New York, NY 10001</p>
                      <p className="text-gray-600">United States</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientPayments;
