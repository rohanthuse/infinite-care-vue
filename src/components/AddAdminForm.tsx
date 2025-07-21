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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInviteAdmin } from "@/data/hooks/useInviteAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Shield } from "lucide-react";

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
    firstName: "",
    lastName: "",
    branchId: "",
  });

  const [permissions, setPermissions] = useState<Permissions>(initialPermissions);
  const [activeTab, setActiveTab] = useState("basic");

  const inviteAdminMutation = useInviteAdmin();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.branchId) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await inviteAdminMutation.mutateAsync({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        branchId: formData.branchId,
        permissions
      });

      // Reset form
      setFormData({ 
        email: "", 
        firstName: "", 
        lastName: "", 
        branchId: "" 
      });
      setPermissions(initialPermissions);
      setActiveTab("basic");
      onAdminAdded();
      onClose();

    } catch (error: any) {
      console.error("Invite admin error:", error);
      // Error handling is done in the hook
    }
  };

  const handleClose = () => {
    setFormData({ 
      email: "", 
      firstName: "", 
      lastName: "", 
      branchId: "" 
    });
    setPermissions(initialPermissions);
    setActiveTab("basic");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Invite New Branch Admin</DialogTitle>
          <DialogDescription>
            Send an invitation to create a new administrator account for a branch location with specific permissions.
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
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
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
                <Label htmlFor="branch">Branch *</Label>
                <Select
                  value={formData.branchId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, branchId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    {branchesLoading ? (
                      <SelectItem value="" disabled>
                        <div className="flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading branches...
                        </div>
                      </SelectItem>
                    ) : branches.length === 0 ? (
                      <SelectItem value="" disabled>
                        No branches available
                      </SelectItem>
                    ) : (
                      branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
              disabled={inviteAdminMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={inviteAdminMutation.isPending || branchesLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {inviteAdminMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending Invitation...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
