import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Edit, Receipt, Eye, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useStaffDeductionSettings, useToggleDeductionActive } from "@/hooks/useStaffDeductionSettings";
import { EditStaffDeductionSettingsDialog } from "./EditStaffDeductionSettingsDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StaffDeductionSettingsCardProps {
  staffId: string;
  branchId?: string;
  organizationId?: string;
}

interface DeductionRow {
  name: string;
  type: string;
  amount: number;
  activeField: 'tax_active' | 'ni_active' | 'pension_active' | 'other_deductions_active';
  isActive: boolean;
}

export const StaffDeductionSettingsCard: React.FC<StaffDeductionSettingsCardProps> = ({
  staffId,
  branchId,
  organizationId
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewingDeduction, setViewingDeduction] = useState<DeductionRow | null>(null);
  const [deletingDeduction, setDeletingDeduction] = useState<DeductionRow | null>(null);
  const { data: settings, isLoading } = useStaffDeductionSettings(staffId);
  const toggleDeduction = useToggleDeductionActive();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const deductionRows: DeductionRow[] = settings ? [
    {
      name: 'Tax',
      type: 'Fixed',
      amount: settings.tax_amount || 0,
      activeField: 'tax_active',
      isActive: settings.tax_active !== false
    },
    {
      name: 'National Insurance',
      type: 'Fixed',
      amount: settings.ni_amount || 0,
      activeField: 'ni_active',
      isActive: settings.ni_active !== false
    },
    {
      name: 'Pension',
      type: 'Fixed',
      amount: settings.pension_amount || 0,
      activeField: 'pension_active',
      isActive: settings.pension_active !== false
    },
    {
      name: 'Other Deductions',
      type: 'Fixed',
      amount: settings.other_deductions_amount || 0,
      activeField: 'other_deductions_active',
      isActive: settings.other_deductions_active !== false
    }
  ] : [];

  const totalActiveDeductions = deductionRows
    .filter(row => row.isActive)
    .reduce((sum, row) => sum + row.amount, 0);

  const handleToggle = (row: DeductionRow) => {
    if (!settings) return;
    toggleDeduction.mutate({
      id: settings.id,
      field: row.activeField,
      value: !row.isActive,
      staffId
    });
  };

  const handleDeleteDeduction = () => {
    // For now, deactivate the deduction (set amount to 0 would require edit dialog)
    if (deletingDeduction && settings) {
      toggleDeduction.mutate({
        id: settings.id,
        field: deletingDeduction.activeField,
        value: false,
        staffId
      });
    }
    setDeletingDeduction(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg font-semibold">Payroll Deduction Settings</CardTitle>
                <CardDescription>Manage fixed monthly deduction amounts</CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="flex items-center gap-2"
            >
              {settings ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {settings ? 'Edit' : 'Add'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!settings ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No Deduction Settings</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Set up payroll deduction settings for this staff member.
              </p>
              <Button onClick={() => setIsEditDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Set Up Deductions
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Deductions Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deduction Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deductionRows.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {row.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(row.amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={row.isActive}
                              onCheckedChange={() => handleToggle(row)}
                              disabled={toggleDeduction.isPending}
                            />
                            <Badge 
                              variant={row.isActive ? "default" : "secondary"}
                              className={row.isActive ? "bg-green-500/10 text-green-600 border-green-200" : ""}
                            >
                              {row.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setViewingDeduction(row)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setIsEditDialogOpen(true)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletingDeduction(row)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Total Active Deductions */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-sm font-medium">Total Active Deductions</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(totalActiveDeductions)}</span>
              </div>

              {/* Effective Date & Notes */}
              <div className="flex flex-col gap-2 text-xs text-muted-foreground pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span>Effective From: {format(new Date(settings.effective_from), 'dd/MM/yyyy')}</span>
                  {settings.effective_until && (
                    <span>Until: {format(new Date(settings.effective_until), 'dd/MM/yyyy')}</span>
                  )}
                </div>
                {settings.notes && (
                  <p className="italic">Notes: {settings.notes}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditStaffDeductionSettingsDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        staffId={staffId}
        branchId={branchId}
        organizationId={organizationId}
        existingSettings={settings || undefined}
      />

      {/* View Deduction Dialog */}
      <Dialog open={!!viewingDeduction} onOpenChange={() => setViewingDeduction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingDeduction?.name} Details</DialogTitle>
            <DialogDescription>View deduction information</DialogDescription>
          </DialogHeader>
          {viewingDeduction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Deduction Name</p>
                  <p className="font-medium">{viewingDeduction.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{viewingDeduction.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatCurrency(viewingDeduction.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={viewingDeduction.isActive ? "default" : "secondary"}>
                    {viewingDeduction.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="pt-4 border-t text-sm text-muted-foreground">
                <p>When this deduction is <strong>Active</strong>, it will be applied to payroll calculations.</p>
                <p className="mt-1">When <strong>Inactive</strong>, this deduction will not affect payroll.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingDeduction} onOpenChange={() => setDeletingDeduction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {deletingDeduction?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the {deletingDeduction?.name} deduction. It will no longer be applied to payroll calculations. You can reactivate it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDeduction}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
