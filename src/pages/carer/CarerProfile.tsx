
import React, { useState } from "react";
import { 
  User, Mail, Phone, MapPin, Briefcase, Calendar, CheckCircle, 
  Shield, Save, X, Edit, Bank, Lock, Key
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

const CarerProfile: React.FC = () => {
  const { toast } = useToast();
  
  // Get name from localStorage or use default
  const storedName = localStorage.getItem("carerName") || "Carer";

  // State for profile data
  const [profileData, setProfileData] = useState({
    // Personal Details
    name: storedName,
    email: "carer@med-infinite.com",
    phone: "+44 7700 900123",
    address: "123 Healthcare Street, London, UK",
    dateOfBirth: "15/05/1990",
    nationalInsuranceNumber: "AB123456C",
    emergencyContact: "John Smith",
    emergencyPhone: "+44 7700 900456",
    
    // Professional Details
    role: "Home Care Specialist",
    qualifications: ["Registered Nurse", "Dementia Care Certified", "First Aid Certified"],
    experience: "5+ years in home healthcare",
    languages: ["English", "Hindi"],
    specialization: "Elder Care",
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    certifications: "Registered with Nursing and Midwifery Council",
    employmentStartDate: "01/06/2018",
    
    // Bank Details
    bankName: "Metro Bank",
    accountName: "John Doe",
    accountNumber: "12345678",
    sortCode: "12-34-56",
    payrollReference: "EMP12345"
  });
  
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

  // Handle input change for all form fields
  const handleInputChange = (section: string, field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
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
  const handleSave = (section: string) => {
    // In a real app, you would send this data to the server
    // For now, we'll just show a toast and exit edit mode
    toast({
      title: "Changes saved",
      description: `Your ${section} details have been updated successfully.`,
    });
    
    // If it's personal section, update the name in localStorage
    if (section === "personal") {
      localStorage.setItem("carerName", profileData.name);
    }
    
    toggleEditMode(section);
  };

  // Handle password update
  const handleUpdatePassword = () => {
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
    
    // In a real app, you would verify the current password and update with the new one
    // Here we'll just show a success toast
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
    });
    
    // Reset form
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="col-span-1">
          <CardHeader className="flex flex-col items-center">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-3xl font-bold">
                {profileData.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">{profileData.name}</h2>
            <p className="text-gray-500">{profileData.role}</p>
            <Badge className="mt-2 bg-green-100 text-green-700 hover:bg-green-200 border-0">Active</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{profileData.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{profileData.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{profileData.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-500" />
              <span>{profileData.experience}</span>
            </div>
          </CardContent>
        </Card>
        
        <div className="col-span-1 md:col-span-3 space-y-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="personal">
                <User className="h-4 w-4 mr-2" />
                Personal Details
              </TabsTrigger>
              <TabsTrigger value="professional">
                <Briefcase className="h-4 w-4 mr-2" />
                Professional Details
              </TabsTrigger>
              <TabsTrigger value="bank">
                <Bank className="h-4 w-4 mr-2" />
                Bank Details
              </TabsTrigger>
              <TabsTrigger value="security">
                <Lock className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>
            
            {/* Personal Details Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Personal Details</CardTitle>
                  {!editMode.personal ? (
                    <Button variant="outline" size="sm" onClick={() => toggleEditMode('personal')}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleEditMode('personal')}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={() => handleSave('personal')}>
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      {editMode.personal ? (
                        <Input 
                          id="name" 
                          value={profileData.name} 
                          onChange={(e) => handleInputChange('personal', 'name', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.name}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      {editMode.personal ? (
                        <Input 
                          id="email" 
                          value={profileData.email} 
                          onChange={(e) => handleInputChange('personal', 'email', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.email}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      {editMode.personal ? (
                        <Input 
                          id="phone" 
                          value={profileData.phone} 
                          onChange={(e) => handleInputChange('personal', 'phone', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.phone}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="dob">Date of Birth</Label>
                      {editMode.personal ? (
                        <Input 
                          id="dob" 
                          value={profileData.dateOfBirth}
                          onChange={(e) => handleInputChange('personal', 'dateOfBirth', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.dateOfBirth}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="ni">National Insurance Number</Label>
                      {editMode.personal ? (
                        <Input 
                          id="ni" 
                          value={profileData.nationalInsuranceNumber}
                          onChange={(e) => handleInputChange('personal', 'nationalInsuranceNumber', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.nationalInsuranceNumber}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      {editMode.personal ? (
                        <Input 
                          id="address" 
                          value={profileData.address}
                          onChange={(e) => handleInputChange('personal', 'address', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.address}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="emergency-contact">Emergency Contact</Label>
                      {editMode.personal ? (
                        <Input 
                          id="emergency-contact" 
                          value={profileData.emergencyContact}
                          onChange={(e) => handleInputChange('personal', 'emergencyContact', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.emergencyContact}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="emergency-phone">Emergency Contact Phone</Label>
                      {editMode.personal ? (
                        <Input 
                          id="emergency-phone" 
                          value={profileData.emergencyPhone}
                          onChange={(e) => handleInputChange('personal', 'emergencyPhone', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.emergencyPhone}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Professional Details Tab */}
            <TabsContent value="professional">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Professional Details</CardTitle>
                  {!editMode.professional ? (
                    <Button variant="outline" size="sm" onClick={() => toggleEditMode('professional')}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleEditMode('professional')}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={() => handleSave('professional')}>
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">Job Title</Label>
                      {editMode.professional ? (
                        <Input 
                          id="role" 
                          value={profileData.role}
                          onChange={(e) => handleInputChange('professional', 'role', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.role}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="specialization">Specialization</Label>
                      {editMode.professional ? (
                        <Input 
                          id="specialization" 
                          value={profileData.specialization}
                          onChange={(e) => handleInputChange('professional', 'specialization', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.specialization}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="experience">Experience</Label>
                      {editMode.professional ? (
                        <Input 
                          id="experience" 
                          value={profileData.experience}
                          onChange={(e) => handleInputChange('professional', 'experience', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.experience}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="certifications">Certifications</Label>
                      {editMode.professional ? (
                        <Input 
                          id="certifications" 
                          value={profileData.certifications}
                          onChange={(e) => handleInputChange('professional', 'certifications', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.certifications}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="start-date">Employment Start Date</Label>
                      {editMode.professional ? (
                        <Input 
                          id="start-date" 
                          value={profileData.employmentStartDate}
                          onChange={(e) => handleInputChange('professional', 'employmentStartDate', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.employmentStartDate}</div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="languages">Languages</Label>
                      {editMode.professional ? (
                        <Input 
                          id="languages" 
                          value={profileData.languages.join(", ")}
                          onChange={(e) => handleInputChange('professional', 'languages', e.target.value.split(", "))} 
                        />
                      ) : (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {profileData.languages.map((language, index) => (
                            <div key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                              {language}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label>Qualifications</Label>
                      {editMode.professional ? (
                        <Textarea 
                          value={profileData.qualifications.join("\n")}
                          onChange={(e) => handleInputChange('professional', 'qualifications', e.target.value.split("\n"))}
                          className="mt-2"
                          rows={4}
                        />
                      ) : (
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          {profileData.qualifications.map((qualification, index) => (
                            <li key={index}>{qualification}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label>Availability</Label>
                      <div className="grid grid-cols-7 gap-2 text-center mt-2">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => {
                          const dayKey = day.toLowerCase() as keyof typeof profileData.availability;
                          return (
                            <div key={index} className="space-y-1">
                              <div className="font-medium">{day.substring(0, 3)}</div>
                              {editMode.professional ? (
                                <Button
                                  variant={profileData.availability[dayKey] ? "default" : "outline"}
                                  size="sm"
                                  className="w-full"
                                  onClick={() => setProfileData(prev => ({
                                    ...prev,
                                    availability: {
                                      ...prev.availability,
                                      [dayKey]: !prev.availability[dayKey]
                                    }
                                  }))}
                                >
                                  {profileData.availability[dayKey] ? "Available" : "Unavailable"}
                                </Button>
                              ) : (
                                <div className={`px-2 py-1 rounded ${
                                  profileData.availability[dayKey] 
                                    ? "bg-green-100 text-green-700" 
                                    : "bg-gray-100 text-gray-500"
                                }`}>
                                  {profileData.availability[dayKey] ? "Available" : "Unavailable"}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Bank Details Tab */}
            <TabsContent value="bank">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Bank Details</CardTitle>
                  {!editMode.bank ? (
                    <Button variant="outline" size="sm" onClick={() => toggleEditMode('bank')}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleEditMode('bank')}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={() => handleSave('bank')}>
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label htmlFor="bank-name">Bank Name</Label>
                      {editMode.bank ? (
                        <Input 
                          id="bank-name" 
                          value={profileData.bankName}
                          onChange={(e) => handleInputChange('bank', 'bankName', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.bankName}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="account-name">Account Holder Name</Label>
                      {editMode.bank ? (
                        <Input 
                          id="account-name" 
                          value={profileData.accountName}
                          onChange={(e) => handleInputChange('bank', 'accountName', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.accountName}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="account-number">Account Number</Label>
                      {editMode.bank ? (
                        <Input 
                          id="account-number" 
                          value={profileData.accountNumber}
                          onChange={(e) => handleInputChange('bank', 'accountNumber', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.accountNumber}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="sort-code">Sort Code</Label>
                      {editMode.bank ? (
                        <Input 
                          id="sort-code" 
                          value={profileData.sortCode}
                          onChange={(e) => handleInputChange('bank', 'sortCode', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.sortCode}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="payroll-ref">Payroll Reference</Label>
                      {editMode.bank ? (
                        <Input 
                          id="payroll-ref" 
                          value={profileData.payrollReference}
                          onChange={(e) => handleInputChange('bank', 'payrollReference', e.target.value)} 
                        />
                      ) : (
                        <div className="text-sm py-3 border-b">{profileData.payrollReference}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                      <Input 
                        id="current-password" 
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input 
                        id="new-password" 
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input 
                        id="confirm-password" 
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)} 
                      />
                    </div>
                    <div>
                      <Button onClick={handleUpdatePassword}>Update Password</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CarerProfile;
