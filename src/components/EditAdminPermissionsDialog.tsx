
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

const initialPermissions = {
  system: true,
  finance: true,
  under_review_care_plan: true,
  confirmed_care_plan: true,
  reviews: true,
  third_party: true,
  report_accounting: true,
  report_total_working_hours: true,
  report_staff: true,
  report_client: true,
  report_service: true,
  accounting_extra_time: true,
  accounting_expense: true,
  accounting_travel: true,
  accounting_invoices: true,
  accounting_gross_payslip: true,
  accounting_travel_management: true,
  accounting_client_rate: true,
  accounting_authority_rate: true,
  accounting_staff_rate: true,
  accounting_rate_management: true,
  accounting_staff_bank_detail: true,
};

type Permissions = typeof initialPermissions;

interface EditAdminPermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
  branchId: string;
  adminName: string;
}

export function EditAdminPermissionsDialog({ isOpen, onClose, adminId, branchId, adminName }: EditAdminPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<Permissions>(initialPermissions);
  const [originalPermissions, setOriginalPermissions] = useState<Permissions>(initialPermissions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingPermissions, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['adminPermissions', adminId, branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('*')
        .eq('admin_id', adminId)
        .eq('branch_id', branchId)
        .maybeSingle();

      if (error) {
        toast({ title: "Error", description: "Could not fetch permissions.", variant: "destructive" });
        throw error;
      }
      return data;
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (existingPermissions) {
      const loadedPermissions = { ...initialPermissions };
      for (const key in loadedPermissions) {
        if (Object.prototype.hasOwnProperty.call(existingPermissions, key)) {
          // @ts-ignore
          loadedPermissions[key as keyof Permissions] = existingPermissions[key];
        }
      }
      setPermissions(loadedPermissions);
      setOriginalPermissions(loadedPermissions);
    } else if (!isLoadingPermissions) {
      // If no permissions exist and we are not loading, set to default
      setPermissions(initialPermissions);
      setOriginalPermissions(initialPermissions);
    }
  }, [existingPermissions, isLoadingPermissions]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    return JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
  };

  const handlePermissionChange = (permission: keyof Permissions, value: boolean) => {
    setPermissions(prev => ({ ...prev, [permission]: value }));
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesAlert(true);
    } else {
      onClose();
    }
  };

  const handleForceClose = () => {
    setShowUnsavedChangesAlert(false);
    // Reset to original permissions
    setPermissions(originalPermissions);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('admin_permissions').upsert({
        admin_id: adminId,
        branch_id: branchId,
        ...permissions
      }, { onConflict: 'admin_id, branch_id' });

      if (error) throw error;

      toast({
        title: "Permissions Updated",
        description: `Permissions for ${adminName} have been successfully updated.`,
      });
      
      // Update original permissions to reflect saved state
      setOriginalPermissions(permissions);
      queryClient.invalidateQueries({ queryKey: ['adminPermissions', adminId, branchId] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderPermissionSwitch = (key: keyof Permissions, label: string) => (
    <div className="flex items-center justify-between">
      <Label htmlFor={key} className="text-gray-700">{label}</Label>
      <Switch 
        id={key} 
        checked={permissions[key]} 
        onCheckedChange={(value) => handlePermissionChange(key, value)} 
      />
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden rounded-xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl flex items-center font-semibold text-gray-800">
              <ShieldCheck className="h-5 w-5 mr-2 text-blue-600" />
              Edit Permissions
              {hasUnsavedChanges() && (
                <span className="ml-2 text-sm text-orange-600 font-normal flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Unsaved changes
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Editing permissions for <span className="font-medium text-gray-900">{adminName}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="px-6 pt-6 pb-24 max-h-[70vh] overflow-y-auto space-y-6">
              {isLoadingPermissions ? (
                <div className="flex justify-center items-center h-96">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading Permissions...</span>
                </div>
              ) : (
                <>
                  {/* Branch Settings Section */}
                  <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                    <h3 className="font-semibold text-gray-800 border-b pb-2">Branch Settings</h3>
                    <div className="space-y-4">
                      {renderPermissionSwitch('system', 'System')}
                      {renderPermissionSwitch('finance', 'Finance')}
                    </div>
                  </div>

                  {/* Care Plan Section */}
                  <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                    <h3 className="font-semibold text-gray-800 border-b pb-2">Care Plan</h3>
                    <div className="space-y-4">
                      {renderPermissionSwitch('under_review_care_plan', 'Under Review Care Plan')}
                      {renderPermissionSwitch('confirmed_care_plan', 'Confirmed Care Plan')}
                    </div>
                  </div>

                  {/* Reviews & Third Party Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                      <h3 className="font-semibold text-gray-800 border-b pb-2">Reviews</h3>
                      <div className="space-y-4">
                        {renderPermissionSwitch('reviews', 'Reviews')}
                      </div>
                    </div>
                    <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                      <h3 className="font-semibold text-gray-800 border-b pb-2">Third Party</h3>
                      <div className="space-y-4">
                        {renderPermissionSwitch('third_party', 'Third Party')}
                      </div>
                    </div>
                  </div>

                  {/* Branch Report Section */}
                  <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                    <h3 className="font-semibold text-gray-800 border-b pb-2">Branch Report</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      {renderPermissionSwitch('report_accounting', 'Accounting')}
                      {renderPermissionSwitch('report_total_working_hours', 'Total Working Hours')}
                      {renderPermissionSwitch('report_staff', 'Staff')}
                      {renderPermissionSwitch('report_client', 'Client')}
                      {renderPermissionSwitch('report_service', 'Service')}
                    </div>
                  </div>

                  {/* Accounting Section */}
                  <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                    <h3 className="font-semibold text-gray-800 border-b pb-2">Accounting</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      {renderPermissionSwitch('accounting_extra_time', 'Extra Time')}
                      {renderPermissionSwitch('accounting_expense', 'Expense')}
                      {renderPermissionSwitch('accounting_travel', 'Travel')}
                      {renderPermissionSwitch('accounting_invoices', 'Invoices')}
                      {renderPermissionSwitch('accounting_gross_payslip', 'Gross Payslip')}
                      {renderPermissionSwitch('accounting_travel_management', 'Travel Management')}
                      {renderPermissionSwitch('accounting_client_rate', 'Client Rate')}
                      {renderPermissionSwitch('accounting_authority_rate', 'Authority Rate')}
                      {renderPermissionSwitch('accounting_staff_rate', 'Staff Rate')}
                      {renderPermissionSwitch('accounting_rate_management', 'Rate Management')}
                      {renderPermissionSwitch('accounting_staff_bank_detail', "Staff's Bank Detail")}
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t bg-gray-50/80">
              <div className="flex justify-end gap-2 w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose} 
                  className="border-gray-200 rounded-md" 
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className={`font-medium rounded-md ${
                    hasUnsavedChanges() 
                      ? 'bg-orange-600 hover:bg-orange-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                  disabled={isSubmitting || isLoadingPermissions}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Changes
                      {hasUnsavedChanges() && <span className="ml-1">*</span>}
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Alert Dialog */}
      <AlertDialog open={showUnsavedChangesAlert} onOpenChange={setShowUnsavedChangesAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to the permissions for <strong>{adminName}</strong>. 
              If you close this dialog, your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedChangesAlert(false)}>
              Continue Editing
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleForceClose}
              className="bg-red-600 hover:bg-red-700"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
