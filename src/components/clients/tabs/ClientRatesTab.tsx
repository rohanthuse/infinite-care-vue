import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Trash2, Calendar, Save, DollarSign, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { ViewRateDetailsDialog } from "@/components/clients/tabs/dialogs/ViewRateDetailsDialog";
import { RateBlockForm, RateBlock, createNewRateBlock, dayOptions } from "@/components/accounting/RateBlockForm";
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
import { useServiceRates, useCreateServiceRate } from "@/hooks/useAccountingData";
import { useServices } from "@/data/hooks/useServices";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { supabase } from "@/integrations/supabase/client";

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
  
  // State for "Create a New Rate"
  const [createRateAuthority, setCreateRateAuthority] = useState<string>('');
  const [createRateStartDate, setCreateRateStartDate] = useState<Date | undefined>();
  const [createRateEndDate, setCreateRateEndDate] = useState<Date | undefined>();
  const [rateBlocks, setRateBlocks] = useState<RateBlock[]>([]);
  const [isSavingNewRate, setIsSavingNewRate] = useState(false);
  
  // Dialog states
  const [showRateDetails, setShowRateDetails] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ClientRateAssignment | null>(null);

  // Data fetching
  const { authorities, isLoading: authoritiesLoading } = useAuthorities();
  const { data: allServiceRates = [], isLoading: ratesLoading } = useServiceRates(branchId);
  const { data: assignments = [], isLoading: assignmentsLoading } = useClientRateAssignments(clientId);
  const { data: userOrg } = useUserOrganization();
  const organizationId = userOrg?.id;
  const { data: services = [], isLoading: servicesLoading } = useServices(organizationId || undefined);
  
  // Mutations
  const createAssignment = useCreateClientRateAssignment();
  const deleteAssignment = useDeleteClientRateAssignment();
  const createServiceRate = useCreateServiceRate();

  // Transform services for MultiSelect
  const servicesOptions = useMemo(() => {
    return services.map(service => ({
      label: service.title,
      value: service.id
    }));
  }, [services]);

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

  // Reset create new rate form
  const resetCreateNewRateForm = () => {
    setCreateRateAuthority('');
    setCreateRateStartDate(undefined);
    setCreateRateEndDate(undefined);
    setRateBlocks([]);
  };

  // Handle save rate assignment (Use a Defined Rate)
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

  // Rate block handlers
  const handleAddRateBlock = () => {
    setRateBlocks((prev) => [...prev, createNewRateBlock()]);
  };

  const handleRemoveRateBlock = (id: string) => {
    setRateBlocks((prev) => prev.filter((block) => block.id !== id));
  };

  const handleRateBlockChange = (id: string, field: keyof RateBlock, value: any) => {
    setRateBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, [field]: value } : block
      )
    );
  };

  const handleDayToggle = (blockId: string, dayId: string) => {
    setRateBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        const currentDays = block.applicableDays;
        const newDays = currentDays.includes(dayId)
          ? currentDays.filter((d) => d !== dayId)
          : [...currentDays, dayId];
        return { ...block, applicableDays: newDays };
      })
    );
  };

  const handleSelectAllDays = (blockId: string) => {
    setRateBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? { ...block, applicableDays: dayOptions.map((d) => d.id) }
          : block
      )
    );
  };

  const handleClearAllDays = (blockId: string) => {
    setRateBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, applicableDays: [] } : block
      )
    );
  };

  // Helper function to map UI values to database charge_type
  const mapToChargeType = (chargeBasedOn: string, rateChargingMethod: string, rateCalculationType: string): string => {
    if (chargeBasedOn === 'services') {
      switch (rateChargingMethod) {
        case 'flat': return 'flat_rate';
        case 'pro': return 'pro_rata';
        case 'hourly': return 'hourly_rate';
        default: return 'flat_rate';
      }
    } else if (chargeBasedOn === 'fix_flat_rate') {
      return 'flat_rate';
    } else if (chargeBasedOn === 'hours_minutes') {
      switch (rateCalculationType) {
        case 'rate_per_hour': return 'rate_per_hour';
        case 'rate_per_minutes_pro': return 'rate_per_minutes_pro_rata';
        case 'rate_per_minutes_flat': return 'rate_per_minutes_flat_rate';
        default: return 'rate_per_hour';
      }
    }
    return 'flat_rate';
  };

  // Helper function to map UI values to database pay_based_on
  const mapToPayBasedOn = (chargeBasedOn: string): string => {
    switch (chargeBasedOn) {
      case 'services': return 'service';
      case 'fix_flat_rate': return 'fixed';
      case 'hours_minutes': return 'hours_minutes';
      default: return 'service';
    }
  };

  // Handle save new rate (Create a New Rate)
  const handleSaveNewRate = async () => {
    // Validation
    if (!createRateAuthority) {
      toast.error('Please select an authority');
      return;
    }
    if (!createRateStartDate) {
      toast.error('Please select a start date');
      return;
    }
    if (rateBlocks.length === 0) {
      toast.error('Please add at least one rate block');
      return;
    }

    const rateBlock = rateBlocks[0]; // Primary rate block

    // Validate rate block
    if (!rateBlock.chargeBasedOn) {
      toast.error('Please select a "Charge Based On" option');
      return;
    }

    // Determine amount from rate block
    let amount = 0;
    if (rateBlock.rateChargingMethod === "flat" || rateBlock.rateChargingMethod === "hourly") {
      if (!rateBlock.rate) {
        toast.error('Please enter a rate amount');
        return;
      }
      amount = parseFloat(rateBlock.rate) || 0;
    } else if (rateBlock.chargeBasedOn === "hours_minutes") {
      // Hours/Minutes - validate based on rate calculation type
      if (rateBlock.rateCalculationType === "rate_per_hour") {
        // Rate per Hour - validate single rate field
        if (!rateBlock.rate) {
          toast.error('Please enter a rate amount');
          return;
        }
        amount = parseFloat(rateBlock.rate) || 0;
      } else if (rateBlock.rateCalculationType === "rate_per_minutes_pro" || 
                 rateBlock.rateCalculationType === "rate_per_minutes_flat") {
        // Rate per Minutes - validate minute-based fields
        if (!rateBlock.rateAt30Minutes || !rateBlock.rateAt45Minutes || !rateBlock.rateAt60Minutes) {
          toast.error('Please enter required rate amounts (30, 45, 60 minutes)');
          return;
        }
        amount = parseFloat(rateBlock.rateAt60Minutes) || 0;
      }
    } else if (rateBlock.rateChargingMethod === "pro") {
      // Pro Rate (under Services) now uses single rate field
      if (!rateBlock.rate) {
        toast.error('Please enter a rate amount');
        return;
      }
      amount = parseFloat(rateBlock.rate) || 0;
    }

    setIsSavingNewRate(true);

    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create a rate');
        setIsSavingNewRate(false);
        return;
      }
      // Get service name from selected services
      let serviceName = "Client Rate";
      let serviceCode = "client_rate";
      let serviceId: string | undefined;

      if (rateBlock.services?.length > 0) {
        const selectedService = services.find(s => s.id === rateBlock.services[0]);
        if (selectedService) {
          serviceName = selectedService.title;
          serviceCode = selectedService.code || serviceCode;
          serviceId = selectedService.id;
        }
      }

      // Get authority name for caption
      const authorityData = authorities.find(a => a.id === createRateAuthority);
      const authorityName = authorityData?.organization || 'Authority';

      // Build rate data for database
      const dbRateData = {
        service_name: serviceName,
        service_code: serviceCode,
        service_id: serviceId,
        rate_type: rateBlock.rateChargingMethod || rateBlock.rateType || "hourly",
        amount: amount,
        currency: "GBP",
        effective_from: format(createRateStartDate, 'yyyy-MM-dd'),
        effective_to: createRateEndDate ? format(createRateEndDate, 'yyyy-MM-dd') : null,
        client_type: rateBlock.rateType || "standard",
        funding_source: createRateAuthority,
        applicable_days: rateBlock.applicableDays || [],
        is_default: false,
        status: "active",
        description: `Rate for ${serviceName} - ${authorityName}`,
        rate_15_minutes: rateBlock.rateAt15Minutes ? parseFloat(rateBlock.rateAt15Minutes) : null,
        rate_30_minutes: rateBlock.rateAt30Minutes ? parseFloat(rateBlock.rateAt30Minutes) : null,
        rate_45_minutes: rateBlock.rateAt45Minutes ? parseFloat(rateBlock.rateAt45Minutes) : null,
        rate_60_minutes: rateBlock.rateAt60Minutes ? parseFloat(rateBlock.rateAt60Minutes) : null,
        consecutive_hours: rateBlock.consecutiveHours ? parseFloat(rateBlock.consecutiveHours) : null,
        service_type: rateBlock.isVatable ? 'vatable' : 'standard',
        charge_type: mapToChargeType(
          rateBlock.chargeBasedOn || 'services',
          rateBlock.rateChargingMethod || 'flat',
          rateBlock.rateCalculationType || 'rate_per_hour'
        ),
        pay_based_on: mapToPayBasedOn(rateBlock.chargeBasedOn || 'services'),
        time_from: rateBlock.effectiveFrom || null,
        time_until: rateBlock.effectiveUntil || null,
        branch_id: branchId,
        organization_id: organizationId,
        created_by: user.id,
      };

      // Create the service rate
      const newRate = await createServiceRate.mutateAsync(dbRateData);

      // Create the client rate assignment
      await createAssignment.mutateAsync({
        client_id: clientId,
        service_rate_id: newRate.id,
        authority_id: createRateAuthority,
        start_date: format(createRateStartDate, 'yyyy-MM-dd'),
        end_date: createRateEndDate ? format(createRateEndDate, 'yyyy-MM-dd') : null,
      });

      toast.success('Rate created and assigned successfully');
      resetCreateNewRateForm();
      setRateOption('');
    } catch (error) {
      console.error('[ClientRatesTab] Error creating new rate:', error);
      toast.error('Failed to create rate. Please try again.');
    } finally {
      setIsSavingNewRate(false);
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
              resetCreateNewRateForm();
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

          {/* Create a New Rate Section */}
          {rateOption === 'create_new' && (
            <div className="space-y-6 p-4 border rounded-lg bg-muted/30">
              {/* Authority Dropdown */}
              <div className="space-y-2">
                <Label>Authorities <span className="text-destructive">*</span></Label>
                <Select 
                  value={createRateAuthority} 
                  onValueChange={setCreateRateAuthority}
                  disabled={authoritiesLoading}
                >
                  <SelectTrigger className="w-full md:w-[400px]">
                    <SelectValue placeholder={authoritiesLoading ? "Loading authorities..." : "Select Authority"} />
                  </SelectTrigger>
                  <SelectContent>
                    {authoritiesLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading authorities...
                      </SelectItem>
                    ) : authorities.length > 0 ? (
                      authorities.map((auth) => (
                        <SelectItem key={auth.id} value={auth.id}>
                          {auth.organization}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-authorities" disabled>
                        No authorities available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {!authoritiesLoading && authorities.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Add authorities in Workflow Management → Authorities tab
                  </p>
                )}
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date <span className="text-destructive">*</span></Label>
                  <EnhancedDatePicker
                    value={createRateStartDate}
                    onChange={setCreateRateStartDate}
                    placeholder="Select start date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <EnhancedDatePicker
                    value={createRateEndDate}
                    onChange={setCreateRateEndDate}
                    placeholder="Select end date (optional)"
                  />
                </div>
              </div>

              {/* Rates Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-semibold text-foreground">Rates</h3>
                  <Button variant="outline" size="sm" onClick={handleAddRateBlock}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rate
                  </Button>
                </div>

                {rateBlocks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Click "Add Rate" to add rate configuration
                  </p>
                )}

                {/* Rate Blocks */}
                {rateBlocks.map((block, index) => (
                  <RateBlockForm
                    key={block.id}
                    block={block}
                    index={index}
                    isViewMode={false}
                    servicesOptions={servicesOptions}
                    servicesLoading={servicesLoading}
                    onBlockChange={handleRateBlockChange}
                    onDayToggle={handleDayToggle}
                    onSelectAllDays={handleSelectAllDays}
                    onClearAllDays={handleClearAllDays}
                    onRemoveBlock={handleRemoveRateBlock}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    resetCreateNewRateForm();
                    setRateOption('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveNewRate}
                  disabled={!createRateAuthority || !createRateStartDate || rateBlocks.length === 0 || isSavingNewRate}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingNewRate ? 'Saving...' : 'Save New Rate'}
                </Button>
              </div>
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
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
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

export default ClientRatesTab;
