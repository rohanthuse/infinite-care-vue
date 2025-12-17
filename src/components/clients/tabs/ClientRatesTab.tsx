import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Trash2, Calendar, Save, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { ViewRateDetailsDialog } from "@/components/clients/tabs/dialogs/ViewRateDetailsDialog";
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
import {
  useClientRateAssignments,
  useCreateClientRateAssignment,
  useDeleteClientRateAssignment,
  ClientRateAssignment,
} from "@/hooks/useClientRateAssignments";
import { useAuthorities } from "@/contexts/AuthoritiesContext";
import { useServiceRates } from "@/hooks/useAccountingData";

interface ClientRatesTabProps {
  clientId: string;
  branchId: string;
}

type RateOption = 'use_defined' | 'create_new' | 'change_percent' | '';

export const ClientRatesTab: React.FC<ClientRatesTabProps> = ({ clientId, branchId }) => {
  // State for "Set a New Rate" section
  const [rateOption, setRateOption] = useState<RateOption>('');
  const [selectedAuthority, setSelectedAuthority] = useState<string>('');
  const [selectedRate, setSelectedRate] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  
  // Dialog states
  const [showRateDetails, setShowRateDetails] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ClientRateAssignment | null>(null);

  // Data fetching
  const { authorities, isLoading: authoritiesLoading } = useAuthorities();
  const { data: allServiceRates = [], isLoading: ratesLoading } = useServiceRates(branchId);
  const { data: assignments = [], isLoading: assignmentsLoading } = useClientRateAssignments(clientId);
  
  // Mutations
  const createAssignment = useCreateClientRateAssignment();
  const deleteAssignment = useDeleteClientRateAssignment();

  // Filter rates by selected authority (using funding_source field)
  const filteredRates = useMemo(() => {
    if (!selectedAuthority || !allServiceRates) return [];
    return allServiceRates.filter(rate => 
      rate.funding_source === selectedAuthority || 
      rate.funding_source === 'local_authority' // Include general authority rates
    );
  }, [selectedAuthority, allServiceRates]);

  // Get the selected rate details - transform to match dialog interface
  const selectedRateDetails = useMemo(() => {
    if (!selectedRate) return null;
    const rate = allServiceRates.find(r => r.id === selectedRate) as any;
    if (!rate) return null;
    
    return {
      id: rate.id,
      service_name: rate.service_name,
      service_code: rate.service_code,
      rate_type: rate.rate_type,
      amount: rate.amount,
      currency: rate.currency || 'GBP',
      effective_from: rate.effective_from,
      effective_to: rate.effective_to || null,
      client_type: rate.client_type,
      funding_source: rate.funding_source,
      applicable_days: rate.applicable_days || [],
      is_default: rate.is_default,
      status: rate.status,
      description: rate.description || null,
      time_from: rate.time_from || null,
      time_until: rate.time_until || null,
      rate_category: rate.rate_category || null,
      pay_based_on: rate.pay_based_on || null,
      charge_type: rate.charge_type || null,
      rate_15_minutes: rate.rate_15_minutes ?? null,
      rate_30_minutes: rate.rate_30_minutes ?? null,
      rate_45_minutes: rate.rate_45_minutes ?? null,
      rate_60_minutes: rate.rate_60_minutes ?? null,
    };
  }, [selectedRate, allServiceRates]);

  // Get authority name for display
  const getAuthorityName = (authorityId: string | null) => {
    if (!authorityId) return 'N/A';
    const authority = authorities.find(a => a.id === authorityId);
    return authority?.organization || 'Unknown';
  };

  // Reset form
  const resetForm = () => {
    setRateOption('');
    setSelectedAuthority('');
    setSelectedRate('');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // Handle save rate assignment
  const handleSaveRateAssignment = async () => {
    if (!selectedRate || !startDate) {
      toast.error('Please select a rate and start date');
      return;
    }

    try {
      await createAssignment.mutateAsync({
        client_id: clientId,
        service_rate_id: selectedRate,
        authority_id: selectedAuthority || null,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      });
      resetForm();
    } catch (error) {
      console.error('[ClientRatesTab] Error creating assignment:', error);
    }
  };

  // Handle delete
  const handleDeleteAssignment = (assignment: ClientRateAssignment) => {
    setSelectedAssignment(assignment);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAssignment) return;
    
    try {
      await deleteAssignment.mutateAsync(selectedAssignment.id);
      setIsDeleteDialogOpen(false);
      setSelectedAssignment(null);
    } catch (error) {
      console.error('[ClientRatesTab] Error deleting assignment:', error);
    }
  };

  // View rate details from assignment
  const handleViewAssignmentRate = (assignment: ClientRateAssignment) => {
    if (assignment.service_rate) {
      setSelectedAssignment(assignment);
      setShowRateDetails(true);
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "Ongoing";
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  const isLoading = authoritiesLoading || ratesLoading || assignmentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Prepare rate details for dialog
  const getRateDetailsForDialog = () => {
    if (selectedAssignment?.service_rate) {
      return selectedAssignment.service_rate;
    }
    return selectedRateDetails;
  };

  return (
    <div className="space-y-6">
      {/* Set a New Rate Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Set a New Rate</CardTitle>
          <CardDescription>Assign a rate from Rate Management to this client</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Rate Option Dropdown */}
          <div className="space-y-2">
            <Label>Set a New Rate</Label>
            <Select value={rateOption} onValueChange={(value: RateOption) => {
              setRateOption(value);
              setSelectedAuthority('');
              setSelectedRate('');
              setStartDate(undefined);
              setEndDate(undefined);
            }}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="use_defined">Use a Defined Rate</SelectItem>
                <SelectItem value="create_new">Create a New Rate</SelectItem>
                <SelectItem value="change_percent">Change by %</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Fields for "Use a Defined Rate" */}
          {rateOption === 'use_defined' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              {/* Authority Dropdown */}
              <div className="space-y-2">
                <Label>Authority</Label>
                <Select 
                  value={selectedAuthority} 
                  onValueChange={(value) => {
                    setSelectedAuthority(value);
                    setSelectedRate(''); // Reset rate when authority changes
                  }}
                >
                  <SelectTrigger className="w-full md:w-[400px]">
                    <SelectValue placeholder="Select Authority" />
                  </SelectTrigger>
                  <SelectContent>
                    {authorities.map((auth) => (
                      <SelectItem key={auth.id} value={auth.id}>
                        {auth.organization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rate Dropdown - Enabled only when authority is selected */}
              <div className="space-y-2">
                <Label>Rate</Label>
                <div className="flex gap-2">
                  <Select 
                    value={selectedRate} 
                    onValueChange={setSelectedRate}
                    disabled={!selectedAuthority}
                  >
                    <SelectTrigger className="w-full md:w-[400px]">
                      <SelectValue placeholder={selectedAuthority ? "Select Rate" : "Select Authority first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredRates.length === 0 ? (
                        <SelectItem value="no-rates" disabled>
                          No rates available for this authority
                        </SelectItem>
                      ) : (
                        filteredRates.map((rate) => (
                          <SelectItem key={rate.id} value={rate.id}>
                            {rate.service_name} - {formatCurrency(rate.amount)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* View Button */}
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRateDetails(true)}
                    disabled={!selectedRate}
                    className="shrink-0"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date <span className="text-destructive">*</span></Label>
                  <EnhancedDatePicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Select start date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <EnhancedDatePicker
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="Select end date (optional)"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={handleSaveRateAssignment}
                  disabled={!selectedRate || !startDate || createAssignment.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createAssignment.isPending ? 'Saving...' : 'Save Rate Assignment'}
                </Button>
              </div>
            </div>
          )}

          {/* Placeholder for other options */}
          {rateOption === 'create_new' && (
            <div className="p-4 border rounded-lg bg-muted/30 text-center text-muted-foreground">
              Create New Rate functionality coming soon
            </div>
          )}

          {rateOption === 'change_percent' && (
            <div className="p-4 border rounded-lg bg-muted/30 text-center text-muted-foreground">
              Change by % functionality coming soon
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Assigned Rates</CardTitle>
          <CardDescription>Rates currently assigned to this client</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No Rates Assigned</h3>
              <p className="text-muted-foreground">Use the section above to assign rates to this client.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Authority</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Effective Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.service_rate?.service_name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.service_rate?.service_code || ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {assignment.authority?.organization_name || getAuthorityName(assignment.authority_id)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {assignment.service_rate ? formatCurrency(assignment.service_rate.amount) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatDate(assignment.start_date)} - {formatDate(assignment.end_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={assignment.is_active 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                        }
                      >
                        {assignment.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAssignmentRate(assignment)}
                          className="h-8 w-8 p-0"
                          disabled={!assignment.service_rate}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAssignment(assignment)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Rate Details Dialog */}
      <ViewRateDetailsDialog
        open={showRateDetails}
        onOpenChange={setShowRateDetails}
        rate={getRateDetailsForDialog()}
        authorityName={selectedAssignment?.authority?.organization_name || getAuthorityName(selectedAuthority)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Rate Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this rate assignment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              type="button" 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
