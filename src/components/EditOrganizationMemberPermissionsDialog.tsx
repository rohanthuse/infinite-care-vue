import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, AlertTriangle, Users, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  useOrganizationMemberPermissions, 
  useUpdateOrganizationMemberPermissions,
  OrganizationMemberPermissions,
  defaultOrganizationMemberPermissions,
  getPermissionTemplateByRole
} from "@/hooks/useOrganizationMemberPermissions";
import { useRemoveOrganizationMember } from "@/hooks/useOrganization";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditOrganizationMemberPermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberRole: string;
}

export function EditOrganizationMemberPermissionsDialog({
  isOpen,
  onClose,
  memberId,
  memberName,
  memberEmail,
  memberRole
}: EditOrganizationMemberPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<OrganizationMemberPermissions>(defaultOrganizationMemberPermissions);
  const [originalPermissions, setOriginalPermissions] = useState<OrganizationMemberPermissions>(defaultOrganizationMemberPermissions);
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);
  const [showRemoveMemberAlert, setShowRemoveMemberAlert] = useState(false);
  const { toast } = useToast();

  const { data: existingPermissions, isLoading: isLoadingPermissions } = useOrganizationMemberPermissions(memberId);
  const { mutate: updatePermissions, isPending: isUpdating } = useUpdateOrganizationMemberPermissions();
  const { mutate: removeMember, isPending: isRemoving } = useRemoveOrganizationMember();

  useEffect(() => {
    if (existingPermissions) {
      setPermissions(existingPermissions);
      setOriginalPermissions(existingPermissions);
    } else if (!isLoadingPermissions) {
      const defaultPerms = getPermissionTemplateByRole(memberRole);
      setPermissions(defaultPerms);
      setOriginalPermissions(defaultPerms);
    }
  }, [existingPermissions, isLoadingPermissions, memberRole]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    return JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
  };

  const handlePermissionChange = (permission: keyof OrganizationMemberPermissions, value: boolean) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    updatePermissions({ 
      memberId, 
      permissions 
    }, {
      onSuccess: () => {
        setOriginalPermissions(permissions);
        onClose();
      }
    });
  };

  const handlePresetSelect = (preset: string) => {
    if (preset === 'current') return;
    
    const presetPermissions = getPermissionTemplateByRole(preset);
    setPermissions(presetPermissions);
  };

  const handleRemoveMember = () => {
    removeMember(memberId, {
      onSuccess: () => {
        toast({
          title: "Member Removed",
          description: `${memberName} has been removed from the organisation.`,
        });
        setShowRemoveMemberAlert(false);
        onClose();
      }
    });
  };

  // Select All functionality
  const areAllPermissionsEnabled = () => {
    return Object.values(permissions).every(value => value === true);
  };

  const areAllPermissionsDisabled = () => {
    return Object.values(permissions).every(value => value === false);
  };

  const handleSelectAll = (enabled: boolean) => {
    const newPermissions = Object.keys(permissions).reduce((acc, key) => {
      acc[key as keyof OrganizationMemberPermissions] = enabled;
      return acc;
    }, {} as OrganizationMemberPermissions);
    setPermissions(newPermissions);
  };

  const renderPermissionSwitch = (key: keyof OrganizationMemberPermissions, label: string) => (
    <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-white/50 transition-colors">
      <Label htmlFor={key} className="text-gray-700 text-sm cursor-pointer flex-1">{label}</Label>
      <Switch 
        id={key} 
        checked={permissions[key]} 
        onCheckedChange={value => handlePermissionChange(key, value)} 
        className="ml-2" 
      />
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] p-0 overflow-hidden rounded-xl flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-xl flex items-center font-semibold text-gray-800">
              <ShieldCheck className="h-5 w-5 mr-2 text-blue-600" />
              Edit Member Permissions
              {hasUnsavedChanges() && (
                <span className="ml-2 text-sm text-orange-600 font-normal flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Unsaved changes
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <div>
                Editing permissions for <span className="font-medium text-gray-900">{memberName}</span>
              </div>
              <div className="text-sm text-gray-600">{memberEmail}</div>
              <div className="flex items-center text-sm bg-blue-50 border border-blue-200 rounded-lg p-2">
                <Users className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-medium text-blue-800 capitalize">
                  {memberRole.replace('_', ' ')} Role
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-6">
              {isLoadingPermissions ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading Permissions...</span>
                </div>
              ) : (
                <>
                  {/* Permission Presets */}
                  <div className="space-y-4 border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-gray-100/30">
                    <h3 className="font-semibold text-gray-800 flex items-center text-base">Permission Presets</h3>
                    <div className="flex gap-2">
                      <Select onValueChange={handlePresetSelect} value="current">
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Apply preset" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="current">Current Settings</SelectItem>
                          <SelectItem value="member">Member (Basic Access)</SelectItem>
                          <SelectItem value="manager">Manager (Extended Access)</SelectItem>
                          <SelectItem value="admin">Admin (Full Access)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Select All Toggle */}
                  <div className="space-y-4 border rounded-lg p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800 flex items-center text-base">Select All Permissions</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {areAllPermissionsEnabled() ? 'All permissions enabled' : 
                           areAllPermissionsDisabled() ? 'All permissions disabled' : 
                           `${Object.values(permissions).filter(Boolean).length} of ${Object.keys(permissions).length} permissions enabled`}
                        </p>
                      </div>
                      <Switch
                        checked={areAllPermissionsEnabled()}
                        onCheckedChange={handleSelectAll}
                        className="ml-4"
                      />
                    </div>
                  </div>

                  {/* Core Features */}
                  <div className="space-y-4 border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-blue-100/30">
                    <h3 className="font-semibold text-gray-800 flex items-center text-base">Core Features</h3>
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
                    <h3 className="font-semibold text-gray-800 flex items-center text-base">Advanced Features</h3>
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
                      {renderPermissionSwitch('system', 'System')}
                    </div>
                  </div>

                  {/* Accounting Features */}
                  <div className="space-y-4 border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-purple-100/30">
                    <h3 className="font-semibold text-gray-800 flex items-center text-base">
                      Accounting & Finance
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                      {renderPermissionSwitch('accounting_extra_time', 'Extra Time Management')}
                      {renderPermissionSwitch('accounting_expense', 'Expense Management')}
                      {renderPermissionSwitch('accounting_travel', 'Travel Management')}
                      {renderPermissionSwitch('accounting_invoices', 'Invoice Management')}
                      {renderPermissionSwitch('accounting_gross_payslip', 'Gross Payslip')}
                      {renderPermissionSwitch('accounting_travel_management', 'Travel Records')}
                      {renderPermissionSwitch('accounting_client_rate', 'Client Rates')}
                      {renderPermissionSwitch('accounting_authority_rate', 'Authority Rates')}
                      {renderPermissionSwitch('accounting_staff_rate', 'Staff Rates')}
                      {renderPermissionSwitch('accounting_rate_management', 'Rate Management')}
                      {renderPermissionSwitch('accounting_staff_bank_detail', 'Staff Bank Details')}
                    </div>
                  </div>

                  {/* Reports Features */}
                  <div className="space-y-4 border rounded-lg p-4 bg-gradient-to-br from-orange-50 to-orange-100/30">
                    <h3 className="font-semibold text-gray-800 flex items-center text-base">
                      Reports & Analytics
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                      {renderPermissionSwitch('reports', 'General Reports')}
                      {renderPermissionSwitch('report_accounting', 'Accounting Reports')}
                      {renderPermissionSwitch('report_total_working_hours', 'Working Hours Reports')}
                      {renderPermissionSwitch('report_staff', 'Staff Reports')}
                      {renderPermissionSwitch('report_client', 'Client Reports')}
                      {renderPermissionSwitch('report_service', 'Service Reports')}
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t bg-gray-50/80 flex-shrink-0">
              <div className="flex justify-between items-center w-full">
                {/* Remove Member Button - Left Side */}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowRemoveMemberAlert(true)}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  disabled={isUpdating || isRemoving}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Member
                </Button>
                
                {/* Action Buttons - Right Side */}
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClose} 
                    className="border-gray-200 rounded-md" 
                    disabled={isUpdating || isRemoving}
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
                    disabled={isUpdating || isRemoving || isLoadingPermissions}
                  >
                    {isUpdating ? (
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
              You have unsaved changes to the permissions for <strong>{memberName}</strong>. 
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

      {/* Remove Member Alert Dialog */}
      <AlertDialog open={showRemoveMemberAlert} onOpenChange={setShowRemoveMemberAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-red-600" />
              Remove Organisation Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{memberName}</strong> from the organization? 
              They will lose access to all organization resources and this action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRemoveMemberAlert(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveMember} 
              className="bg-red-600 hover:bg-red-700"
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Member'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}