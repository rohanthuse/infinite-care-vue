export interface InvoiceExpenseEntry {
  id: string; // Temporary UUID for local state management
  expense_type_id: string;
  expense_type_name: string; // For display
  date: string | null;
  amount: number;
  admin_cost_percentage: number;
  description: string;
  pay_staff: boolean;
  staff_id: string | null;
  staff_name: string | null; // For display
  pay_staff_amount: number | null;
}
