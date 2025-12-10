import React, { useState, useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, DollarSign, Plus, Receipt, Clock, Car, TrendingUp, Wallet, Eye, Search, Download, FileText, Pencil, Trash2 } from 'lucide-react';
import { useCarerPayments } from '@/hooks/useCarerPayments';
import { useCarerProfile } from '@/hooks/useCarerProfile';
import { exportPayrollPayslip } from '@/utils/payslipPdfGenerator';
import { useExpenseTypeOptions } from '@/hooks/useParameterOptions';
import { useMyExpenses } from '@/hooks/useMyExpenses';
import { useMyTravel } from '@/hooks/useMyTravel';
import { useMyExtraTime } from '@/hooks/useMyExtraTime';
import { useCarerExpenseManagement } from '@/hooks/useCarerExpenseManagement';
import { useCarerExpenseDelete } from '@/hooks/useCarerExpenseDelete';
import { useCarerTravelDelete } from '@/hooks/useCarerTravelDelete';
import { useCarerExtraTimeDelete } from '@/hooks/useCarerExtraTimeDelete';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AddTravelRecordDialog } from '@/components/carer/AddTravelRecordDialog';
import { AddExtraTimeDialog } from '@/components/carer/AddExtraTimeDialog';
import { ViewMyExpenseDialog } from '@/components/carer/ViewMyExpenseDialog';
import { ViewMyTravelDialog } from '@/components/carer/ViewMyTravelDialog';
import { ViewMyExtraTimeDialog } from '@/components/carer/ViewMyExtraTimeDialog';
import { EditMyExpenseDialog } from '@/components/carer/EditMyExpenseDialog';
import { EditTravelRecordDialog } from '@/components/carer/EditTravelRecordDialog';
import { EditExtraTimeDialog } from '@/components/carer/EditExtraTimeDialog';
import { ClaimFilters } from '@/components/carer/ClaimFilters';
import { DeleteClaimDialog } from '@/components/carer/DeleteClaimDialog';

