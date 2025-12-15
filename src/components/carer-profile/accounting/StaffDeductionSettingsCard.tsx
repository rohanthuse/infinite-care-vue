import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Edit, 
  Receipt, 
  Check, 
  X,
  Percent,
  GraduationCap,
  PiggyBank,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { 
  useStaffDeductionSettings, 
  TAX_CODES, 
  NI_CATEGORIES,
  STUDENT_LOAN_PLANS
} from "@/hooks/useStaffDeductionSettings";
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

  const getTaxCodeDescription = (code: string) => {
    return TAX_CODES.find(t => t.code === code)?.description || code;
  };

  const getNICategoryDescription = (category: string) => {
    return NI_CATEGORIES.find(n => n.category === category)?.description || category;
  };

  const getStudentLoanPlanDescription = (plan?: string) => {
    if (!plan) return null;
    return STUDENT_LOAN_PLANS.find(p => p.plan === plan)?.description || plan;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
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
                <CardDescription>Tax, NI, pension and other deduction configurations</CardDescription>
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
            <div className="space-y-6">
              {/* Tax & NI Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tax Settings */}
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-sm">Tax Settings</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax Code</span>
                      <Badge variant="secondary">{settings.tax_code}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate</span>
                      <span className="font-medium">
                        {settings.use_custom_tax_rate ? (
                          <>{settings.tax_rate}% <span className="text-xs text-orange-600">(Custom)</span></>
                        ) : (
                          <>{settings.tax_rate}% <span className="text-xs text-green-600">(Standard)</span></>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      {getTaxCodeDescription(settings.tax_code)}
                    </p>
                  </div>
                </div>

                {/* NI Settings */}
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Percent className="h-4 w-4 text-purple-600" />
                    <h4 className="font-medium text-sm">National Insurance</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">NI Category</span>
                      <Badge variant="secondary">{settings.ni_category}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate</span>
                      <span className="font-medium">
                        {settings.use_custom_ni_rate ? (
                          <>{settings.ni_rate}% <span className="text-xs text-orange-600">(Custom)</span></>
                        ) : (
                          <>{settings.ni_rate}% <span className="text-xs text-green-600">(Standard)</span></>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      {getNICategoryDescription(settings.ni_category)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pension & Student Loan Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pension Settings */}
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <PiggyBank className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-sm">Pension</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Enrolled</span>
                      {settings.pension_opted_in ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          <Check className="h-3 w-3 mr-1" />
                          Opted In
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <X className="h-3 w-3 mr-1" />
                          Opted Out
                        </Badge>
                      )}
                    </div>
                    {settings.pension_opted_in && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Employee</span>
                          <span className="font-medium">{settings.pension_percentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Employer</span>
                          <span className="font-medium">{settings.employer_pension_percentage}%</span>
                        </div>
                        {settings.pension_provider && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Provider</span>
                            <span className="font-medium">{settings.pension_provider}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Student Loan Settings */}
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="h-4 w-4 text-amber-600" />
                    <h4 className="font-medium text-sm">Student Loan</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Has Loan</span>
                      {settings.has_student_loan ? (
                        <Badge variant="default" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                          <Check className="h-3 w-3 mr-1" />
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <X className="h-3 w-3 mr-1" />
                          No
                        </Badge>
                      )}
                    </div>
                    {settings.has_student_loan && settings.student_loan_plan && (
                      <div className="pt-1">
                        <p className="text-xs text-muted-foreground">
                          {getStudentLoanPlanDescription(settings.student_loan_plan)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Other Deductions */}
              {settings.other_deductions && settings.other_deductions.length > 0 && (
                <div className="p-4 rounded-lg border bg-muted/30">
                  <h4 className="font-medium text-sm mb-3">Other Deductions</h4>
                  <div className="space-y-2">
                    {settings.other_deductions.map((deduction, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{deduction.name}</span>
                        <span className="font-medium">
                          {deduction.type === 'fixed' 
                            ? formatCurrency(deduction.amount)
                            : `${deduction.amount}%`
                          }
                          <span className="text-xs text-muted-foreground ml-1">
                            ({deduction.type === 'fixed' ? 'Fixed' : 'Percentage'})
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Effective Date */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>Effective From: {format(new Date(settings.effective_from), 'dd/MM/yyyy')}</span>
                {settings.effective_until && (
                  <span>Until: {format(new Date(settings.effective_until), 'dd/MM/yyyy')}</span>
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
