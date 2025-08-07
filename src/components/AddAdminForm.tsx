
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Shield, Building2 } from "lucide-react";

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

  const createAdminMutation = useCreateAdmin();

  // Fetch branches for the dropdown
  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, address')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

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
      
      if (adminResult?.user?.id) {
        // Create permissions for each selected branch
        const permissionEntries = formData.branch_ids.map(branchId => ({
          admin_id: adminResult.user.id,
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
          toast.success(`Admin user created successfully with access to ${formData.branch_ids.length} branch${formData.branch_ids.length > 1 ? 'es' : ''}!`);
        }
      } else {
        toast.success("Admin user created successfully!");
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
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Enter password"
                    required
                    minLength={6}
                  />
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
                    <div className="border rounded-lg p-4 bg-muted/20 max-h-72 overflow-y-auto">
                      <div className="space-y-4">
                        {branches.map((branch) => (
                          <div key={branch.id} className="flex items-start space-x-3 p-2 rounded hover:bg-muted/30">
                            <Checkbox
                              id={branch.id}
                              checked={formData.branch_ids.includes(branch.id)}
                              onCheckedChange={(checked) => 
                                handleBranchToggle(branch.id, checked as boolean)
                              }
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <Label 
                                htmlFor={branch.id}
                                className="text-sm font-medium cursor-pointer block"
                              >
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  {branch.name}
                                </div>
                              </Label>
                              {branch.address && (
                                <p className="text-xs text-muted-foreground mt-1 ml-6">
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
                {/* Branch Settings Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                  <h3 className="font-semibold border-b pb-2">Branch Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <Label htmlFor="system" className="font-medium">System</Label>
                        <p className="text-sm text-muted-foreground">System administration access</p>
                      </div>
                      <Switch
                        id="system"
                        checked={permissions.system}
                        onCheckedChange={(checked) => handlePermissionChange('system', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <Label htmlFor="finance" className="font-medium">Finance</Label>
                        <p className="text-sm text-muted-foreground">Financial data and operations</p>
                      </div>
                      <Switch
                        id="finance"
                        checked={permissions.finance}
                        onCheckedChange={(checked) => handlePermissionChange('finance', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Care Plan Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                  <h3 className="font-semibold border-b pb-2">Care Plan</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <Label htmlFor="under_review_care_plan" className="font-medium">Under Review Care Plan</Label>
                        <p className="text-sm text-muted-foreground">Access to review pending care plans</p>
                      </div>
                      <Switch
                        id="under_review_care_plan"
                        checked={permissions.under_review_care_plan}
                        onCheckedChange={(checked) => handlePermissionChange('under_review_care_plan', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <Label htmlFor="care_plan" className="font-medium">Care Plan</Label>
                        <p className="text-sm text-muted-foreground">Access to care plans</p>
                      </div>
                      <Switch
                        id="care_plan"
                        checked={permissions.care_plan}
                        onCheckedChange={(checked) => handlePermissionChange('care_plan', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Reviews & Third Party Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                    <h3 className="font-semibold border-b pb-2">Reviews</h3>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <Label htmlFor="reviews" className="font-medium">Reviews</Label>
                        <p className="text-sm text-muted-foreground">Manage client reviews</p>
                      </div>
                      <Switch
                        id="reviews"
                        checked={permissions.reviews}
                        onCheckedChange={(checked) => handlePermissionChange('reviews', checked)}
                      />
                    </div>
                  </div>
                  <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                    <h3 className="font-semibold border-b pb-2">Third Party</h3>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <Label htmlFor="third_party" className="font-medium">Third Party</Label>
                        <p className="text-sm text-muted-foreground">Third party integrations</p>
                      </div>
                      <Switch
                        id="third_party"
                        checked={permissions.third_party}
                        onCheckedChange={(checked) => handlePermissionChange('third_party', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Branch Report Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                  <h3 className="font-semibold border-b pb-2">Branch Reports</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { key: 'report_accounting', label: 'Accounting Reports', desc: 'Financial reporting access' },
                      { key: 'report_total_working_hours', label: 'Working Hours Reports', desc: 'Staff time tracking reports' },
                      { key: 'report_staff', label: 'Staff Reports', desc: 'Staff performance and data' },
                      { key: 'report_client', label: 'Client Reports', desc: 'Client data and analytics' },
                      { key: 'report_service', label: 'Service Reports', desc: 'Service delivery metrics' }
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <Label htmlFor={key} className="font-medium">{label}</Label>
                          <p className="text-sm text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          id={key}
                          checked={permissions[key as keyof Permissions]}
                          onCheckedChange={(checked) => handlePermissionChange(key as keyof Permissions, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accounting Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                  <h3 className="font-semibold border-b pb-2">Accounting</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { key: 'accounting_extra_time', label: 'Extra Time', desc: 'Overtime and additional hours' },
                      { key: 'accounting_expense', label: 'Expenses', desc: 'Expense management and tracking' },
                      { key: 'accounting_travel', label: 'Travel', desc: 'Travel expense tracking' },
                      { key: 'accounting_invoices', label: 'Invoices', desc: 'Invoice generation and management' },
                      { key: 'accounting_gross_payslip', label: 'Gross Payslip', desc: 'Payroll and salary information' },
                      { key: 'accounting_travel_management', label: 'Travel Management', desc: 'Travel planning and approval' },
                      { key: 'accounting_client_rate', label: 'Client Rates', desc: 'Client billing rates' },
                      { key: 'accounting_authority_rate', label: 'Authority Rates', desc: 'Government/authority billing rates' },
                      { key: 'accounting_staff_rate', label: 'Staff Rates', desc: 'Staff payment rates' },
                      { key: 'accounting_rate_management', label: 'Rate Management', desc: 'Overall rate management system' },
                      { key: 'accounting_staff_bank_detail', label: 'Staff Bank Details', desc: 'Employee banking information' }
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <Label htmlFor={key} className="font-medium">{label}</Label>
                          <p className="text-sm text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          id={key}
                          checked={permissions[key as keyof Permissions]}
                          onCheckedChange={(checked) => handlePermissionChange(key as keyof Permissions, checked)}
                        />
                      </div>
                    ))}
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
