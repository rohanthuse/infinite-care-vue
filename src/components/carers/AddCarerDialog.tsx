
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCarerPreapproved, CreateCarerData } from "@/data/hooks/useBranchCarers";
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
    house_no: "",
    street: "",
    city: "",
    county: "",
    pin_code: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    experience: "",
    specialization: "",
    availability: "",
    date_of_birth: "",
    branch_id: branchId
  });

  const createCarerMutation = useCreateCarerPreapproved();

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
      // Concatenate address fields into single string
      const fullAddress = [
        formData.house_no,
        formData.street,
        formData.city,
        formData.county,
        formData.pin_code
      ].filter(part => part && part.trim()).join(', ');

      await createCarerMutation.mutateAsync({
        ...formData,
        address: fullAddress,
        postcode: formData.pin_code,
        branch_id: branchId
      });
      
      // Reset form and close dialog
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        house_no: "",
        street: "",
        city: "",
        county: "",
        pin_code: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
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
          <DialogDescription>
            Fill out the form below to add a new carer to this branch. Required fields are marked with *.
          </DialogDescription>
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

          {/* SECTION: Address Information */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h3 className="text-sm font-semibold text-gray-900">Address Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="house_no">House No/Name</Label>
                <Input 
                  id="house_no" 
                  value={formData.house_no} 
                  onChange={(e) => handleInputChange("house_no", e.target.value)}
                  placeholder="e.g., 123 or Apartment 4B"
                />
              </div>
              <div>
                <Label htmlFor="street">Street</Label>
                <Input 
                  id="street" 
                  value={formData.street} 
                  onChange={(e) => handleInputChange("street", e.target.value)}
                  placeholder="e.g., High Street"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  value={formData.city} 
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="e.g., London"
                />
              </div>
              <div>
                <Label htmlFor="county">County</Label>
                <Input 
                  id="county" 
                  value={formData.county} 
                  onChange={(e) => handleInputChange("county", e.target.value)}
                  placeholder="e.g., Greater London"
                />
              </div>
              <div>
                <Label htmlFor="pin_code">Postcode</Label>
                <Input 
                  id="pin_code" 
                  value={formData.pin_code} 
                  onChange={(e) => handleInputChange("pin_code", e.target.value)}
                  placeholder="e.g., MK9 1AA"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
              <Input
                id="emergency_contact_name"
                type="text"
                placeholder="Full name of emergency contact person"
                value={formData.emergency_contact_name}
                onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Name of person to contact in case of emergency
              </p>
            </div>
            <div>
              <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
              <Input
                id="emergency_contact_phone"
                type="tel"
                placeholder="e.g., +44 123 456 7890"
                pattern="[+]?[\d\s\-\(\)]*"
                value={formData.emergency_contact_phone}
                onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Phone number to reach your emergency contact
              </p>
            </div>
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
              {createCarerMutation.isPending ? "Creating..." : "Create Pre-Approved Carer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
