
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCarerWithInvitation, CreateCarerData } from "@/data/hooks/useBranchCarers";
import { toast } from "sonner";

interface AddCarerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
}

export const AddCarerDialog = ({ open, onOpenChange, branchId }: AddCarerDialogProps) => {
  const [formData, setFormData] = useState<CreateCarerData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    experience: "",
    specialization: "",
    availability: "",
    date_of_birth: "",
    branch_id: branchId
  });

  const createCarerMutation = useCreateCarerWithInvitation();

  const handleInputChange = (field: keyof CreateCarerData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim()) {
      toast.error("First name, last name, and email are required");
      return;
    }

    try {
      await createCarerMutation.mutateAsync({
        ...formData,
        branch_id: branchId
      });
      
      // Reset form and close dialog
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        experience: "",
        specialization: "",
        availability: "",
        date_of_birth: "",
        branch_id: branchId
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating carer:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Carer</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Select 
                value={formData.specialization} 
                onValueChange={(value) => handleInputChange("specialization", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General Care">General Care</SelectItem>
                  <SelectItem value="Dementia Care">Dementia Care</SelectItem>
                  <SelectItem value="Physical Disabilities">Physical Disabilities</SelectItem>
                  <SelectItem value="Mental Health">Mental Health</SelectItem>
                  <SelectItem value="Learning Disabilities">Learning Disabilities</SelectItem>
                  <SelectItem value="Palliative Care">Palliative Care</SelectItem>
                  <SelectItem value="Respite Care">Respite Care</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="availability">Availability</Label>
              <Select 
                value={formData.availability} 
                onValueChange={(value) => handleInputChange("availability", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Flexible">Flexible</SelectItem>
                  <SelectItem value="Weekends Only">Weekends Only</SelectItem>
                  <SelectItem value="Night Shifts">Night Shifts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="experience">Experience</Label>
              <Input
                id="experience"
                value={formData.experience}
                onChange={(e) => handleInputChange("experience", e.target.value)}
                placeholder="e.g., 5 years"
              />
            </div>
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCarerMutation.isPending}>
              {createCarerMutation.isPending ? "Creating..." : "Create Carer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
