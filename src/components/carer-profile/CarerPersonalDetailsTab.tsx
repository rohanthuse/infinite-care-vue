import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Edit, Save, X } from "lucide-react";
import { useCarerProfileById } from "@/hooks/useCarerProfile";
import { useToast } from "@/hooks/use-toast";

interface CarerPersonalDetailsTabProps {
  carerId: string;
}

export const CarerPersonalDetailsTab: React.FC<CarerPersonalDetailsTabProps> = ({ carerId }) => {
  const { data: carer } = useCarerProfileById(carerId);
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: carer?.first_name || '',
    last_name: carer?.last_name || '',
    email: carer?.email || '',
    phone: carer?.phone || '',
    address: carer?.address || '',
    date_of_birth: carer?.date_of_birth || '',
    national_insurance_number: carer?.national_insurance_number || '',
    emergency_contact_name: carer?.emergency_contact_name || '',
    emergency_contact_phone: carer?.emergency_contact_phone || ''
  });

  const handleSave = () => {
    // TODO: Implement save functionality with Supabase
    toast({
      title: "Personal details updated",
      description: "Changes have been saved successfully."
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      first_name: carer?.first_name || '',
      last_name: carer?.last_name || '',
      email: carer?.email || '',
      phone: carer?.phone || '',
      address: carer?.address || '',
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

            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              {isEditing ? (
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              ) : (
                <p className="text-sm text-muted-foreground p-2">{carer?.address || 'Not provided'}</p>
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