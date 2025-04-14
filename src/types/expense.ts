
export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  receipt?: string;
  notes?: string;
  status: ExpenseStatus;
  createdBy: string;
}

export type ExpenseCategory = 
  | 'office_supplies'
  | 'travel'
  | 'meals'
  | 'equipment'
  | 'utilities'
  | 'rent'
  | 'software'
  | 'training'
  | 'medical_supplies'
  | 'other';

export type PaymentMethod = 
  | 'credit_card'
  | 'cash'
  | 'bank_transfer'
  | 'cheque'
  | 'other';

export type ExpenseStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'reimbursed';

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  office_supplies: 'Office Supplies',
  travel: 'Travel',
  meals: 'Meals & Entertainment',
  equipment: 'Equipment',
  utilities: 'Utilities',
  rent: 'Rent',
  software: 'Software',
  training: 'Training',
  medical_supplies: 'Medical Supplies',
  other: 'Other'
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  credit_card: 'Credit Card',
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  other: 'Other'
};

export const expenseStatusLabels: Record<ExpenseStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  reimbursed: 'Reimbursed'
};

export interface ExpenseFilter {
  categories: ExpenseCategory[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  status: ExpenseStatus[];
  minAmount?: number;
  maxAmount?: number;
}
