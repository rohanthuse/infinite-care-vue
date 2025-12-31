
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Save, Eye, EyeOff, User, Heart, Phone, Lock } from "lucide-react";
import { toast } from "sonner";
import { useSimpleClientAuth } from "@/hooks/useSimpleClientAuth";
import {
  useClientProfile,
  useClientPersonalInfo,
  useClientMedicalInfo,
  useUpdateClientProfile,
  useUpdateClientPersonalInfo,
  useUpdateClientMedicalInfo,
  useChangeClientPassword
} from "@/hooks/useClientProfile";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";

const ClientProfile = () => {
  const { data: authData, isLoading: authLoading, error: authError } = useSimpleClientAuth();
  const { data: profile, isLoading: profileLoading } = useClientProfile();
  const { data: personalInfo, isLoading: personalLoading } = useClientPersonalInfo();
  const { data: medicalInfo, isLoading: medicalLoading } = useClientMedicalInfo();
  
  const updateProfile = useUpdateClientProfile();
  const updatePersonalInfo = useUpdateClientPersonalInfo();
  const updateMedicalInfo = useUpdateClientMedicalInfo();
  const changePassword = useChangeClientPassword();
  const { uploadPhoto, uploading } = usePhotoUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    mobile_number: "",
    telephone_number: "",
    address: "",
    date_of_birth: "",
    gender: "",
    preferred_name: "",
    title: "",
    middle_name: "",
    pronouns: "",
    communication_preferences: "",
    additional_information: ""
  });

  const [personalData, setPersonalData] = useState({
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    next_of_kin_name: "",
    next_of_kin_phone: "",
    next_of_kin_relationship: "",
    gp_name: "",
    gp_practice: "",
    gp_phone: "",
    preferred_communication: "",
    cultural_preferences: "",
    language_preferences: "",
    religion: "",
    marital_status: ""
  });

  const [medicalData, setMedicalData] = useState({
    allergies: [] as string[],
    current_medications: [] as string[],
    medical_conditions: [] as string[],
    medical_history: "",
    mobility_status: "",
    cognitive_status: "",
    communication_needs: "",
    sensory_impairments: [] as string[],
    mental_health_status: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Update form data when profile data loads
  React.useEffect(() => {
    if (profile) {
      setProfileData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        mobile_number: profile.mobile_number || "",
        telephone_number: profile.telephone_number || "",
        address: profile.address || "",
        date_of_birth: profile.date_of_birth || "",
        gender: profile.gender || "",
        preferred_name: profile.preferred_name || "",
        title: profile.title || "",
        middle_name: profile.middle_name || "",
        pronouns: profile.pronouns || "",
        communication_preferences: profile.communication_preferences || "",
        additional_information: profile.additional_information || ""
      });
      
      // Set the photo from the database if it exists
      if (profile.profile_photo_url && !photoPreview) {
        setPhotoPreview(profile.profile_photo_url);
      }
    }
  }, [profile]);

  React.useEffect(() => {
    if (personalInfo) {
      setPersonalData({
        emergency_contact_name: personalInfo.emergency_contact_name || "",
        emergency_contact_phone: personalInfo.emergency_contact_phone || "",
        emergency_contact_relationship: personalInfo.emergency_contact_relationship || "",
        next_of_kin_name: personalInfo.next_of_kin_name || "",
        next_of_kin_phone: personalInfo.next_of_kin_phone || "",
        next_of_kin_relationship: personalInfo.next_of_kin_relationship || "",
        gp_name: personalInfo.gp_name || "",
        gp_practice: personalInfo.gp_practice || "",
        gp_phone: personalInfo.gp_phone || "",
        preferred_communication: personalInfo.preferred_communication || "",
        cultural_preferences: personalInfo.cultural_preferences || "",
        language_preferences: personalInfo.language_preferences || "",
        religion: personalInfo.religion || "",
        marital_status: personalInfo.marital_status || ""
      });
    }
  }, [personalInfo]);

  React.useEffect(() => {
    if (medicalInfo) {
      setMedicalData({
        allergies: medicalInfo.allergies || [],
        current_medications: medicalInfo.current_medications || [],
        medical_conditions: medicalInfo.medical_conditions || [],
        medical_history: medicalInfo.medical_history || "",
        mobility_status: medicalInfo.mobility_status || "",
        cognitive_status: medicalInfo.cognitive_status || "",
        communication_needs: medicalInfo.communication_needs || "",
        sensory_impairments: medicalInfo.sensory_impairments || [],
        mental_health_status: medicalInfo.mental_health_status || ""
      });
    }
  }, [medicalInfo]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo size must be less than 5MB");
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file");
      return;
    }
    
    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      toast.success("Photo preview updated. Click 'Save Changes' to apply.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    try {
      let photoUrl = profile?.profile_photo_url || null;
      
      // Upload photo if a new one was selected
      if (selectedFile && authData?.client?.id) {
        const uploadedUrl = await uploadPhoto(selectedFile, authData.client.id);
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }
      
      // Include photo URL in the profile update
      const updateData = {
        ...profileData,
        ...(photoUrl && { profile_photo_url: photoUrl })
      };
      
      await updateProfile.mutateAsync(updateData);
      
      // Clear the selected file after successful save
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleSavePersonalInfo = async () => {
    try {
      await updatePersonalInfo.mutateAsync(personalData);
    } catch (error) {
      console.error('Failed to save personal info:', error);
    }
  };

  const handleSaveMedicalInfo = async () => {
    try {
      await updateMedicalInfo.mutateAsync(medicalData);
    } catch (error) {
      console.error('Failed to save medical info:', error);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      await changePassword.mutateAsync({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error('Failed to change password:', error);
    }
  };

  const addArrayItem = (field: keyof typeof medicalData, value: string) => {
    if (value.trim() && Array.isArray(medicalData[field])) {
      setMedicalData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }));
    }
  };

  const removeArrayItem = (field: keyof typeof medicalData, index: number) => {
    if (Array.isArray(medicalData[field])) {
      setMedicalData(prev => ({
        ...prev,
        [field]: (prev[field] as string[]).filter((_, i) => i !== index)
      }));
    }
  };

  if (authLoading || profileLoading || personalLoading || medicalLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (authError || !authData?.client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 dark:text-red-400">Unable to load profile. Please try again.</div>
      </div>
    );
  }

  const displayName = profileData.preferred_name || profileData.first_name || "Client";
  const fullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || "Client";
  const avatarInitials = profile?.avatar_initials || `${profileData.first_name?.charAt(0) || 'C'}${profileData.last_name?.charAt(0) || 'L'}`;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-card p-6 rounded-xl border border-gray-200 dark:border-border">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full md:w-64 flex flex-col items-center text-center">
            <Avatar className="h-24 w-24">
              {photoPreview || profile?.profile_photo_url ? (
                <AvatarImage src={photoPreview || profile?.profile_photo_url} alt={fullName} />
              ) : (
                <AvatarFallback className="bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-3xl">
                  {avatarInitials}
                </AvatarFallback>
              )}
            </Avatar>
            <h3 className="font-bold mt-4 text-lg text-foreground">{fullName}</h3>
            <div className="text-gray-600 dark:text-muted-foreground text-sm space-y-1 mt-2">
              {profileData.email && (
                <p className="flex items-center justify-center gap-1">
                  <span>📧</span> {profileData.email}
                </p>
              )}
              {profileData.phone && (
                <p className="flex items-center justify-center gap-1">
                  <span>📞</span> {profileData.phone}
                </p>
              )}
              {profileData.address && (
                <p className="flex items-center justify-center gap-1">
                  <span>📍</span> {profileData.address}
                </p>
              )}
            </div>
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
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4" /> 
                {uploading ? 'Uploading...' : 'Change Photo'}
              </Button>
            </div>
          </div>
          
          <div className="flex-1">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">
                  <User className="w-4 h-4 mr-2" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="personal">
                  <Phone className="w-4 h-4 mr-2" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="medical">
                  <Heart className="w-4 h-4 mr-2" />
                  Medical
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Lock className="w-4 h-4 mr-2" />
                  Security
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Update your basic profile information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={profileData.title}
                          onChange={(e) => setProfileData({...profileData, title: e.target.value})}
                          placeholder="Mr, Mrs, Dr, etc."
                        />
                      </div>
                      <div>
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={profileData.first_name}
                          onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="middle_name">Middle Name</Label>
                        <Input
                          id="middle_name"
                          value={profileData.middle_name}
                          onChange={(e) => setProfileData({...profileData, middle_name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={profileData.last_name}
                          onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="preferred_name">Preferred Name</Label>
                        <Input
                          id="preferred_name"
                          value={profileData.preferred_name}
                          onChange={(e) => setProfileData({...profileData, preferred_name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="pronouns">Pronouns</Label>
                        <Input
                          id="pronouns"
                          value={profileData.pronouns}
                          onChange={(e) => setProfileData({...profileData, pronouns: e.target.value})}
                          placeholder="he/him, she/her, they/them"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          disabled
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="mobile_number">Mobile Number</Label>
                        <Input
                          id="mobile_number"
                          value={profileData.mobile_number}
                          onChange={(e) => setProfileData({...profileData, mobile_number: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="telephone_number">Telephone</Label>
                        <Input
                          id="telephone_number"
                          value={profileData.telephone_number}
                          onChange={(e) => setProfileData({...profileData, telephone_number: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={profileData.date_of_birth}
                          onChange={(e) => setProfileData({...profileData, date_of_birth: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={profileData.gender} onValueChange={(value) => setProfileData({...profileData, gender: value})}>
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
                    </div>
                    
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="additional_information">Additional Information</Label>
                      <Textarea
                        id="additional_information"
                        value={profileData.additional_information}
                        onChange={(e) => setProfileData({...profileData, additional_information: e.target.value})}
                        rows={3}
                        placeholder="Any additional information you'd like to share..."
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={updateProfile.isPending || uploading}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {updateProfile.isPending || uploading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Personal Information Tab */}
              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal & Emergency Information</CardTitle>
                    <CardDescription>Update your emergency contacts and personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-foreground">Emergency Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="emergency_contact_name">Name</Label>
                          <Input
                            id="emergency_contact_name"
                            value={personalData.emergency_contact_name}
                            onChange={(e) => setPersonalData({...personalData, emergency_contact_name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="emergency_contact_phone">Phone</Label>
                          <Input
                            id="emergency_contact_phone"
                            value={personalData.emergency_contact_phone}
                            onChange={(e) => setPersonalData({...personalData, emergency_contact_phone: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                          <Input
                            id="emergency_contact_relationship"
                            value={personalData.emergency_contact_relationship}
                            onChange={(e) => setPersonalData({...personalData, emergency_contact_relationship: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4 text-foreground">Next of Kin</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="next_of_kin_name">Name</Label>
                          <Input
                            id="next_of_kin_name"
                            value={personalData.next_of_kin_name}
                            onChange={(e) => setPersonalData({...personalData, next_of_kin_name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="next_of_kin_phone">Phone</Label>
                          <Input
                            id="next_of_kin_phone"
                            value={personalData.next_of_kin_phone}
                            onChange={(e) => setPersonalData({...personalData, next_of_kin_phone: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="next_of_kin_relationship">Relationship</Label>
                          <Input
                            id="next_of_kin_relationship"
                            value={personalData.next_of_kin_relationship}
                            onChange={(e) => setPersonalData({...personalData, next_of_kin_relationship: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4 text-foreground">GP Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="gp_name">GP Name</Label>
                          <Input
                            id="gp_name"
                            value={personalData.gp_name}
                            onChange={(e) => setPersonalData({...personalData, gp_name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="gp_practice">Practice</Label>
                          <Input
                            id="gp_practice"
                            value={personalData.gp_practice}
                            onChange={(e) => setPersonalData({...personalData, gp_practice: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="gp_phone">Phone</Label>
                          <Input
                            id="gp_phone"
                            value={personalData.gp_phone}
                            onChange={(e) => setPersonalData({...personalData, gp_phone: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4 text-foreground">Personal Preferences</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="preferred_communication">Preferred Communication</Label>
                          <Select value={personalData.preferred_communication} onValueChange={(value) => setPersonalData({...personalData, preferred_communication: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select preference" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="text">Text Message</SelectItem>
                              <SelectItem value="in_person">In Person</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="marital_status">Marital Status</Label>
                          <Select value={personalData.marital_status} onValueChange={(value) => setPersonalData({...personalData, marital_status: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="married">Married</SelectItem>
                              <SelectItem value="divorced">Divorced</SelectItem>
                              <SelectItem value="widowed">Widowed</SelectItem>
                              <SelectItem value="separated">Separated</SelectItem>
                              <SelectItem value="domestic_partnership">Domestic Partnership</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="religion">Religion</Label>
                          <Input
                            id="religion"
                            value={personalData.religion}
                            onChange={(e) => setPersonalData({...personalData, religion: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="language_preferences">Language Preferences</Label>
                          <Input
                            id="language_preferences"
                            value={personalData.language_preferences}
                            onChange={(e) => setPersonalData({...personalData, language_preferences: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Label htmlFor="cultural_preferences">Cultural Preferences</Label>
                        <Textarea
                          id="cultural_preferences"
                          value={personalData.cultural_preferences}
                          onChange={(e) => setPersonalData({...personalData, cultural_preferences: e.target.value})}
                          rows={3}
                          placeholder="Any cultural considerations or preferences..."
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSavePersonalInfo}
                        disabled={updatePersonalInfo.isPending}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {updatePersonalInfo.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Medical Information Tab */}
              <TabsContent value="medical">
                <Card>
                  <CardHeader>
                    <CardTitle>Medical Information</CardTitle>
                    <CardDescription>Update your medical history and health information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Note: This is a simplified version. In a real implementation, 
                         you'd want proper array management for allergies, medications, etc. */}
                    <div>
                      <Label htmlFor="medical_history">Medical History</Label>
                      <Textarea
                        id="medical_history"
                        value={medicalData.medical_history}
                        onChange={(e) => setMedicalData({...medicalData, medical_history: e.target.value})}
                        rows={4}
                        placeholder="Please provide your medical history..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="mobility_status">Mobility Status</Label>
                        <Select value={medicalData.mobility_status} onValueChange={(value) => setMedicalData({...medicalData, mobility_status: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mobility status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="independent">Independent</SelectItem>
                            <SelectItem value="assistance_needed">Assistance Needed</SelectItem>
                            <SelectItem value="wheelchair_user">Wheelchair User</SelectItem>
                            <SelectItem value="limited_mobility">Limited Mobility</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="cognitive_status">Cognitive Status</Label>
                        <Input
                          id="cognitive_status"
                          value={medicalData.cognitive_status}
                          onChange={(e) => setMedicalData({...medicalData, cognitive_status: e.target.value})}
                          placeholder="e.g., Normal, Mild impairment, etc."
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="communication_needs">Communication Needs</Label>
                      <Textarea
                        id="communication_needs"
                        value={medicalData.communication_needs}
                        onChange={(e) => setMedicalData({...medicalData, communication_needs: e.target.value})}
                        rows={3}
                        placeholder="Any special communication requirements..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="mental_health_status">Mental Health Status</Label>
                      <Textarea
                        id="mental_health_status"
                        value={medicalData.mental_health_status}
                        onChange={(e) => setMedicalData({...medicalData, mental_health_status: e.target.value})}
                        rows={3}
                        placeholder="Any mental health considerations..."
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSaveMedicalInfo}
                        disabled={updateMedicalInfo.isPending}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {updateMedicalInfo.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Change your password and security preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-foreground">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showCurrentPassword ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="newPassword">New Password</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            onClick={handleChangePassword}
                            disabled={changePassword.isPending || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                            className="flex items-center gap-2"
                          >
                            <Lock className="w-4 h-4" />
                            {changePassword.isPending ? 'Changing...' : 'Change Password'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
