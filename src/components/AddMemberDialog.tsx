import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, UserPlus, Loader2, User, Shield } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { 
  getPermissionTemplateByRole, 
  OrganizationMemberPermissions,
  defaultOrganizationMemberPermissions
} from "@/hooks/useOrganizationMemberPermissions";

interface AddMemberDialogProps {
  triggerClassName?: string;
}

export const AddMemberDialog: React.FC<AddMemberDialogProps> = ({ 
  triggerClassName 
}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("");
  const [activeTab, setActiveTab] = useState("basic");
  const [permissions, setPermissions] = useState<OrganizationMemberPermissions>(defaultOrganizationMemberPermissions);
  const { toast } = useToast();
  const { organization } = useTenant();
  const queryClient = useQueryClient();

  const addMember = useMutation({
    mutationFn: async () => {
      if (!organization?.id) {
        throw new Error("Missing organization information");
      }

      // First, create auth user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Create the organization member record with the configured permissions
      const { data, error } = await supabase
        .from("organization_members")
        .insert({
          organization_id: organization.id,
          user_id: authData.user.id,
          role,
          permissions: permissions as any,
          invited_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Member Added",
        description: "New member has been successfully added to the organization.",
      });
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      setOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add member.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setPassword("");
    setRole("");
    setActiveTab("basic");
    setPermissions(defaultOrganizationMemberPermissions);
  };

  const handlePermissionChange = (permission: keyof OrganizationMemberPermissions, value: boolean) => {
    setPermissions(prev => ({ ...prev, [permission]: value }));
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    const templatePermissions = getPermissionTemplateByRole(newRole);
    setPermissions(templatePermissions);
  };

  const renderPermissionSwitch = (key: keyof OrganizationMemberPermissions, label: string) => (
    <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-white/50 transition-colors">
      <Label htmlFor={key} className="text-gray-700 text-sm cursor-pointer flex-1">{label}</Label>
      <Switch 
        id={key} 
        checked={permissions[key] || false} 
        onCheckedChange={(value) => handlePermissionChange(key, value)} 
        className="ml-2" 
      />
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !firstName || !lastName || !password || !role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!organization?.id) {
      toast({
        title: "Error",
        description: "No organization context available.",
        variant: "destructive",
      });
      return;
    }

    addMember.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={`bg-blue-600 hover:bg-blue-700 ${triggerClassName}`}>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-[800px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Organization Member
          </DialogTitle>
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
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={role} onValueChange={handleRoleChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-6 m-0 pr-2">
                {/* Core Features */}
                <div className="space-y-4 border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-blue-100/30">
                  <h3 className="font-semibold text-gray-800 flex items-center text-base">
                    Core Features
                  </h3>
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
                  <h3 className="font-semibold text-gray-800 flex items-center text-base">
                    Advanced Features
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                    {renderPermissionSwitch('reviews', 'Reviews')}
                    {renderPermissionSwitch('medication', 'Medication')}
                    {renderPermissionSwitch('workflow', 'Workflow')}
                    {renderPermissionSwitch('key_parameters', 'Key Parameters')}
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
              </TabsContent>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                disabled={addMember.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addMember.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {addMember.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Member'
                )}
              </Button>
            </div>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
};