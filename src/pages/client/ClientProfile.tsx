import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Lock, Shield, Bell, Eye, EyeOff, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientProfile, useUpdateClientProfile } from "@/hooks/useClientData";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "react-router-dom";

const ClientProfile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get client ID from URL params or use user ID as fallback
  const clientId = params.clientId || user?.id || '';
  
  const { data: clientProfile, isLoading } = useClientProfile(clientId);
  const updateClientMutation = useUpdateClientProfile();
  
  // Complete form state with all database fields
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

  // Photo state
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Update local state when client profile loads
  useEffect(() => {
    if (clientProfile) {
      setProfile({
        first_name: clientProfile.first_name || "",
        last_name: clientProfile.last_name || "",
        title: clientProfile.title || "",
        middle_name: clientProfile.middle_name || "",
        preferred_name: clientProfile.preferred_name || "",
        email: clientProfile.email || "",
        phone: clientProfile.phone || "",
        mobile_number: clientProfile.mobile_number || "",
        telephone_number: clientProfile.telephone_number || "",
        country_code: clientProfile.country_code || "",
        address: clientProfile.address || "",
        region: clientProfile.region || "",
        date_of_birth: clientProfile.date_of_birth || "",
        gender: clientProfile.gender || "",
        pronouns: clientProfile.pronouns || "",
        status: clientProfile.status || "",
        referral_route: clientProfile.referral_route || "",
        other_identifier: clientProfile.other_identifier || "",
        additional_information: clientProfile.additional_information || "",
        avatar_initials: clientProfile.avatar_initials || "",
        registered_on: clientProfile.registered_on || ""
      });
    }
  }, [clientProfile]);

  // Form state for password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: true,
    appointments: true,
    careUpdates: true,
    billing: true
  });
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setProfilePhoto(file.name);
      setPhotoPreview(result);
      
      toast({
        title: "Photo uploaded",
        description: "Your profile photo has been updated.",
      });
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const handleClickChangePhoto = () => {
    fileInputRef.current?.click();
  };

  // Handle profile form submission
  const handleProfileUpdate = async (e: React.FormEvent) => {
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
        description: "Your profile information has been saved.",
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Error updating profile",
        description: "There was an error saving your profile. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle password change form submission
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirm password must match.",
        variant: "destructive"
      });
      return;
    }
    
    // Reset form
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    
    toast({
      title: "Password changed",
      description: "Your password has been updated successfully.",
    });
  };
  
  // Toggle notification setting
  const toggleNotification = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    toast({
      title: "Notification settings updated",
      description: `${key} notifications ${notificationSettings[key] ? 'disabled' : 'enabled'}.`,
    });
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: keyof typeof showPassword) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
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
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold mb-6">Client Profile</h2>
        
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar and basic info */}
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
          
          {/* Tabs for different settings */}
          <div className="flex-1">
            <Tabs defaultValue="personal">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">
                  <User className="h-4 w-4 mr-2" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Lock className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
              </TabsList>
              
              {/* Personal Info Tab */}
              <TabsContent value="personal" className="pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update personal details and contact information.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
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

                      <Separator />

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

                      <Separator />

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

                      <Separator />

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
                      
                      <div className="flex justify-end">
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
              </TabsContent>
              
              {/* Security Tab */}
              <TabsContent value="security" className="pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Password & Security</CardTitle>
                    <CardDescription>
                      Manage your password and security settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPassword.current ? "text" : "password"}
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('current')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPassword.current ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showPassword.new ? "text" : "password"}
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('new')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPassword.new ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showPassword.confirm ? "text" : "password"}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('confirm')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPassword.confirm ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button type="submit">Update Password</Button>
                      </div>
                    </form>
                    
                    <Separator className="my-6" />
                    
                    <div>
                      <h3 className="font-medium text-lg mb-4">Two-Factor Authentication</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Enable Two-Factor Authentication</p>
                          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Setup</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Notifications Tab */}
              <TabsContent value="notifications" className="pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Manage how we contact you with updates and notifications.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Communication Channels</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-gray-500">Receive notifications via email</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.email} 
                          onCheckedChange={() => toggleNotification('email')} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">SMS Notifications</p>
                          <p className="text-sm text-gray-500">Receive notifications via text message</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.sms} 
                          onCheckedChange={() => toggleNotification('sms')} 
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="font-medium">Notification Types</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Appointment Reminders</p>
                          <p className="text-sm text-gray-500">Notifications about your upcoming appointments</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.appointments} 
                          onCheckedChange={() => toggleNotification('appointments')} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Care Plan Updates</p>
                          <p className="text-sm text-gray-500">Notifications when your care plan is updated</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.careUpdates} 
                          onCheckedChange={() => toggleNotification('careUpdates')} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Billing and Payments</p>
                          <p className="text-sm text-gray-500">Receive invoices and payment reminders</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.billing} 
                          onCheckedChange={() => toggleNotification('billing')} 
                        />
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
