
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  FileDown, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  CalendarDays,
  SlidersHorizontal
} from "lucide-react";
import { usePayrollRecords, useCreatePayrollRecord, PayrollRecord } from "@/hooks/useAccountingData";
import PayrollTable from "./PayrollTable";
import AddPayrollDialog from "./AddPayrollDialog";
import ViewPayrollDialog from "./ViewPayrollDialog";
import FilterPayrollDialog from "./FilterPayrollDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface PayrollTabProps {
  branchId?: string;
  branchName?: string;
}

interface PayrollFilter {
  dateRange: { from?: Date; to?: Date };
  paymentStatuses: string[];
  minGrossPay?: number;
  maxGrossPay?: number;
}

const PayrollTab: React.FC<PayrollTabProps> = ({ branchId, branchName }) => {
  const { data: payrollRecords = [], isLoading, error } = usePayrollRecords(branchId);
  const createPayrollMutation = useCreatePayrollRecord();

  const [filteredRecords, setFilteredRecords] = useState<PayrollRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  
  // Dialogs state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Filters state
  const [activeFilters, setActiveFilters] = useState<PayrollFilter>({
    dateRange: {},
    paymentStatuses: [],
  });

  // Effect to filter records based on search query and active filters
  useEffect(() => {
    let results = [...payrollRecords];
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(record => 
        (record.staff && `${record.staff.first_name} ${record.staff.last_name}`.toLowerCase().includes(query)) ||
        record.staff_id.toLowerCase().includes(query) ||
        record.payment_reference?.toLowerCase().includes(query)
      );
    }
    
    // Apply date range filter
    if (activeFilters.dateRange.from) {
      results = results.filter(record => 
        new Date(record.pay_period_start) >= activeFilters.dateRange.from!
      );
    }
    
    if (activeFilters.dateRange.to) {
      results = results.filter(record => 
        new Date(record.pay_period_end) <= activeFilters.dateRange.to!
      );
    }
    
    // Apply status filters
    if (activeFilters.paymentStatuses.length > 0) {
      results = results.filter(record => 
        activeFilters.paymentStatuses.includes(record.payment_status)
      );
    }
    
    // Apply amount filters
    if (activeFilters.minGrossPay !== undefined) {
      results = results.filter(record => 
        record.gross_pay >= activeFilters.minGrossPay!
      );
    }
    
    if (activeFilters.maxGrossPay !== undefined) {
      results = results.filter(record => 
        record.gross_pay <= activeFilters.maxGrossPay!
      );
    }
    
    setFilteredRecords(results);
  }, [payrollRecords, searchQuery, activeFilters]);

  // Handle adding new payroll record
  const handleAddPayroll = async (record: Partial<PayrollRecord>) => {
    if (!branchId) return;
    
    try {
      if (isEditing && selectedRecord) {
        // TODO: Implement update mutation
        console.log('Update record:', record);
      } else {
        await createPayrollMutation.mutateAsync({
          ...record,
          branch_id: branchId,
          created_by: 'current-user', // Replace with actual user ID
        } as Omit<PayrollRecord, 'id' | 'created_at' | 'updated_at'>);
      }
      
      setAddDialogOpen(false);
      setIsEditing(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error('Failed to save payroll record:', error);
    }
  };

  // Handle viewing record details
  const handleViewRecord = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  // Handle editing record
  const handleEditRecord = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setIsEditing(true);
    setViewDialogOpen(false);
    setAddDialogOpen(true);
  };

  // Handle deleting record
  const handleDeleteClick = (recordId: string) => {
    const recordToDelete = payrollRecords.find(record => record.id === recordId);
    if (recordToDelete) {
      setSelectedRecord(recordToDelete);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    // TODO: Implement delete mutation
    setDeleteDialogOpen(false);
    setSelectedRecord(null);
  };

  // Handle filter application
  const handleApplyFilters = (filters: PayrollFilter) => {
    setActiveFilters(filters);
  };

  // Get status counts for summary
  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      processed: 0,
      failed: 0,
      total: filteredRecords.length
    };
    
    filteredRecords.forEach(record => {
      if (record.payment_status === 'pending') counts.pending++;
      if (record.payment_status === 'processed') counts.processed++;
      if (record.payment_status === 'failed') counts.failed++;
    });
    
    return counts;
  };

  const statusCounts = getStatusCounts();

  // Check if filters are active
  const hasActiveFilters = () => {
    return (
      !!activeFilters.dateRange.from ||
      !!activeFilters.dateRange.to ||
      activeFilters.paymentStatuses.length > 0 ||
      activeFilters.minGrossPay !== undefined ||
      activeFilters.maxGrossPay !== undefined
    );
  };

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters({
      dateRange: {},
      paymentStatuses: [],
    });
    setSearchQuery("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading payroll records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading payroll records. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Payroll Management</h2>
          <p className="text-gray-500 mt-1">Manage payslips and salary information for {branchName}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              setIsEditing(false);
              setSelectedRecord(null);
              setAddDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>New Payslip</span>
          </Button>
        </div>
      </div>
      
      {/* Search and filter row */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search employees..."
            className="pl-9 md:max-w-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-2 ${hasActiveFilters() ? 'border-blue-500 text-blue-600' : ''}`}
          onClick={() => setFilterDialogOpen(true)}
        >
          <Filter className="h-4 w-4" />
          <span>Filter</span>
          {hasActiveFilters() && <span className="rounded-full bg-blue-100 text-blue-600 w-5 h-5 text-xs flex items-center justify-center">!</span>}
        </Button>
      </div>
      
      {/* Filter tags */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500">Filters:</span>
          
          {activeFilters.dateRange.from && (
            <div className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" />
              <span>From {activeFilters.dateRange.from.toLocaleDateString()}</span>
            </div>
          )}
          
          {activeFilters.dateRange.to && (
            <div className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" />
              <span>To {activeFilters.dateRange.to.toLocaleDateString()}</span>
            </div>
          )}
          
          {activeFilters.paymentStatuses.map((status) => (
            <div key={status} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
              <SlidersHorizontal className="h-3 w-3" />
              <span>Status: {status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
          ))}
          
          {activeFilters.minGrossPay !== undefined && (
            <div className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
              <SlidersHorizontal className="h-3 w-3" />
              <span>Min: £{activeFilters.minGrossPay.toFixed(2)}</span>
            </div>
          )}
          
          {activeFilters.maxGrossPay !== undefined && (
            <div className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
              <SlidersHorizontal className="h-3 w-3" />
              <span>Max: £{activeFilters.maxGrossPay.toFixed(2)}</span>
            </div>
          )}
          
          <Button variant="ghost" size="sm" className="h-6 text-sm text-gray-500" onClick={clearAllFilters}>
            Clear all
          </Button>
        </div>
      )}
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Total Records</div>
              <div className="text-2xl font-bold">{statusCounts.total}</div>
            </div>
            <div className="bg-gray-100 p-2 rounded-full">
              <CalendarDays className="h-6 w-6 text-gray-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Processed</div>
              <div className="text-2xl font-bold text-green-600">{statusCounts.processed}</div>
            </div>
            <div className="bg-green-50 p-2 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Pending</div>
              <div className="text-2xl font-bold text-amber-600">{statusCounts.pending}</div>
            </div>
            <div className="bg-amber-50 p-2 rounded-full">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Failed</div>
              <div className="text-2xl font-bold text-red-600">{statusCounts.failed}</div>
            </div>
            <div className="bg-red-50 p-2 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Payroll table */}
      {filteredRecords.length > 0 ? (
        <PayrollTable
          payrollRecords={filteredRecords}
          onViewRecord={handleViewRecord}
          onEditRecord={handleEditRecord}
          onDeleteRecord={handleDeleteClick}
        />
      ) : (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500">No payroll records found matching your criteria.</p>
        </div>
      )}
      
      {/* Add/Edit Payroll Dialog */}
      <AddPayrollDialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setIsEditing(false);
          setSelectedRecord(null);
        }}
        onAdd={handleAddPayroll}
        initialData={isEditing ? selectedRecord! : undefined}
        isEditing={isEditing}
        branchId={branchId}
      />
      
      {/* View Payroll Dialog */}
      {selectedRecord && (
        <ViewPayrollDialog
          open={viewDialogOpen}
          onClose={() => {
            setViewDialogOpen(false);
            setSelectedRecord(null);
          }}
          onEdit={() => {
            setViewDialogOpen(false);
            setIsEditing(true);
            setAddDialogOpen(true);
          }}
          payrollRecord={selectedRecord}
        />
      )}
      
      {/* Filter Dialog */}
      <FilterPayrollDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={activeFilters}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payroll record for {selectedRecord?.staff ? `${selectedRecord.staff.first_name} ${selectedRecord.staff.last_name}` : 'this employee'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PayrollTab;
