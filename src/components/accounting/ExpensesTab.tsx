
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, FileText, Download } from "lucide-react";
import { mockExpenses } from "@/data/mockExpenseData";
import { Expense, ExpenseFilter } from "@/types/expense";
import ExpensesTable from "./ExpensesTable";
import AddExpenseDialog from "./AddExpenseDialog";
import FilterExpensesDialog from "./FilterExpensesDialog";
import ViewExpenseDialog from "./ViewExpenseDialog";
import { v4 as uuidv4 } from "uuid";
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

const ExpensesTab: React.FC<ExpensesTabProps> = ({ branchId, branchName }) => {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>(mockExpenses);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Current expense states
  const [currentExpense, setCurrentExpense] = useState<Expense | undefined>(undefined);
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
          expense.paymentMethod.toLowerCase().includes(searchLower) ||
          expense.amount.toString().includes(searchTerm) ||
          expense.createdBy.toLowerCase().includes(searchLower)
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
        (expense) => new Date(expense.date) >= fromDate
      );
    }
    if (filters.dateRange.to) {
      const toDate = new Date(filters.dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(
        (expense) => new Date(expense.date) <= toDate
      );
    }
    
    setFilteredExpenses(result);
  }, [expenses, searchTerm, filters]);

  // Handler functions
  const handleAddExpense = (expenseData: Omit<Expense, "id" | "status" | "createdBy">) => {
    const newExpense: Expense = {
      ...expenseData,
      id: uuidv4(),
      status: "pending", // Default status for new expenses
      createdBy: "Current User" // In a real app, this would come from auth context
    };
    setExpenses([newExpense, ...expenses]);
    setAddDialogOpen(false);
  };

  const handleEditExpense = (expense: Expense) => {
    setCurrentExpense(expense);
    setAddDialogOpen(true);
  };

  const handleUpdateExpense = (updatedData: Omit<Expense, "id" | "status" | "createdBy">) => {
    if (currentExpense) {
      const updatedExpense: Expense = {
        ...updatedData,
        id: currentExpense.id,
        status: currentExpense.status,
        createdBy: currentExpense.createdBy
      };
      
      setExpenses(
        expenses.map((exp) => (exp.id === currentExpense.id ? updatedExpense : exp))
      );
      
      setAddDialogOpen(false);
      setCurrentExpense(undefined);
    }
  };

  const handleViewExpense = (expense: Expense) => {
    setCurrentExpense(expense);
    setViewDialogOpen(true);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteExpense = () => {
    if (expenseToDelete) {
      setExpenses(expenses.filter((exp) => exp.id !== expenseToDelete));
      setDeleteDialogOpen(false);
      setExpenseToDelete(undefined);
    }
  };

  const handleApplyFilters = (newFilters: ExpenseFilter) => {
    setFilters(newFilters);
  };

  // Handle the "Add Expense" or "Add First Expense" button click
  const handleAddExpenseClick = () => {
    setCurrentExpense(undefined); // Ensure we're not in edit mode
    setAddDialogOpen(true);
  };

  // Handle the filter button click
  const handleFilterClick = () => {
    setFilterDialogOpen(true);
  };

  // Determine if filters are active
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
        onSave={currentExpense ? handleUpdateExpense : handleAddExpense}
        initialData={currentExpense}
        isEditing={!!currentExpense}
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
