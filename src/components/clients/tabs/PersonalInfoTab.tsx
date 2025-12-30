import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Edit, X, Loader2, FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { supabase } from '@/integrations/supabase/client';
import { useClientPersonalInfo, useUpdateClientPersonalInfo } from "@/hooks/useClientPersonalInfo";
import { useClientServiceActions, useCreateClientServiceAction } from "@/hooks/useClientServiceActions";
import { useClientVaccinations } from "@/hooks/useClientVaccinations";
import { useUpdateClient } from "@/hooks/useUpdateClient";
import { ServiceActionsTab } from "@/components/care/tabs/ServiceActionsTab";
import { VaccinationDialog } from "@/components/care/dialogs/VaccinationDialog";
import { AddServiceActionDialog } from "@/components/care/dialogs/AddServiceActionDialog";
import { ClientAddressSection } from "@/components/clients/address/ClientAddressSection";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
    telephone_number: client?.telephone_number || '',
    country_code: client?.country_code || '',
    address: client?.address || client?.location || '',
    pin_code: client?.pin_code || '',
    region: client?.region || '',
    status: client?.status || '',
    referral_route: client?.referral_route || '',
    avatar_initials: client?.avatar_initials || client?.avatar || '',
    additional_information: client?.additional_information || '',
    age_group: (client?.age_group === 'child' ? 'young_person' : client?.age_group) || 'adult',
    branch_id: client?.branch_id
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
        
        telephone_number: client?.telephone_number || '',
        country_code: client?.country_code || '',
        address: client?.address || client?.location || '',
        pin_code: client?.pin_code || '',
        region: client?.region || '',
        status: client?.status || '',
        referral_route: client?.referral_route || '',
        avatar_initials: client?.avatar_initials || client?.avatar || '',
        additional_information: client?.additional_information || '',
        age_group: (client?.age_group === 'child' ? 'young_person' : client?.age_group) || 'adult',
        branch_id: client?.branch_id
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
      postcode: parts[parts.length - 1] || ''
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
            <div>
              <Label htmlFor="age_group">Age Group</Label>
              <Select value={formData.age_group} onValueChange={value => handleInputChange('age_group', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adult">Adult (18+ years)</SelectItem>
                  <SelectItem value="young_person">Young Person (0-17 years)</SelectItem>
                </SelectContent>
              </Select>
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
  const [isAddServiceActionOpen, setIsAddServiceActionOpen] = useState(false);
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSavingRelatedInfo, setIsSavingRelatedInfo] = useState(false);
  
  const { data: personalInfo, isLoading: isPersonalInfoLoading, refetch: refetchPersonalInfo } = useClientPersonalInfo(client?.id);
  const { data: serviceActions, isLoading: isServiceActionsLoading } = useClientServiceActions(client?.id);
  const { data: vaccinations, isLoading: isVaccinationsLoading } = useClientVaccinations(client?.id);
  const createServiceActionMutation = useCreateClientServiceAction();
  const updateClientMutation = useUpdateClient();
  const updatePersonalInfoMutation = useUpdateClientPersonalInfo();

  // Address form state
  const [addressFormData, setAddressFormData] = useState({
    houseNo: addressComponents.houseNo || '',
    street: addressComponents.street || '',
    city: addressComponents.city || '',
    county: addressComponents.county || '',
    postcode: addressComponents.postcode || client.pin_code || ''
  });

  // Related Info form state
  const [relatedInfoFormData, setRelatedInfoFormData] = useState({
    ethnicity: personalInfo?.ethnicity || '',
    sexual_orientation: personalInfo?.sexual_orientation || '',
    gender_identity: personalInfo?.gender_identity || '',
    nationality: personalInfo?.nationality || '',
    primary_language: personalInfo?.primary_language || '',
    interpreter_required: personalInfo?.interpreter_required || false,
    preferred_interpreter_language: personalInfo?.preferred_interpreter_language || '',
    religion: personalInfo?.religion || '',
    property_type: personalInfo?.property_type || '',
    living_arrangement: personalInfo?.living_arrangement || '',
    home_accessibility: personalInfo?.home_accessibility || '',
    pets: personalInfo?.pets || '',
    key_safe_location: personalInfo?.key_safe_location || '',
    parking_availability: personalInfo?.parking_availability || '',
    emergency_access: personalInfo?.emergency_access || '',
    sensory_impairment: personalInfo?.sensory_impairment || '',
    communication_aids: personalInfo?.communication_aids || '',
    preferred_communication_method: personalInfo?.preferred_communication_method || '',
    hearing_difficulties: personalInfo?.hearing_difficulties || false,
    vision_difficulties: personalInfo?.vision_difficulties || false,
    speech_difficulties: personalInfo?.speech_difficulties || false,
    cognitive_impairment: personalInfo?.cognitive_impairment || false,
    mobility_aids: personalInfo?.mobility_aids || '',
    likes_preferences: personalInfo?.likes_preferences || '',
    dislikes_restrictions: personalInfo?.dislikes_restrictions || '',
    dos: personalInfo?.dos || '',
    donts: personalInfo?.donts || '',
    gp_name: personalInfo?.gp_name || '',
    gp_surgery_name: personalInfo?.gp_surgery_name || '',
    gp_surgery_address: personalInfo?.gp_surgery_address || '',
    gp_surgery_phone: personalInfo?.gp_surgery_phone || '',
    gp_surgery_ods_code: personalInfo?.gp_surgery_ods_code || '',
    gp_practice: personalInfo?.gp_practice || '',
    pharmacy_name: personalInfo?.pharmacy_name || '',
    pharmacy_address: personalInfo?.pharmacy_address || '',
    pharmacy_phone: personalInfo?.pharmacy_phone || '',
    pharmacy_ods_code: personalInfo?.pharmacy_ods_code || '',
    personal_goals: personalInfo?.personal_goals || '',
    desired_outcomes: personalInfo?.desired_outcomes || '',
    success_measures: personalInfo?.success_measures || '',
    priority_areas: personalInfo?.priority_areas || ''
  });

  // Update form data when personalInfo changes
  useEffect(() => {
    if (personalInfo) {
      setRelatedInfoFormData({
        ethnicity: personalInfo.ethnicity || '',
        sexual_orientation: personalInfo.sexual_orientation || '',
        gender_identity: personalInfo.gender_identity || '',
        nationality: personalInfo.nationality || '',
        primary_language: personalInfo.primary_language || '',
        interpreter_required: personalInfo.interpreter_required || false,
        preferred_interpreter_language: personalInfo.preferred_interpreter_language || '',
        religion: personalInfo.religion || '',
        property_type: personalInfo.property_type || '',
        living_arrangement: personalInfo.living_arrangement || '',
        home_accessibility: personalInfo.home_accessibility || '',
        pets: personalInfo.pets || '',
        key_safe_location: personalInfo.key_safe_location || '',
        parking_availability: personalInfo.parking_availability || '',
        emergency_access: personalInfo.emergency_access || '',
        sensory_impairment: personalInfo.sensory_impairment || '',
        communication_aids: personalInfo.communication_aids || '',
        preferred_communication_method: personalInfo.preferred_communication_method || '',
        hearing_difficulties: personalInfo.hearing_difficulties || false,
        vision_difficulties: personalInfo.vision_difficulties || false,
        speech_difficulties: personalInfo.speech_difficulties || false,
        cognitive_impairment: personalInfo.cognitive_impairment || false,
        mobility_aids: personalInfo.mobility_aids || '',
        likes_preferences: personalInfo.likes_preferences || '',
        dislikes_restrictions: personalInfo.dislikes_restrictions || '',
        dos: personalInfo.dos || '',
        donts: personalInfo.donts || '',
        gp_name: personalInfo.gp_name || '',
        gp_surgery_name: personalInfo.gp_surgery_name || '',
        gp_surgery_address: personalInfo.gp_surgery_address || '',
        gp_surgery_phone: personalInfo.gp_surgery_phone || '',
        gp_surgery_ods_code: personalInfo.gp_surgery_ods_code || '',
        gp_practice: personalInfo.gp_practice || '',
        pharmacy_name: personalInfo.pharmacy_name || '',
        pharmacy_address: personalInfo.pharmacy_address || '',
        pharmacy_phone: personalInfo.pharmacy_phone || '',
        pharmacy_ods_code: personalInfo.pharmacy_ods_code || '',
        personal_goals: personalInfo.personal_goals || '',
        desired_outcomes: personalInfo.desired_outcomes || '',
        success_measures: personalInfo.success_measures || '',
        priority_areas: personalInfo.priority_areas || ''
      });
    }
  }, [personalInfo]);
  const handleSaveServiceAction = (data: any) => {
    createServiceActionMutation.mutate(data, {
      onSuccess: () => {
        setIsAddServiceActionOpen(false);
      },
      onError: (error) => {
        console.error('Error creating service action:', error);
      }
    });
  };

  // Address handlers
  const handleEditAddress = () => {
    const components = parseAddress(client.address || client.location || '');
    setAddressFormData({
      houseNo: components.houseNo || '',
      street: components.street || '',
      city: components.city || '',
      county: components.county || '',
      postcode: components.postcode || client.pin_code || ''
    });
    setEditingTab('address');
  };

  const handleCancelAddress = () => {
    setEditingTab(null);
  };

  const handleSaveAddress = async () => {
    // Validate required fields
    if (!addressFormData.houseNo || !addressFormData.street || 
        !addressFormData.county || !addressFormData.city || !addressFormData.postcode) {
      toast.error('Please fill in all required address fields');
      return;
    }

    setIsSavingAddress(true);
    
    try {
      const minDelay = new Promise(resolve => setTimeout(resolve, 400));
      
      // Reconstruct address string
      const fullAddress = `${addressFormData.houseNo}, ${addressFormData.street}, ${addressFormData.city}, ${addressFormData.county}, ${addressFormData.postcode}`;
      
      const saveOperation = updateClientMutation.mutateAsync({
        clientId: client.id,
        updates: {
          address: fullAddress,
          pin_code: addressFormData.postcode
        }
      });

      await Promise.all([saveOperation, minDelay]);
      
      toast.success('Address updated successfully');
      setEditingTab(null);
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Related Info handlers
  const handleEditRelatedInfo = () => {
    setEditingTab('related-info');
  };

  const handleCancelRelatedInfo = () => {
    setEditingTab(null);
    // Reset form data to current personalInfo
    if (personalInfo) {
      setRelatedInfoFormData({
        ethnicity: personalInfo.ethnicity || '',
        sexual_orientation: personalInfo.sexual_orientation || '',
        gender_identity: personalInfo.gender_identity || '',
        nationality: personalInfo.nationality || '',
        primary_language: personalInfo.primary_language || '',
        interpreter_required: personalInfo.interpreter_required || false,
        preferred_interpreter_language: personalInfo.preferred_interpreter_language || '',
        religion: personalInfo.religion || '',
        property_type: personalInfo.property_type || '',
        living_arrangement: personalInfo.living_arrangement || '',
        home_accessibility: personalInfo.home_accessibility || '',
        pets: personalInfo.pets || '',
        key_safe_location: personalInfo.key_safe_location || '',
        parking_availability: personalInfo.parking_availability || '',
        emergency_access: personalInfo.emergency_access || '',
        sensory_impairment: personalInfo.sensory_impairment || '',
        communication_aids: personalInfo.communication_aids || '',
        preferred_communication_method: personalInfo.preferred_communication_method || '',
        hearing_difficulties: personalInfo.hearing_difficulties || false,
        vision_difficulties: personalInfo.vision_difficulties || false,
        speech_difficulties: personalInfo.speech_difficulties || false,
        cognitive_impairment: personalInfo.cognitive_impairment || false,
        mobility_aids: personalInfo.mobility_aids || '',
        likes_preferences: personalInfo.likes_preferences || '',
        dislikes_restrictions: personalInfo.dislikes_restrictions || '',
        dos: personalInfo.dos || '',
        donts: personalInfo.donts || '',
        gp_name: personalInfo.gp_name || '',
        gp_surgery_name: personalInfo.gp_surgery_name || '',
        gp_surgery_address: personalInfo.gp_surgery_address || '',
        gp_surgery_phone: personalInfo.gp_surgery_phone || '',
        gp_surgery_ods_code: personalInfo.gp_surgery_ods_code || '',
        gp_practice: personalInfo.gp_practice || '',
        pharmacy_name: personalInfo.pharmacy_name || '',
        pharmacy_address: personalInfo.pharmacy_address || '',
        pharmacy_phone: personalInfo.pharmacy_phone || '',
        pharmacy_ods_code: personalInfo.pharmacy_ods_code || '',
        personal_goals: personalInfo.personal_goals || '',
        desired_outcomes: personalInfo.desired_outcomes || '',
        success_measures: personalInfo.success_measures || '',
        priority_areas: personalInfo.priority_areas || ''
      });
    }
  };

  const handleSaveRelatedInfo = async () => {
    setIsSavingRelatedInfo(true);
    
    try {
      const minDelay = new Promise(resolve => setTimeout(resolve, 400));
      
      const saveOperation = updatePersonalInfoMutation.mutateAsync({
        client_id: client.id,
        ...relatedInfoFormData
      });

      await Promise.all([saveOperation, minDelay]);
      
      toast.success('Personal information updated successfully');
      setEditingTab(null);
      await refetchPersonalInfo();
    } catch (error) {
      console.error('Error saving personal info:', error);
      toast.error('Failed to save personal information');
    } finally {
      setIsSavingRelatedInfo(false);
    }
  };

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

            {/* Emergency Contact Section */}
            {(client.emergency_contact || client.emergency_phone) && (
              <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
                <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Contact Name</h4>
                    <p className="mt-1">{client.emergency_contact || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Contact Phone</h4>
                    <p className="mt-1">{client.emergency_phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="address" className="mt-6">
          <ClientAddressSection 
            clientId={client.id}
            legacyAddress={client.address || client.location}
            legacyPinCode={client.pin_code}
          />
        </TabsContent>

        <TabsContent value="related-info" className="mt-6">
          {isPersonalInfoLoading ? (
            <Card className="p-4 border border-border shadow-sm">
              <p>Loading related information...</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Edit/Save buttons */}
              {editingTab !== 'related-info' && (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={handleEditRelatedInfo}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit All Sections
                  </Button>
                </div>
              )}

              {editingTab === 'related-info' && (
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCancelRelatedInfo}
                    disabled={isSavingRelatedInfo}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveRelatedInfo}
                    disabled={isSavingRelatedInfo}
                    className={cn(
                      "transition-all duration-150",
                      isSavingRelatedInfo && "opacity-70"
                    )}
                  >
                    {isSavingRelatedInfo ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Save All
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Background & Identity Section */}
              <Card className="p-4 border border-border shadow-sm">
                <h3 className="text-lg font-medium mb-4">Background & Identity</h3>
                {editingTab === 'related-info' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ethnicity">Ethnicity</Label>
                      <Input 
                        id="ethnicity"
                        value={relatedInfoFormData.ethnicity}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, ethnicity: e.target.value }))}
                        placeholder="Enter ethnicity"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sexual_orientation">Sexual Orientation</Label>
                      <Input 
                        id="sexual_orientation"
                        value={relatedInfoFormData.sexual_orientation}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, sexual_orientation: e.target.value }))}
                        placeholder="Enter sexual orientation"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender_identity">Gender Identity</Label>
                      <Input 
                        id="gender_identity"
                        value={relatedInfoFormData.gender_identity}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, gender_identity: e.target.value }))}
                        placeholder="Enter gender identity"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input 
                        id="nationality"
                        value={relatedInfoFormData.nationality}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, nationality: e.target.value }))}
                        placeholder="Enter nationality"
                      />
                    </div>
                    <div>
                      <Label htmlFor="primary_language">Primary Language</Label>
                      <Input 
                        id="primary_language"
                        value={relatedInfoFormData.primary_language}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, primary_language: e.target.value }))}
                        placeholder="Enter primary language"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox 
                        id="interpreter_required"
                        checked={relatedInfoFormData.interpreter_required}
                        onCheckedChange={(checked) => setRelatedInfoFormData(prev => ({ ...prev, interpreter_required: checked as boolean }))}
                      />
                      <Label htmlFor="interpreter_required" className="font-normal">Interpreter Required</Label>
                    </div>
                    <div>
                      <Label htmlFor="preferred_interpreter_language">Preferred Interpreter Language</Label>
                      <Input 
                        id="preferred_interpreter_language"
                        value={relatedInfoFormData.preferred_interpreter_language}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, preferred_interpreter_language: e.target.value }))}
                        placeholder="Enter preferred interpreter language"
                      />
                    </div>
                    <div>
                      <Label htmlFor="religion">Religion</Label>
                      <Input 
                        id="religion"
                        value={relatedInfoFormData.religion}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, religion: e.target.value }))}
                        placeholder="Enter religion"
                      />
                    </div>
                  </div>
                ) : (
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
                )}
              </Card>

              {/* My Home Section */}
              <Card className="p-4 border border-border shadow-sm">
                <h3 className="text-lg font-medium mb-4">My Home</h3>
                {editingTab === 'related-info' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="property_type">Property Type</Label>
                      <Input 
                        id="property_type"
                        value={relatedInfoFormData.property_type}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, property_type: e.target.value }))}
                        placeholder="e.g., House, Flat, Bungalow"
                      />
                    </div>
                    <div>
                      <Label htmlFor="living_arrangement">Living Arrangement</Label>
                      <Input 
                        id="living_arrangement"
                        value={relatedInfoFormData.living_arrangement}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, living_arrangement: e.target.value }))}
                        placeholder="e.g., Lives alone, With family"
                      />
                    </div>
                    <div>
                      <Label htmlFor="home_accessibility">Home Accessibility</Label>
                      <Textarea 
                        id="home_accessibility"
                        value={relatedInfoFormData.home_accessibility}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, home_accessibility: e.target.value }))}
                        placeholder="Describe any accessibility features or needs"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pets_home">Pets</Label>
                      <Textarea 
                        id="pets_home"
                        value={relatedInfoFormData.pets}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, pets: e.target.value }))}
                        placeholder="Describe any pets"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="key_safe_location">Key Safe Location</Label>
                      <Input 
                        id="key_safe_location"
                        value={relatedInfoFormData.key_safe_location}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, key_safe_location: e.target.value }))}
                        placeholder="Location of key safe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="parking_availability">Parking Availability</Label>
                      <Input 
                        id="parking_availability"
                        value={relatedInfoFormData.parking_availability}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, parking_availability: e.target.value }))}
                        placeholder="Parking information"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergency_access">Emergency Access</Label>
                      <Textarea 
                        id="emergency_access"
                        value={relatedInfoFormData.emergency_access}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, emergency_access: e.target.value }))}
                        placeholder="Emergency access information"
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
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
                )}
              </Card>

              {/* My Accessibility and Communication Section */}
              <Card className="p-4 border border-border shadow-sm">
                <h3 className="text-lg font-medium mb-4">My Accessibility and Communication</h3>
                {editingTab === 'related-info' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sensory_impairment">Sensory Impairment</Label>
                      <Input 
                        id="sensory_impairment"
                        value={relatedInfoFormData.sensory_impairment}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, sensory_impairment: e.target.value }))}
                        placeholder="Describe any sensory impairment"
                      />
                    </div>
                    <div>
                      <Label htmlFor="communication_aids">Communication Aids</Label>
                      <Input 
                        id="communication_aids"
                        value={relatedInfoFormData.communication_aids}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, communication_aids: e.target.value }))}
                        placeholder="Communication aids used"
                      />
                    </div>
                    <div>
                      <Label htmlFor="preferred_communication_method">Preferred Communication Method</Label>
                      <Input 
                        id="preferred_communication_method"
                        value={relatedInfoFormData.preferred_communication_method}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, preferred_communication_method: e.target.value }))}
                        placeholder="Preferred communication method"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox 
                        id="hearing_difficulties"
                        checked={relatedInfoFormData.hearing_difficulties}
                        onCheckedChange={(checked) => setRelatedInfoFormData(prev => ({ ...prev, hearing_difficulties: checked as boolean }))}
                      />
                      <Label htmlFor="hearing_difficulties" className="font-normal">Hearing Difficulties</Label>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox 
                        id="vision_difficulties"
                        checked={relatedInfoFormData.vision_difficulties}
                        onCheckedChange={(checked) => setRelatedInfoFormData(prev => ({ ...prev, vision_difficulties: checked as boolean }))}
                      />
                      <Label htmlFor="vision_difficulties" className="font-normal">Vision Difficulties</Label>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox 
                        id="speech_difficulties"
                        checked={relatedInfoFormData.speech_difficulties}
                        onCheckedChange={(checked) => setRelatedInfoFormData(prev => ({ ...prev, speech_difficulties: checked as boolean }))}
                      />
                      <Label htmlFor="speech_difficulties" className="font-normal">Speech Difficulties</Label>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox 
                        id="cognitive_impairment"
                        checked={relatedInfoFormData.cognitive_impairment}
                        onCheckedChange={(checked) => setRelatedInfoFormData(prev => ({ ...prev, cognitive_impairment: checked as boolean }))}
                      />
                      <Label htmlFor="cognitive_impairment" className="font-normal">Cognitive Impairment</Label>
                    </div>
                    <div>
                      <Label htmlFor="mobility_aids">Mobility Aids</Label>
                      <Input 
                        id="mobility_aids"
                        value={relatedInfoFormData.mobility_aids}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, mobility_aids: e.target.value }))}
                        placeholder="Mobility aids used"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Sensory Impairment</h4>
                      <p className="mt-1">{personalInfo?.sensory_impairment || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Communication Aids</h4>
                      <p className="mt-1">{personalInfo?.communication_aids || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Preferred Communication Method</h4>
                      <p className="mt-1">{personalInfo?.preferred_communication_method || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Hearing Difficulties</h4>
                      <p className="mt-1">{personalInfo?.hearing_difficulties === null ? 'Not provided' : personalInfo?.hearing_difficulties ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Vision Difficulties</h4>
                      <p className="mt-1">{personalInfo?.vision_difficulties === null ? 'Not provided' : personalInfo?.vision_difficulties ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Speech Difficulties</h4>
                      <p className="mt-1">{personalInfo?.speech_difficulties === null ? 'Not provided' : personalInfo?.speech_difficulties ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Cognitive Impairment</h4>
                      <p className="mt-1">{personalInfo?.cognitive_impairment === null ? 'Not provided' : personalInfo?.cognitive_impairment ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Mobility Aids</h4>
                      <p className="mt-1">{personalInfo?.mobility_aids || 'Not provided'}</p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Do's & Don'ts Section */}
              <Card className="p-4 border border-border shadow-sm">
                <h3 className="text-lg font-medium mb-4">Do's & Don'ts</h3>
                {editingTab === 'related-info' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="likes_preferences">Likes/Preferences</Label>
                      <Textarea 
                        id="likes_preferences"
                        value={relatedInfoFormData.likes_preferences}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, likes_preferences: e.target.value }))}
                        placeholder="Things the client likes or prefers"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dislikes_restrictions">Dislikes/Restrictions</Label>
                      <Textarea 
                        id="dislikes_restrictions"
                        value={relatedInfoFormData.dislikes_restrictions}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, dislikes_restrictions: e.target.value }))}
                        placeholder="Things the client dislikes or restrictions"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dos">Do's</Label>
                      <Textarea 
                        id="dos"
                        value={relatedInfoFormData.dos}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, dos: e.target.value }))}
                        placeholder="Things that should be done"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="donts">Don'ts</Label>
                      <Textarea 
                        id="donts"
                        value={relatedInfoFormData.donts}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, donts: e.target.value }))}
                        placeholder="Things that should not be done"
                        rows={4}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Likes/Preferences</h4>
                      <p className="mt-1 whitespace-pre-wrap">{personalInfo?.likes_preferences || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Dislikes/Restrictions</h4>
                      <p className="mt-1 whitespace-pre-wrap">{personalInfo?.dislikes_restrictions || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Do's</h4>
                      <p className="mt-1 whitespace-pre-wrap">{personalInfo?.dos || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Don'ts</h4>
                      <p className="mt-1 whitespace-pre-wrap">{personalInfo?.donts || 'Not provided'}</p>
                    </div>
                  </div>
                )}
              </Card>

              {/* My GP Section */}
              <Card className="p-4 border border-border shadow-sm">
                <h3 className="text-lg font-medium mb-4">My GP</h3>
                {editingTab === 'related-info' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gp_name">GP Name</Label>
                      <Input 
                        id="gp_name"
                        value={relatedInfoFormData.gp_name}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, gp_name: e.target.value }))}
                        placeholder="GP name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gp_surgery_name">Surgery Name</Label>
                      <Input 
                        id="gp_surgery_name"
                        value={relatedInfoFormData.gp_surgery_name}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, gp_surgery_name: e.target.value }))}
                        placeholder="Surgery name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gp_surgery_address">Surgery Address</Label>
                      <Textarea 
                        id="gp_surgery_address"
                        value={relatedInfoFormData.gp_surgery_address}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, gp_surgery_address: e.target.value }))}
                        placeholder="Surgery address"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gp_surgery_phone">Surgery Phone</Label>
                      <Input 
                        id="gp_surgery_phone"
                        value={relatedInfoFormData.gp_surgery_phone}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, gp_surgery_phone: e.target.value }))}
                        placeholder="Surgery phone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gp_surgery_ods_code">ODS Code</Label>
                      <Input 
                        id="gp_surgery_ods_code"
                        value={relatedInfoFormData.gp_surgery_ods_code}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, gp_surgery_ods_code: e.target.value }))}
                        placeholder="ODS code"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gp_practice">Practice</Label>
                      <Input 
                        id="gp_practice"
                        value={relatedInfoFormData.gp_practice}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, gp_practice: e.target.value }))}
                        placeholder="Practice name"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Show legacy GP details if no personalInfo GP data */}
                    {!personalInfo?.gp_name && client.gp_details && (
                      <div className="mb-4 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">Legacy GP Details</h4>
                        <p className="text-sm whitespace-pre-wrap">{client.gp_details}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Click "Edit All Sections" to update GP information in the new format.
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">GP Name</h4>
                        <p className="mt-1">{personalInfo?.gp_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Surgery Name</h4>
                        <p className="mt-1">{personalInfo?.gp_surgery_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Surgery Address</h4>
                        <p className="mt-1">{personalInfo?.gp_surgery_address || 'Not provided'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Surgery Phone</h4>
                        <p className="mt-1">{personalInfo?.gp_surgery_phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">ODS Code</h4>
                        <p className="mt-1">{personalInfo?.gp_surgery_ods_code || 'Not provided'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Practice</h4>
                        <p className="mt-1">{personalInfo?.gp_practice || 'Not provided'}</p>
                      </div>
                    </div>
                  </>
                )}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Find NHS services and healthcare providers at{' '}
                    <a 
                      href="https://digital.nhs.uk/services/organisation-data-service/ods-portal" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      NHS Digital ODS Portal
                    </a>
                  </p>
                </div>
              </Card>

              {/* Pharmacy Section */}
              <Card className="p-4 border border-border shadow-sm">
                <h3 className="text-lg font-medium mb-4">Pharmacy</h3>
                {editingTab === 'related-info' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pharmacy_name">Pharmacy Name</Label>
                      <Input 
                        id="pharmacy_name"
                        value={relatedInfoFormData.pharmacy_name}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, pharmacy_name: e.target.value }))}
                        placeholder="Pharmacy name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pharmacy_address">Pharmacy Address</Label>
                      <Textarea 
                        id="pharmacy_address"
                        value={relatedInfoFormData.pharmacy_address}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, pharmacy_address: e.target.value }))}
                        placeholder="Pharmacy address"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pharmacy_phone">Pharmacy Phone</Label>
                      <Input 
                        id="pharmacy_phone"
                        value={relatedInfoFormData.pharmacy_phone}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, pharmacy_phone: e.target.value }))}
                        placeholder="Pharmacy phone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pharmacy_ods_code">ODS Code</Label>
                      <Input 
                        id="pharmacy_ods_code"
                        value={relatedInfoFormData.pharmacy_ods_code}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, pharmacy_ods_code: e.target.value }))}
                        placeholder="ODS code"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Pharmacy Name</h4>
                      <p className="mt-1">{personalInfo?.pharmacy_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Pharmacy Address</h4>
                      <p className="mt-1">{personalInfo?.pharmacy_address || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Pharmacy Phone</h4>
                      <p className="mt-1">{personalInfo?.pharmacy_phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">ODS Code</h4>
                      <p className="mt-1">{personalInfo?.pharmacy_ods_code || 'Not provided'}</p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Desired outcomes Section */}
              <Card className="p-4 border border-border shadow-sm">
                <h3 className="text-lg font-medium mb-4">Desired outcomes</h3>
                {editingTab === 'related-info' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="personal_goals">Personal Goals</Label>
                      <Textarea 
                        id="personal_goals"
                        value={relatedInfoFormData.personal_goals}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, personal_goals: e.target.value }))}
                        placeholder="Personal goals"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="desired_outcomes">Desired Outcomes</Label>
                      <Textarea 
                        id="desired_outcomes"
                        value={relatedInfoFormData.desired_outcomes}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, desired_outcomes: e.target.value }))}
                        placeholder="Desired outcomes"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="success_measures">Success Measures</Label>
                      <Textarea 
                        id="success_measures"
                        value={relatedInfoFormData.success_measures}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, success_measures: e.target.value }))}
                        placeholder="Success measures"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority_areas">Priority Areas</Label>
                      <Textarea 
                        id="priority_areas"
                        value={relatedInfoFormData.priority_areas}
                        onChange={(e) => setRelatedInfoFormData(prev => ({ ...prev, priority_areas: e.target.value }))}
                        placeholder="Priority areas"
                        rows={4}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Personal Goals</h4>
                      <p className="mt-1 whitespace-pre-wrap">{personalInfo?.personal_goals || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Desired Outcomes</h4>
                      <p className="mt-1 whitespace-pre-wrap">{personalInfo?.desired_outcomes || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Success Measures</h4>
                      <p className="mt-1 whitespace-pre-wrap">{personalInfo?.success_measures || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Priority Areas</h4>
                      <p className="mt-1 whitespace-pre-wrap">{personalInfo?.priority_areas || 'Not provided'}</p>
                    </div>
                  </div>
                )}
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
                      <div key={vaccination.id} className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Vaccination</h4>
                            <p className="mt-1 font-medium">{vaccination.vaccination_name}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Date Given</h4>
                            <p className="mt-1">{formatDate(vaccination.vaccination_date)}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Next Due</h4>
                            <p className="mt-1">{vaccination.next_due_date ? formatDate(vaccination.next_due_date) : 'N/A'}</p>
                          </div>
                        </div>
                        
                        {vaccination.notes && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                            <p className="mt-1 text-sm">{vaccination.notes}</p>
                          </div>
                        )}

                        {vaccination.file_path && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Document</h4>
                            <a
                              href={supabase.storage.from('client-documents').getPublicUrl(vaccination.file_path).data.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 border rounded-lg transition-colors"
                            >
                              <FileText className="h-4 w-4 text-primary" />
                              <span>View Document</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
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
              onAddServiceAction={() => setIsAddServiceActionOpen(true)} 
            />
          )}
          
          <AddServiceActionDialog
            open={isAddServiceActionOpen}
            onOpenChange={setIsAddServiceActionOpen}
            onSave={handleSaveServiceAction}
            clientId={client?.id}
            branchId={client?.branch_id}
            isLoading={createServiceActionMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>;
};