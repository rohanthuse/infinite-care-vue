
import { useQuery } from '@tanstack/react-query';
import { usePayrollRecords, useExpenses, useExtraTimeRecords, useTravelRecords } from '@/hooks/useAccountingData';
import { useCarerProfile } from '@/hooks/useCarerProfile';
import { format, startOfYear, endOfYear } from 'date-fns';

export interface CarerPaymentSummary {
  currentMonth: number;
  yearToDate: number;
  totalEarnings: number;
  totalReimbursements: number;
  totalExpenseReimbursements: number;
  totalTravelReimbursements: number;
  extraTimeThisMonth: {
    approved: number;
    pending: number;
    total: number;
  };
  expenseThisMonth: {
    approved: number;
    pending: number;
    total: number;
  };
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
  type: 'salary' | 'overtime' | 'expense_reimbursement' | 'travel_reimbursement';
  reference?: string;
}

export function useCarerPayments(dateRange?: { from: Date; to: Date }) {
  const { data: carerProfile } = useCarerProfile();
  const branchId = carerProfile?.branch_id;
  const staffId = carerProfile?.id;

  // Get payroll records
  const { data: payrollRecords, isLoading: payrollLoading, error: payrollError } = usePayrollRecords(branchId);
  
  // Get expense records
  const { data: expenseRecords, isLoading: expenseLoading, error: expenseError } = useExpenses(branchId);
  
  // Get extra time records
  const { data: extraTimeRecords, isLoading: extraTimeLoading, error: extraTimeError } = useExtraTimeRecords(branchId);
  
  // Get travel records
  const { data: travelRecords, isLoading: travelLoading, error: travelError } = useTravelRecords(branchId);

  return useQuery({
    queryKey: ['carer-payments', staffId, branchId, dateRange],
    queryFn: () => {
      if (!staffId || !payrollRecords) return null;

      // Filter records for current carer
      const carerPayroll = payrollRecords.filter(record => record.staff_id === staffId);
      
      // Get ALL expense records for the table (pending, approved, rejected)
      const allCarerExpenses = expenseRecords?.filter(expense => 
        expense.staff_id === staffId
      ) || [];
      
      // Get ALL travel records for the table
      const allCarerTravel = travelRecords?.filter(record => 
        record.staff_id === staffId
      ) || [];
      
      // Get ALL extra time records for the table
      const allCarerExtraTime = extraTimeRecords?.filter(record => 
        record.staff_id === staffId
      ) || [];
      
      // Get only APPROVED expenses for reimbursement calculations
      const approvedCarerExpenses = expenseRecords?.filter(expense => 
        expense.staff_id === staffId && expense.status === 'approved'
      ) || [];
      
      // Get only APPROVED travel records for reimbursement calculations
      const approvedCarerTravel = travelRecords?.filter(record => 
        record.staff_id === staffId && record.status === 'approved'
      ) || [];

      // Get approved extra time for earnings calculations
      const approvedCarerExtraTime = extraTimeRecords?.filter(record => 
        record.staff_id === staffId && record.status === 'approved'
      ) || [];

      // Create payment history combining payroll, approved expenses, and extra time
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
        
        // Only approved expense reimbursements for payment history
        ...approvedCarerExpenses.map(expense => ({
          id: expense.id,
          period: format(new Date(expense.expense_date), 'MMM yyyy'),
          amount: expense.amount,
          date: new Date(expense.expense_date),
          status: 'paid',
          type: 'expense_reimbursement' as const,
        })),
        
        // Extra time payments (approved only)
        ...approvedCarerExtraTime.map(record => ({
          id: record.id,
          period: format(new Date(record.work_date), 'MMM yyyy'),
          amount: record.total_cost,
          date: new Date(record.work_date),
          status: record.invoiced ? 'paid' : 'pending',
          type: 'overtime' as const,
        })),
        
        // Travel reimbursements
        ...approvedCarerTravel.map(record => ({
          id: record.id,
          period: format(new Date(record.travel_date), 'MMM yyyy'),
          amount: record.total_cost,
          date: new Date(record.travel_date),
          status: record.reimbursed_at ? 'paid' : 'pending',
          type: 'travel_reimbursement' as const,
        })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime());

      // Calculate summary statistics using only approved expenses
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

      // Separate earnings (salary + overtime) from reimbursements
      const earnings = paymentHistory.filter(payment => 
        payment.type === 'salary' || payment.type === 'overtime'
      );
      
      const expenseReimbursements = paymentHistory.filter(payment => 
        payment.type === 'expense_reimbursement'
      );
      
      const travelReimbursements = paymentHistory.filter(payment => 
        payment.type === 'travel_reimbursement'
      );

      // Calculate current month extra time and expenses
      const currentMonthDate = new Date().getMonth();
      const currentYearDate = new Date().getFullYear();
      
      const currentMonthExtraTime = allCarerExtraTime.filter(record => {
        const recordDate = new Date(record.work_date);
        return recordDate.getMonth() === currentMonthDate && recordDate.getFullYear() === currentYearDate;
      });
      
      const currentMonthExpenses = allCarerExpenses.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        return expenseDate.getMonth() === currentMonthDate && expenseDate.getFullYear() === currentYearDate;
      });

      const summary: CarerPaymentSummary = {
        currentMonth: currentMonthPayments.filter(p => p.type === 'salary' || p.type === 'overtime').reduce((sum, p) => sum + p.amount, 0),
        yearToDate: yearToDatePayments.filter(p => p.type === 'salary' || p.type === 'overtime').reduce((sum, p) => sum + p.amount, 0),
        totalEarnings: earnings.reduce((sum, p) => sum + p.amount, 0),
        totalReimbursements: expenseReimbursements.reduce((sum, p) => sum + p.amount, 0) + travelReimbursements.reduce((sum, p) => sum + p.amount, 0),
        totalExpenseReimbursements: expenseReimbursements.reduce((sum, p) => sum + p.amount, 0),
        totalTravelReimbursements: travelReimbursements.reduce((sum, p) => sum + p.amount, 0),
        extraTimeThisMonth: {
          approved: currentMonthExtraTime.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.total_cost, 0),
          pending: currentMonthExtraTime.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.total_cost, 0),
          total: currentMonthExtraTime.reduce((sum, r) => sum + r.total_cost, 0),
        },
        expenseThisMonth: {
          approved: currentMonthExpenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0),
          pending: currentMonthExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
          total: currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0),
        },
        lastPayment: paymentHistory.length > 0 ? {
          amount: paymentHistory[0].amount,
          period: paymentHistory[0].period,
          date: paymentHistory[0].date,
        } : null,
      };

      return {
        summary,
        paymentHistory,
        allCarerExpenses, // All expenses for the table (including pending)
        allCarerTravel, // All travel records for the table
        allCarerExtraTime, // All extra time records for the table
        approvedCarerExpenses, // Only approved expenses for calculations
        carerExpenses: allCarerExpenses, // Keep backward compatibility
        carerPayroll,
        approvedCarerTravel,
        approvedCarerExtraTime,
      };
    },
    enabled: !!staffId && !!branchId && !!payrollRecords,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
