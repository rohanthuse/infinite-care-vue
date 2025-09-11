import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save } from "lucide-react";
import { format } from "date-fns";
import { useClientPersonalInfo } from "@/hooks/useClientPersonalInfo";
import { useClientServiceActions } from "@/hooks/useClientServiceActions";
import { useClientVaccinations } from "@/hooks/useClientVaccinations";
import { ServiceActionsTab } from "@/components/care/tabs/ServiceActionsTab";
import { VaccinationDialog } from "@/components/care/dialogs/VaccinationDialog";
interface PersonalInfoTabProps {
  client: any;
  isEditing?: boolean;
  onSave?: (data: any) => void;
  isSaving?: boolean;
}
export const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  client,
  isEditing = false,
  onSave,
  isSaving = false
}) => {
  const [formData, setFormData] = useState({
    title: client?.title || '',
    first_name: client?.first_name || '',
    middle_name: client?.middle_name || '',
    last_name: client?.last_name || '',
    preferred_name: client?.preferred_name || '',
    pronouns: client?.pronouns || '',
    date_of_birth: client?.date_of_birth || '',
    gender: client?.gender || '',
    other_identifier: client?.other_identifier || '',
    email: client?.email || '',
    phone: client?.phone || '',
    mobile_number: client?.mobile_number || '',
    telephone_number: client?.telephone_number || '',
    country_code: client?.country_code || '',
    address: client?.address || client?.location || '',
    pin_code: client?.pin_code || '',
    region: client?.region || '',
    status: client?.status || '',
    referral_route: client?.referral_route || '',
    avatar_initials: client?.avatar_initials || client?.avatar || '',
    additional_information: client?.additional_information || ''
  });
  useEffect(() => {
    if (client) {
      setFormData({
        title: client?.title || '',
        first_name: client?.first_name || '',
        middle_name: client?.middle_name || '',
        last_name: client?.last_name || '',
        preferred_name: client?.preferred_name || '',
        pronouns: client?.pronouns || '',
        date_of_birth: client?.date_of_birth || '',
        gender: client?.gender || '',
        other_identifier: client?.other_identifier || '',
        email: client?.email || '',
        phone: client?.phone || '',
        mobile_number: client?.mobile_number || '',
        telephone_number: client?.telephone_number || '',
        country_code: client?.country_code || '',
        address: client?.address || client?.location || '',
        pin_code: client?.pin_code || '',
        region: client?.region || '',
        status: client?.status || '',
        referral_route: client?.referral_route || '',
        avatar_initials: client?.avatar_initials || client?.avatar || '',
        additional_information: client?.additional_information || ''
      });
    }
  }, [client]);
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSave = () => {
    if (onSave) {
      // Sanitize form data before saving
      const sanitizedData = Object.entries(formData).reduce((acc, [key, value]) => {
        // Convert empty strings to null
        if (typeof value === 'string') {
          const trimmedValue = value.trim();
          acc[key] = trimmedValue === '' ? null : trimmedValue;
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      onSave(sanitizedData);
    }
  };
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return dateString;
    }
  };
  const displayName = client.preferred_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.name;

  // Parse address into components
  const parseAddress = (address: string) => {
    if (!address) return {};
    
    const parts = address.split(',').map(part => part.trim());
    return {
      houseNo: parts[0] || '',
      street: parts[1] || '',
      city: parts[parts.length - 3] || '',
      county: parts[parts.length - 2] || '',
      postcode: parts[parts.length - 1] || '',
      country: 'United Kingdom' // Default assumption
    };
  };

  const addressComponents = parseAddress(client.address || client.location || '');
  if (isEditing) {
    return <div className="space-y-6">
        <Card className="p-4 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={formData.title} onChange={e => handleInputChange('title', e.target.value)} placeholder="e.g., Mr, Mrs, Ms, Dr" />
            </div>
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" value={formData.first_name} onChange={e => handleInputChange('first_name', e.target.value)} placeholder="First name" />
            </div>
            <div>
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input id="middle_name" value={formData.middle_name} onChange={e => handleInputChange('middle_name', e.target.value)} placeholder="Middle name" />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" value={formData.last_name} onChange={e => handleInputChange('last_name', e.target.value)} placeholder="Last name" />
            </div>
            <div>
              <Label htmlFor="preferred_name">Preferred Name</Label>
              <Input id="preferred_name" value={formData.preferred_name} onChange={e => handleInputChange('preferred_name', e.target.value)} placeholder="Preferred name" />
            </div>
            <div>
              <Label htmlFor="pronouns">Pronouns</Label>
              <Input id="pronouns" value={formData.pronouns} onChange={e => handleInputChange('pronouns', e.target.value)} placeholder="e.g., he/him, she/her, they/them" />
            </div>
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={e => handleInputChange('date_of_birth', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={value => handleInputChange('gender', value)}>
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
            <div>
              <Label htmlFor="other_identifier">Other Identifier</Label>
              <Input id="other_identifier" value={formData.other_identifier} onChange={e => handleInputChange('other_identifier', e.target.value)} placeholder="Other identifier" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-border shadow-sm">
          <h3 className="text-lg font-medium mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} placeholder="email@example.com" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} placeholder="Phone number" />
            </div>
            <div>
              <Label htmlFor="mobile_number">Mobile Number</Label>
              <Input id="mobile_number" value={formData.mobile_number} onChange={e => handleInputChange('mobile_number', e.target.value)} placeholder="Mobile number" />
            </div>
            <div>
              <Label htmlFor="telephone_number">Telephone</Label>
              <Input id="telephone_number" value={formData.telephone_number} onChange={e => handleInputChange('telephone_number', e.target.value)} placeholder="Telephone number" />
            </div>
            <div>
              <Label htmlFor="country_code">Country Code</Label>
              <Input id="country_code" value={formData.country_code} onChange={e => handleInputChange('country_code', e.target.value)} placeholder="e.g., +1, +44" />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} placeholder="Full address" />
            </div>
            <div>
              <Label htmlFor="pin_code">Post Code</Label>
              <Input id="pin_code" value={formData.pin_code} onChange={e => handleInputChange('pin_code', e.target.value)} placeholder="Postal/Pin code" />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Input id="region" value={formData.region} onChange={e => handleInputChange('region', e.target.value)} placeholder="Region" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-border shadow-sm">
          <h3 className="text-lg font-medium mb-4">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={value => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="referral_route">Referral Route</Label>
              <Input id="referral_route" value={formData.referral_route} onChange={e => handleInputChange('referral_route', e.target.value)} placeholder="How did they find us?" />
            </div>
            <div>
              <Label htmlFor="avatar_initials">Avatar Initials</Label>
              <Input id="avatar_initials" value={formData.avatar_initials} onChange={e => handleInputChange('avatar_initials', e.target.value)} placeholder="e.g., JD" maxLength={3} />
            </div>
          </div>
          
          <div className="mt-4">
            <Label htmlFor="additional_information">Additional Information</Label>
            <Textarea id="additional_information" value={formData.additional_information} onChange={e => handleInputChange('additional_information', e.target.value)} placeholder="Any additional notes or information about the client" rows={4} />
          </div>
        </Card>
      </div>;
  }
  const { data: personalInfo, isLoading: isPersonalInfoLoading } = useClientPersonalInfo(client?.id);
  const { data: serviceActions, isLoading: isServiceActionsLoading } = useClientServiceActions(client?.id);
  const { data: vaccinations, isLoading: isVaccinationsLoading } = useClientVaccinations(client?.id);

  return <div className="space-y-6">
      <Tabs defaultValue="personal-details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal-details">Personal Details</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
          <TabsTrigger value="related-info">Related Info</TabsTrigger>
          <TabsTrigger value="service-actions">Service Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="personal-details" className="mt-6">
          <Card className="p-4 border border-border shadow-sm">
            <h3 className="text-lg font-medium mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Title</h4>
                <p className="mt-1">{client.title || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">First Name</h4>
                <p className="mt-1">{client.first_name || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Middle Name</h4>
                <p className="mt-1">{client.middle_name || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Last Name</h4>
                <p className="mt-1">{client.last_name || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Preferred Name</h4>
                <p className="mt-1">{client.preferred_name || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Pronouns</h4>
                <p className="mt-1">{client.pronouns || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Date of Birth</h4>
                <p className="mt-1">{formatDate(client.date_of_birth)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Gender</h4>
                <p className="mt-1">{client.gender || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Client ID</h4>
                <p className="mt-1">{client.id}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Other Identifier</h4>
                <p className="mt-1">{client.other_identifier || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                <p className="mt-1">{client.status || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Registered On</h4>
                <p className="mt-1">{formatDate(client.registered_on || client.registeredOn)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Referral Route</h4>
                <p className="mt-1">{client.referral_route || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Avatar Initials</h4>
                <p className="mt-1">{client.avatar_initials || client.avatar || 'Not provided'}</p>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                  <p className="mt-1">{client.email || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                  <p className="mt-1">{client.phone || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Mobile Number</h4>
                  <p className="mt-1">{client.mobile_number || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Telephone</h4>
                  <p className="mt-1">{client.telephone_number || 'Not provided'}</p>
                </div>
              </div>
            </div>
            
            {client.additional_information && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-muted-foreground">Additional Information</h4>
                <p className="mt-1 whitespace-pre-wrap">{client.additional_information}</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="address" className="mt-6">
          <Card className="p-4 border border-border shadow-sm">
            <h3 className="text-lg font-medium mb-4">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  House No/Name <span className="text-red-500">*</span>
                </h4>
                <p className="mt-1">{addressComponents.houseNo || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Street <span className="text-red-500">*</span>
                </h4>
                <p className="mt-1">{addressComponents.street || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Country <span className="text-red-500">*</span>
                </h4>
                <p className="mt-1">{addressComponents.country || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  County <span className="text-red-500">*</span>
                </h4>
                <p className="mt-1">{addressComponents.county || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  City <span className="text-red-500">*</span>
                </h4>
                <p className="mt-1">{addressComponents.city || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Postcode <span className="text-red-500">*</span>
                </h4>
                <p className="mt-1">{addressComponents.postcode || client.pin_code || 'Not provided'}</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="related-info" className="mt-6">
          {isPersonalInfoLoading ? (
            <Card className="p-4 border border-border shadow-sm">
              <p>Loading related information...</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Background & Identity Section */}
              <Card className="p-4 border border-border shadow-sm">
                <h3 className="text-lg font-medium mb-4">Background & Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Ethnicity</h4>
                    <p className="mt-1">{personalInfo?.ethnicity || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Sexual Orientation</h4>
                    <p className="mt-1">{personalInfo?.sexual_orientation || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Gender Identity</h4>
                    <p className="mt-1">{personalInfo?.gender_identity || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Nationality</h4>
                    <p className="mt-1">{personalInfo?.nationality || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Primary Language</h4>
                    <p className="mt-1">{personalInfo?.primary_language || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Interpreter Required</h4>
                    <p className="mt-1">{personalInfo?.interpreter_required ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Preferred Interpreter Language</h4>
                    <p className="mt-1">{personalInfo?.preferred_interpreter_language || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Religion</h4>
                    <p className="mt-1">{personalInfo?.religion || 'Not provided'}</p>
                  </div>
                </div>
              </Card>

              {/* My Home Section */}
              <Card className="p-4 border border-border shadow-sm">
                <h3 className="text-lg font-medium mb-4">My Home</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Property Type</h4>
                    <p className="mt-1">{personalInfo?.property_type || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Living Arrangement</h4>
                    <p className="mt-1">{personalInfo?.living_arrangement || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Home Accessibility</h4>
                    <p className="mt-1">{personalInfo?.home_accessibility || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Pets</h4>
                    <p className="mt-1">{personalInfo?.pets || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Key Safe Location</h4>
                    <p className="mt-1">{personalInfo?.key_safe_location || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Parking Availability</h4>
                    <p className="mt-1">{personalInfo?.parking_availability || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Emergency Access</h4>
                    <p className="mt-1">{personalInfo?.emergency_access || 'Not provided'}</p>
                  </div>
                </div>
              </Card>

              {/* Vaccination Section */}
              <Card className="p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Vaccination</h3>
                  <VaccinationDialog clientId={client?.id} />
                </div>
                {isVaccinationsLoading ? (
                  <p>Loading vaccinations...</p>
                ) : vaccinations && vaccinations.length > 0 ? (
                  <div className="space-y-3">
                    {vaccinations.map((vaccination) => (
                      <div key={vaccination.id} className="border rounded-lg p-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Vaccination</h4>
                            <p className="mt-1 font-medium">{vaccination.vaccination_name}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                            <p className="mt-1">{formatDate(vaccination.vaccination_date)}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Next Due</h4>
                            <p className="mt-1">{vaccination.next_due_date ? formatDate(vaccination.next_due_date) : 'N/A'}</p>
                          </div>
                        </div>
                        {vaccination.notes && (
                          <div className="mt-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                            <p className="mt-1 text-sm">{vaccination.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No vaccination records found.</p>
                )}
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="service-actions" className="mt-6">
          {isServiceActionsLoading ? (
            <Card className="p-4 border border-border shadow-sm">
              <p>Loading service actions...</p>
            </Card>
          ) : (
            <ServiceActionsTab 
              serviceActions={serviceActions || []} 
              onAddServiceAction={() => {}} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>;
};