import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Edit, Save, X } from "lucide-react";
import { useCarerProfileById } from "@/hooks/useCarerProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface CarerPersonalDetailsTabProps {
  carerId: string;
}

// Helper function to parse concatenated address string
const parseAddress = (addressString: string | null | undefined) => {
  if (!addressString || addressString.trim() === '') {
    return {
      house_no: '',
      street: '',
      city: '',
      county: '',
      pin_code: ''
    };
  }
  
  // Split by comma and trim whitespace
  const parts = addressString.split(',').map(part => part.trim());
  
  // Map parts to fields (handle cases where some parts might be missing)
  return {
    house_no: parts[0] || '',
    street: parts[1] || '',
    city: parts[2] || '',
    county: parts[3] || '',
    pin_code: parts[4] || ''
  };
};

export const CarerPersonalDetailsTab: React.FC<CarerPersonalDetailsTabProps> = ({ carerId }) => {
  const { data: carer } = useCarerProfileById(carerId);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState(() => {
    const parsedAddress = parseAddress(carer?.address);
    
    return {
      first_name: carer?.first_name || '',
      last_name: carer?.last_name || '',
      email: carer?.email || '',
      phone: carer?.phone || '',
      ...parsedAddress,
      date_of_birth: carer?.date_of_birth || '',
      national_insurance_number: carer?.national_insurance_number || '',
      emergency_contact_name: carer?.emergency_contact_name || '',
      emergency_contact_phone: carer?.emergency_contact_phone || ''
    };
  });

  // Update form data when carer data changes
  React.useEffect(() => {
    if (carer) {
      const parsedAddress = parseAddress(carer.address);
      setFormData({
        first_name: carer.first_name || '',
        last_name: carer.last_name || '',
        email: carer.email || '',
        phone: carer.phone || '',
        ...parsedAddress,
        date_of_birth: carer.date_of_birth || '',
        national_insurance_number: carer.national_insurance_number || '',
        emergency_contact_name: carer.emergency_contact_name || '',
        emergency_contact_phone: carer.emergency_contact_phone || ''
      });
    }
  }, [carer]);

  const handleSave = async () => {
    try {
      // Concatenate address fields into single string
      const fullAddress = [
        formData.house_no,
        formData.street,
        formData.city,
        formData.county,
        formData.pin_code
      ].filter(part => part && part.trim()).join(', ');
      
      const { error } = await supabase
        .from('staff')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          address: fullAddress,
          date_of_birth: formData.date_of_birth,
          national_insurance_number: formData.national_insurance_number,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', carerId);

      if (error) throw error;

      // Invalidate cache to refresh UI with new data
      await queryClient.invalidateQueries({ queryKey: ['carer-profile-by-id', carerId] });
      await queryClient.invalidateQueries({ queryKey: ['carer-profile'] });
      await queryClient.invalidateQueries({ queryKey: ['staff-profile', carerId] });
      await queryClient.invalidateQueries({ queryKey: ['branch-carers'] });

      toast({
        title: "Personal details updated",
        description: "Changes have been saved successfully."
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating staff details:', error);
      toast({
        title: "Error updating details",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    const parsedAddress = parseAddress(carer?.address);
    
    setFormData({
      first_name: carer?.first_name || '',
      last_name: carer?.last_name || '',
      email: carer?.email || '',
      phone: carer?.phone || '',
      ...parsedAddress,
      date_of_birth: carer?.date_of_birth || '',
      national_insurance_number: carer?.national_insurance_number || '',
      emergency_contact_name: carer?.emergency_contact_name || '',
      emergency_contact_phone: carer?.emergency_contact_phone || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              {isEditing ? (
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                />
              ) : (
                <p className="text-sm text-muted-foreground p-2">{carer?.first_name || 'Not provided'}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              {isEditing ? (
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                />
              ) : (
                <p className="text-sm text-muted-foreground p-2">{carer?.last_name || 'Not provided'}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              ) : (
                <p className="text-sm text-muted-foreground p-2">{carer?.email || 'Not provided'}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              ) : (
                <p className="text-sm text-muted-foreground p-2">{carer?.phone || 'Not provided'}</p>
              )}
            </div>

            {/* Address Information Section */}
            <div className="md:col-span-2 space-y-3 border-t pt-4">
              <div className="border-b pb-2">
                <h3 className="text-sm font-semibold text-gray-900">Address Information</h3>
              </div>
              
              {isEditing ? (
                <>
                  {/* Edit Mode: Structured Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="house_no">House No/Name</Label>
                      <Input 
                        id="house_no" 
                        value={formData.house_no} 
                        onChange={(e) => setFormData({...formData, house_no: e.target.value})}
                        placeholder="e.g., 123 or Apartment 4B"
                      />
                    </div>
                    <div>
                      <Label htmlFor="street">Street</Label>
                      <Input 
                        id="street" 
                        value={formData.street} 
                        onChange={(e) => setFormData({...formData, street: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        placeholder="e.g., London"
                      />
                    </div>
                    <div>
                      <Label htmlFor="county">County</Label>
                      <Input 
                        id="county" 
                        value={formData.county} 
                        onChange={(e) => setFormData({...formData, county: e.target.value})}
                        placeholder="e.g., Greater London"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pin_code">Postcode</Label>
                      <Input 
                        id="pin_code" 
                        value={formData.pin_code} 
                        onChange={(e) => setFormData({...formData, pin_code: e.target.value})}
                        placeholder="e.g., MK9 1AA"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* View Mode: Display Structured Address */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">House No/Name</Label>
                      <p className="text-sm p-2">{formData.house_no || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Street</Label>
                      <p className="text-sm p-2">{formData.street || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">City</Label>
                      <p className="text-sm p-2">{formData.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">County</Label>
                      <p className="text-sm p-2">{formData.county || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Postcode</Label>
                      <p className="text-sm p-2">{formData.pin_code || 'Not provided'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              {isEditing ? (
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                />
              ) : (
                <p className="text-sm text-muted-foreground p-2">
                  {carer?.date_of_birth ? new Date(carer.date_of_birth).toLocaleDateString() : 'Not provided'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="ni_number">National Insurance Number</Label>
              {isEditing ? (
                <Input
                  id="ni_number"
                  value={formData.national_insurance_number}
                  onChange={(e) => setFormData({...formData, national_insurance_number: e.target.value})}
                />
              ) : (
                <p className="text-sm text-muted-foreground p-2">{carer?.national_insurance_number || 'Not provided'}</p>
              )}
            </div>

            <div>
              <Label htmlFor="emergency_name">Emergency Contact Name</Label>
              {isEditing ? (
                <Input
                  id="emergency_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                />
              ) : (
                <p className="text-sm text-muted-foreground p-2">{carer?.emergency_contact_name || 'Not provided'}</p>
              )}
            </div>

            <div>
              <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
              {isEditing ? (
                <Input
                  id="emergency_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                />
              ) : (
                <p className="text-sm text-muted-foreground p-2">{carer?.emergency_contact_phone || 'Not provided'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};