
export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  jobTitle: string;
  payPeriod: {
    from: string;
    to: string;
  };
  regularHours: number;
  overtimeHours: number;
  basicSalary: number;
  overtimePay: number;
  bonus: number;
  deductions: {
    tax: number;
    nationalInsurance: number;
    pension: number;
    other: number;
  };
  grossPay: number;
  netPay: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes?: string;
}

export type PaymentStatus = 
  | 'pending'
  | 'processed'
  | 'failed'
  | 'cancelled';

export type PaymentMethod = 
  | 'bank_transfer'
  | 'cheque'
  | 'cash'
  | 'other';

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'Pending',
  processed: 'Processed',
  failed: 'Failed',
  cancelled: 'Cancelled'
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  cash: 'Cash',
  other: 'Other'
};

export interface PayrollFilter {
  dateRange: {
    from?: Date;
    to?: Date;
  };
  paymentStatuses: PaymentStatus[];
  employeeIds?: string[];
  minGrossPay?: number;
  maxGrossPay?: number;
  paymentMethods?: PaymentMethod[];
}
