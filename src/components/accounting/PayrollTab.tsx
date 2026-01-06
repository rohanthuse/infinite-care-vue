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
  SlidersHorizontal,
  Users
} from "lucide-react";
import { usePayrollRecords, useCreatePayrollRecord, useDeletePayrollRecord, PayrollRecord } from "@/hooks/useAccountingData";
import { useAuthSafe } from "@/hooks/useAuthSafe";
import { useUserRoleCheck } from "@/hooks/useUserRoleCheck";
import PayrollTable from "./PayrollTable";
import AddPayrollDialog from "./AddPayrollDialog";
import ViewPayrollDialog from "./ViewPayrollDialog";
import FilterPayrollDialog from "./FilterPayrollDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import PayrollBookingIntegration from "./PayrollBookingIntegration";
import BulkPayrollGenerationDialog from "./BulkPayrollGenerationDialog";
import { exportPayrollPayslip, OrganizationInfo } from "@/utils/payslipPdfGenerator";
import { useTenant } from "@/contexts/TenantContext";

interface PayrollTabProps {
  branchId?: string;
  branchName?: string;
}

// Define payment status type to match FilterPayrollDialog
type PaymentStatus = 'pending' | 'processed' | 'failed' | 'cancelled';

// Define filter types to match FilterPayrollDialog
interface PayrollFilter {
  dateRange: { from?: Date; to?: Date };
  paymentStatuses: PaymentStatus[];
  minGrossPay?: number;
  maxGrossPay?: number;
}

