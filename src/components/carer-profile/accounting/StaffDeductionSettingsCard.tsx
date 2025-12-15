import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Receipt } from "lucide-react";
import { format } from "date-fns";
import { useStaffDeductionSettings } from "@/hooks/useStaffDeductionSettings";
import { EditStaffDeductionSettingsDialog } from "./EditStaffDeductionSettingsDialog";

interface StaffDeductionSettingsCardProps {
  staffId: string;
  branchId?: string;
  organizationId?: string;
}

export const StaffDeductionSettingsCard: React.FC<StaffDeductionSettingsCardProps> = ({
  staffId,
  branchId,
  organizationId
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { data: settings, isLoading } = useStaffDeductionSettings(staffId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const totalDeductions = (settings?.tax_amount || 0) + 
    (settings?.ni_amount || 0) + 
    (settings?.pension_amount || 0) + 
    (settings?.other_deductions_amount || 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
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
                <CardDescription>Fixed monthly deduction amounts</CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              {settings ? 'Edit' : 'Set Up'}
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
                Set Up Deductions
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Deductions Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Tax</p>
                  <p className="text-lg font-semibold">{formatCurrency(settings.tax_amount || 0)}</p>
                </div>
                
                <div className="p-4 rounded-lg border bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">National Insurance</p>
                  <p className="text-lg font-semibold">{formatCurrency(settings.ni_amount || 0)}</p>
                </div>
                
                <div className="p-4 rounded-lg border bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Pension</p>
                  <p className="text-lg font-semibold">{formatCurrency(settings.pension_amount || 0)}</p>
                </div>
                
                <div className="p-4 rounded-lg border bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Other Deductions</p>
                  <p className="text-lg font-semibold">{formatCurrency(settings.other_deductions_amount || 0)}</p>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-sm font-medium">Total Monthly Deductions</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(totalDeductions)}</span>
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

      <EditStaffDeductionSettingsDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        staffId={staffId}
        branchId={branchId}
        organizationId={organizationId}
        existingSettings={settings || undefined}
      />
    </>
  );
};
