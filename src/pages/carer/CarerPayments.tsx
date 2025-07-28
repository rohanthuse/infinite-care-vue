
import React, { useState } from "react";
import { Search, Filter, Calendar, Download, ChevronDown, Wallet, Clock, CreditCard, Plus, FileText, Loader2, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, addDays, subMonths } from "date-fns";
import { useCarerPayments } from "@/hooks/useCarerPayments";
import { useCarerExpenseManagement } from "@/hooks/useCarerExpenseManagement";
import { useCarerExpenseEdit } from "@/hooks/useCarerExpenseEdit";
import { useCarerProfile } from "@/hooks/useCarerProfile";
import { formatCurrency } from "@/utils/currencyFormatter";
import { toast } from "sonner";
import ViewExpenseDialog from "@/components/accounting/ViewExpenseDialog";
import EditExpenseDialog from "@/components/carer/EditExpenseDialog";

const CarerPayments: React.FC = () => {
  const [activeTab, setActiveTab] = useState("payments");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showViewExpense, setShowViewExpense] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    category: "",
    amount: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: "",
    receipt: null as File | null,
  });

  const { data: carerProfile } = useCarerProfile();
  const { data: paymentData, isLoading, error } = useCarerPayments();
  const { submitExpense, isSubmitting } = useCarerExpenseManagement();
  const { updateExpense, isUpdating } = useCarerExpenseEdit();

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold mb-6">My Payments</h1>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading payment data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold mb-6">My Payments</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-2">Error loading payment data</p>
            <p className="text-sm text-gray-500">{error.message}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data state
  if (!paymentData) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold mb-6">My Payments</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No payment data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Safely destructure with fallbacks
  const { 
    summary, 
    paymentHistory = [], 
    allCarerExpenses = [] 
  } = paymentData;

  // Filter payment history based on period
  const filteredPayments = paymentHistory.filter(payment => {
    if (periodFilter === "last3Months") {
      const threeMonthsAgo = subMonths(new Date(), 3);
      return payment.date >= threeMonthsAgo;
    }
    if (periodFilter === "thisYear") {
      const currentYear = new Date().getFullYear();
      return payment.date.getFullYear() === currentYear;
    }
    return true;
  });

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expenseForm.description || !expenseForm.category || !expenseForm.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await submitExpense.mutateAsync({
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        expense_date: expenseForm.date,
        notes: expenseForm.notes || undefined,
        receipt_file: expenseForm.receipt || undefined,
      });

      // Reset form and close dialog
      setExpenseForm({
        description: "",
        category: "",
        amount: "",
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: "",
        receipt: null,
      });
      setShowAddExpense(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExpenseForm(prev => ({ ...prev, receipt: file }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'salary':
        return 'Salary';
      case 'overtime':
        return 'Overtime';
      case 'expense_reimbursement':
        return 'Expense Reimbursement';
      default:
        return 'Payment';
    }
  };

  const handleViewExpense = (expense: any) => {
    setSelectedExpense(expense);
    setShowViewExpense(true);
  };

  const handleEditExpense = (expense: any) => {
    setSelectedExpense(expense);
    setShowEditExpense(true);
  };

  const handleViewExpenseEdit = () => {
    setShowViewExpense(false);
    setShowEditExpense(true);
  };

  const handleUpdateExpense = async (expenseData: any) => {
    await updateExpense.mutateAsync(expenseData);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Payments</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Current Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.currentMonth || 0)}</div>
            <p className="text-sm text-gray-500">
              {summary?.lastPayment ? `Payment for ${summary.lastPayment.period}` : 'No payments this month'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Year to Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.yearToDate || 0)}</div>
            <p className="text-sm text-gray-500">Total earnings in {new Date().getFullYear()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Total Reimbursements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalReimbursements || 0)}</div>
            <p className="text-sm text-gray-500">All approved expense claims</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payments">
              Payments History
            </TabsTrigger>
            <TabsTrigger value="expenses">
              Expense Claims
            </TabsTrigger>
            <TabsTrigger value="documents">
              Payment Documents
            </TabsTrigger>
          </TabsList>
          
          <div className="p-6">
            <TabsContent value="payments" className="mt-0">
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
                        <td className="py-4 px-4 text-sm">{getTypeLabel(payment.type)}</td>
                        <td className="py-4 px-4 text-sm font-medium">{formatCurrency(payment.amount)}</td>
                        <td className="py-4 px-4 text-sm">{format(payment.date, "dd MMM yyyy")}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
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
                    {filteredPayments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          No payment records found for the selected period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="expenses" className="mt-0">
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
                    {allCarerExpenses.map((expense) => (
                      <tr key={expense.id} className="border-t border-gray-200">
                        <td className="py-4 px-4 text-sm">{expense.description}</td>
                        <td className="py-4 px-4 text-sm">{expense.category}</td>
                        <td className="py-4 px-4 text-sm font-medium">{formatCurrency(expense.amount)}</td>
                        <td className="py-4 px-4 text-sm">{format(new Date(expense.expense_date), "dd MMM yyyy")}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(expense.status)}`}>
                            {expense.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewExpense(expense)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View</span>
                            </Button>
                            {expense.status === 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditExpense(expense)}
                                className="flex items-center gap-2"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                <span>Edit</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {allCarerExpenses.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          No expense claims found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="documents" className="mt-0">
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
                          <p className="text-sm text-gray-500">Tax year {new Date().getFullYear()}</p>
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
          
          <form onSubmit={handleExpenseSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Input 
                placeholder="Brief description of expense"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Category *</label>
              <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="uniform">Uniform</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (£) *</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <Input 
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input 
                placeholder="Additional notes (optional)"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Receipt</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="receipt-upload"
                />
                <label htmlFor="receipt-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>Select File</span>
                  </Button>
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  {expenseForm.receipt ? expenseForm.receipt.name : 'PDF, JPG or PNG up to 5MB'}
                </p>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddExpense(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Claim'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* View Expense Dialog */}
      {selectedExpense && (
        <ViewExpenseDialog
          open={showViewExpense}
          onClose={() => setShowViewExpense(false)}
          expense={selectedExpense}
        />
      )}
      
      {/* Edit Expense Dialog */}
      {selectedExpense && (
        <EditExpenseDialog
          open={showEditExpense}
          onClose={() => setShowEditExpense(false)}
          expense={selectedExpense}
          onUpdate={handleUpdateExpense}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
};

export default CarerPayments;
