
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Edit } from "lucide-react";
import { useUpdateCarer, CarerDB } from "@/data/hooks/useBranchCarers";
import { toast } from "sonner";
import { useControlledDialog } from "@/hooks/useDialogManager";

interface EditCarerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carer: CarerDB | null;
  trigger?: React.ReactNode;
  mode?: 'view' | 'edit';
}

export const EditCarerDialog = ({ open, onOpenChange, carer, trigger, mode = 'edit' }: EditCarerDialogProps) => {
  const isView = mode === 'view';
  
  // Use controlled dialog for proper cleanup and route change handling
  const dialogId = `edit-carer-${carer?.id || 'new'}`;
  const controlledDialog = useControlledDialog(dialogId, open);
  
  // Handle dialog state changes - call parent's onOpenChange
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    controlledDialog.onOpenChange(newOpen);
    onOpenChange(newOpen);
  }, [controlledDialog, onOpenChange]);
  
  // Cleanup on unmount - use empty dependency array to prevent infinite loop
  React.useEffect(() => {
    return () => {
      handleOpenChange(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Force UI unlock function for comprehensive cleanup
  const forceUIUnlock = React.useCallback(() => {
    // Remove any stuck overlays
    const overlays = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-alert-dialog-overlay]');
    overlays.forEach(overlay => overlay.remove());
    
    // Remove aria-hidden and inert from any elements
    document.querySelectorAll('[aria-hidden="true"], [inert]').forEach(el => {
      el.removeAttribute('aria-hidden');
      el.removeAttribute('inert');
    });
    
    // Aggressive body/html cleanup
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('pointer-events');
    document.documentElement.style.removeProperty('overflow');
    document.body.classList.remove('overflow-hidden');
    document.documentElement.classList.remove('overflow-hidden');
    document.body.removeAttribute('data-scroll-locked');
    document.documentElement.removeAttribute('data-scroll-locked');
  }, []);
  
  const [formData, setFormData] = useState({
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
    status: ""
  });

  const updateCarerMutation = useUpdateCarer();

  // Helper to parse existing address into structured components
  const parseAddress = (address: string | undefined) => {
    if (!address) return { house_no: '', street: '', city: '', county: '', pin_code: '' };
    
    const parts = address.split(',').map(p => p.trim());
    return {
      house_no: parts[0] || '',
      street: parts[1] || '',
      city: parts[2] || '',
      county: parts[3] || '',
      pin_code: parts[4] || ''
    };
  };

  useEffect(() => {
    if (carer) {
      const addressParts = parseAddress(carer.address);
      setFormData({
        first_name: carer.first_name || "",
        last_name: carer.last_name || "",
        email: carer.email || "",
        phone: carer.phone || "",
        house_no: addressParts.house_no,
        street: addressParts.street,
        city: addressParts.city,
        county: addressParts.county,
        pin_code: (carer as any).postcode || addressParts.pin_code,
        emergency_contact_name: carer.emergency_contact_name || "",
        emergency_contact_phone: carer.emergency_contact_phone || "",
        experience: carer.experience || "",
        specialization: carer.specialization || "",
        availability: carer.availability || "",
        date_of_birth: carer.date_of_birth || "",
        status: carer.status || "Active"
      });
    }
  }, [carer]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!carer) {
      toast.error("No carer selected");
      return;
    }
    
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim()) {
      toast.error("First name, last name, and email are required");
      return;
    }

    try {
      // Concatenate address fields into single string (same as Add form)
      const fullAddress = [
        formData.house_no,
        formData.street,
        formData.city,
        formData.county,
        formData.pin_code
      ].filter(part => part && part.trim()).join(', ');

      await updateCarerMutation.mutateAsync({
        id: carer.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        address: fullAddress,
        postcode: formData.pin_code,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        experience: formData.experience,
        specialization: formData.specialization,
        availability: formData.availability,
        date_of_birth: formData.date_of_birth,
        status: formData.status
      });
      handleOpenChange(false);
    } catch (error) {
      console.error("Error updating carer:", error);
    }
  };

  // Don't render if no carer is provided
  if (!carer) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onCloseAutoFocus={() => setTimeout(forceUIUnlock, 50)}
        onEscapeKeyDown={() => {
          handleOpenChange(false);
          setTimeout(forceUIUnlock, 50);
        }}
        onPointerDownOutside={() => {
          handleOpenChange(false);
          setTimeout(forceUIUnlock, 50);
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isView ? `Staff Details - ${carer.first_name} ${carer.last_name}` : `Edit Carer - ${carer.first_name} ${carer.last_name}`}
          </DialogTitle>
          <DialogDescription>
            {isView ? 'View detailed information about this carer.' : 'Update the carer information in the form below.'}
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
                disabled={isView}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                disabled={isView}
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
                disabled={isView}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={isView}
              />
            </div>
          </div>

          {/* Address Information - structured fields matching Add form */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h3 className="text-sm font-semibold text-foreground">Address Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="house_no">House No/Name</Label>
                <Input 
                  id="house_no" 
                  value={formData.house_no} 
                  onChange={(e) => handleInputChange("house_no", e.target.value)}
                  placeholder="e.g., 123 or Apartment 4B"
                  disabled={isView}
                />
              </div>
              <div>
                <Label htmlFor="street">Street</Label>
                <Input 
                  id="street" 
                  value={formData.street} 
                  onChange={(e) => handleInputChange("street", e.target.value)}
                  placeholder="e.g., High Street"
                  disabled={isView}
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
                  disabled={isView}
                />
              </div>
              <div>
                <Label htmlFor="county">County</Label>
                <Input 
                  id="county" 
                  value={formData.county} 
                  onChange={(e) => handleInputChange("county", e.target.value)}
                  placeholder="e.g., Greater London"
                  disabled={isView}
                />
              </div>
              <div>
                <Label htmlFor="pin_code">Postcode</Label>
                <Input 
                  id="pin_code" 
                  value={formData.pin_code} 
                  onChange={(e) => handleInputChange("pin_code", e.target.value)}
                  placeholder="e.g., MK9 1AA"
                  disabled={isView}
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
                disabled={isView}
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
                disabled={isView}
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
                disabled={isView}
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
                disabled={isView}
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
                disabled={isView}
              />
            </div>
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                disabled={isView}
              />
            </div>
          </div>

          {/* Status - Edit mode only field */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleInputChange("status", value)}
              disabled={isView}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Training">Training</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {isView ? (
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCarerMutation.isPending}>
                  {updateCarerMutation.isPending ? "Updating..." : "Update Carer"}
                </Button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
