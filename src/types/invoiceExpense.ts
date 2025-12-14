export interface InvoiceExpenseEntry {
  id: string; // Temporary UUID for local state management
  expense_id?: string | null; // Reference to source expense if from existing approved expense
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
  booking_reference?: string | null; // For display in PDF
  source_type?: 'manual' | 'booking' | 'travel' | 'claim'; // Track where expense came from
}
