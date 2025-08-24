import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Phone, Mail, Edit, Save, X, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCarerProfile, useUpdateCarer } from "@/data/hooks/useBranchCarers";
import { useCarerAuthSafe } from "@/hooks/useCarerAuthSafe";
import { CarerPhotoUpload } from "@/components/CarerPhotoUpload";

const displayDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Not available';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const CarerProfile: React.FC = () => {
  const { toast } = useToast();
  const { data: carerProfile, isLoading, isError } = useCarerProfile();
  const updateCarerMutation = useUpdateCarer();
  const { user } = useCarerAuthSafe();

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: carerProfile?.first_name || '',
    lastName: carerProfile?.last_name || '',
    email: carerProfile?.email || '',
    phone: carerProfile?.phone || '',
    address: carerProfile?.address || '',
  });

  useEffect(() => {
    if (carerProfile) {
      setProfileData({
        firstName: carerProfile.first_name || '',
        lastName: carerProfile.last_name || '',
        email: carerProfile.email || '',
        phone: carerProfile.phone || '',
        address: carerProfile.address || '',
      });
    }
  }, [carerProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User ID not found. Please sign in again.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      email: profileData.email,
      phone: profileData.phone,
      address: profileData.address,
    };

    updateCarerMutation.mutate({ id: carerProfile?.id, ...payload }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Profile updated successfully.",
        });
        setIsEditing(false);
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading profile...</div>;
  }

  if (isError) {
    return <div className="text-center p-4 text-red-500">Error loading profile.</div>;
  }

  return (
    <div className="container mx-auto mt-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Carer Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList>
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            <TabsContent value="personal" className="space-y-2">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <CarerPhotoUpload 
                    carerId={carerProfile?.id}
                    currentPhotoUrl={carerProfile?.photo_url}
                    carerName={`${carerProfile?.first_name ?? ''} ${carerProfile?.last_name ?? ''}`.trim()}
                    isEditing={isEditing}
                  />
                </div>
                <div className="col-span-1">
                  <div className="flex justify-end">
                    {isEditing ? (
                      <div>
                        <Button
                          variant="ghost"
                          className="mr-2"
                          onClick={() => {
                            setIsEditing(false);
                            // Reset profile data to the original values
                            setProfileData({
                              firstName: carerProfile?.first_name || '',
                              lastName: carerProfile?.last_name || '',
                              email: carerProfile?.email || '',
                              phone: carerProfile?.phone || '',
                              address: carerProfile?.address || '',
                            });
                          }}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={updateCarerMutation.isPending}>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  type="text"
                  id="address"
                  name="address"
                  value={profileData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
            </TabsContent>
            <TabsContent value="security">
              <div className="space-y-4 p-4 text-center text-muted-foreground">
                <p>Security settings are managed through your account settings.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarerProfile;
