
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, FileText, Download, Car, Route } from "lucide-react";
import { TravelRecord, useCreateTravelRecord, useTravelRecords, useDeleteTravelRecord } from "@/hooks/useAccountingData";
import TravelRecordsTable from "./TravelRecordsTable";
import AddTravelRecordDialog from "./AddTravelRecordDialog";
import FilterTravelDialog from "./FilterTravelDialog";
import ViewTravelRecordDialog from "./ViewTravelRecordDialog";
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

// Define filter interface compatible with database types
interface TravelTabFilter {
  dateRange: {
    from?: Date;
    to?: Date;
  };
  vehicleTypes: string[];
  status: string[];
  minDistance?: number;
  maxDistance?: number;
  minCost?: number;
  maxCost?: number;
  carerIds?: string[];
  clientNames?: string[];
}

interface TravelTabProps {
  branchId?: string;
  branchName?: string;
}

const TravelTab: React.FC<TravelTabProps> = ({ branchId, branchName }) => {
  const { data: travelRecords = [], isLoading } = useTravelRecords(branchId);
  const createTravelRecord = useCreateTravelRecord();
  const deleteTravelRecord = useDeleteTravelRecord();
  
  const [filteredRecords, setFilteredRecords] = useState<TravelRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Current record states
  const [currentRecord, setCurrentRecord] = useState<TravelRecord | undefined>(undefined);
  const [recordToDelete, setRecordToDelete] = useState<string | undefined>(undefined);
  
  // Filter state
  const [filters, setFilters] = useState<TravelTabFilter>({
    vehicleTypes: [],
    dateRange: { from: undefined, to: undefined },
    status: [],
    minDistance: undefined,
    maxDistance: undefined,
    minCost: undefined,
    maxCost: undefined,
  });

  // Update filteredRecords when travelRecords changes
  useEffect(() => {
    setFilteredRecords(travelRecords);
  }, [travelRecords]);

  // Apply search and filters to travel records
  useEffect(() => {
    let result = [...travelRecords];
    
    // Apply search
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (record) =>
          record.purpose.toLowerCase().includes(searchLower) ||
          record.start_location.toLowerCase().includes(searchLower) ||
          record.end_location.toLowerCase().includes(searchLower) ||
          record.distance_miles.toString().includes(searchTerm)
      );
    }
    
    // Apply vehicle type filters
    if (filters.vehicleTypes.length > 0) {
      result = result.filter((record) =>
        filters.vehicleTypes.includes(record.vehicle_type)
      );
    }
    
    // Apply status filters
    if (filters.status.length > 0) {
      result = result.filter((record) =>
        filters.status.includes(record.status)
      );
    }
    
    // Apply distance filters
    if (filters.minDistance !== undefined) {
      result = result.filter((record) => record.distance_miles >= filters.minDistance!);
    }
    if (filters.maxDistance !== undefined) {
      result = result.filter((record) => record.distance_miles <= filters.maxDistance!);
    }
    
    // Apply cost filters
    if (filters.minCost !== undefined) {
      result = result.filter((record) => record.total_cost >= filters.minCost!);
    }
    if (filters.maxCost !== undefined) {
      result = result.filter((record) => record.total_cost <= filters.maxCost!);
    }
    
    // Apply date range filters
    if (filters.dateRange.from) {
      const fromDate = new Date(filters.dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter(
        (record) => new Date(record.travel_date) >= fromDate
      );
    }
    if (filters.dateRange.to) {
      const toDate = new Date(filters.dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(
        (record) => new Date(record.travel_date) <= toDate
      );
    }
    
    setFilteredRecords(result);
  }, [travelRecords, searchTerm, filters]);

  // Handler functions
  const handleAddRecord = (recordData: Omit<TravelRecord, "id" | "created_at" | "updated_at" | "staff" | "client">) => {
    createTravelRecord.mutate(recordData);
    setAddDialogOpen(false);
  };

  const handleEditRecord = (record: TravelRecord) => {
    setCurrentRecord(record);
    setAddDialogOpen(true);
  };

  const handleUpdateRecord = async (updatedData: Omit<TravelRecord, "id" | "created_at" | "updated_at" | "staff" | "client">) => {
    if (!currentRecord) return;
    
    try {
      console.log('Updating travel record with data:', {
        id: currentRecord.id,
        ...updatedData
      });
      
      await createTravelRecord.mutateAsync(updatedData);
      setAddDialogOpen(false);
      setCurrentRecord(undefined);
    } catch (error) {
      console.error('Failed to update travel record:', error);
      // Provide more detailed error logging
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      // Error toast is already handled by the mutation's onError
    }
  };

  const handleViewRecord = (record: TravelRecord) => {
    setCurrentRecord(record);
    setViewDialogOpen(true);
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecordToDelete(recordId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteRecord = async () => {
    if (!recordToDelete || !branchId) return;
    
    try {
      await deleteTravelRecord.mutateAsync({
        id: recordToDelete,
        branchId
      });
      setDeleteDialogOpen(false);
      setRecordToDelete(undefined);
    } catch (error) {
      console.error('Failed to delete travel record:', error);
    }
  };

  const handleApplyFilters = (newFilters: TravelTabFilter) => {
    setFilters(newFilters);
  };

  // Handle the "Add Record" or "Add First Record" button click
  const handleAddRecordClick = () => {
    setCurrentRecord(undefined); // Ensure we're not in edit mode
    setAddDialogOpen(true);
  };

  // Handle the filter button click
  const handleFilterClick = () => {
    setFilterDialogOpen(true);
  };

  // Determine if filters are active
  const hasActiveFilters = () => {
    return (
      filters.vehicleTypes.length > 0 ||
      filters.status.length > 0 ||
      filters.minDistance !== undefined ||
      filters.maxDistance !== undefined ||
      filters.minCost !== undefined ||
      filters.maxCost !== undefined ||
      filters.dateRange.from !== undefined ||
      filters.dateRange.to !== undefined
    );
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Travel & Mileage</h2>
          <p className="text-muted-foreground mt-1">Manage travel expenses and mileage claims for {branchName}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {filteredRecords.length > 0 && (
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          )}
          <Button 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={handleAddRecordClick}
          >
            <Plus className="h-4 w-4" />
            <span>Add Travel Record</span>
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search travel records..."
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
            <Car className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No Travel Records Yet</h3>
          <p className="text-muted-foreground">Start logging travel expenses and mileage for {branchName}.</p>
          <Button 
            variant="default" 
            className="mt-4 bg-blue-600 hover:bg-blue-700"
            onClick={handleAddRecordClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Travel Record
          </Button>
        </div>
      ) : (
        <TravelRecordsTable 
          travelRecords={filteredRecords} 
          onViewRecord={handleViewRecord}
          onEditRecord={handleEditRecord}
          onDeleteRecord={handleDeleteRecord}
        />
      )}
      
      {/* Add/Edit Record Dialog */}
      <AddTravelRecordDialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setCurrentRecord(undefined);
        }}
        onSave={currentRecord ? handleUpdateRecord : handleAddRecord}
        initialData={currentRecord}
        isEditing={!!currentRecord}
        branchId={branchId}
      />
      
      {/* View Record Dialog */}
      {currentRecord && (
        <ViewTravelRecordDialog
          open={viewDialogOpen}
          onClose={() => {
            setViewDialogOpen(false);
            setCurrentRecord(undefined);
          }}
          onEdit={() => {
            setViewDialogOpen(false);
            setAddDialogOpen(true);
          }}
          travelRecord={currentRecord}
          branchId={branchId}
          canApprove={true}
        />
      )}
      
      {/* Filter Dialog */}
      <FilterTravelDialog
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
              This action cannot be undone. This will permanently delete the selected travel record.
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

export default TravelTab;
