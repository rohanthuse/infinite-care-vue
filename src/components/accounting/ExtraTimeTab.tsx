
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, Clock, Download } from "lucide-react";
import { 
  useExtraTimeRecords, 
  useCreateExtraTimeRecord, 
  useStaffList, 
  useClientsList,
  ExtraTimeRecord 
} from "@/hooks/useAccountingData";
import ExtraTimeTable from "./ExtraTimeTable";
import AddExtraTimeDialog from "./AddExtraTimeDialog";
import FilterExtraTimeDialog from "./FilterExtraTimeDialog";
import ViewExtraTimeDialog from "./ViewExtraTimeDialog";
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

interface ExtraTimeTabProps {
  branchId?: string;
  branchName?: string;
}

type ExtraTimeStatus = 'pending' | 'approved' | 'rejected';

interface ExtraTimeFilter {
  dateRange: { from?: Date; to?: Date };
  statuses: ExtraTimeStatus[];
  minAmount?: number;
  maxAmount?: number;
}

const ExtraTimeTab: React.FC<ExtraTimeTabProps> = ({ branchId, branchName }) => {
  const { data: extraTimeRecords = [], isLoading, error } = useExtraTimeRecords(branchId);
  const { data: staffList = [] } = useStaffList(branchId);
  const { data: clientsList = [] } = useClientsList(branchId);
  const createExtraTimeMutation = useCreateExtraTimeRecord();

  const [filteredRecords, setFilteredRecords] = useState<ExtraTimeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Current record states
  const [currentRecord, setCurrentRecord] = useState<ExtraTimeRecord | undefined>(undefined);
  const [recordToDelete, setRecordToDelete] = useState<string | undefined>(undefined);
  
  // Filter state
  const [filters, setFilters] = useState<ExtraTimeFilter>({
    dateRange: { from: undefined, to: undefined },
    statuses: [],
    minAmount: undefined,
    maxAmount: undefined,
  });

  // Apply search and filters to records
  useEffect(() => {
    let result = [...extraTimeRecords];
    
    // Enhance records with staff and client names
    result = result.map(record => {
      const staff = staffList.find(s => s.id === record.staff_id);
      const client = clientsList.find(c => c.id === record.client_id);
      
      return {
        ...record,
        staff: staff ? {
          first_name: staff.first_name,
          last_name: staff.last_name,
        } : null,
        client: client ? {
          first_name: client.first_name,
          last_name: client.last_name,
        } : null,
      };
    });
    
    // Apply search
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (record) => {
          const staffName = record.staff ? `${record.staff.first_name} ${record.staff.last_name}` : '';
          const clientName = record.client ? `${record.client.first_name} ${record.client.last_name}` : '';
          
          return (
            staffName.toLowerCase().includes(searchLower) ||
            clientName.toLowerCase().includes(searchLower) ||
            record.reason?.toLowerCase().includes(searchLower) ||
            record.id.toLowerCase().includes(searchLower) ||
            record.total_cost.toString().includes(searchTerm)
          );
        }
      );
    }
    
    // Apply status filters
    if (filters.statuses.length > 0) {
      result = result.filter((record) =>
        filters.statuses.includes(record.status as ExtraTimeStatus)
      );
    }
    
    // Apply amount filters
    if (filters.minAmount !== undefined) {
      result = result.filter((record) => record.total_cost >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined) {
      result = result.filter((record) => record.total_cost <= filters.maxAmount!);
    }
    
    // Apply date range filters
    if (filters.dateRange.from) {
      const fromDate = new Date(filters.dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter(
        (record) => new Date(record.work_date) >= fromDate
      );
    }
    if (filters.dateRange.to) {
      const toDate = new Date(filters.dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(
        (record) => new Date(record.work_date) <= toDate
      );
    }
    
    setFilteredRecords(result);
  }, [extraTimeRecords, searchTerm, filters, staffList, clientsList]);

  // Listen for export events from parent component
  useEffect(() => {
    const handleAccountingExport = (event: CustomEvent) => {
      if (event.detail.tabName === 'extra-time') {
        handleExportExtraTime();
      }
    };

    window.addEventListener('accounting-export', handleAccountingExport as EventListener);
    
    return () => {
      window.removeEventListener('accounting-export', handleAccountingExport as EventListener);
    };
  }, []);

  // Export function
  const handleExportExtraTime = async () => {
    try {
      setIsExporting(true);
      
      // Prepare CSV data
      const headers = [
        'Date',
        'Staff Member',
        'Client',
        'Scheduled Start',
        'Scheduled End',
        'Actual Start',
        'Actual End',
        'Extra Time (minutes)',
        'Hourly Rate',
        'Extra Time Rate',
        'Total Cost',
        'Status',
        'Reason',
        'Notes'
      ];
      
      const csvData = filteredRecords.map(record => [
        new Date(record.work_date).toLocaleDateString(),
        record.staff ? `${record.staff.first_name} ${record.staff.last_name}` : 'Unknown',
        record.client ? `${record.client.first_name} ${record.client.last_name}` : 'N/A',
        record.scheduled_start_time,
        record.scheduled_end_time,
        record.actual_start_time || 'N/A',
        record.actual_end_time || 'N/A',
        record.extra_time_minutes.toString(),
        `£${record.hourly_rate.toFixed(2)}`,
        `£${(record.extra_time_rate || record.hourly_rate).toFixed(2)}`,
        `£${record.total_cost.toFixed(2)}`,
        record.status.charAt(0).toUpperCase() + record.status.slice(1),
        record.reason || '',
        record.notes || ''
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
      link.download = `extra_time_${branchName || 'branch'}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported ${filteredRecords.length} extra time records`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export extra time records');
    } finally {
      setIsExporting(false);
    }
  };

  // Handler functions
  const handleAddExtraTime = async (recordData: Partial<ExtraTimeRecord>) => {
    if (!branchId) return;
    
    try {
      await createExtraTimeMutation.mutateAsync({
        ...recordData,
        branch_id: branchId,
      } as Omit<ExtraTimeRecord, 'id' | 'created_at' | 'updated_at'>);
      
      setAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to create extra time record:', error);
    }
  };

  const handleEditRecord = (record: ExtraTimeRecord) => {
    setCurrentRecord(record);
    setAddDialogOpen(true);
  };

  const handleViewRecord = (record: ExtraTimeRecord) => {
    setCurrentRecord(record);
    setViewDialogOpen(true);
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecordToDelete(recordId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteRecord = () => {
    // TODO: Implement delete mutation
    console.log('Deleting record:', recordToDelete);
    setDeleteDialogOpen(false);
    setRecordToDelete(undefined);
  };

  const handleApplyFilters = (newFilters: ExtraTimeFilter) => {
    setFilters(newFilters);
  };

  const handleAddRecordClick = () => {
    setCurrentRecord(undefined);
    setAddDialogOpen(true);
  };

  const handleFilterClick = () => {
    setFilterDialogOpen(true);
  };

  const hasActiveFilters = () => {
    return (
      filters.statuses.length > 0 ||
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
          <p className="text-muted-foreground">Loading extra time records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">Error loading extra time records. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Extra Time Management</h2>
          <p className="text-muted-foreground mt-1">Review and approve additional hours reported by carers for {branchName}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {filteredRecords.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={handleExportExtraTime}
              disabled={isExporting}
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </Button>
          )}
          <Button 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={handleAddRecordClick}
          >
            <Plus className="h-4 w-4" />
            <span>Add Extra Time</span>
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by carer name, client or reason..."
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
      
      {filteredRecords.length === 0 && searchTerm === "" && !hasActiveFilters() ? (
        <div className="bg-muted border border-dashed border-border rounded-lg p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No Extra Time Records Yet</h3>
          <p className="text-muted-foreground">Start logging extra time records for {branchName}.</p>
          <Button 
            variant="default" 
            className="mt-4 bg-blue-600 hover:bg-blue-700"
            onClick={handleAddRecordClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Record
          </Button>
        </div>
      ) : (
        <ExtraTimeTable 
          records={filteredRecords} 
          onViewRecord={handleViewRecord}
          onEditRecord={handleEditRecord}
          onDeleteRecord={handleDeleteRecord}
        />
      )}
      
      <AddExtraTimeDialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setCurrentRecord(undefined);
        }}
        onSave={handleAddExtraTime}
        initialData={currentRecord}
        isEditing={!!currentRecord}
        branchId={branchId}
      />
      
      {currentRecord && (
        <ViewExtraTimeDialog
          open={viewDialogOpen}
          onClose={() => {
            setViewDialogOpen(false);
            setCurrentRecord(undefined);
          }}
          onEdit={() => {
            setViewDialogOpen(false);
            setAddDialogOpen(true);
          }}
          record={currentRecord}
          branchId={branchId}
          canApprove={true}
        />
      )}
      
      <FilterExtraTimeDialog
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
              This action cannot be undone. This will permanently delete the selected extra time record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteRecord}
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

export default ExtraTimeTab;
