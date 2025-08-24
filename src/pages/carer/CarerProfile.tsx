
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCarerProfile, useUpdateCarer } from '@/data/hooks/useBranchCarers';
import { useCarerAuthSafe } from '@/hooks/useCarerAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CarerPhotoUpload } from '@/components/CarerPhotoUpload';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Shield, 
  Edit, 
  Save, 
  X,
  Heart,
  CreditCard,
  Building,
  FileText
} from 'lucide-react';

const CarerProfile: React.FC = () => {
  const { toast } = useToast();
  const { data: carerProfile, isLoading: loading, error } = useCarerProfile();
  const { user } = useCarerAuthSafe();
  const updateCarerMutation = useUpdateCarer();
  
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const handleEdit = () => {
    setEditForm({
      first_name: carerProfile?.first_name || '',
      last_name: carerProfile?.last_name || '',
      email: carerProfile?.email || '',
      phone: carerProfile?.phone || '',
      address: carerProfile?.address || '',
      date_of_birth: carerProfile?.date_of_birth || '',
      emergency_contact_name: carerProfile?.emergency_contact_name || '',
      emergency_contact_phone: carerProfile?.emergency_contact_phone || '',
      national_insurance_number: carerProfile?.national_insurance_number || '',
      bank_name: carerProfile?.bank_name || '',
      bank_account_name: carerProfile?.bank_account_name || '',
      bank_account_number: carerProfile?.bank_account_number || '',
      bank_sort_code: carerProfile?.bank_sort_code || '',
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSave = async () => {
    if (!carerProfile?.id) return;
    
    try {
      await updateCarerMutation.mutateAsync({
        ...editForm,
        id: carerProfile.id,
      });
      
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const displayDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !carerProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  const getInitials = (firstName: string = '', lastName: string = '') => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const fullName = `${carerProfile.first_name || ''} ${carerProfile.last_name || ''}`.trim();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header Section */}
      <div className="mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                <CarerPhotoUpload
                  carerId={carerProfile.id}
                  currentPhotoUrl={carerProfile.photo_url}
                  carerName={fullName}
                  isEditing={isEditing}
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {fullName || 'Profile'}
                    </h1>
                    <p className="text-lg text-gray-600 mt-1">
                      {carerProfile.specialization || 'Care Professional'}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 mt-4 md:mt-0">
                    {!isEditing ? (
                      <Button onClick={handleEdit} className="flex items-center space-x-2">
                        <Edit className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </Button>
                    ) : (
                      <div className="flex space-x-2">
                        <Button onClick={handleSave} disabled={updateCarerMutation.isPending}>
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button variant="outline" onClick={handleCancel}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge variant={carerProfile.status === 'active' ? 'default' : 'secondary'}>
                    {carerProfile.status || 'Unknown'}
                  </Badge>
                  <Badge variant="outline">
                    {carerProfile.availability || 'Not specified'}
                  </Badge>
                  {carerProfile.profile_completed && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Profile Complete
                    </Badge>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {carerProfile.experience || '0'}
                    </p>
                    <p className="text-sm text-gray-600">Experience</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {carerProfile.qualifications?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Qualifications</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {carerProfile.certifications?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Certifications</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {carerProfile.hire_date ? new Date().getFullYear() - new Date(carerProfile.hire_date).getFullYear() : 0}
                    </p>
                    <p className="text-sm text-gray-600">Years with us</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Personal</span>
          </TabsTrigger>
          <TabsTrigger value="professional" className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4" />
            <span>Professional</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>Financial</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>First Name</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      id="first_name"
                      value={editForm.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      placeholder="Enter first name"
                    />
                  ) : (
                    <p className="text-gray-900">{carerProfile.first_name || 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Last Name</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      id="last_name"
                      value={editForm.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      placeholder="Enter last name"
                    />
                  ) : (
                    <p className="text-gray-900">{carerProfile.last_name || 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  ) : (
                    <p className="text-gray-900">{carerProfile.email || 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>Phone Number</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p className="text-gray-900">{carerProfile.phone || 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Date of Birth</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={editForm.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{displayDate(carerProfile.date_of_birth)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="national_insurance" className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>National Insurance Number</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      id="national_insurance"
                      value={editForm.national_insurance_number}
                      onChange={(e) => handleInputChange('national_insurance_number', e.target.value)}
                      placeholder="Enter NI number"
                    />
                  ) : (
                    <p className="text-gray-900">{carerProfile.national_insurance_number || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Address</span>
                </Label>
                {isEditing ? (
                  <Textarea
                    id="address"
                    value={editForm.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter full address"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-900">{carerProfile.address || 'Not provided'}</p>
                )}
              </div>

              <Separator />

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span>Emergency Contact</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_name">Contact Name</Label>
                    {isEditing ? (
                      <Input
                        id="emergency_name"
                        value={editForm.emergency_contact_name}
                        onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                        placeholder="Enter emergency contact name"
                      />
                    ) : (
                      <p className="text-gray-900">{carerProfile.emergency_contact_name || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_phone">Contact Phone</Label>
                    {isEditing ? (
                      <Input
                        id="emergency_phone"
                        value={editForm.emergency_contact_phone}
                        onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                        placeholder="Enter emergency contact phone"
                      />
                    ) : (
                      <p className="text-gray-900">{carerProfile.emergency_contact_phone || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Information Tab */}
        <TabsContent value="professional">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>Professional Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <p className="text-gray-900">{carerProfile.specialization || 'Not specified'}</p>
                </div>

                <div className="space-y-2">
                  <Label>Experience</Label>
                  <p className="text-gray-900">{carerProfile.experience || 'Not specified'}</p>
                </div>

                <div className="space-y-2">
                  <Label>Availability</Label>
                  <p className="text-gray-900">{carerProfile.availability || 'Not specified'}</p>
                </div>

                <div className="space-y-2">
                  <Label>Hire Date</Label>
                  <p className="text-gray-900">{displayDate(carerProfile.hire_date)}</p>
                </div>
              </div>

              <Separator />

              {/* Qualifications */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Qualifications</h3>
                {carerProfile.qualifications && carerProfile.qualifications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {carerProfile.qualifications.map((qualification, index) => (
                      <Badge key={index} variant="secondary">
                        {qualification}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No qualifications listed</p>
                )}
              </div>

              {/* Certifications */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Certifications</h3>
                {carerProfile.certifications && carerProfile.certifications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {carerProfile.certifications.map((certification, index) => (
                      <Badge key={index} variant="outline">
                        {certification}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No certifications listed</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Information Tab */}
        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Financial Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Bank Details</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    {isEditing ? (
                      <Input
                        id="bank_name"
                        value={editForm.bank_name}
                        onChange={(e) => handleInputChange('bank_name', e.target.value)}
                        placeholder="Enter bank name"
                      />
                    ) : (
                      <p className="text-gray-900">{carerProfile.bank_name || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_name">Account Holder Name</Label>
                    {isEditing ? (
                      <Input
                        id="account_name"
                        value={editForm.bank_account_name}
                        onChange={(e) => handleInputChange('bank_account_name', e.target.value)}
                        placeholder="Enter account holder name"
                      />
                    ) : (
                      <p className="text-gray-900">{carerProfile.bank_account_name || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number</Label>
                    {isEditing ? (
                      <Input
                        id="account_number"
                        value={editForm.bank_account_number}
                        onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
                        placeholder="Enter account number"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {carerProfile.bank_account_number 
                          ? `****${carerProfile.bank_account_number.slice(-4)}`
                          : 'Not provided'
                        }
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sort_code">Sort Code</Label>
                    {isEditing ? (
                      <Input
                        id="sort_code"
                        value={editForm.bank_sort_code}
                        onChange={(e) => handleInputChange('bank_sort_code', e.target.value)}
                        placeholder="Enter sort code"
                      />
                    ) : (
                      <p className="text-gray-900">{carerProfile.bank_sort_code || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security & Account</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Security Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
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
                      <span className="capitalize">{carerProfile.status || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Member since:</span>
                      <span>{displayDate(carerProfile.invitation_accepted_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CarerProfile;
