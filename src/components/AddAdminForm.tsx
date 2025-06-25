
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
import { useCreateAdmin } from "@/data/hooks/useCreateAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
    branch_id: "",
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.first_name || !formData.last_name || !formData.password || !formData.branch_id) {
      toast.error("Please fill in all fields");
      return;
    }

    createAdminMutation.mutate(formData, {
      onSuccess: () => {
        toast.success("Admin user created successfully!");
        setFormData({ 
          email: "", 
          first_name: "", 
          last_name: "", 
          password: "",
          branch_id: "" 
        });
        onAdminAdded();
        onClose();
      },
      onError: (error: any) => {
        console.error("Create admin error:", error);
        toast.error(error.message || "Failed to create admin user");
      },
    });
  };

  const handleClose = () => {
    setFormData({ 
      email: "", 
      first_name: "", 
      last_name: "", 
      password: "",
      branch_id: "" 
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Branch Admin</DialogTitle>
          <DialogDescription>
            Create a new administrator account for a branch location.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="branch">Branch *</Label>
            <Select
              value={formData.branch_id}
              onValueChange={(value) =>
                setFormData({ ...formData, branch_id: value })
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

          <DialogFooter className="flex gap-2 pt-4">
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
