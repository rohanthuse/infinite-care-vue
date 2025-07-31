
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
        .select('id, name')
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add New Branch Admin</DialogTitle>
          <DialogDescription>
            Create a new administrator account for a branch location with specific permissions.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

            <TabsContent value="basic" className="space-y-4 mt-4">
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
                  <div className="border rounded-lg p-3 bg-gray-50/50 max-h-48 overflow-y-auto">
                    <div className="space-y-3">
                      {branches.map((branch) => (
                        <div key={branch.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={branch.id}
                            checked={formData.branch_ids.includes(branch.id)}
                            onCheckedChange={(checked) => 
                              handleBranchToggle(branch.id, checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={branch.id}
                            className="flex items-center gap-2 cursor-pointer flex-1 text-sm"
                          >
                            <Building2 className="h-4 w-4 text-gray-500" />
                            {branch.name}
                          </Label>
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

            <TabsContent value="permissions" className="mt-4">
              <div className="max-h-[400px] overflow-y-auto space-y-6 pr-2">
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
              </div>
            </TabsContent>
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
              className="bg-blue-600 hover:bg-blue-700"
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
