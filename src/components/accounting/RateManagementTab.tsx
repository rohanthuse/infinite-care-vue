
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Percent, Plus, Filter, Download, FileSpreadsheet, FileText, 
  Check, Info, AlertTriangle, Clock, RefreshCw, PoundSterling
} from "lucide-react";
import RatesTable from "./RatesTable";
import { ServiceRate, useServiceRates, useCreateServiceRate, useDeleteServiceRate, useStaffList } from "@/hooks/useAccountingData";
import { cn, formatCurrency } from "@/lib/utils";
import NewAddRateDialog from "./NewAddRateDialog";
import EditRateDialog from "./EditRateDialog";
import ViewRateDialog from "./ViewRateDialog";
import FilterRateDialog from "./FilterRateDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ServiceRate as UIServiceRate, RateFilter as UIRateFilter } from "@/types/rate";
import { useUserRole } from "@/hooks/useUserRole";

// Define filter interface compatible with database types
interface RateFilter {
  serviceNames?: string[];
  rateTypes?: string[];
  clientTypes?: string[];
  fundingSources?: string[];
  statuses?: string[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  minAmount?: number;
  maxAmount?: number;
}

interface RateManagementTabProps {
  branchId?: string;
  branchName?: string;
}

const RateManagementTab: React.FC<RateManagementTabProps> = ({ branchId, branchName }) => {
  console.log('[RateManagementTab] Received props:', { branchId, branchName });
  // Use real database data instead of mock data
  const { data: rates = [], isLoading, error, refetch } = useServiceRates(branchId);
  const { data: staffList = [] } = useStaffList(branchId);
  const createServiceRate = useCreateServiceRate();
  const deleteServiceRate = useDeleteServiceRate();
  const { data: currentUser } = useUserRole();
  
  const [filteredRates, setFilteredRates] = useState<ServiceRate[]>([]);
  const [activeFilter, setActiveFilter] = useState<RateFilter | undefined>(undefined);
  
  const [isAddRateDialogOpen, setIsAddRateDialogOpen] = useState(false);
  const [isEditRateDialogOpen, setIsEditRateDialogOpen] = useState(false);
  const [isViewRateDialogOpen, setIsViewRateDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [selectedRate, setSelectedRate] = useState<UIServiceRate | null>(null);
  const [rateToDelete, setRateToDelete] = useState<string | null>(null);

  // Update filteredRates when rates change
  useEffect(() => {
    setFilteredRates(rates);
  }, [rates]);

  // Helper function to transform database ServiceRate to UI ServiceRate
  const transformDbRateToUI = (dbRate: ServiceRate): UIServiceRate => ({
    id: dbRate.id,
    serviceName: dbRate.service_name,
    serviceCode: dbRate.service_code,
    rateType: dbRate.rate_type as any,
    amount: dbRate.amount,
    effectiveFrom: dbRate.effective_from,
    effectiveTo: dbRate.effective_to,
    description: dbRate.description,
    applicableDays: dbRate.applicable_days,
    clientType: dbRate.client_type as any,
    fundingSource: dbRate.funding_source as any,
    status: dbRate.status as any,
    lastUpdated: dbRate.updated_at,
    createdBy: dbRate.created_by,
    isDefault: dbRate.is_default
  });

  // Helper function to transform database RateFilter to UI RateFilter
  const transformDbFilterToUI = (dbFilter: RateFilter): UIRateFilter => ({
    serviceNames: dbFilter.serviceNames,
    rateTypes: dbFilter.rateTypes as any,
    clientTypes: dbFilter.clientTypes as any,
    fundingSources: dbFilter.fundingSources as any,
    statuses: dbFilter.statuses as any,
    dateRange: dbFilter.dateRange,
    minAmount: dbFilter.minAmount,
    maxAmount: dbFilter.maxAmount
  });

  const handleAddRate = async (rateData: Partial<ServiceRate>) => {
    if (!branchId) {
      toast.error('No branch selected');
      return;
    }

    if (!currentUser?.id) {
      toast.error('User authentication required');
      return;
    }

    // Determine the creator staff ID
    let creatorStaffId: string;
    
    if (currentUser.staffId) {
      // Current user is a carer with a staff record
      creatorStaffId = currentUser.staffId;
    } else if (staffList.length > 0) {
      // Use the first staff member in the branch
      creatorStaffId = staffList[0].id;
    } else {
      toast.error('No staff members found in this branch. Please add at least one staff member before creating rates.');
      return;
    }

    try {
      // Clean the payload - remove auto-generated fields
      const cleanRateData = {
        ...rateData,
        branch_id: branchId,
        created_by: creatorStaffId,
        // Normalize effective_to: pass null instead of empty string
        effective_to: rateData.effective_to || null,
      };

      // Remove fields that should be auto-generated by the database
      delete cleanRateData.id;
      delete cleanRateData.created_at;
      delete cleanRateData.updated_at;

      await createServiceRate.mutateAsync(cleanRateData as Omit<ServiceRate, 'id' | 'created_at' | 'updated_at'>);
      
      setIsAddRateDialogOpen(false);
      toast.success('Service rate created successfully');
    } catch (error) {
      console.error('Error creating service rate:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create service rate';
      toast.error(errorMessage);
    }
  };

  const handleUpdateRate = (rateId: string, rateData: any) => {
    // TODO: Implement update mutation
    toast.success("Rate updated successfully", {
      description: `${rateData.service_name} - ${formatCurrency(rateData.amount)}`,
    });
  };

  const handleDeleteRate = (rateId: string) => {
    setRateToDelete(rateId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRate = async () => {
    if (rateToDelete && branchId) {
      try {
        await deleteServiceRate.mutateAsync(rateToDelete);
        
        // Remove the item from local state immediately for better UX
        setFilteredRates(prev => prev.filter(r => r.id !== rateToDelete));
        
        setRateToDelete(null);
        setIsDeleteDialogOpen(false);
      } catch (error) {
        console.error('Error deleting service rate:', error);
        // Error toast is handled by the hook
      }
    }
  };

  const handleViewRate = (rate: ServiceRate) => {
    setSelectedRate(transformDbRateToUI(rate));
    setIsViewRateDialogOpen(true);
  };

  const handleEditRate = (rate: ServiceRate) => {
    setSelectedRate(transformDbRateToUI(rate));
    setIsEditRateDialogOpen(true);
  };

  const applyFilter = (filter: UIRateFilter | undefined, ratesList = rates) => {
    if (!filter || Object.keys(filter).length === 0) {
      setFilteredRates(ratesList);
      setActiveFilter(undefined);
      return;
    }
    
    // Convert UI filter to database filter format
    const dbFilter: RateFilter = {
      serviceNames: filter.serviceNames,
      rateTypes: filter.rateTypes as string[],
      clientTypes: filter.clientTypes as string[],
      fundingSources: filter.fundingSources as string[],
      statuses: filter.statuses as string[],
      dateRange: filter.dateRange,
      minAmount: filter.minAmount,
      maxAmount: filter.maxAmount
    };
    
    let result = [...ratesList];
    
    // Filter by service name
    if (dbFilter.serviceNames && dbFilter.serviceNames.length) {
      const searchTerm = dbFilter.serviceNames[0].toLowerCase();
      result = result.filter(rate => 
        rate.service_name.toLowerCase().includes(searchTerm) || 
        rate.service_code.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by rate type
    if (dbFilter.rateTypes && dbFilter.rateTypes.length) {
      result = result.filter(rate => dbFilter.rateTypes?.includes(rate.rate_type));
    }
    
    // Filter by client type
    if (dbFilter.clientTypes && dbFilter.clientTypes.length) {
      result = result.filter(rate => dbFilter.clientTypes?.includes(rate.client_type));
    }
    
    // Filter by funding source
    if (dbFilter.fundingSources && dbFilter.fundingSources.length) {
      result = result.filter(rate => dbFilter.fundingSources?.includes(rate.funding_source));
    }
    
    // Filter by status
    if (dbFilter.statuses && dbFilter.statuses.length) {
      result = result.filter(rate => dbFilter.statuses?.includes(rate.status));
    }
    
    // Filter by date range
    if (dbFilter.dateRange) {
      if (dbFilter.dateRange.from) {
        result = result.filter(rate => {
          const effectiveFrom = new Date(rate.effective_from);
          return effectiveFrom >= dbFilter.dateRange!.from!;
        });
      }
      
      if (dbFilter.dateRange.to) {
        result = result.filter(rate => {
          if (!rate.effective_to) return true;
          const effectiveTo = new Date(rate.effective_to);
          return effectiveTo <= dbFilter.dateRange!.to!;
        });
      }
    }
    
    // Filter by amount range
    if (dbFilter.minAmount !== undefined) {
      result = result.filter(rate => rate.amount >= dbFilter.minAmount!);
    }
    
    if (dbFilter.maxAmount !== undefined) {
      result = result.filter(rate => rate.amount <= dbFilter.maxAmount!);
    }
    
    setFilteredRates(result);
    setActiveFilter(dbFilter);
    
    toast.success("Filters applied", {
      description: `Showing ${result.length} of ${ratesList.length} rates`,
    });
  };

  const clearFilters = () => {
    setActiveFilter(undefined);
    setFilteredRates(rates);
  };

  const exportRates = (format: 'csv' | 'pdf') => {
    toast.success(`Exporting rates as ${format.toUpperCase()}`, {
      description: `${filteredRates.length} rates will be exported`,
    });
    
    console.log(`Exporting ${filteredRates.length} rates in ${format} format`);
  };

  // Calculate summary stats
  const activeRatesCount = filteredRates.filter(r => r.status === 'active').length;
  const pendingRatesCount = filteredRates.filter(r => r.status === 'pending').length;
  const expiredRatesCount = filteredRates.filter(r => r.status === 'expired').length;
  
  const averageHourlyRate = filteredRates
    .filter(r => r.rate_type === 'hourly' && r.status === 'active')
    .reduce((sum, rate) => sum + rate.amount, 0) / 
    (filteredRates.filter(r => r.rate_type === 'hourly' && r.status === 'active').length || 1);

  // Transform database ServiceRate to UI ServiceRate format for the table
  const transformedRates = filteredRates.map(rate => ({
    id: rate.id,
    serviceName: rate.service_name,
    serviceCode: rate.service_code,
    rateType: rate.rate_type as any,
    amount: rate.amount,
    effectiveFrom: rate.effective_from,
    effectiveTo: rate.effective_to,
    description: rate.description,
    applicableDays: rate.applicable_days,
    clientType: rate.client_type as any,
    fundingSource: rate.funding_source as any,
    status: rate.status as any,
    lastUpdated: rate.updated_at,
    createdBy: rate.created_by,
    isDefault: rate.is_default
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading service rates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading service rates. Please try again.</p>
        <Button onClick={() => refetch()} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Rate Management</h2>
          <p className="text-gray-500 mt-1">Configure and manage service rates for {branchName}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600"
            onClick={() => setIsFilterDialogOpen(true)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
            {activeFilter && Object.keys(activeFilter).length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                {Object.keys(activeFilter).length}
              </span>
            )}
          </Button>
          
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 px-2"
              onClick={() => exportRates('csv')}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="sr-only">Export CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 px-2"
              onClick={() => exportRates('pdf')}
            >
              <FileText className="h-4 w-4" />
              <span className="sr-only">Export PDF</span>
            </Button>
          </div>
          
          <Button
            onClick={() => setIsAddRateDialogOpen(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={staffList.length === 0}
            title={staffList.length === 0 ? "Add at least one staff member to create rates" : ""}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Rate
          </Button>
        </div>
      </div>
      
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className={cn("flex items-center p-4")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 mr-3">
              <Check className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Rates</p>
              <h3 className="text-2xl font-bold mt-1">{activeRatesCount}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className={cn("flex items-center p-4")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 mr-3">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Rates</p>
              <h3 className="text-2xl font-bold mt-1">{pendingRatesCount}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className={cn("flex items-center p-4")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 mr-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Expired Rates</p>
              <h3 className="text-2xl font-bold mt-1">{expiredRatesCount}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className={cn("flex items-center p-4")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 mr-3">
              <PoundSterling className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Hourly Rate</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(averageHourlyRate)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {activeFilter && Object.keys(activeFilter).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm text-blue-700">
              Filtered results: Showing {filteredRates.length} of {rates.length} rates
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 text-blue-700 hover:bg-blue-100"
            onClick={clearFilters}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Clear Filters
          </Button>
        </div>
      )}

      {filteredRates.length === 0 && !activeFilter ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Percent className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Service Rates Yet</h3>
          <p className="text-gray-500">Start by adding service rates for {branchName}.</p>
          <Button 
            variant="default" 
            className="mt-4 bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsAddRateDialogOpen(true)}
            disabled={staffList.length === 0}
            title={staffList.length === 0 ? "Add at least one staff member to create rates" : ""}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Rate
          </Button>
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm">
          <RatesTable
            rates={transformedRates}
            onViewRate={(uiRate) => {
              // Find the original database rate using the ID
              const dbRate = rates.find(r => r.id === uiRate.id);
              if (dbRate) handleViewRate(dbRate);
            }}
            onEditRate={(uiRate) => {
              // Find the original database rate using the ID
              const dbRate = rates.find(r => r.id === uiRate.id);
              if (dbRate) handleEditRate(dbRate);
            }}
            onDeleteRate={handleDeleteRate}
          />
        </div>
      )}
      
      {/* Dialogs */}
      <NewAddRateDialog
        open={isAddRateDialogOpen}
        onClose={() => setIsAddRateDialogOpen(false)}
        onSave={handleAddRate}
      />
      
      <EditRateDialog
        open={isEditRateDialogOpen}
        onClose={() => setIsEditRateDialogOpen(false)}
        onUpdateRate={handleUpdateRate}
        rate={selectedRate}
      />
      
      <ViewRateDialog
        open={isViewRateDialogOpen}
        onClose={() => setIsViewRateDialogOpen(false)}
        onEdit={(rate) => {
          setSelectedRate(rate);
          setIsViewRateDialogOpen(false);
          setIsEditRateDialogOpen(true);
        }}
        rate={selectedRate}
      />
      
      <FilterRateDialog
        open={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        onApplyFilters={applyFilter}
        initialFilters={activeFilter ? transformDbFilterToUI(activeFilter) : {}}
        serviceNames={[...new Set(rates.map(rate => rate.service_name))]}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the rate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRateToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRate} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RateManagementTab;
