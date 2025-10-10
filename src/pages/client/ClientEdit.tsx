
import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminClientDetail, useAdminUpdateClient } from "@/hooks/useAdminClientData";
import { useTenant } from "@/contexts/TenantContext";

const ClientEdit = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const params = useParams();
  const { tenantSlug } = useTenant();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const clientId = params.clientId || '';
  const branchId = params.id || '';
  const branchName = params.branchName || '';
  
  const { data: clientData, isLoading } = useAdminClientDetail(clientId);
  const updateClientMutation = useAdminUpdateClient();
  
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    title: "",
    middle_name: "",
    preferred_name: "",
    email: "",
    phone: "",
    mobile_number: "",
    telephone_number: "",
    country_code: "",
    address: "",
    region: "",
    date_of_birth: "",
    gender: "",
    pronouns: "",
    status: "",
    referral_route: "",
    other_identifier: "",
    additional_information: "",
    avatar_initials: "",
    registered_on: ""
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (clientData) {
      setProfile({
        first_name: clientData.first_name || "",
        last_name: clientData.last_name || "",
        title: clientData.title || "",
        middle_name: clientData.middle_name || "",
        preferred_name: clientData.preferred_name || "",
        email: clientData.email || "",
        phone: clientData.phone || "",
        mobile_number: clientData.mobile_number || "",
        telephone_number: clientData.telephone_number || "",
        country_code: clientData.country_code || "",
        address: clientData.address || "",
        region: clientData.region || "",
        date_of_birth: clientData.date_of_birth || "",
        gender: clientData.gender || "",
        pronouns: clientData.pronouns || "",
        status: clientData.status || "",
        referral_route: clientData.referral_route || "",
        other_identifier: clientData.other_identifier || "",
        additional_information: clientData.additional_information || "",
        avatar_initials: clientData.avatar_initials || "",
        registered_on: clientData.registered_on || ""
      });
    }
  }, [clientData]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      
      toast({
        title: "Photo uploaded",
        description: "Your profile photo has been updated.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleClickChangePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID is required to update profile.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await updateClientMutation.mutateAsync({
        clientId: clientId,
        updates: profile
      });
      
      toast({
        title: "Profile updated",
        description: "Client profile has been saved successfully.",
      });
      
      if (tenantSlug) {
        navigate(`/${tenantSlug}/branch-dashboard/${branchId}/${branchName}/clients`);
      } else {
        navigate(`/branch-dashboard/${branchId}/${branchName}/clients`);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Error updating profile",
        description: "There was an error saving the profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    if (tenantSlug) {
      navigate(`/${tenantSlug}/branch-dashboard/${branchId}/${branchName}/clients`);
    } else {
      navigate(`/branch-dashboard/${branchId}/${branchName}/clients`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const displayName = profile.preferred_name || profile.first_name || "Client";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </Button>
          <h1 className="text-2xl font-bold">Edit Client Profile</h1>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full md:w-64 flex flex-col items-center text-center">
            <Avatar className="h-24 w-24">
              {photoPreview ? (
                <AvatarImage src={photoPreview} alt={displayName} />
              ) : (
                <AvatarFallback className="bg-blue-100 text-blue-800 text-3xl">
                  {profile.avatar_initials || displayName.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <h3 className="font-bold mt-4">{displayName}</h3>
            <p className="text-gray-500 text-sm">Client</p>
            <div className="mt-4 w-full">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                className="hidden"
              />
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
                onClick={handleClickChangePhoto}
              >
                <Upload className="w-4 h-4" /> Change Photo
              </Button>
            </div>
          </div>
          
          <div className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
                <CardDescription>
                  Update client details and contact information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={profile.title}
                          onChange={(e) => setProfile({...profile, title: e.target.value})}
                          placeholder="Mr, Mrs, Dr, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input
                          id="first_name"
                          value={profile.first_name}
                          onChange={(e) => setProfile({...profile, first_name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="middle_name">Middle Name</Label>
                        <Input
                          id="middle_name"
                          value={profile.middle_name}
                          onChange={(e) => setProfile({...profile, middle_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name *</Label>
                        <Input
                          id="last_name"
                          value={profile.last_name}
                          onChange={(e) => setProfile({...profile, last_name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="preferred_name">Preferred Name</Label>
                        <Input
                          id="preferred_name"
                          value={profile.preferred_name}
                          onChange={(e) => setProfile({...profile, preferred_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pronouns">Pronouns</Label>
                        <Input
                          id="pronouns"
                          value={profile.pronouns}
                          onChange={(e) => setProfile({...profile, pronouns: e.target.value})}
                          placeholder="he/him, she/her, they/them"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({...profile, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profile.phone}
                          onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile_number">Mobile Number</Label>
                        <Input
                          id="mobile_number"
                          value={profile.mobile_number}
                          onChange={(e) => setProfile({...profile, mobile_number: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telephone_number">Telephone</Label>
                        <Input
                          id="telephone_number"
                          value={profile.telephone_number}
                          onChange={(e) => setProfile({...profile, telephone_number: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country_code">Country Code</Label>
                        <Input
                          id="country_code"
                          value={profile.country_code}
                          onChange={(e) => setProfile({...profile, country_code: e.target.value})}
                          placeholder="+44, +1, etc."
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={profile.address}
                        onChange={(e) => setProfile({...profile, address: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Personal Details */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={profile.date_of_birth}
                          onChange={(e) => setProfile({...profile, date_of_birth: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={profile.gender} onValueChange={(value) => setProfile({...profile, gender: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Non-binary">Non-binary</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="region">Region</Label>
                        <Select value={profile.region} onValueChange={(value) => setProfile({...profile, region: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="North">North</SelectItem>
                            <SelectItem value="South">South</SelectItem>
                            <SelectItem value="East">East</SelectItem>
                            <SelectItem value="West">West</SelectItem>
                            <SelectItem value="Central">Central</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={profile.status} onValueChange={(value) => setProfile({...profile, status: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
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
                      <div className="space-y-2">
                        <Label htmlFor="registered_on">Registered On</Label>
                        <Input
                          id="registered_on"
                          type="date"
                          value={profile.registered_on}
                          onChange={(e) => setProfile({...profile, registered_on: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="referral_route">Referral Route</Label>
                        <Input
                          id="referral_route"
                          value={profile.referral_route}
                          onChange={(e) => setProfile({...profile, referral_route: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="other_identifier">Other Identifier</Label>
                        <Input
                          id="other_identifier"
                          value={profile.other_identifier}
                          onChange={(e) => setProfile({...profile, other_identifier: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avatar_initials">Avatar Initials</Label>
                        <Input
                          id="avatar_initials"
                          value={profile.avatar_initials}
                          onChange={(e) => setProfile({...profile, avatar_initials: e.target.value.slice(0, 2).toUpperCase()})}
                          maxLength={2}
                          placeholder="e.g., JD"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="additional_information">Additional Information</Label>
                      <Textarea
                        id="additional_information"
                        value={profile.additional_information}
                        onChange={(e) => setProfile({...profile, additional_information: e.target.value})}
                        rows={4}
                        placeholder="Any additional notes or information about the client..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateClientMutation.isPending}
                    >
                      {updateClientMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientEdit;
