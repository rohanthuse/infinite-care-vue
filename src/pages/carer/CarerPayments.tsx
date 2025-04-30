
import React, { useState } from "react";
import { Search, Filter, Calendar, Download, ChevronDown, Wallet, Clock, CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

// Mock payment data
const mockPayments = [
  {
    id: "1",
    period: "April 2024",
    amount: 2540.00,
    date: new Date("2024-04-20"),
    status: "Paid",
    type: "Salary"
  },
  {
    id: "2",
    period: "March 2024",
    amount: 2350.00,
    date: new Date("2024-03-20"),
    status: "Paid",
    type: "Salary"
  },
  {
    id: "3",
    period: "February 2024",
    amount: 2280.00,
    date: new Date("2024-02-20"),
    status: "Paid",
    type: "Salary"
  },
  {
    id: "4",
    period: "April 2024",
    amount: 120.00,
    date: new Date("2024-04-15"),
    status: "Paid",
    type: "Expense Reimbursement"
  },
  {
    id: "5",
    period: "March 2024",
    amount: 85.50,
    date: new Date("2024-03-15"),
    status: "Paid",
    type: "Expense Reimbursement"
  }
];

// Mock expenses data
const mockExpenses = [
  {
    id: "1",
    description: "Travel expenses - Client visits",
    amount: 78.50,
    date: new Date("2024-04-12"),
    status: "Approved",
    category: "Travel"
  },
  {
    id: "2",
    description: "Training materials",
    amount: 42.00,
    date: new Date("2024-04-05"),
    status: "Approved",
    category: "Training"
  },
  {
    id: "3",
    description: "Mobile phone bill (work-related)",
    amount: 35.00,
    date: new Date("2024-03-28"),
    status: "Approved",
    category: "Communication"
  },
  {
    id: "4",
    description: "Uniform cleaning",
    amount: 25.00,
    date: new Date("2024-03-20"),
    status: "Approved",
    category: "Uniform"
  }
];

const CarerPayments: React.FC = () => {
  const [activeTab, setActiveTab] = useState("payments");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [showAddExpense, setShowAddExpense] = useState(false);
  
  const filteredPayments = mockPayments.filter(payment => {
    if (periodFilter === "last3Months") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return payment.date >= threeMonthsAgo;
    }
    
    return true;
  });
  
  const currentYearTotal = mockPayments
    .filter(payment => payment.date.getFullYear() === new Date().getFullYear())
    .reduce((sum, payment) => sum + payment.amount, 0);
  
  const totalReimbursements = mockPayments
    .filter(payment => payment.type === "Expense Reimbursement")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Payments</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Current Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{mockPayments[0].amount.toFixed(2)}</div>
            <p className="text-sm text-gray-500">Payment for {mockPayments[0].period}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Year to Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{currentYearTotal.toFixed(2)}</div>
            <p className="text-sm text-gray-500">Total earnings in {new Date().getFullYear()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Total Reimbursements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalReimbursements.toFixed(2)}</div>
            <p className="text-sm text-gray-500">All approved expense claims</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-200">
            <TabsList className="h-auto p-0 bg-transparent border-b border-transparent">
              <TabsTrigger 
                value="payments" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none py-3 px-6 rounded-none font-medium border-b-2 border-transparent"
              >
                Payments History
              </TabsTrigger>
              <TabsTrigger 
                value="expenses" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none py-3 px-6 rounded-none font-medium border-b-2 border-transparent"
              >
                Expense Claims
              </TabsTrigger>
              <TabsTrigger 
                value="documents" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none py-3 px-6 rounded-none font-medium border-b-2 border-transparent"
              >
                Payment Documents
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-4">
            <TabsContent value="payments" className="mt-0 p-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold">Payment History</h2>
                <div className="flex gap-2">
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="last3Months">Last 3 Months</SelectItem>
                      <SelectItem value="thisYear">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Period</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Type</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Amount</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Date</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Status</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-t border-gray-200">
                        <td className="py-4 px-4 text-sm">{payment.period}</td>
                        <td className="py-4 px-4 text-sm">{payment.type}</td>
                        <td className="py-4 px-4 text-sm font-medium">£{payment.amount.toFixed(2)}</td>
                        <td className="py-4 px-4 text-sm">{format(payment.date, "dd MMM yyyy")}</td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Button variant="ghost" size="sm" className="flex items-center gap-2">
                            <Download className="h-3.5 w-3.5" />
                            <span>Payslip</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="expenses" className="mt-0 p-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold">Expense Claims</h2>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </Button>
                  
                  <Button onClick={() => setShowAddExpense(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Expense</span>
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Description</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Category</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Amount</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Date</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Status</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockExpenses.map((expense) => (
                      <tr key={expense.id} className="border-t border-gray-200">
                        <td className="py-4 px-4 text-sm">{expense.description}</td>
                        <td className="py-4 px-4 text-sm">{expense.category}</td>
                        <td className="py-4 px-4 text-sm font-medium">£{expense.amount.toFixed(2)}</td>
                        <td className="py-4 px-4 text-sm">{format(expense.date, "dd MMM yyyy")}</td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            {expense.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="documents" className="mt-0 p-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold">Payment Documents</h2>
                <div className="relative w-full sm:w-[250px]">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    className="pl-8"
                    placeholder="Search documents" 
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">Annual Income Statement</h3>
                          <p className="text-sm text-gray-500">Tax year 2023/2024</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">Bank Details Confirmation</h3>
                          <p className="text-sm text-gray-500">Payment information</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
      
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Expense Claim</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="Brief description of expense" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="uniform">Uniform</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (£)</label>
                <Input type="number" step="0.01" placeholder="0.00" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input type="date" className="pl-10" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Receipt</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Button variant="outline" size="sm">Select File</Button>
                <p className="text-xs text-gray-500 mt-2">PDF, JPG or PNG up to 5MB</p>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddExpense(false)}>Cancel</Button>
              <Button>Submit Claim</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CarerPayments;
