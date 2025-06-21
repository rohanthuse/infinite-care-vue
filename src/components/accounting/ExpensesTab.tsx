
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, FileText, Download } from "lucide-react";
import { useExpenses, useCreateExpense, ExpenseRecord } from "@/hooks/useAccountingData";
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

interface ExpensesTabProps {
  branchId?: string;
  branchName?: string;
}

interface ExpenseFilter {
  categories: string[];
  dateRange: { from?: Date; to?: Date };
  status: string[];
  minAmount?: number;
  maxAmount?: number;
}

const ExpensesTab: React.FC<ExpensesTabProps> = ({ branchId, branchName }) => {
  const { data: expenses = [], isLoading, error } = useExpenses(branchId);
  const createExpenseMutation = useCreateExpense();

  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
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
        filters.categories.includes(expense.category)
      );
    }
    
    // Apply status filters
    if (filters.status.length > 0) {
      result = result.filter((expense) =>
        filters.status.includes(expense.status)
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

  // Handler functions
  const handleAddExpense = async (expenseData: Partial<ExpenseRecord>) => {
    if (!branchId) return;
    
    try {
      await createExpenseMutation.mutateAsync({
        ...expenseData,
        branch_id: branchId,
        created_by: 'current-user', // Replace with actual user ID from auth
      } as Omit<ExpenseRecord, 'id' | 'created_at' | 'updated_at'>);
      
      setAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to create expense:', error);
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
          <p className="text-gray-500">Loading expenses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading expenses. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Expenses Management</h2>
          <p className="text-gray-500 mt-1">Log and manage branch expenses for {branchName}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {filteredExpenses.length > 0 && (
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
            className={`h-10 w-10 ${hasActiveFilters() ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
            onClick={handleFilterClick}
          >
            <Filter className={`h-4 w-4 ${hasActiveFilters() ? 'text-blue-600' : ''}`} />
          </Button>
        </div>
      </div>
      
      {filteredExpenses.length === 0 && searchTerm === "" && !hasActiveFilters() ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <FileText className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Expenses Yet</h3>
          <p className="text-gray-500">Start logging expenses for {branchName}.</p>
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
      
      {/* Add/Edit Expense Dialog */}
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
      
      {/* View Expense Dialog */}
      {currentExpense && (
        <ViewExpenseDialog
          open={viewDialogOpen}
          onClose={() => {
            setViewDialogOpen(false);
            setCurrentExpense(undefined);
          }}
          onEdit={() => {
            setViewDialogOpen(false);
            setAddDialogOpen(true);
          }}
          expense={currentExpense}
        />
      )}
      
      {/* Filter Dialog */}
      <FilterExpensesDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />
      
      {/* Delete Confirmation Dialog */}
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
