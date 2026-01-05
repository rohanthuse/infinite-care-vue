import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, Building2, ShieldCheck, Plus, Trash2, AlertTriangle,
  LayoutDashboard, Calendar, Users, ClipboardList,
  PoundSterling, Star, MessageSquare, Workflow,
  ListChecks, Pill, FileText, Bell, ClipboardCheck,
  FileUp, Folder, UserPlus, BarChart4, Settings
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAddBranchToAdmin, useRemoveBranchFromAdmin } from "@/hooks/useAdminBranchManagement";
import { toast } from "sonner";
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

interface AdminBranch {
  branch_id: string;
  branch_name: string;
}

interface EditBranchAdminDialogProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
  adminName: string;
  adminEmail: string;
  currentBranches: AdminBranch[];
  onSave?: () => void;
}

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

export function EditBranchAdminDialog({
  isOpen,
  onClose,
  adminId,
  adminName,
  adminEmail,
  currentBranches,
  onSave
}: EditBranchAdminDialogProps) {
  const [activeTab, setActiveTab] = useState("branches");
  const [selectedBranchForPermissions, setSelectedBranchForPermissions] = useState<string>("");
  const [permissions, setPermissions] = useState<Permissions>(initialPermissions);
  const [originalPermissions, setOriginalPermissions] = useState<Permissions>(initialPermissions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branchToRemove, setBranchToRemove] = useState<AdminBranch | null>(null);
  const [assignedBranches, setAssignedBranches] = useState<AdminBranch[]>(currentBranches);

  const queryClient = useQueryClient();
  const { organization } = useTenant();
  const addBranch = useAddBranchToAdmin();
  const removeBranch = useRemoveBranchFromAdmin();

  // Update local state when props change
  useEffect(() => {
    setAssignedBranches(currentBranches);
    if (currentBranches.length > 0 && !selectedBranchForPermissions) {
      setSelectedBranchForPermissions(currentBranches[0].branch_id);
    }
  }, [currentBranches]);

  // Fetch all branches for the organization
  const { data: allBranches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['organization-branches', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .eq('organization_id', organization.id)
        .order('name');
      
      if (error) throw error;
      return data.map(b => ({ branch_id: b.id, branch_name: b.name }));
    },
    enabled: isOpen && !!organization?.id
  });

  // Fetch permissions for selected branch
  const { data: existingPermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['adminPermissions', adminId, selectedBranchForPermissions],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('*')
        .eq('admin_id', adminId)
        .eq('branch_id', selectedBranchForPermissions)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!selectedBranchForPermissions
  });

  // Update permissions when fetched
  useEffect(() => {
    if (existingPermissions) {
      const loadedPermissions = { ...initialPermissions };
      for (const key in loadedPermissions) {
        if (Object.prototype.hasOwnProperty.call(existingPermissions, key)) {
          loadedPermissions[key as keyof Permissions] = existingPermissions[key as keyof typeof existingPermissions] as boolean;
        }
      }
      setPermissions(loadedPermissions);
      setOriginalPermissions(loadedPermissions);
    } else if (!permissionsLoading) {
      setPermissions(initialPermissions);
      setOriginalPermissions(initialPermissions);
    }
  }, [existingPermissions, permissionsLoading, selectedBranchForPermissions]);

  const hasUnsavedChanges = () => {
    return JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
  };

  const handlePermissionChange = (permission: keyof Permissions, value: boolean) => {
    setPermissions(prev => ({ ...prev, [permission]: value }));
  };

  const handleAddBranch = async (branchId: string) => {
    const branch = allBranches.find(b => b.branch_id === branchId);
    if (!branch) return;

    await addBranch.mutateAsync({ adminId, branchId });
    setAssignedBranches(prev => [...prev, branch]);
    onSave?.();
  };

  const handleRemoveBranch = async () => {
    if (!branchToRemove) return;
    
    if (assignedBranches.length <= 1) {
      toast.error("Cannot remove the last branch. Admin must have at least one branch.");
      setBranchToRemove(null);
      return;
    }

    await removeBranch.mutateAsync({ adminId, branchId: branchToRemove.branch_id });
    setAssignedBranches(prev => prev.filter(b => b.branch_id !== branchToRemove.branch_id));
    
    // If we removed the currently selected permissions branch, switch to another
    if (selectedBranchForPermissions === branchToRemove.branch_id) {
      const remaining = assignedBranches.filter(b => b.branch_id !== branchToRemove.branch_id);
      if (remaining.length > 0) {
        setSelectedBranchForPermissions(remaining[0].branch_id);
      }
    }
    
    setBranchToRemove(null);
    onSave?.();
  };

  const handleSavePermissions = async () => {
    if (!selectedBranchForPermissions) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('admin_permissions')
        .upsert({
          admin_id: adminId,
          branch_id: selectedBranchForPermissions,
          ...permissions
        }, {
          onConflict: 'admin_id, branch_id'
        });

      if (error) throw error;

      toast.success("Permissions saved successfully");
      setOriginalPermissions(permissions);
      queryClient.invalidateQueries({ queryKey: ['adminPermissions', adminId, selectedBranchForPermissions] });
      queryClient.invalidateQueries({ queryKey: ['branch-admins'] });
      onSave?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save permissions");
    } finally {
      setIsSubmitting(false);
    }
  };

  const unassignedBranches = allBranches.filter(
    b => !assignedBranches.some(ab => ab.branch_id === b.branch_id)
  );

  const selectedBranchName = assignedBranches.find(b => b.branch_id === selectedBranchForPermissions)?.branch_name || '';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-xl flex items-center font-semibold">
              <Settings className="h-5 w-5 mr-2 text-primary" />
              Edit Branch Admin
            </DialogTitle>
            <DialogDescription>
              Managing <span className="font-medium">{adminName}</span> ({adminEmail})
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
            <TabsList className="mx-6 mt-4">
              <TabsTrigger value="branches" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Branches
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Permissions
                {hasUnsavedChanges() && (
                  <span className="w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </TabsTrigger>
            </TabsList>

            {/* Branches Tab */}
            <TabsContent value="branches" className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Branch Access</h3>
                  <Badge variant="secondary">{assignedBranches.length} assigned</Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Select which branches this admin can manage:
                </p>

                {branchesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Assigned Branches */}
                    {assignedBranches.map(branch => (
                      <div 
                        key={branch.branch_id} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{branch.branch_name}</span>
                          <Badge variant="success" className="text-xs">Assigned</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setBranchToRemove(branch)}
                          disabled={assignedBranches.length <= 1}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {/* Unassigned Branches */}
                    {unassignedBranches.map(branch => (
                      <div 
                        key={branch.branch_id} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{branch.branch_name}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddBranch(branch.branch_id)}
                          disabled={addBranch.isPending}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}

                    {allBranches.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No branches found in this organization.
                      </p>
                    )}
                  </div>
                )}

                {assignedBranches.length === 1 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2 mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    Admin must have at least one branch assigned.
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {/* Branch Selector */}
                <div className="space-y-2">
                  <Label>Editing permissions for:</Label>
                  <Select 
                    value={selectedBranchForPermissions} 
                    onValueChange={setSelectedBranchForPermissions}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignedBranches.map(branch => (
                        <SelectItem key={branch.branch_id} value={branch.branch_id}>
                          {branch.branch_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {permissionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Primary Modules */}
                    <div className="space-y-3 border rounded-lg p-4 bg-blue-50/30 dark:bg-blue-950/20">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <LayoutDashboard className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold">Primary Modules</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                          { key: 'bookings', label: 'Bookings', icon: Calendar },
                          { key: 'clients', label: 'Clients', icon: Users },
                          { key: 'carers', label: 'Staff', icon: Users },
                          { key: 'care_plan', label: 'Care Plan', icon: ClipboardList },
                          { key: 'finance', label: 'Finance', icon: PoundSterling },
                          { key: 'reviews', label: 'Feedbacks', icon: Star },
                          { key: 'communication', label: 'Communication', icon: MessageSquare },
                        ].map(({ key, label, icon: Icon }) => (
                          <div key={key} className="flex items-center justify-between p-2 rounded-lg border bg-background">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={key} className="text-sm cursor-pointer">{label}</Label>
                            </div>
                            <Switch
                              id={key}
                              checked={permissions[key as keyof Permissions]}
                              onCheckedChange={(value) => handlePermissionChange(key as keyof Permissions, value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Operations */}
                    <div className="space-y-3 border rounded-lg p-4 bg-purple-50/30 dark:bg-purple-950/20">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <Workflow className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold">Operations</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { key: 'workflow', label: 'Workflow', icon: Workflow },
                          { key: 'key_parameters', label: 'Core Settings', icon: ListChecks },
                          { key: 'medication', label: 'Medication', icon: Pill },
                        ].map(({ key, label, icon: Icon }) => (
                          <div key={key} className="flex items-center justify-between p-2 rounded-lg border bg-background">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={key} className="text-sm cursor-pointer">{label}</Label>
                            </div>
                            <Switch
                              id={key}
                              checked={permissions[key as keyof Permissions]}
                              onCheckedChange={(value) => handlePermissionChange(key as keyof Permissions, value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Administration */}
                    <div className="space-y-3 border rounded-lg p-4 bg-amber-50/30 dark:bg-amber-950/20">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <FileText className="h-5 w-5 text-amber-600" />
                        <h3 className="font-semibold">Administration</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { key: 'agreements', label: 'Agreements', icon: FileText },
                          { key: 'events_logs', label: 'Events & Logs', icon: Bell },
                          { key: 'attendance', label: 'Attendance', icon: ClipboardCheck },
                        ].map(({ key, label, icon: Icon }) => (
                          <div key={key} className="flex items-center justify-between p-2 rounded-lg border bg-background">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={key} className="text-sm cursor-pointer">{label}</Label>
                            </div>
                            <Switch
                              id={key}
                              checked={permissions[key as keyof Permissions]}
                              onCheckedChange={(value) => handlePermissionChange(key as keyof Permissions, value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resources */}
                    <div className="space-y-3 border rounded-lg p-4 bg-green-50/30 dark:bg-green-950/20">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <Folder className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold">Resources</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'form_builder', label: 'Form Builder', icon: FileUp },
                          { key: 'documents', label: 'Documents', icon: Folder },
                          { key: 'notifications', label: 'Notifications', icon: Bell },
                          { key: 'library', label: 'Library', icon: Folder },
                          { key: 'third_party', label: 'Third Party', icon: UserPlus },
                        ].map(({ key, label, icon: Icon }) => (
                          <div key={key} className="flex items-center justify-between p-2 rounded-lg border bg-background">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={key} className="text-sm cursor-pointer">{label}</Label>
                            </div>
                            <Switch
                              id={key}
                              checked={permissions[key as keyof Permissions]}
                              onCheckedChange={(value) => handlePermissionChange(key as keyof Permissions, value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reports & System */}
                    <div className="space-y-3 border rounded-lg p-4 bg-indigo-50/30 dark:bg-indigo-950/20">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <BarChart4 className="h-5 w-5 text-indigo-600" />
                        <h3 className="font-semibold">Reports & System</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'reports', label: 'Reports', icon: BarChart4 },
                          { key: 'system', label: 'System', icon: Settings },
                        ].map(({ key, label, icon: Icon }) => (
                          <div key={key} className="flex items-center justify-between p-2 rounded-lg border bg-background">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={key} className="text-sm cursor-pointer">{label}</Label>
                            </div>
                            <Switch
                              id={key}
                              checked={permissions[key as keyof Permissions]}
                              onCheckedChange={(value) => handlePermissionChange(key as keyof Permissions, value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="border-t p-4 flex justify-between items-center flex-shrink-0">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {activeTab === "permissions" && (
              <Button 
                onClick={handleSavePermissions} 
                disabled={isSubmitting || !hasUnsavedChanges()}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Permissions
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Branch Confirmation */}
      <AlertDialog open={!!branchToRemove} onOpenChange={() => setBranchToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Branch Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{branchToRemove?.branch_name}</strong> access from this admin?
              This will also remove any permissions configured for this branch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveBranch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Branch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
