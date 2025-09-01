import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  onSuccess: () => void;
}
export const AddClientDialog: React.FC<AddClientDialogProps> = ({
  open,
  onOpenChange,
  branchId,
  onSuccess
}) => {
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    pin_code: "",
    status: "New Enquiries",
    region: "North",
    date_of_birth: "",
    gender: "",
    emergency_contact: "",
    emergency_phone: "",
    gp_details: "",
    mobility_status: "",
    communication_preferences: "",
    additional_information: ""
  });
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const generateAvatarInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Check authentication first
      const {
        data: {
          user
        },
        error: authError
      } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to add clients. Please refresh and try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      console.log("Adding client with user:", user.id, "to branch:", branchId);

      // Prepare client data
      const clientData = {
        ...formData,
        branch_id: branchId,
        avatar_initials: generateAvatarInitials(formData.first_name, formData.last_name),
        registered_on: new Date().toISOString().split('T')[0],
        date_of_birth: formData.date_of_birth || null
      };
      console.log("Client data to insert:", clientData);
      const {
        data,
        error
      } = await supabase.from('clients').insert(clientData).select().single();
      if (error) {
        console.error("Error adding client:", error);

        // Provide specific error messages
        if (error.message.includes('row-level security policy')) {
          toast({
            title: "Permission Error",
            description: "You don't have permission to add clients to this branch. Please contact your administrator.",
            variant: "destructive"
          });
        } else if (error.message.includes('duplicate key')) {
          toast({
            title: "Duplicate Client",
            description: "A client with this email already exists.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to add client: ${error.message}`,
            variant: "destructive"
          });
        }
        setIsLoading(false);
        return;
      }
      console.log("Client added successfully:", data);
      toast({
        title: "Success",
        description: "Client has been added successfully."
      });

      // Reset form and close dialog
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        pin_code: "",
        status: "New Enquiries",
        region: "North",
        date_of_birth: "",
        gender: "",
        emergency_contact: "",
        emergency_phone: "",
        gp_details: "",
        mobility_status: "",
        communication_preferences: "",
        additional_information: ""
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input id="first_name" value={formData.first_name} onChange={e => handleInputChange("first_name", e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input id="last_name" value={formData.last_name} onChange={e => handleInputChange("last_name", e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone} onChange={e => handleInputChange("phone", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={formData.address} onChange={e => handleInputChange("address", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="pin_code">Post Code</Label>
              <Input id="pin_code" value={formData.pin_code} onChange={e => handleInputChange("pin_code", e.target.value)} placeholder="e.g., MK9 1AA" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={value => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="New Enquiries">New Enquiries</SelectItem>
                  <SelectItem value="Actively Assessing">Actively Assessing</SelectItem>
                  <SelectItem value="Closed Enquiries">Closed Enquiries</SelectItem>
                  <SelectItem value="Former">Former</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Select value={formData.region} onValueChange={value => handleInputChange("region", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="North">North</SelectItem>
                  <SelectItem value="South">South</SelectItem>
                  <SelectItem value="East">East</SelectItem>
                  <SelectItem value="West">West</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={e => handleInputChange("date_of_birth", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={value => handleInputChange("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergency_contact">Emergency Contact Person</Label>
              <Input id="emergency_contact" value={formData.emergency_contact} onChange={e => handleInputChange("emergency_contact", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="emergency_phone">Emergency Phone</Label>
              <Input id="emergency_phone" value={formData.emergency_phone} onChange={e => handleInputChange("emergency_phone", e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="gp_details">GP Details</Label>
            <Input id="gp_details" value={formData.gp_details} onChange={e => handleInputChange("gp_details", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mobility_status">Mobility Status</Label>
              <Select value={formData.mobility_status} onValueChange={value => handleInputChange("mobility_status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mobility status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Independent">Independent</SelectItem>
                  <SelectItem value="Assisted">Assisted</SelectItem>
                  <SelectItem value="Wheelchair">Wheelchair</SelectItem>
                  <SelectItem value="Bed bound">Bed bound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="communication_preferences">Communication Preferences</Label>
              <Select value={formData.communication_preferences} onValueChange={value => handleInputChange("communication_preferences", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="Post">Post</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="additional_information">Additional Information</Label>
            <Textarea id="additional_information" value={formData.additional_information} onChange={e => handleInputChange("additional_information", e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};