
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, FileText, Download } from "lucide-react";
import { useExpenses, useCreateExpense, ExpenseRecord } from "@/hooks/useAccountingData";
import { useUserRole } from "@/hooks/useUserRole";
import ExpensesTable from "./ExpensesTable";
import AddExpenseDialog from "./AddExpenseDialog";
import FilterExpensesDialog from "./FilterExpensesDialog";
import ViewExpenseDialog from "./ViewExpenseDialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ExpensesTabProps {
  branchId?: string;
  branchName?: string;
}

// Define expense category and status types to match FilterExpensesDialog
type ExpenseCategory = 'office_supplies' | 'travel' | 'meals' | 'equipment' | 'utilities' | 'rent' | 'software' | 'training' | 'medical_supplies' | 'other';
type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed';

// Define filter types to match FilterExpensesDialog
interface ExpenseFilter {
  categories: ExpenseCategory[];
  dateRange: { from?: Date; to?: Date };
  status: ExpenseStatus[];
  minAmount?: number;
  maxAmount?: number;
}

const ExpensesTab: React.FC<ExpensesTabProps> = ({ branchId, branchName }) => {
  const { data: expenses = [], isLoading, error } = useExpenses(branchId);
  const createExpenseMutation = useCreateExpense();
  const { data: userRole } = useUserRole();

  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Current expense states
  const [currentExpense, setCurrentExpense] = useState<ExpenseRecord | undefined>(undefined);
  const [expenseToDelete, setExpenseToDelete] = useState<string | undefined>(undefined);
  
  // Filter state
  const [filters, setFilters] = useState<ExpenseFilter>({
    categories: [],
    dateRange: { from: undefined, to: undefined },
    status: [],
    minAmount: undefined,
    maxAmount: undefined,
  });

  // Apply search and filters to expenses
  useEffect(() => {
    let result = [...expenses];
    
    // Apply search
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (expense) =>
          expense.description.toLowerCase().includes(searchLower) ||
          expense.category.toLowerCase().includes(searchLower) ||
          expense.payment_method.toLowerCase().includes(searchLower) ||
          expense.amount.toString().includes(searchTerm) ||
          (expense.staff && `${expense.staff.first_name} ${expense.staff.last_name}`.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply category filters
    if (filters.categories.length > 0) {
      result = result.filter((expense) =>
        filters.categories.includes(expense.category as ExpenseCategory)
      );
    }
    
    // Apply status filters
    if (filters.status.length > 0) {
      result = result.filter((expense) =>
        filters.status.includes(expense.status as ExpenseStatus)
      );
    }
    
    // Apply amount filters
    if (filters.minAmount !== undefined) {
      result = result.filter((expense) => expense.amount >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined) {
      result = result.filter((expense) => expense.amount <= filters.maxAmount!);
    }
    
    // Apply date range filters
    if (filters.dateRange.from) {
      const fromDate = new Date(filters.dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter(
        (expense) => new Date(expense.expense_date) >= fromDate
      );
    }
    if (filters.dateRange.to) {
      const toDate = new Date(filters.dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(
        (expense) => new Date(expense.expense_date) <= toDate
      );
    }
    
    setFilteredExpenses(result);
  }, [expenses, searchTerm, filters]);

  // Export function
  const handleExportExpenses = async () => {
    try {
      setIsExporting(true);
      
      // Prepare CSV data
      const headers = [
        'Date',
        'Description',
        'Category',
        'Amount',
        'Payment Method',
        'Status',
        'Staff',
        'Notes'
      ];
      
      const csvData = filteredExpenses.map(expense => [
        new Date(expense.expense_date).toLocaleDateString(),
        expense.description,
        expense.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        `£${expense.amount.toFixed(2)}`,
        expense.payment_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        expense.status.charAt(0).toUpperCase() + expense.status.slice(1),
        expense.staff ? `${expense.staff.first_name} ${expense.staff.last_name}` : 'N/A',
        expense.notes || ''
      ]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expenses_${branchName || 'branch'}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported ${filteredExpenses.length} expense records`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export expenses');
    } finally {
      setIsExporting(false);
    }
  };

  // Handler functions
  const handleAddExpense = async (expenseData: Partial<ExpenseRecord>) => {
    if (!branchId || !userRole?.id) {
      toast.error("Missing required information. Please try again.");
      return;
    }
    
    try {
      console.log("Creating expense with user role:", userRole);
      console.log("Expense data received:", expenseData);

      // For super admins, use a system approach to handle foreign key constraints
      const isStaffMember = userRole.role === 'carer';
      const systemStaffId = 'f47cc12e-01df-4f28-b5a5-ec0cf540fd78'; // System admin staff ID for this branch
      
      const expenseToCreate = {
        branch_id: branchId,
        staff_id: expenseData.staff_id || null,
        client_id: null,
        description: expenseData.description || '',
        amount: Number(expenseData.amount || 0),
        category: expenseData.category || '',
        expense_date: expenseData.expense_date || new Date().toISOString().split('T')[0],
        payment_method: expenseData.payment_method || 'cash',
        receipt_url: expenseData.receipt_url || null,
        notes: expenseData.notes || null,
        status: 'approved', // Auto-approve for super admin
        created_by: isStaffMember ? userRole.id : systemStaffId, // Use system staff ID for super admins
        approved_by: null, // Set to null to avoid foreign key constraint
        approved_at: new Date().toISOString(),
      };

      console.log("Final expense to create:", expenseToCreate);

      await createExpenseMutation.mutateAsync(expenseToCreate);
      
      setAddDialogOpen(false);
      toast.success("Expense added successfully");
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error(`Failed to add expense: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEditExpense = (expense: ExpenseRecord) => {
    setCurrentExpense(expense);
    setAddDialogOpen(true);
  };

  const handleViewExpense = (expense: ExpenseRecord) => {
    setCurrentExpense(expense);
    setViewDialogOpen(true);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteExpense = () => {
    // TODO: Implement delete mutation
    setDeleteDialogOpen(false);
    setExpenseToDelete(undefined);
  };

  const handleApplyFilters = (newFilters: ExpenseFilter) => {
    setFilters(newFilters);
  };

  const handleAddExpenseClick = () => {
    setCurrentExpense(undefined);
    setAddDialogOpen(true);
  };

  const handleFilterClick = () => {
    setFilterDialogOpen(true);
  };

  const hasActiveFilters = () => {
    return (
      filters.categories.length > 0 ||
      filters.status.length > 0 ||
      filters.minAmount !== undefined ||
      filters.maxAmount !== undefined ||
      filters.dateRange.from !== undefined ||
      filters.dateRange.to !== undefined
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading expenses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">Error loading expenses. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Expenses Management</h2>
          <p className="text-muted-foreground mt-1">Log and manage branch expenses for {branchName}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {filteredExpenses.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={handleExportExpenses}
              disabled={isExporting}
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </Button>
          )}
          <Button 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={handleAddExpenseClick}
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            className="pl-10 pr-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            variant="outline" 
            size="icon" 
            className={`h-10 w-10 ${hasActiveFilters() ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' : 'bg-background'}`}
            onClick={handleFilterClick}
          >
            <Filter className={`h-4 w-4 ${hasActiveFilters() ? 'text-blue-600 dark:text-blue-400' : ''}`} />
          </Button>
        </div>
      </div>
      
      {filteredExpenses.length === 0 && searchTerm === "" && !hasActiveFilters() ? (
        <div className="bg-muted border border-dashed border-border rounded-lg p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No Expenses Yet</h3>
          <p className="text-muted-foreground">Start logging expenses for {branchName}.</p>
          <Button 
            variant="default" 
            className="mt-4 bg-blue-600 hover:bg-blue-700"
            onClick={handleAddExpenseClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Expense
          </Button>
        </div>
      ) : (
        <ExpensesTable 
          expenses={filteredExpenses} 
          onViewExpense={handleViewExpense}
          onEditExpense={handleEditExpense}
          onDeleteExpense={handleDeleteExpense}
        />
      )}
      
      <AddExpenseDialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setCurrentExpense(undefined);
        }}
        onSave={handleAddExpense}
        initialData={currentExpense}
        isEditing={!!currentExpense}
        branchId={branchId}
      />
      
      {currentExpense && (
        <ViewExpenseDialog
          open={viewDialogOpen}
          onClose={() => {
            setViewDialogOpen(false);
            setCurrentExpense(undefined);
          }}
          expense={currentExpense}
          branchId={branchId}
          canApprove={true}
        />
      )}
      
      <FilterExpensesDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected expense.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteExpense}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExpensesTab;
