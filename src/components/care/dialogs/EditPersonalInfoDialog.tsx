
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditPersonalInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  clientData?: any;
  isLoading?: boolean;
}

export const EditPersonalInfoDialog: React.FC<EditPersonalInfoDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  clientData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    address: "",
    gender: "",
    preferred_name: "",
    title: "",
    middle_name: "",
    telephone_number: "",
    mobile_number: "",
    country_code: "",
    region: "",
    pronouns: "",
    other_identifier: "",
    additional_information: "",
  });

  useEffect(() => {
    if (clientData && open) {
      setFormData({
        first_name: clientData.first_name || "",
        last_name: clientData.last_name || "",
        email: clientData.email || "",
        phone: clientData.phone || "",
        date_of_birth: clientData.date_of_birth || "",
        address: clientData.address || "",
        gender: clientData.gender || "",
        preferred_name: clientData.preferred_name || "",
        title: clientData.title || "",
        middle_name: clientData.middle_name || "",
        telephone_number: clientData.telephone_number || "",
        mobile_number: clientData.mobile_number || "",
        country_code: clientData.country_code || "",
        region: clientData.region || "",
        pronouns: clientData.pronouns || "",
        other_identifier: clientData.other_identifier || "",
        additional_information: clientData.additional_information || "",
      });
    }
  }, [clientData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Personal Information</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Select value={formData.title} onValueChange={(value) => handleChange('title', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mr">Mr</SelectItem>
                  <SelectItem value="Mrs">Mrs</SelectItem>
                  <SelectItem value="Ms">Ms</SelectItem>
                  <SelectItem value="Miss">Miss</SelectItem>
                  <SelectItem value="Dr">Dr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input
                id="middle_name"
                value={formData.middle_name}
                onChange={(e) => handleChange('middle_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_name">Preferred Name</Label>
              <Input
                id="preferred_name"
                value={formData.preferred_name}
                onChange={(e) => handleChange('preferred_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pronouns">Pronouns</Label>
              <Select value={formData.pronouns} onValueChange={(value) => handleChange('pronouns', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pronouns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="he/him">He/Him</SelectItem>
                  <SelectItem value="she/her">She/Her</SelectItem>
                  <SelectItem value="they/them">They/Them</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile_number">Mobile Number</Label>
              <Input
                id="mobile_number"
                value={formData.mobile_number}
                onChange={(e) => handleChange('mobile_number', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone_number">Telephone Number</Label>
              <Input
                id="telephone_number"
                value={formData.telephone_number}
                onChange={(e) => handleChange('telephone_number', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country_code">Country Code</Label>
              <Input
                id="country_code"
                value={formData.country_code}
                onChange={(e) => handleChange('country_code', e.target.value)}
                placeholder="+44"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => handleChange('region', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="other_identifier">Other Identifier</Label>
              <Input
                id="other_identifier"
                value={formData.other_identifier}
                onChange={(e) => handleChange('other_identifier', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional_information">Additional Information</Label>
            <Textarea
              id="additional_information"
              value={formData.additional_information}
              onChange={(e) => handleChange('additional_information', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
