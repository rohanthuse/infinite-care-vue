import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, AlertTriangle, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
const initialPermissions = {
  dashboard: true,
  bookings: true,
  clients: true,
  carers: true,
  reviews: true,
  communication: true,
  medication: true,
  finance: true,
  workflow: true,
  key_parameters: true,
  care_plan: true,
  under_review_care_plan: true,
  agreements: true,
  events_logs: true,
  attendance: true,
  form_builder: true,
  documents: true,
  notifications: true,
  library: true,
  third_party: true,
  reports: true,
  system: true
};
type Permissions = typeof initialPermissions;
interface AdminBranch {
  branch_id: string;
  branch_name: string;
}
interface EditAdminPermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
  branchId: string;
  branchName?: string;
  adminName: string;
  adminBranches?: AdminBranch[];
  onBranchSwitch?: (branchId: string, branchName: string) => void;
}
export function EditAdminPermissionsDialog({
  isOpen,
  onClose,
  adminId,
  branchId,
  branchName,
  adminName,
  adminBranches = [],
  onBranchSwitch
}: EditAdminPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<Permissions>(initialPermissions);
  const [originalPermissions, setOriginalPermissions] = useState<Permissions>(initialPermissions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);
  const [showBranchSwitchAlert, setShowBranchSwitchAlert] = useState(false);
  const [pendingSwitchBranch, setPendingSwitchBranch] = useState<{
    branchId: string;
    branchName: string;
  } | null>(null);
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();

  // Get current branch info
  const currentBranch = adminBranches.find(b => b.branch_id === branchId) || {
    branch_id: branchId,
    branch_name: branchName || 'Unknown Branch'
  };
  const isMultiBranch = adminBranches.length > 1;
  const {
    data: existingPermissions,
    isLoading: isLoadingPermissions
  } = useQuery({
    queryKey: ['adminPermissions', adminId, branchId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('admin_permissions').select('*').eq('admin_id', adminId).eq('branch_id', branchId).maybeSingle();
      if (error) {
        toast({
          title: "Error",
          description: "Could not fetch permissions.",
          variant: "destructive"
        });
        throw error;
      }
      return data;
    },
    enabled: isOpen
  });
  useEffect(() => {
    if (existingPermissions) {
      const loadedPermissions = {
        ...initialPermissions
      };
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
    setPermissions(prev => ({
      ...prev,
      [permission]: value
    }));
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
  const handleBranchSwitch = (targetBranchId: string, targetBranchName: string) => {
    if (hasUnsavedChanges()) {
      setPendingSwitchBranch({
        branchId: targetBranchId,
        branchName: targetBranchName
      });
      setShowBranchSwitchAlert(true);
    } else {
      switchToBranch(targetBranchId, targetBranchName);
    }
  };
  const switchToBranch = (targetBranchId: string, targetBranchName: string) => {
    if (onBranchSwitch) {
      onBranchSwitch(targetBranchId, targetBranchName);
    }
  };
  const handleConfirmBranchSwitch = () => {
    if (pendingSwitchBranch) {
      setShowBranchSwitchAlert(false);
      switchToBranch(pendingSwitchBranch.branchId, pendingSwitchBranch.branchName);
      setPendingSwitchBranch(null);
      // Reset permissions to avoid confusion
      setPermissions(initialPermissions);
      setOriginalPermissions(initialPermissions);
    }
  };
  const handleCancelBranchSwitch = () => {
    setShowBranchSwitchAlert(false);
    setPendingSwitchBranch(null);
  };
  const handleSubmit = async (e: React.FormEvent, shouldCloseDialog = true) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.from('admin_permissions').upsert({
        admin_id: adminId,
        branch_id: branchId,
        ...permissions
      }, {
        onConflict: 'admin_id, branch_id'
      });
      if (error) throw error;
      toast({
        title: "Permissions Updated",
        description: `Permissions for ${adminName} have been successfully updated.`
      });

      // Update original permissions to reflect saved state
      setOriginalPermissions(permissions);
      queryClient.invalidateQueries({
        queryKey: ['adminPermissions', adminId, branchId]
      });
      if (shouldCloseDialog) {
        onClose();
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSaveAndSwitchBranch = async () => {
    if (pendingSwitchBranch) {
      try {
        // Create a mock form event
        const mockEvent = {
          preventDefault: () => {}
        } as React.FormEvent;
        await handleSubmit(mockEvent, false); // Don't close dialog after saving

        // Switch to the new branch after successful save
        setShowBranchSwitchAlert(false);
        switchToBranch(pendingSwitchBranch.branchId, pendingSwitchBranch.branchName);
        setPendingSwitchBranch(null);
      } catch (error) {
        // Error handling is already done in handleSubmit
        console.error('Failed to save and switch branch:', error);
      }
    }
  };
  const renderPermissionSwitch = (key: keyof Permissions, label: string) => <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-white/50 transition-colors">
      <Label htmlFor={key} className="text-gray-700 text-sm cursor-pointer flex-1">{label}</Label>
      <Switch id={key} checked={permissions[key]} onCheckedChange={value => handlePermissionChange(key, value)} className="ml-2" />
    </div>;
  return <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] p-0 overflow-hidden rounded-xl flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-xl flex items-center font-semibold text-gray-800">
              <ShieldCheck className="h-5 w-5 mr-2 text-blue-600" />
              Edit Permissions
              {hasUnsavedChanges() && <span className="ml-2 text-sm text-orange-600 font-normal flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Unsaved changes
                </span>}
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <div>
                Editing permissions for <span className="font-medium text-gray-900">{adminName}</span>
              </div>
              <div className="flex items-center text-sm bg-blue-50 border border-blue-200 rounded-lg p-2">
                <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-medium text-blue-800">
                  {currentBranch.branch_name}
                </span>
                {isMultiBranch && <span className="ml-2 text-blue-600">
                    (Branch {adminBranches.findIndex(b => b.branch_id === branchId) + 1} of {adminBranches.length})
                  </span>}
              </div>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-6">
              {isLoadingPermissions ? <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading Permissions...</span>
                </div> : <>
                  {/* Core Features */}
                  <div className="space-y-4 border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-blue-100/30">
                    <h3 className="font-semibold text-gray-800 flex items-center text-base"> Core Features</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                      {renderPermissionSwitch('dashboard', 'Dashboard')}
                      {renderPermissionSwitch('bookings', 'Bookings')}
                      {renderPermissionSwitch('clients', 'Clients')}
                      {renderPermissionSwitch('carers', 'Carers')}
                      {renderPermissionSwitch('communication', 'Communication')}
                      {renderPermissionSwitch('finance', 'Finance')}
                    </div>
                  </div>

                  {/* Advanced Features */}
                  <div className="space-y-4 border rounded-lg p-4 bg-gradient-to-br from-green-50 to-green-100/30">
                    <h3 className="font-semibold text-gray-800 flex items-center text-base"> Advanced Features</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                      {renderPermissionSwitch('reviews', 'Feedbacks')}
                      {renderPermissionSwitch('medication', 'Medication')}
                      {renderPermissionSwitch('workflow', 'Workflow')}
                      {renderPermissionSwitch('key_parameters', 'Core Settings')}
                      {renderPermissionSwitch('care_plan', 'Care Plan')}
                      {renderPermissionSwitch('under_review_care_plan', 'Under Review Care Plan')}
                      {renderPermissionSwitch('agreements', 'Agreements')}
                      {renderPermissionSwitch('events_logs', 'Events Logs')}
                      {renderPermissionSwitch('attendance', 'Attendance')}
                      {renderPermissionSwitch('form_builder', 'Form Builder')}
                      {renderPermissionSwitch('documents', 'Documents')}
                      {renderPermissionSwitch('notifications', 'Notifications')}
                      {renderPermissionSwitch('library', 'Library')}
                      {renderPermissionSwitch('third_party', 'Third Party')}
                      {renderPermissionSwitch('reports', 'Reports')}
                      {renderPermissionSwitch('system', 'System')}
                    </div>
                  </div>
                </>}
            </div>

            <DialogFooter className="px-6 py-4 border-t bg-gray-50/80 flex-shrink-0">
              <div className="flex justify-between items-center w-full">
                {/* Branch Navigation - Left Side */}
                {isMultiBranch && <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Switch Branch:</span>
                    <div className="flex gap-1">
                      {adminBranches.map((branch, index) => <Button key={branch.branch_id} type="button" variant={branch.branch_id === branchId ? "default" : "outline"} size="sm" onClick={() => handleBranchSwitch(branch.branch_id, branch.branch_name)} className="text-xs px-2 py-1" disabled={isSubmitting}>
                          {branch.branch_name}
                        </Button>)}
                    </div>
                  </div>}
                
                {/* Action Buttons - Right Side */}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleClose} className="border-gray-200 rounded-md" disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className={`font-medium rounded-md ${hasUnsavedChanges() ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`} disabled={isSubmitting || isLoadingPermissions}>
                    {isSubmitting ? <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Saving...
                      </> : <>
                        Save Changes
                        {hasUnsavedChanges() && <span className="ml-1">*</span>}
                      </>}
                  </Button>
                </div>
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
            <AlertDialogAction onClick={handleForceClose} className="bg-red-600 hover:bg-red-700">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Branch Switch Alert Dialog */}
      <AlertDialog open={showBranchSwitchAlert} onOpenChange={setShowBranchSwitchAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              Switch Branch with Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes for <strong>{adminName}</strong> on <strong>{currentBranch.branch_name}</strong>. 
              Switching to <strong>{pendingSwitchBranch?.branchName}</strong> will discard these changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel onClick={handleCancelBranchSwitch}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndSwitchBranch} className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </> : 'Save Changes & Switch Branch'}
            </AlertDialogAction>
            <AlertDialogAction onClick={handleConfirmBranchSwitch} className="bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>
              Switch Branch (Discard Changes)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
}