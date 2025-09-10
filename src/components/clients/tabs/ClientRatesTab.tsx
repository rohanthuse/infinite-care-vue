import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Edit, Trash2, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ServiceRate as AccountingServiceRate, useServiceRates, useCreateServiceRate, useDeleteServiceRate, useUpdateServiceRate } from "@/hooks/useAccountingData";
import { toast } from "sonner";
import AddRateDialog from "@/components/accounting/AddRateDialog";
import EditRateDialog from "@/components/accounting/EditRateDialog";
import ViewRateDialog from "@/components/accounting/ViewRateDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";

interface ClientRatesTabProps {
  clientId: string;
  branchId: string;
}

export const ClientRatesTab: React.FC<ClientRatesTabProps> = ({ clientId, branchId }) => {
  const [isAddRateDialogOpen, setIsAddRateDialogOpen] = useState(false);
  const [isEditRateDialogOpen, setIsEditRateDialogOpen] = useState(false);
  const [isViewRateDialogOpen, setIsViewRateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<AccountingServiceRate | null>(null);

  const { data: rates = [], isLoading } = useServiceRates(branchId);
  const createServiceRate = useCreateServiceRate();
  const deleteServiceRate = useDeleteServiceRate();
  const updateServiceRate = useUpdateServiceRate();

  const handleAddRate = async (rateData: any) => {
    try {
      // Map from dialog format to AccountingServiceRate format
      const newRateData: Partial<AccountingServiceRate> = {
        branch_id: branchId,
        service_name: rateData.service_name || rateData.serviceName,
        service_code: rateData.service_code || rateData.serviceCode,
        rate_type: rateData.rate_type || rateData.rateType,
        amount: rateData.amount,
        currency: 'GBP',
        effective_from: rateData.effective_from || rateData.effectiveFrom,
        effective_to: rateData.effective_to || rateData.effectiveTo,
        client_type: rateData.client_type || rateData.clientType,
        funding_source: rateData.funding_source || rateData.fundingSource,
        applicable_days: rateData.applicable_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        is_default: rateData.is_default || rateData.isDefault || false,
        status: rateData.status || 'active',
        description: rateData.description,
        created_by: 'current-user-id' // This should come from auth context
      };

      await createServiceRate.mutateAsync(newRateData as Omit<AccountingServiceRate, 'id' | 'created_at' | 'updated_at'>);
      setIsAddRateDialogOpen(false);
      toast.success('Service rate created successfully');
    } catch (error) {
      console.error('Error creating service rate:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create service rate';
      toast.error(errorMessage);
    }
  };

  const handleViewRate = (rate: AccountingServiceRate) => {
    setSelectedRate(rate);
    setIsViewRateDialogOpen(true);
  };

  const handleEditRate = (rate: AccountingServiceRate) => {
    setSelectedRate(rate);
    setIsEditRateDialogOpen(true);
  };

  const handleDeleteRate = (rate: AccountingServiceRate) => {
    setSelectedRate(rate);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRate) return;
    
    try {
      await deleteServiceRate.mutateAsync(selectedRate.id);
      toast.success('Service rate deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedRate(null);
    } catch (error) {
      console.error('Error deleting service rate:', error);
      toast.error('Failed to delete service rate');
    }
  };

  const handleUpdateRate = async (rateId: string, rateData: any) => {
    try {
      await updateServiceRate.mutateAsync({ rateId, updates: rateData });
      toast.success('Service rate updated successfully');
      setIsEditRateDialogOpen(false);
    } catch (error) {
      console.error('Error updating service rate:', error);
      toast.error('Failed to update service rate');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      case 'discontinued':
        return <Badge className="bg-gray-100 text-gray-800">Discontinued</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Ongoing";
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Service Rates</CardTitle>
            <CardDescription>Manage service rates for this client</CardDescription>
          </div>
          <Button onClick={() => setIsAddRateDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Rate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rates.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No Service Rates</h3>
            <p className="text-muted-foreground">Start by adding a service rate for this client.</p>
            <Button 
              onClick={() => setIsAddRateDialogOpen(true)} 
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Rate
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Effective Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{rate.service_name}</p>
                      <p className="text-sm text-muted-foreground">{rate.service_code}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {rate.rate_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(rate.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {formatDate(rate.effective_from)} - {formatDate(rate.effective_to)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(rate.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewRate(rate)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRate(rate)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRate(rate)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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

      {/* Dialogs */}
      <AddRateDialog
        open={isAddRateDialogOpen}
        onClose={() => setIsAddRateDialogOpen(false)}
        onAddRate={handleAddRate}
        branchId={branchId}
      />

      <EditRateDialog
        open={isEditRateDialogOpen}
        onClose={() => setIsEditRateDialogOpen(false)}
        onUpdateRate={handleUpdateRate}
        rate={selectedRate as any}
      />

      <ViewRateDialog
        open={isViewRateDialogOpen}
        onClose={() => setIsViewRateDialogOpen(false)}
        onEdit={handleEditRate}
        rate={selectedRate as any}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Rate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service rate? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};