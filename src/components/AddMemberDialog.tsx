import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();

  const { mutate: addMember, isPending } = useMutation({
    mutationFn: async (newMember: {
      email: string;
      role: string;
      organization_id: string;
    }) => {
      // For simplicity, we'll allow any email and let the backend handle validation
      // In production, you'd want to check if user exists first
      
      // Create a temporary user ID for demonstration
      // In a real app, you'd validate against existing users or send invitations
      const tempUserId = crypto.randomUUID();

      // Get default permissions based on role
      const { getPermissionTemplateByRole } = await import('@/hooks/useOrganizationMemberPermissions');
      const defaultPermissions = getPermissionTemplateByRole(newMember.role);

      // Add as organization member
      const { data, error } = await supabase
        .from('organization_members')
        .insert([{
          organization_id: newMember.organization_id,
          user_id: tempUserId,
          role: newMember.role,
          permissions: defaultPermissions as any,
          status: 'pending', // Set as pending until user accepts
          invited_by: (await supabase.auth.getUser()).data.user?.id,
          invited_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Member added",
        description: `${email} has been added to the organization`,
      });
      queryClient.invalidateQueries({ queryKey: ['organization-members', organization?.id] });
      setOpen(false);
      setEmail("");
      setRole("member");
    },
    onError: (error: any) => {
      toast({
        title: "Error adding member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Email is required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (!organization?.id) {
      toast({
        title: "Organization required",
        description: "No organization context found",
        variant: "destructive",
      });
      return;
    }

    addMember({ 
      email: email.trim(), 
      role,
      organization_id: organization.id
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Organization Member</DialogTitle>
          <DialogDescription>
            Invite a user to join this organization. They must already have an account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                placeholder="user@example.com"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}