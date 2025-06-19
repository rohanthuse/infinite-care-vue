
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCreateCarer, CreateCarerData } from "@/data/hooks/useBranchCarers";

interface AddCarerDialogProps {
  branchId?: string;
}

export const AddCarerDialog = ({ branchId }: AddCarerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateCarerData>>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    experience: "",
    specialization: "",
    availability: "Full-time",
    date_of_birth: "",
  });

  const createCarerMutation = useCreateCarer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!branchId) {
      console.error('[AddCarerDialog] No branch ID provided');
      return;
    }

    if (!formData.first_name || !formData.last_name || !formData.email || !formData.specialization) {
      console.error('[AddCarerDialog] Missing required fields');
      return;
    }

    try {
      const carerData: CreateCarerData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || "",
        address: formData.address,
        experience: formData.experience,
        specialization: formData.specialization,
        availability: formData.availability || "Full-time",
        date_of_birth: formData.date_of_birth,
        branch_id: branchId,
      };

      await createCarerMutation.mutateAsync(carerData);
      
      // Reset form and close dialog
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        experience: "",
        specialization: "",
        availability: "Full-time",
        date_of_birth: "",
      });
      setOpen(false);
    } catch (error) {
      console.error('[AddCarerDialog] Error creating carer:', error);
    }
  };

  const handleInputChange = (field: keyof CreateCarerData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Carer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Carer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
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
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization *</Label>
            <Select value={formData.specialization} onValueChange={(value) => handleInputChange("specialization", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Home Care">Home Care</SelectItem>
                <SelectItem value="Elderly Care">Elderly Care</SelectItem>
                <SelectItem value="Disability Support">Disability Support</SelectItem>
                <SelectItem value="Mental Health">Mental Health</SelectItem>
                <SelectItem value="Physiotherapy">Physiotherapy</SelectItem>
                <SelectItem value="Nurse">Nurse</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <Select value={formData.availability} onValueChange={(value) => handleInputChange("availability", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Casual">Casual</SelectItem>
                <SelectItem value="On-call">On-call</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="experience">Experience</Label>
            <Input
              id="experience"
              value={formData.experience}
              onChange={(e) => handleInputChange("experience", e.target.value)}
              placeholder="e.g., 3 years"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCarerMutation.isPending}>
              {createCarerMutation.isPending ? "Adding..." : "Add Carer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
