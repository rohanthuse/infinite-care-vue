
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
import { useCreateAdmin } from "@/data/hooks/useCreateAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
}

export const CreateAdminDialog: React.FC<CreateAdminDialogProps> = ({
  open,
  onOpenChange,
  branchId,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
  });

  const createAdminMutation = useCreateAdmin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.first_name || !formData.last_name || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    createAdminMutation.mutate(
      {
        ...formData,
        branch_ids: [branchId],
      },
      {
        onSuccess: async (adminResult) => {
          // Create default permissions for the new admin
          if (adminResult?.user?.id) {
            try {
              const { error: permissionsError } = await supabase
                .from('admin_permissions')
                .insert({
                  admin_id: adminResult.user.id,
                  branch_id: branchId,
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
                });

              if (permissionsError) {
                console.error("Error creating admin permissions:", permissionsError);
              }
            } catch (error) {
              console.error("Error setting up permissions:", error);
            }
          }
          
          toast.success("Admin user created successfully! Welcome email sent to " + formData.email);
          setFormData({ email: "", first_name: "", last_name: "", password: "" });
          onOpenChange(false);
        },
        onError: (error: any) => {
          console.error("Create admin error:", error);
          toast.error(error.message || "Failed to create admin user");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Admin User</DialogTitle>
          <DialogDescription>
            Create a new admin user for this branch to enable booking creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="first_name" className="text-right">
                First Name
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last_name" className="text-right">
                Last Name
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={createAdminMutation.isPending}
            >
              {createAdminMutation.isPending ? "Creating..." : "Create Admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
