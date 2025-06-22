
import { useQuery } from '@tanstack/react-query';
import { usePayrollRecords, useExpenses, useExtraTimeRecords } from '@/hooks/useAccountingData';
import { useCarerAuth } from '@/hooks/useCarerAuth';
import { format, startOfYear, endOfYear } from 'date-fns';

export interface CarerPaymentSummary {
  currentMonth: number;
  yearToDate: number;
  totalReimbursements: number;
  lastPayment: {
    amount: number;
    period: string;
    date: Date;
  } | null;
}

export interface PaymentHistoryItem {
  id: string;
  period: string;
  amount: number;
  date: Date;
  status: string;
  type: 'salary' | 'overtime' | 'expense_reimbursement';
  reference?: string;
}

export function useCarerPayments() {
  const { carerProfile } = useCarerAuth();
  const branchId = carerProfile?.branch_id;
  const staffId = carerProfile?.id;

  // Get payroll records
  const { data: payrollRecords, isLoading: payrollLoading, error: payrollError } = usePayrollRecords(branchId);
  
  // Get expense records
  const { data: expenseRecords, isLoading: expenseLoading, error: expenseError } = useExpenses(branchId);
  
  // Get extra time records
  const { data: extraTimeRecords, isLoading: extraTimeLoading, error: extraTimeError } = useExtraTimeRecords(branchId);

  return useQuery({
    queryKey: ['carer-payments', staffId, branchId],
    queryFn: () => {
      if (!staffId || !payrollRecords) return null;

      // Filter records for current carer
      const carerPayroll = payrollRecords.filter(record => record.staff_id === staffId);
      const carerExpenses = expenseRecords?.filter(expense => 
        expense.staff_id === staffId && expense.status === 'approved'
      ) || [];
      const carerExtraTime = extraTimeRecords?.filter(record => 
        record.staff_id === staffId && record.status === 'approved'
      ) || [];

      // Create payment history combining payroll, expenses, and extra time
      const paymentHistory: PaymentHistoryItem[] = [
        // Regular payroll
        ...carerPayroll.map(record => ({
          id: record.id,
          period: `${format(new Date(record.pay_period_start), 'MMM')} ${format(new Date(record.pay_period_end), 'yyyy')}`,
          amount: record.net_pay,
          date: record.payment_date ? new Date(record.payment_date) : new Date(record.pay_period_end),
          status: record.payment_status,
          type: 'salary' as const,
          reference: record.payment_reference || undefined,
        })),
        
        // Expense reimbursements
        ...carerExpenses.map(expense => ({
          id: expense.id,
          period: format(new Date(expense.expense_date), 'MMM yyyy'),
          amount: expense.amount,
          date: new Date(expense.expense_date),
          status: 'paid',
          type: 'expense_reimbursement' as const,
        })),
        
        // Extra time payments
        ...carerExtraTime.map(record => ({
          id: record.id,
          period: format(new Date(record.work_date), 'MMM yyyy'),
          amount: record.total_cost,
          date: new Date(record.work_date),
          status: record.invoiced ? 'paid' : 'pending',
          type: 'overtime' as const,
        })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime());

      // Calculate summary statistics
      const currentYear = new Date().getFullYear();
      const yearStart = startOfYear(new Date());
      const yearEnd = endOfYear(new Date());
      
      const currentMonthPayments = paymentHistory.filter(payment => {
        const paymentMonth = payment.date.getMonth();
        const currentMonth = new Date().getMonth();
        return paymentMonth === currentMonth && payment.date.getFullYear() === currentYear;
      });

      const yearToDatePayments = paymentHistory.filter(payment => 
        payment.date >= yearStart && payment.date <= yearEnd
      );

      const reimbursements = paymentHistory.filter(payment => 
        payment.type === 'expense_reimbursement'
      );

      const summary: CarerPaymentSummary = {
        currentMonth: currentMonthPayments.reduce((sum, p) => sum + p.amount, 0),
        yearToDate: yearToDatePayments.reduce((sum, p) => sum + p.amount, 0),
        totalReimbursements: reimbursements.reduce((sum, p) => sum + p.amount, 0),
        lastPayment: paymentHistory.length > 0 ? {
          amount: paymentHistory[0].amount,
          period: paymentHistory[0].period,
          date: paymentHistory[0].date,
        } : null,
      };

      return {
        summary,
        paymentHistory,
        carerExpenses,
        carerPayroll,
        carerExtraTime,
      };
    },
    enabled: !!staffId && !!branchId && !!payrollRecords,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
