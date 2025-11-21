import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Plus, UserPlus, Loader2, User } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";

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
  const { toast } = useToast();
  const { organization } = useTenant();
  const queryClient = useQueryClient();

  const addMember = useMutation({
    mutationFn: async () => {
      if (!organization?.id) {
        throw new Error("Missing organisation information");
      }

      // Use edge function to handle member creation
      const { data, error } = await supabase.functions.invoke('create-organization-member', {
        body: {
          email,
          password,
          firstName,
          lastName,
          role,
          permissions: null,
          organizationId: organization.id
        }
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to add member');
      }
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Member Added",
        description: "New member has been successfully added to the organisation.",
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
  };

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
        description: "No organisation context available.",
        variant: "destructive",
      });
      return;
    }

    addMember.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={`bg-primary hover:bg-primary/90 text-primary-foreground ${triggerClassName}`}>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-[800px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Organisation Member
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Combobox
              options={[
                { value: "member", label: "Member" },
                { value: "manager", label: "Manager" },
                { value: "admin", label: "Admin" },
              ]}
              value={role}
              onValueChange={setRole}
              placeholder="Select or enter a role"
              searchPlaceholder="Search roles..."
              emptyText="No roles found."
              allowCustom={true}
            />
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
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
        </form>
      </DialogContent>
    </Dialog>
  );
};