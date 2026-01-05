
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateAdmin } from "@/data/hooks/useCreateAdmin";
import { useTenantAwareQuery } from "@/hooks/useTenantAware";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, User, Shield, Building2,
  LayoutDashboard, Calendar, Users, ClipboardList,
  PoundSterling, Star, MessageSquare, Workflow,
  ListChecks, Pill, FileText, Bell, ClipboardCheck,
  FileUp, Folder, UserPlus, BarChart4, Settings,
  Eye, EyeOff
} from "lucide-react";

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
  system: true,
};

type Permissions = typeof initialPermissions;

interface AddAdminFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminAdded: () => void;
}

export const AddAdminForm: React.FC<AddAdminFormProps> = ({
  isOpen,
  onClose,
  onAdminAdded,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    branch_ids: [] as string[],
  });

  const [permissions, setPermissions] = useState<Permissions>(initialPermissions);
  const [activeTab, setActiveTab] = useState("basic");
  const [showPassword, setShowPassword] = useState(false);

  const createAdminMutation = useCreateAdmin();
  const { organization } = useTenant();

  // Fetch branches for the dropdown using tenant-aware query
  const { data: branches = [], isLoading: branchesLoading } = useTenantAwareQuery(
    ['branches'],
    async (organizationId) => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, address')
        .eq('organization_id', organizationId)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  );

  const handlePermissionChange = (permission: keyof Permissions, value: boolean) => {
    setPermissions(prev => ({ ...prev, [permission]: value }));
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

  const handleBranchToggle = (branchId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      branch_ids: checked 
        ? [...prev.branch_ids, branchId]
        : prev.branch_ids.filter(id => id !== branchId)
    }));
  };

  const handleSelectAllBranches = () => {
    setFormData(prev => ({
      ...prev,
      branch_ids: branches.map(branch => branch.id)
    }));
  };

  const handleClearAllBranches = () => {
    setFormData(prev => ({
      ...prev,
      branch_ids: []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.first_name || !formData.last_name || !formData.password || formData.branch_ids.length === 0) {
      toast.error("Please fill in all fields and select at least one branch");
      return;
    }

    try {
      // First create the admin
      const adminResult = await createAdminMutation.mutateAsync(formData);
      
      if (adminResult?.user_id) {
        // Create permissions for each selected branch
        const permissionEntries = formData.branch_ids.map(branchId => ({
          admin_id: adminResult.user_id,
          branch_id: branchId,
          ...permissions
        }));

        const { error: permissionsError } = await supabase
          .from('admin_permissions')
          .insert(permissionEntries);

        if (permissionsError) {
          console.error("Error creating admin permissions:", permissionsError);
          toast.error("Admin created but permissions setup failed");
        } else {
          toast.success(`Branch admin created successfully! They can log in immediately with access to ${formData.branch_ids.length} branch${formData.branch_ids.length > 1 ? 'es' : ''}!`);
        }
      } else {
        toast.success("Branch admin created successfully! They can log in immediately!");
      }

      // Reset form
      setFormData({ 
        email: "", 
        first_name: "", 
        last_name: "", 
        password: "",
        branch_ids: [] 
      });
      setPermissions(initialPermissions);
      setActiveTab("basic");
      onAdminAdded();
      onClose();

    } catch (error: any) {
      console.error("Create admin error:", error);
      toast.error(error.message || "Failed to create admin user");
    }
  };

  const handleClose = () => {
    setFormData({ 
      email: "", 
      first_name: "", 
      last_name: "", 
      password: "",
      branch_ids: [] 
    });
    setPermissions(initialPermissions);
    setActiveTab("basic");
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[800px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Branch Admin</DialogTitle>
          <DialogDescription>
            Create a new administrator account for a branch location with specific permissions.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissions
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto mt-4">
              <TabsContent value="basic" className="space-y-4 m-0 pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Enter password"
                      required
                      minLength={6}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Branches Access *</Label>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {formData.branch_ids.length} selected
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAllBranches}
                        disabled={branchesLoading}
                        className="h-6 px-2 text-xs"
                      >
                        All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAllBranches}
                        disabled={branchesLoading}
                        className="h-6 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  
                  {branchesLoading ? (
                    <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading branches...
                    </div>
                  ) : branches.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No branches available
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 bg-card max-h-72 overflow-y-auto">
                      <div className="space-y-3">
                        {branches.map((branch) => (
                          <div key={branch.id} className="flex items-start space-x-3 p-3 rounded-md border border-border/40 bg-background hover:bg-accent/20 hover:border-primary/30 transition-colors duration-200">
                            <Checkbox
                              id={branch.id}
                              checked={formData.branch_ids.includes(branch.id)}
                              onCheckedChange={(checked) => 
                                handleBranchToggle(branch.id, checked as boolean)
                              }
                              className="mt-0.5 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <Label 
                                htmlFor={branch.id}
                                className="text-sm font-medium cursor-pointer block leading-tight hover:text-primary transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-foreground">{branch.name}</span>
                                </div>
                              </Label>
                              {branch.address && (
                                <p className="text-xs text-muted-foreground mt-1 ml-6 leading-relaxed">
                                  {branch.address}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {formData.branch_ids.length === 0 && (
                    <p className="text-sm text-destructive">
                      Please select at least one branch
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-6 m-0 pr-2">
                {/* Primary Tabs Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-blue-50/30">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <LayoutDashboard className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Primary Modules</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'dashboard', label: 'Dashboard', desc: 'Branch overview and statistics', icon: LayoutDashboard },
                      { key: 'bookings', label: 'Bookings', desc: 'Manage appointments and scheduling', icon: Calendar },
                      { key: 'clients', label: 'Clients', desc: 'Client information and management', icon: Users },
                      { key: 'carers', label: 'Staff', desc: 'Staff management and details', icon: Users },
                      { key: 'care_plan', label: 'Care Plan', desc: 'Patient care plans', icon: ClipboardList },
                      { key: 'finance', label: 'Finance', desc: 'Financial management', icon: PoundSterling },
                      { key: 'reviews', label: 'Feedbacks', desc: 'Client feedback and reviews', icon: Star },
                      { key: 'communication', label: 'Communication', desc: 'Messages and emails', icon: MessageSquare },
                    ].map(({ key, label, desc, icon: Icon }) => (
                      <div key={key} className="flex items-start gap-3 p-3 rounded-lg border bg-white">
                        <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={key} className="font-medium text-sm cursor-pointer">{label}</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                        <Switch
                          id={key}
                          checked={permissions[key as keyof Permissions]}
                          onCheckedChange={(checked) => handlePermissionChange(key as keyof Permissions, checked)}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operations Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-purple-50/30">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Workflow className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Operations</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { key: 'workflow', label: 'Workflow', desc: 'Process management and automation', icon: Workflow },
                      { key: 'key_parameters', label: 'Core Settings', desc: 'Track key metrics and parameters', icon: ListChecks },
                      { key: 'medication', label: 'Medication', desc: 'Medicine tracking and management', icon: Pill },
                    ].map(({ key, label, desc, icon: Icon }) => (
                      <div key={key} className="flex items-start gap-3 p-3 rounded-lg border bg-white">
                        <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={key} className="font-medium text-sm cursor-pointer">{label}</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                        <Switch
                          id={key}
                          checked={permissions[key as keyof Permissions]}
                          onCheckedChange={(checked) => handlePermissionChange(key as keyof Permissions, checked)}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Administration Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-amber-50/30">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <FileText className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold text-amber-900">Administration</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { key: 'agreements', label: 'Agreements', desc: 'Legal documents and contracts', icon: FileText },
                      { key: 'events_logs', label: 'Events & Logs', desc: 'Activity tracking and history', icon: Bell },
                      { key: 'attendance', label: 'Attendance', desc: 'Staff attendance management', icon: ClipboardCheck },
                    ].map(({ key, label, desc, icon: Icon }) => (
                      <div key={key} className="flex items-start gap-3 p-3 rounded-lg border bg-white">
                        <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={key} className="font-medium text-sm cursor-pointer">{label}</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                        <Switch
                          id={key}
                          checked={permissions[key as keyof Permissions]}
                          onCheckedChange={(checked) => handlePermissionChange(key as keyof Permissions, checked)}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resources Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-green-50/30">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Folder className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Resources</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'form_builder', label: 'Form Builder', desc: 'Create custom forms', icon: FileUp },
                      { key: 'documents', label: 'Documents', desc: 'Manage documents', icon: Folder },
                      { key: 'notifications', label: 'Notifications', desc: 'Alert management', icon: Bell },
                      { key: 'library', label: 'Library', desc: 'Resources and guides', icon: Folder },
                      { key: 'third_party', label: 'Third Party Access', desc: 'External user access', icon: UserPlus },
                    ].map(({ key, label, desc, icon: Icon }) => (
                      <div key={key} className="flex items-start gap-3 p-3 rounded-lg border bg-white">
                        <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={key} className="font-medium text-sm cursor-pointer">{label}</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                        <Switch
                          id={key}
                          checked={permissions[key as keyof Permissions]}
                          onCheckedChange={(checked) => handlePermissionChange(key as keyof Permissions, checked)}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reports Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-indigo-50/30">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <BarChart4 className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-semibold text-indigo-900">Reports</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg border bg-white">
                      <BarChart4 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor="reports" className="font-medium text-sm cursor-pointer">Reports</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Data analysis and reporting</p>
                      </div>
                      <Switch
                        id="reports"
                        checked={permissions.reports}
                        onCheckedChange={(checked) => handlePermissionChange('reports', checked)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* System & Advanced Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-red-50/30">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Settings className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">System & Advanced</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { key: 'system', label: 'System Administration', desc: 'Full system access and configuration', icon: Settings },
                      { key: 'under_review_care_plan', label: 'Under Review Care Plan', desc: 'Review pending care plans', icon: ClipboardList },
                    ].map(({ key, label, desc, icon: Icon }) => (
                      <div key={key} className="flex items-start gap-3 p-3 rounded-lg border bg-white">
                        <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={key} className="font-medium text-sm cursor-pointer">{label}</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                        <Switch
                          id={key}
                          checked={permissions[key as keyof Permissions]}
                          onCheckedChange={(checked) => handlePermissionChange(key as keyof Permissions, checked)}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Configure all permissions at once</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPermissions(initialPermissions)}
                    >
                      Enable All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPermissions(Object.fromEntries(
                        Object.keys(initialPermissions).map(key => [key, false])
                      ) as Permissions)}
                    >
                      Disable All
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="flex gap-2 pt-4 mt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createAdminMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createAdminMutation.isPending || branchesLoading}
            >
              {createAdminMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Admin"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