const PayrollTab: React.FC<PayrollTabProps> = ({ branchId, branchName }) => {
  const { user } = useAuthSafe();
  const { organization } = useTenant();
  const { data: payrollRecords = [], isLoading, error } = usePayrollRecords(branchId);
  const createPayrollMutation = useCreatePayrollRecord();
  const deletePayrollMutation = useDeletePayrollRecord();
  const { data: roleInfo } = useUserRoleCheck();
  
  // Permission checks based on user role
  const isAdmin = roleInfo?.isSuperAdmin || roleInfo?.isBranchAdmin;

  const [filteredRecords, setFilteredRecords] = useState<PayrollRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Dialogs state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
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
        activeFilters.paymentStatuses.includes(record.payment_status as PaymentStatus)
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

  // Export function
  const handleExportPayroll = async () => {
    try {
      setIsExporting(true);
      
      // Prepare CSV data
      const headers = [
        'Employee Name',
        'Email',
        'Pay Period Start',
        'Pay Period End',
        'Regular Hours',
        'Overtime Hours',
        'Hourly Rate',
        'Basic Salary',
        'Overtime Pay',
        'Bonus',
        'Gross Pay',
        'Tax Deduction',
        'NI Deduction',
        'Pension Deduction',
        'Other Deductions',
        'Net Pay',
        'Payment Status',
        'Payment Method',
        'Payment Date',
        'Payment Reference'
      ];
      
      const csvData = filteredRecords.map(record => [
        record.staff ? `${record.staff.first_name} ${record.staff.last_name}` : 'Unknown Employee',
        record.staff?.email || 'N/A',
        new Date(record.pay_period_start).toLocaleDateString(),
        new Date(record.pay_period_end).toLocaleDateString(),
        record.regular_hours.toString(),
        record.overtime_hours.toString(),
        `£${record.hourly_rate.toFixed(2)}`,
        `£${record.basic_salary.toFixed(2)}`,
        `£${record.overtime_pay.toFixed(2)}`,
        `£${record.bonus.toFixed(2)}`,
        `£${record.gross_pay.toFixed(2)}`,
        `£${record.tax_deduction.toFixed(2)}`,
        `£${record.ni_deduction.toFixed(2)}`,
        `£${record.pension_deduction.toFixed(2)}`,
        `£${record.other_deductions.toFixed(2)}`,
        `£${record.net_pay.toFixed(2)}`,
        record.payment_status.charAt(0).toUpperCase() + record.payment_status.slice(1),
        record.payment_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        record.payment_date ? new Date(record.payment_date).toLocaleDateString() : 'Not set',
        record.payment_reference || 'N/A'
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
      link.download = `payroll_${branchName || 'branch'}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported ${filteredRecords.length} payroll records`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export payroll data');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle adding new payroll record
  const handleAddPayroll = async (record: Partial<PayrollRecord>) => {
    if (!branchId) {
      toast.error('No branch selected');
      return;
    }
    
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }
    
    try {
      console.log('Submitting payroll data:', {
        ...record,
        branch_id: branchId,
        created_by: user.id,
      });
      
      if (isEditing && selectedRecord) {
        // TODO: Implement update mutation
        console.log('Update record:', record);
        toast.success('Payroll record updated successfully');
      } else {
        await createPayrollMutation.mutateAsync({
          ...record,
          branch_id: branchId,
          created_by: user.id,
        } as Omit<PayrollRecord, 'id' | 'created_at' | 'updated_at'>);
      }
      
      setAddDialogOpen(false);
      setIsEditing(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error('Failed to save payroll record:', error);
      toast.error(`Failed to save payroll record: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const handleDeleteConfirm = async () => {
    if (!selectedRecord || !branchId) {
      toast.error('Unable to delete record. Missing required information.');
      return;
    }

    try {
      await deletePayrollMutation.mutateAsync({
        id: selectedRecord.id,
        branchId: branchId
      });
      
      setDeleteDialogOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error('Error deleting payroll record:', error);
      // Toast error is already shown by the mutation
    }
  };

  // Handle filter application
  const handleApplyFilters = (filters: PayrollFilter) => {
    setActiveFilters(filters);
  };

  // Handle share payroll record
  const handleShareRecord = (record: PayrollRecord) => {
    // For now, copy a share link or show share options
    const employeeName = record.staff ? `${record.staff.first_name} ${record.staff.last_name}` : 'Employee';
    const period = `${new Date(record.pay_period_start).toLocaleDateString()} - ${new Date(record.pay_period_end).toLocaleDateString()}`;
    const shareText = `Payroll for ${employeeName} - ${period}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Payroll Record',
        text: shareText,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText);
        toast.success('Payroll info copied to clipboard');
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Payroll info copied to clipboard');
    }
  };

  // Handle download payslip PDF
  const handleDownloadPayslip = (record: PayrollRecord) => {
    const orgInfo: OrganizationInfo | undefined = organization ? {
      name: organization.name || 'Company',
      address: organization.address || '',
      email: organization.contact_email || organization.billing_email || '',
      phone: organization.contact_phone || undefined,
      logoBase64: null,
      registrationNumber: undefined,
    } : undefined;
    
    exportPayrollPayslip(record, orgInfo);
    toast.success('Payslip PDF downloaded');
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
          <p className="text-muted-foreground">Loading payroll records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">Error loading payroll records. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Payroll Management</h2>
          <p className="text-muted-foreground mt-1">Manage payslips and salary information for {branchName}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={handleExportPayroll}
            disabled={isExporting}
          >
            <FileDown className="h-4 w-4" />
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            onClick={() => setBulkDialogOpen(true)}
          >
            <Users className="h-4 w-4" />
            <span>Bulk Generate</span>
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

      {/* Payroll Integration Component */}
      <PayrollBookingIntegration 
        branchId={branchId!}
        branchName={branchName}
        onPayrollCreated={() => {
          // Refresh payroll records after creation
          // The query will auto-invalidate from the mutation
        }}
      />
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
          className={`flex items-center gap-2 ${hasActiveFilters() ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400' : ''}`}
          onClick={() => setFilterDialogOpen(true)}
        >
          <Filter className="h-4 w-4" />
          <span>Filter</span>
          {hasActiveFilters() && <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 w-5 h-5 text-xs flex items-center justify-center">!</span>}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Records</div>
              <div className="text-2xl font-bold text-foreground">{statusCounts.total}</div>
            </div>
            <div className="bg-muted p-2 rounded-full">
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Processed</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{statusCounts.processed}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-green-500 dark:text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Pending</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{statusCounts.pending}</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded-full">
              <Clock className="h-6 w-6 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Failed</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{statusCounts.failed}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-500 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>
      
      {filteredRecords.length > 0 ? (
        <PayrollTable
          payrollRecords={filteredRecords}
          onViewRecord={handleViewRecord}
          onEditRecord={handleEditRecord}
          onDeleteRecord={handleDeleteClick}
          onShareRecord={handleShareRecord}
          onDownloadPayslip={handleDownloadPayslip}
          canEdit={isAdmin}
          canDelete={isAdmin}
        />
      ) : (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500">No payroll records found matching your criteria.</p>
        </div>
      )}
      
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
      
      <FilterPayrollDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={activeFilters}
      />
      
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
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deletePayrollMutation.isPending}
            >
              {deletePayrollMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <BulkPayrollGenerationDialog
        isOpen={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        branchId={branchId!}
        onPayrollCreated={() => {
          // Query will auto-invalidate from the mutation
        }}
      />
    </div>
  );
};

export default PayrollTab;
