import React, { useState, useEffect } from 'react';
import { format, subMonths, addMonths } from 'date-fns';
import { CalendarIcon, FilePlus, Loader2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { useCarerProfile } from '@/hooks/useCarerProfile';
import { useCarerPayments } from '@/hooks/useCarerPayments';
import { useCarerExpenseManagement } from '@/hooks/useCarerExpenseManagement';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useExpenseTypeOptions } from '@/hooks/useParameterOptions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Payment {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
}

const CarerPayments: React.FC = () => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    category: "",
    amount: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: "",
    receipt: null as File | null,
  });
  
  const { data: carerProfile } = useCarerProfile();
  const { data: carerPayments, isLoading, error } = useCarerPayments();
  const { submitExpense, isSubmitting } = useCarerExpenseManagement();
  const { data: expenseTypeOptions = [], isLoading: expenseTypesLoading } = useExpenseTypeOptions();

  useEffect(() => {
    if (carerPayments?.paymentHistory) {
      // Filter payments based on date range and convert to Payment interface
      const filteredPayments = carerPayments.paymentHistory
        .filter(payment => {
          if (!date?.from || !date?.to) return true;
          const paymentDate = new Date(payment.date);
          return paymentDate >= date.from && paymentDate <= date.to;
        })
        .map(payment => ({
          id: payment.id,
          date: payment.date instanceof Date ? payment.date.toISOString() : payment.date,
          description: `${payment.type === 'salary' ? 'Salary' : payment.type === 'overtime' ? 'Overtime' : 'Expense Reimbursement'} - ${payment.period}`,
          amount: payment.amount,
          status: payment.status,
        }));
      
      setPayments(filteredPayments);
    }
  }, [carerPayments, date]);

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expenseForm.description || !expenseForm.category || !expenseForm.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (parseFloat(expenseForm.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (!carerProfile?.branch_id) {
      toast.error("Unable to determine branch information");
      return;
    }

    try {
      console.log('Submitting expense form:', expenseForm);
      await submitExpense.mutateAsync({
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        expense_date: expenseForm.date,
        notes: expenseForm.notes || undefined,
        receipt_file: expenseForm.receipt || undefined,
      });
      
      // Reset form and close dialog on success
      setExpenseForm({
        description: "",
        category: "",
        amount: "",
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: "",
        receipt: null,
      });
      setAddExpenseDialogOpen(false);
      toast.success("Expense claim submitted successfully");
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error("Failed to submit expense claim");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExpenseForm(prev => ({ ...prev, receipt: file }));
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-5">Your Payments</h1>

      {/* Date Range Picker */}
      <div className="mb-5">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !date?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  `${format(date.from, "MMM dd, yyyy")} - ${format(date.to, "MMM dd, yyyy")}`
                ) : (
                  format(date.from, "MMM dd, yyyy")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              pagedNavigation
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Payments Table */}
      {isLoading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading payments...
        </div>
      ) : error ? (
        <div className="text-red-500">Error: {error.message}</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableCaption>A list of your recent payments.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{format(new Date(payment.date), "MMM dd, yyyy")}</TableCell>
                  <TableCell>{payment.description}</TableCell>
                  <TableCell>£{payment.amount.toFixed(2)}</TableCell>
                  <TableCell>{payment.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell>£{payments.reduce((acc, payment) => acc + payment.amount, 0).toFixed(2)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}

      {/* Add Expense Claim Button */}
      <Button onClick={() => setAddExpenseDialogOpen(true)} className="mt-5">
        <FilePlus className="mr-2 h-4 w-4" />
        Submit Expense Claim
      </Button>

      {/* Add Expense Claim Dialog */}
      <Dialog open={addExpenseDialogOpen} onOpenChange={setAddExpenseDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Submit Expense Claim</DialogTitle>
            <DialogDescription>
              Fill in the details below to submit your expense claim.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitExpense} className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  type="text"
                  id="description"
                  placeholder="Brief description of expense"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  onValueChange={(value) => setExpenseForm(prev => ({ ...prev, category: value }))}
                  value={expenseForm.category}
                  disabled={expenseTypesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={expenseTypesLoading ? "Loading categories..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (£)</Label>
                  <Input
                    type="number"
                    id="amount"
                    placeholder="0.00"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    type="date"
                    id="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes (optional)"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="receipt">Upload Receipt</Label>
                <Input
                  type="file"
                  id="receipt"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                {expenseForm.receipt && (
                  <p className="mt-2 text-sm text-gray-500">
                    Selected file: {expenseForm.receipt.name}
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter className="mt-4 flex-shrink-0">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAddExpenseDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Claim"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CarerPayments;