const CarerPayments: React.FC = () => {
  const { toast } = useToast();
  const { data: carerProfile } = useCarerProfile();
  const { data: expenseTypeOptions = [], isLoading: expenseTypesLoading } = useExpenseTypeOptions();

  // State management
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    to: new Date()
  });

  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    notes: '',
    receipt: null as File | null,
  });

  const [showTravelDialog, setShowTravelDialog] = useState(false);
  const [showExtraTimeDialog, setShowExtraTimeDialog] = useState(false);
  const [viewExpense, setViewExpense] = useState(null);
  const [viewTravel, setViewTravel] = useState(null);
  const [viewExtraTime, setViewExtraTime] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);

  // Edit/Delete state
  const [editExpense, setEditExpense] = useState(null);
  const [editTravel, setEditTravel] = useState(null);
  const [editExtraTime, setEditExtraTime] = useState(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [deleteTravelId, setDeleteTravelId] = useState<string | null>(null);
  const [deleteExtraTimeId, setDeleteExtraTimeId] = useState<string | null>(null);

  // Filter state
  const [expenseFilters, setExpenseFilters] = useState({ dateFrom: '', dateTo: '', status: 'all', category: 'all' });
  const [travelFilters, setTravelFilters] = useState({ dateFrom: '', dateTo: '', status: 'all', vehicleType: 'all' });
  const [extraTimeFilters, setExtraTimeFilters] = useState({ dateFrom: '', dateTo: '', status: 'all' });

  // Data hooks
  const { data: paymentsData, isLoading } = useCarerPayments(dateRange);
  const { data: myExpenses, isLoading: expensesLoading } = useMyExpenses();
  const { data: myTravel, isLoading: travelLoading } = useMyTravel();
  const { data: myExtraTime, isLoading: extraTimeLoading } = useMyExtraTime();
  const { submitExpense, isSubmitting } = useCarerExpenseManagement();
  const { deleteExpense } = useCarerExpenseDelete();
  const { deleteTravel } = useCarerTravelDelete();
  const { deleteExtraTime } = useCarerExtraTimeDelete();

  // Filtered data
  const filteredExpenses = useMemo(() => {
    if (!myExpenses) return [];
    return myExpenses.filter(expense => {
      if (expenseFilters.dateFrom && expense.expense_date < expenseFilters.dateFrom) return false;
      if (expenseFilters.dateTo && expense.expense_date > expenseFilters.dateTo) return false;
      if (expenseFilters.status !== 'all' && expense.status !== expenseFilters.status) return false;
      if (expenseFilters.category !== 'all' && expense.category !== expenseFilters.category) return false;
      return true;
    });
  }, [myExpenses, expenseFilters]);

  const filteredTravel = useMemo(() => {
    if (!myTravel) return [];
    return myTravel.filter(travel => {
      if (travelFilters.dateFrom && travel.travel_date < travelFilters.dateFrom) return false;
      if (travelFilters.dateTo && travel.travel_date > travelFilters.dateTo) return false;
      if (travelFilters.status !== 'all' && travel.status !== travelFilters.status) return false;
      if (travelFilters.vehicleType !== 'all' && travel.vehicle_type !== travelFilters.vehicleType) return false;
      return true;
    });
  }, [myTravel, travelFilters]);

  const filteredExtraTime = useMemo(() => {
    if (!myExtraTime) return [];
    return myExtraTime.filter(et => {
      if (extraTimeFilters.dateFrom && et.work_date < extraTimeFilters.dateFrom) return false;
      if (extraTimeFilters.dateTo && et.work_date > extraTimeFilters.dateTo) return false;
      if (extraTimeFilters.status !== 'all' && et.status !== extraTimeFilters.status) return false;
      return true;
    });
  }, [myExtraTime, extraTimeFilters]);

  // Create lookup map for payroll records
  const payrollLookup = React.useMemo(() => {
    const lookup = new Map();
    paymentsData?.carerPayroll?.forEach(record => {
      lookup.set(record.id, record);
    });
    return lookup;
  }, [paymentsData?.carerPayroll]);

  // Filter payments by date range
  const filteredPayments = paymentsData?.paymentHistory?.filter(payment => {
    if (!dateRange.from || !dateRange.to) return true;
    const paymentDate = new Date(payment.date);
    return paymentDate >= dateRange.from && paymentDate <= dateRange.to;
  }) || [];

  // Handle payslip download
  const handleDownloadPayslip = (payment: any) => {
    const payrollRecord = payrollLookup.get(payment.id);
    if (payrollRecord) {
      exportPayrollPayslip(payrollRecord);
    } else {
      toast({ title: "Error", description: "Payroll record not found", variant: "destructive" });
    }
  };

  // Handle expense submission
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.category || !expenseForm.amount) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (parseFloat(expenseForm.amount) <= 0) {
      toast({ title: "Error", description: "Amount must be greater than 0", variant: "destructive" });
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
      setExpenseForm({ description: '', category: '', amount: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'cash', notes: '', receipt: null });
      setExpenseDialogOpen(false);
      toast({ title: "Success", description: "Expense claim submitted successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit expense claim", variant: "destructive" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setExpenseForm(prev => ({ ...prev, receipt: file }));
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'bg-success/10 text-success',
      approved: 'bg-success/10 text-success',
      pending: 'bg-warning/10 text-warning',
      rejected: 'bg-destructive/10 text-destructive',
    } as const;
    return <Badge variant="secondary" className={variants[status as keyof typeof variants] || variants.pending}>{status}</Badge>;
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">My Payments & Claims</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{paymentsData?.summary?.currentMonth?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Earnings this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Year to Date</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{paymentsData?.summary?.yearToDate?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Total earnings this year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reimbursements</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{paymentsData?.summary?.totalReimbursements?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Expenses & travel claims paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extra Time (This Month)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{paymentsData?.summary?.extraTimeThisMonth?.total?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Approved: £{paymentsData?.summary?.extraTimeThisMonth?.approved?.toFixed(2) || '0.00'} | Pending: £{paymentsData?.summary?.extraTimeThisMonth?.pending?.toFixed(2) || '0.00'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses (This Month)</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{paymentsData?.summary?.expenseThisMonth?.total?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Approved: £{paymentsData?.summary?.expenseThisMonth?.approved?.toFixed(2) || '0.00'} | Pending: £{paymentsData?.summary?.expenseThisMonth?.pending?.toFixed(2) || '0.00'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="expenses">My Expense Claims</TabsTrigger>
          <TabsTrigger value="travel">Travel & Mileage</TabsTrigger>
          <TabsTrigger value="extratime">Extra Time</TabsTrigger>
        </TabsList>

        {/* Payment History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment History</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search payments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 w-64" />
                  </div>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No payments found for the selected date range.</div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{payment.period || 'Payment'}</TableCell>
                        <TableCell className="capitalize">{payment.type}</TableCell>
                        <TableCell className="text-right font-medium">£{payment.amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>{payment.type === 'salary' && (<Button variant="ghost" size="sm" onClick={() => handleDownloadPayslip(payment)} className="gap-1" disabled={!payrollLookup.has(payment.id)}><FileText className="h-4 w-4" />Payslip</Button>)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Expense Claims Tab */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Expense Claims</CardTitle>
                <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                  <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Submit Expense</Button></DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Submit Expense Claim</DialogTitle><DialogDescription>Submit an expense for reimbursement approval.</DialogDescription></DialogHeader>
                    <form onSubmit={handleSubmitExpense} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Enter expense description" required /></div>
                        <div className="space-y-2"><Label htmlFor="category">Category</Label><Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{expenseTypeOptions.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent></Select></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2"><Label htmlFor="amount">Amount (£)</Label><Input id="amount" type="number" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="0.00" required /></div>
                        <div className="space-y-2"><Label htmlFor="date">Date</Label><Input id="date" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} required /></div>
                        <div className="space-y-2"><Label htmlFor="paymentMethod">Payment Method</Label><Select value={expenseForm.paymentMethod} onValueChange={(value) => setExpenseForm({ ...expenseForm, paymentMethod: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="card">Card</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem></SelectContent></Select></div>
                      </div>
                      <div className="space-y-2"><Label htmlFor="receipt">Receipt</Label><Input id="receipt" type="file" accept="image/*,.pdf" onChange={handleFileChange} /></div>
                      <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} placeholder="Any additional notes" /></div>
                      <div className="flex justify-end space-x-2"><DialogTrigger asChild><Button type="button" variant="outline">Cancel</Button></DialogTrigger><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Expense'}</Button></div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ClaimFilters dateFrom={expenseFilters.dateFrom} dateTo={expenseFilters.dateTo} status={expenseFilters.status} category={expenseFilters.category} categoryOptions={expenseTypeOptions} onDateFromChange={(v) => setExpenseFilters(p => ({ ...p, dateFrom: v }))} onDateToChange={(v) => setExpenseFilters(p => ({ ...p, dateTo: v }))} onStatusChange={(v) => setExpenseFilters(p => ({ ...p, status: v }))} onCategoryChange={(v) => setExpenseFilters(p => ({ ...p, category: v }))} onClear={() => setExpenseFilters({ dateFrom: '', dateTo: '', status: 'all', category: 'all' })} statusOptions={statusOptions} />
              {expensesLoading ? (<div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div>) : filteredExpenses.length > 0 ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{format(new Date(expense.expense_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell className="text-right font-medium">£{expense.amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(expense.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setViewExpense(expense)}><Eye className="h-4 w-4" /></Button>
                            {expense.status === 'pending' && (<><Button variant="ghost" size="sm" onClick={() => setEditExpense(expense)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeleteExpenseId(expense.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></>)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (<div className="text-center py-8 text-muted-foreground">No expense claims found.</div>)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Travel & Mileage Tab */}
        <TabsContent value="travel">
          <Card>
            <CardHeader><div className="flex items-center justify-between"><CardTitle>Travel & Mileage Claims</CardTitle><Button onClick={() => setShowTravelDialog(true)}><Car className="h-4 w-4 mr-2" />Submit Travel Claim</Button></div></CardHeader>
            <CardContent>
              <ClaimFilters dateFrom={travelFilters.dateFrom} dateTo={travelFilters.dateTo} status={travelFilters.status} onDateFromChange={(v) => setTravelFilters(p => ({ ...p, dateFrom: v }))} onDateToChange={(v) => setTravelFilters(p => ({ ...p, dateTo: v }))} onStatusChange={(v) => setTravelFilters(p => ({ ...p, status: v }))} onClear={() => setTravelFilters({ dateFrom: '', dateTo: '', status: 'all', vehicleType: 'all' })} statusOptions={statusOptions} />
              {travelLoading ? (<div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div>) : filteredTravel.length > 0 ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Journey</TableHead><TableHead>Distance</TableHead><TableHead className="text-right">Cost</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredTravel.map((travel) => (
                      <TableRow key={travel.id}>
                        <TableCell>{format(new Date(travel.travel_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell><div className="space-y-1"><div className="font-medium">{travel.purpose}</div><div className="text-sm text-muted-foreground">{travel.start_location} → {travel.end_location}</div></div></TableCell>
                        <TableCell>{travel.distance_miles} miles</TableCell>
                        <TableCell className="text-right font-medium">£{travel.total_cost.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(travel.reimbursed_at ? 'paid' : travel.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setViewTravel(travel)}><Eye className="h-4 w-4" /></Button>
                            {travel.status === 'pending' && (<><Button variant="ghost" size="sm" onClick={() => setEditTravel(travel)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeleteTravelId(travel.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></>)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (<div className="text-center py-8 text-muted-foreground">No travel claims found.</div>)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extra Time Tab */}
        <TabsContent value="extratime">
          <Card>
            <CardHeader><div className="flex items-center justify-between"><CardTitle>Extra Time Claims</CardTitle><Button onClick={() => setShowExtraTimeDialog(true)}><Clock className="h-4 w-4 mr-2" />Submit Extra Time</Button></div></CardHeader>
            <CardContent>
              <ClaimFilters dateFrom={extraTimeFilters.dateFrom} dateTo={extraTimeFilters.dateTo} status={extraTimeFilters.status} onDateFromChange={(v) => setExtraTimeFilters(p => ({ ...p, dateFrom: v }))} onDateToChange={(v) => setExtraTimeFilters(p => ({ ...p, dateTo: v }))} onStatusChange={(v) => setExtraTimeFilters(p => ({ ...p, status: v }))} onClear={() => setExtraTimeFilters({ dateFrom: '', dateTo: '', status: 'all' })} statusOptions={statusOptions} />
              {extraTimeLoading ? (<div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div>) : filteredExtraTime.length > 0 ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Extra Time</TableHead><TableHead>Reason</TableHead><TableHead className="text-right">Cost</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredExtraTime.map((extraTime) => (
                      <TableRow key={extraTime.id}>
                        <TableCell>{format(new Date(extraTime.work_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell><div className="space-y-1"><div className="font-medium">{extraTime.extra_time_minutes} minutes</div><div className="text-sm text-muted-foreground">{extraTime.scheduled_start_time} - {extraTime.scheduled_end_time}</div></div></TableCell>
                        <TableCell>{extraTime.reason || 'Not specified'}</TableCell>
                        <TableCell className="text-right font-medium">£{extraTime.total_cost.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(extraTime.invoiced ? 'paid' : extraTime.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setViewExtraTime(extraTime)}><Eye className="h-4 w-4" /></Button>
                            {extraTime.status === 'pending' && (<><Button variant="ghost" size="sm" onClick={() => setEditExtraTime(extraTime)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeleteExtraTimeId(extraTime.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></>)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (<div className="text-center py-8 text-muted-foreground"><p>No extra time claims found.</p></div>)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddTravelRecordDialog open={showTravelDialog} onOpenChange={setShowTravelDialog} />
      <AddExtraTimeDialog open={showExtraTimeDialog} onOpenChange={setShowExtraTimeDialog} />
      <ViewMyExpenseDialog open={!!viewExpense} onClose={() => setViewExpense(null)} expense={viewExpense} />
      <ViewMyTravelDialog open={!!viewTravel} onClose={() => setViewTravel(null)} travel={viewTravel} />
      <ViewMyExtraTimeDialog open={!!viewExtraTime} onClose={() => setViewExtraTime(null)} extraTime={viewExtraTime} />
      <EditMyExpenseDialog open={!!editExpense} onOpenChange={(open) => !open && setEditExpense(null)} expense={editExpense} />
      <EditTravelRecordDialog open={!!editTravel} onOpenChange={(open) => !open && setEditTravel(null)} travel={editTravel} />
      <EditExtraTimeDialog open={!!editExtraTime} onOpenChange={(open) => !open && setEditExtraTime(null)} extraTime={editExtraTime} />
      <DeleteClaimDialog open={!!deleteExpenseId} onOpenChange={(open) => !open && setDeleteExpenseId(null)} onConfirm={() => { deleteExpense.mutate(deleteExpenseId!); setDeleteExpenseId(null); }} title="Delete Expense Claim" description="Are you sure you want to delete this expense claim? This action cannot be undone." isPending={deleteExpense.isPending} />
      <DeleteClaimDialog open={!!deleteTravelId} onOpenChange={(open) => !open && setDeleteTravelId(null)} onConfirm={() => { deleteTravel.mutate(deleteTravelId!); setDeleteTravelId(null); }} title="Delete Travel Claim" description="Are you sure you want to delete this travel claim? This action cannot be undone." isPending={deleteTravel.isPending} />
      <DeleteClaimDialog open={!!deleteExtraTimeId} onOpenChange={(open) => !open && setDeleteExtraTimeId(null)} onConfirm={() => { deleteExtraTime.mutate(deleteExtraTimeId!); setDeleteExtraTimeId(null); }} title="Delete Extra Time Claim" description="Are you sure you want to delete this extra time claim? This action cannot be undone." isPending={deleteExtraTime.isPending} />
    </div>
  );
};

export default CarerPayments;