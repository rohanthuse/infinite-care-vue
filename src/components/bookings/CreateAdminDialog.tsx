
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
import { useInviteAdmin } from "@/data/hooks/useInviteAdmin";
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
    firstName: "",
    lastName: "",
  });

  const inviteAdminMutation = useInviteAdmin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast.error("Please fill in all fields");
      return;
    }

    // Use default permissions for quick admin creation
    const defaultPermissions = {
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

    inviteAdminMutation.mutate({
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      branchId: branchId,
      permissions: defaultPermissions
    }, {
      onSuccess: () => {
        setFormData({ email: "", firstName: "", lastName: "" });
        onOpenChange(false);
      },
      onError: (error: any) => {
        console.error("Create admin error:", error);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Admin User</DialogTitle>
          <DialogDescription>
            Send an invitation to create a new admin user for this branch to enable booking creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                First Name
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
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
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={inviteAdminMutation.isPending}
            >
              {inviteAdminMutation.isPending ? "Sending Invitation..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
