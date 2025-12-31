import React, { useState } from "react";
import { User, Mail, Phone, MapPin, Briefcase, Calendar, CheckCircle, Shield, Save, X, Edit, Lock, Key, CreditCard, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { CarerDocuments } from "@/components/carer/CarerDocuments";
import { useCarerAuthSafe } from "@/hooks/useCarerAuthSafe";
import { useCarerProfile } from "@/hooks/useCarerProfile";
import { useUpdateCarer } from "@/data/hooks/useBranchCarers";
import { useStaffPhotoUpload } from "@/hooks/useStaffPhotoUpload";
import { supabase } from "@/integrations/supabase/client";
const CarerProfile: React.FC = () => {
  const {
    toast
  } = useToast();
  const {
    data: carerProfile,
    isLoading: loading,
    error
  } = useCarerProfile();
  const {
    user
  } = useCarerAuthSafe();
  const updateCarerMutation = useUpdateCarer();
  const {
    uploadPhoto,
    deletePhoto,
    uploading
  } = useStaffPhotoUpload();

  // State for edit mode
  const [editMode, setEditMode] = useState({
    personal: false,
    professional: false,
    bank: false
  });

  // State for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Handle input change for profile data
  const handleInputChange = (field: string, value: any) => {
    // Update is handled through the form submission
  };

  // Handle password input change
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Toggle edit mode for different sections
  const toggleEditMode = (section: string) => {
    setEditMode(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle save for each section
  const handleSave = async (section: string, formData: FormData) => {
    if (!carerProfile) return;
    try {
      const updateData: any = {
        id: carerProfile.id
      };
      if (section === "personal") {
        updateData.first_name = formData.get("first_name") as string;
        updateData.last_name = formData.get("last_name") as string;
        updateData.email = formData.get("email") as string;
        updateData.phone = formData.get("phone") as string;
        updateData.address = formData.get("address") as string;
        updateData.date_of_birth = formData.get("date_of_birth") as string;
        updateData.national_insurance_number = formData.get("national_insurance_number") as string;
        updateData.emergency_contact_name = formData.get("emergency_contact_name") as string;
        updateData.emergency_contact_phone = formData.get("emergency_contact_phone") as string;
      } else if (section === "professional") {
        updateData.specialization = formData.get("specialization") as string;
        updateData.experience = formData.get("experience") as string;
        updateData.availability = formData.get("availability") as string;
        const qualifications = formData.get("qualifications") as string;
        updateData.qualifications = qualifications ? qualifications.split("\n").filter(q => q.trim()) : [];
        const certifications = formData.get("certifications") as string;
        updateData.certifications = certifications ? certifications.split("\n").filter(c => c.trim()) : [];
      } else if (section === "bank") {
        // Bank details require validation and potentially admin approval
        updateData.bank_name = formData.get("bank_name") as string;
        updateData.bank_account_name = formData.get("bank_account_name") as string;
        updateData.bank_account_number = formData.get("bank_account_number") as string;
        updateData.bank_sort_code = formData.get("bank_sort_code") as string;

        // Log bank detail changes for audit
        console.log(`[AUDIT] Carer ${carerProfile.id} updated bank details at ${new Date().toISOString()}`);
      }
      await updateCarerMutation.mutateAsync(updateData);
      toggleEditMode(section);
      if (section === "bank") {
        toast({
          title: "Bank details updated",
          description: "Your bank details have been updated and will be reviewed by administrators."
        });
      } else {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully."
        });
      }
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !carerProfile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }
    try {
      const photoUrl = await uploadPhoto(file, carerProfile.id);
      if (photoUrl) {
        await updateCarerMutation.mutateAsync({
          id: carerProfile.id,
          photo_url: photoUrl
        });
        toast({
          title: "Photo updated",
          description: "Your profile photo has been updated successfully."
        });
      }
    } catch (error: any) {
      toast({
        title: "Photo upload failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive"
      });
    }
  };

  // Handle photo removal
  const handlePhotoRemove = async () => {
    if (!carerProfile || !carerProfile.photo_url) return;
    try {
      const deleted = await deletePhoto(carerProfile.photo_url);
      if (deleted) {
        await updateCarerMutation.mutateAsync({
          id: carerProfile.id,
          photo_url: null
        });
        toast({
          title: "Photo removed",
          description: "Your profile photo has been removed successfully."
        });
      }
    } catch (error: any) {
      toast({
        title: "Photo removal failed",
        description: error.message || "Failed to remove photo",
        variant: "destructive"
      });
    }
  };

  // Handle password update
  const handleUpdatePassword = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all password fields.",
        variant: "destructive"
      });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation do not match.",
        variant: "destructive"
      });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }
    try {
      const {
        error
      } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      if (error) throw error;
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully."
      });

      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      toast({
        title: "Password update failed",
        description: error.message || "Failed to update password",
        variant: "destructive"
      });
    }
  };
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split('T')[0];
  };
  const displayDate = (dateString?: string) => {
    if (!dateString) return "Not provided";
    return new Date(dateString).toLocaleDateString();
  };
  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="secondary">Unknown</Badge>;
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('active')) {
      return <Badge variant="custom" className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/70 border-0">Active</Badge>;
    } else if (normalizedStatus.includes('pending')) {
      return <Badge variant="custom" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900/70 border-0">Pending</Badge>;
    } else if (normalizedStatus.includes('inactive')) {
      return <Badge variant="custom" className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border-0">Inactive</Badge>;
    } else {
      return <Badge variant="secondary">{status}</Badge>;
    }
  };
  if (loading) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-6">
        <div className="space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }
  if (error || !carerProfile) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error?.message || "Unable to load profile"}
          </p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>
    );
  }
  return <div className="w-full min-w-0 max-w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold">My Profile</h1>
        {getStatusBadge(carerProfile?.status)}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="col-span-1">
          <CardHeader className="flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="w-24 h-24 ring-4 ring-purple-500">
                <AvatarImage src={carerProfile.photo_url || undefined} alt={`${carerProfile.first_name} ${carerProfile.last_name}`} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-3xl font-bold">
                  {`${carerProfile.first_name?.charAt(0) || ''}${carerProfile.last_name?.charAt(0) || ''}`.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex flex-col gap-2 mb-4">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
              <label htmlFor="photo-upload">
                <Button variant="outline" size="sm" className="cursor-pointer" disabled={uploading || updateCarerMutation.isPending} asChild>
                  <span>
                    {uploading ? "Uploading..." : "Change Photo"}
                  </span>
                </Button>
              </label>
              {carerProfile.photo_url && <Button variant="outline" size="sm" onClick={handlePhotoRemove} disabled={uploading || updateCarerMutation.isPending} className="text-red-600 hover:text-red-700">
                  Remove Photo
                </Button>}
            </div>
            
            <h2 className="text-xl font-semibold text-center">
              {carerProfile.first_name} {carerProfile.last_name}
            </h2>
            <p className="text-muted-foreground text-center">{carerProfile.specialization || "Care Specialist"}</p>
            {getStatusBadge(carerProfile.status)}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{carerProfile.email || "Not provided"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{carerProfile.phone || "Not provided"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{carerProfile.address || "Not provided"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{carerProfile.experience || "Not specified"}</span>
            </div>
          </CardContent>
        </Card>
        
        <div className="col-span-1 md:col-span-3 space-y-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 mb-6 h-auto">
              <TabsTrigger value="personal" className="flex items-center justify-center gap-1 py-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Personal</span>
              </TabsTrigger>
              <TabsTrigger value="professional" className="flex items-center justify-center gap-1 py-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Professional</span>
              </TabsTrigger>
              <TabsTrigger value="bank" className="flex items-center justify-center gap-1 py-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Bank</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center justify-center gap-1 py-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center justify-center gap-1 py-2">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Personal Details Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Personal Details</CardTitle>
                  {!editMode.personal ? <Button variant="outline" size="sm" onClick={() => toggleEditMode('personal')}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button> : <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleEditMode('personal')}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    </div>}
                </CardHeader>
                <CardContent>
                  {editMode.personal ? <form onSubmit={e => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSave('personal', formData);
                }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="first_name">First Name</Label>
                          <Input id="first_name" name="first_name" defaultValue={carerProfile.first_name || ""} required />
                        </div>
                        <div>
                          <Label htmlFor="last_name">Last Name</Label>
                          <Input id="last_name" name="last_name" defaultValue={carerProfile.last_name || ""} required />
                        </div>
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input id="email" name="email" type="email" defaultValue={carerProfile.email || ""} required />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" name="phone" defaultValue={carerProfile.phone || ""} />
                        </div>
                        <div>
                          <Label htmlFor="date_of_birth">Date of Birth</Label>
                          <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={formatDate(carerProfile.date_of_birth)} />
                        </div>
                        <div>
                          <Label htmlFor="national_insurance_number">National Insurance Number</Label>
                          <Input id="national_insurance_number" name="national_insurance_number" defaultValue={carerProfile.national_insurance_number || ""} />
                        </div>
                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Input id="address" name="address" defaultValue={carerProfile.address || ""} />
                        </div>
                        <div>
                          <Label htmlFor="emergency_contact_name">Emergency Contact</Label>
                          <Input id="emergency_contact_name" name="emergency_contact_name" defaultValue={carerProfile.emergency_contact_name || ""} />
                        </div>
                        <div>
                          <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                          <Input id="emergency_contact_phone" name="emergency_contact_phone" defaultValue={carerProfile.emergency_contact_phone || ""} />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button type="submit" disabled={updateCarerMutation.isPending}>
                          <Save className="h-4 w-4 mr-1" /> 
                          {updateCarerMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </form> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name</Label>
                        <div className="text-sm py-3 border-b">
                          {carerProfile.first_name} {carerProfile.last_name}
                        </div>
                      </div>
                      <div>
                        <Label>Email Address</Label>
                        <div className="text-sm py-3 border-b">{carerProfile.email || "Not provided"}</div>
                      </div>
                      <div>
                        <Label>Phone Number</Label>
                        <div className="text-sm py-3 border-b">{carerProfile.phone || "Not provided"}</div>
                      </div>
                      <div>
                        <Label>Date of Birth</Label>
                        <div className="text-sm py-3 border-b">{displayDate(carerProfile.date_of_birth)}</div>
                      </div>
                      <div>
                        <Label>National Insurance Number</Label>
                        <div className="text-sm py-3 border-b">{carerProfile.national_insurance_number || "Not provided"}</div>
                      </div>
                      <div>
                        <Label>Address</Label>
                        <div className="text-sm py-3 border-b">{carerProfile.address || "Not provided"}</div>
                      </div>
                      <div>
                        <Label>Emergency Contact Person</Label>
                        <div className="text-sm py-3 border-b">{carerProfile.emergency_contact_name || "Not provided"}</div>
                      </div>
                      <div>
                        <Label>Emergency Contact Phone</Label>
                        <div className="text-sm py-3 border-b">{carerProfile.emergency_contact_phone || "Not provided"}</div>
                      </div>
                    </div>}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Professional Details Tab */}
            <TabsContent value="professional">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Professional Details</CardTitle>
                  {!editMode.professional ? <Button variant="outline" size="sm" onClick={() => toggleEditMode('professional')}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button> : <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleEditMode('professional')}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    </div>}
                </CardHeader>
                <CardContent>
                  {editMode.professional ? <form onSubmit={e => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSave('professional', formData);
                }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="specialization">Specialization</Label>
                          <Input id="specialization" name="specialization" defaultValue={carerProfile.specialization || ""} />
                        </div>
                        <div>
                          <Label htmlFor="experience">Experience</Label>
                          <Input id="experience" name="experience" defaultValue={carerProfile.experience || ""} />
                        </div>
                        <div>
                          <Label htmlFor="availability">Availability</Label>
                          <Input id="availability" name="availability" defaultValue={carerProfile.availability || ""} />
                        </div>
                        <div>
                          <Label htmlFor="hire_date">Hire Date</Label>
                          <div className="text-sm py-3 border-b">{displayDate(carerProfile.hire_date)}</div>
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="qualifications">Qualifications (one per line)</Label>
                          <Textarea id="qualifications" name="qualifications" defaultValue={carerProfile.qualifications?.join("\n") || ""} className="mt-2" rows={4} />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="certifications">Certifications (one per line)</Label>
                          <Textarea id="certifications" name="certifications" defaultValue={carerProfile.certifications?.join("\n") || ""} className="mt-2" rows={4} />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button type="submit" disabled={updateCarerMutation.isPending}>
                          <Save className="h-4 w-4 mr-1" /> 
                          {updateCarerMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </form> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Specialization</Label>
                        <div className="text-sm py-3 border-b">{carerProfile.specialization || "Not specified"}</div>
                      </div>
                      <div>
                        <Label>Experience</Label>
                        <div className="text-sm py-3 border-b">{carerProfile.experience || "Not specified"}</div>
                      </div>
                      <div>
                        <Label>Availability</Label>
                        <div className="text-sm py-3 border-b">{carerProfile.availability || "Not specified"}</div>
                      </div>
                      <div>
                        <Label>Hire Date</Label>
                        <div className="text-sm py-3 border-b">{displayDate(carerProfile.hire_date)}</div>
                      </div>
                      <div className="col-span-2">
                        <Label>Qualifications</Label>
                        {carerProfile.qualifications && carerProfile.qualifications.length > 0 ? <ul className="list-disc list-inside space-y-1 mt-2">
                            {carerProfile.qualifications.map((qualification, index) => <li key={index}>{qualification}</li>)}
                          </ul> : <div className="text-sm py-3 border-b text-gray-500">No qualifications listed</div>}
                      </div>
                      <div className="col-span-2">
                        <Label>Certifications</Label>
                        {carerProfile.certifications && carerProfile.certifications.length > 0 ? <ul className="list-disc list-inside space-y-1 mt-2">
                            {carerProfile.certifications.map((certification, index) => <li key={index}>{certification}</li>)}
                          </ul> : <div className="text-sm py-3 border-b text-gray-500">No certifications listed</div>}
                      </div>
                    </div>}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Bank Details Tab */}
            <TabsContent value="bank">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Bank Details</CardTitle>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-blue-600">Secure & Encrypted</span>
                    {!editMode.bank ? <Button variant="outline" size="sm" onClick={() => toggleEditMode('bank')}>
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button> : <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleEditMode('bank')}>
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      </div>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <Shield className="h-4 w-4 inline mr-1" />
                      Bank details are encrypted and will be reviewed by administrators for security.
                    </p>
                  </div>
                  
                  {editMode.bank ? <form onSubmit={e => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSave('bank', formData);
                }}>
                      <div className="space-y-4 max-w-md">
                        <div>
                          <Label htmlFor="bank_name">Bank Name</Label>
                          <Input id="bank_name" name="bank_name" defaultValue={carerProfile.bank_name || ""} placeholder="e.g., Barclays, HSBC, Lloyds" />
                        </div>
                        <div>
                          <Label htmlFor="bank_account_name">Account Holder Name</Label>
                          <Input id="bank_account_name" name="bank_account_name" defaultValue={carerProfile.bank_account_name || ""} placeholder="Full name as shown on bank account" />
                        </div>
                        <div>
                          <Label htmlFor="bank_account_number">Account Number</Label>
                          <Input id="bank_account_number" name="bank_account_number" defaultValue={carerProfile.bank_account_number || ""} placeholder="8-digit account number" maxLength={8} />
                        </div>
                        <div>
                          <Label htmlFor="bank_sort_code">Sort Code</Label>
                          <Input id="bank_sort_code" name="bank_sort_code" defaultValue={carerProfile.bank_sort_code || ""} placeholder="XX-XX-XX" maxLength={8} />
                        </div>
                        <div>
                          <Button type="submit" disabled={updateCarerMutation.isPending}>
                            <Save className="h-4 w-4 mr-1" /> 
                            {updateCarerMutation.isPending ? "Saving..." : "Save Bank Details"}
                          </Button>
                        </div>
                      </div>
                    </form> : <div className="space-y-4 max-w-md">
                      <div>
                        <Label>Bank Name</Label>
                        <div className="text-sm py-3 border-b">{carerProfile.bank_name || "Not provided"}</div>
                      </div>
                      <div>
                        <Label>Account Holder Name</Label>
                        <div className="text-sm py-3 border-b">{carerProfile.bank_account_name || "Not provided"}</div>
                      </div>
                      <div>
                        <Label>Account Number</Label>
                        <div className="text-sm py-3 border-b">
                          {carerProfile.bank_account_number ? `****${carerProfile.bank_account_number.slice(-4)}` : "Not provided"}
                        </div>
                      </div>
                      <div>
                        <Label>Sort Code</Label>
                        <div className="text-sm py-3 border-b">
                          {carerProfile.bank_sort_code ? `**-**-${carerProfile.bank_sort_code.slice(-2)}` : "Not provided"}
                        </div>
                      </div>
                    </div>}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Documents Tab */}
            <TabsContent value="documents">
              <CarerDocuments />
            </TabsContent>
            
            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Key className="h-5 w-5 mr-2" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" value={passwordData.currentPassword} onChange={e => handlePasswordChange('currentPassword', e.target.value)} placeholder="Enter current password" />
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" value={passwordData.newPassword} onChange={e => handlePasswordChange('newPassword', e.target.value)} placeholder="Enter new password (min. 6 characters)" />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" value={passwordData.confirmPassword} onChange={e => handlePasswordChange('confirmPassword', e.target.value)} placeholder="Confirm new password" />
                    </div>
                    <div>
                      <Button onClick={handleUpdatePassword} disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}>
                        <Key className="h-4 w-4 mr-1" />
                        Update Password
                      </Button>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t">
                    <h3 className="font-medium mb-4">Security Information</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Last login:</span>
                        <span>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Not available"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profile completed:</span>
                        <span>{carerProfile.profile_completed ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Account status:</span>
                        <span>{carerProfile.status || "Active"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>;
};
export default CarerProfile;