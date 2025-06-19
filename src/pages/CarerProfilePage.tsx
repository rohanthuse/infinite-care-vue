
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, MapPin, Briefcase, Calendar, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCarerProfile } from "@/data/hooks/useBranchCarers";

const CarerProfilePage: React.FC = () => {
  const { id: branchId, branchName, carerId } = useParams();
  const navigate = useNavigate();
  
  const { data: carer, isLoading, error } = useCarerProfile(carerId);

  const handleGoBack = () => {
    navigate(`/branch-dashboard/${branchId}/${branchName}/carers`);
  };

  const getAvatarInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "?";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading carer profile...</p>
        </div>
      </div>
    );
  }

  if (error || !carer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load carer profile</p>
          <Button onClick={handleGoBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Carer Profile</h1>
            <p className="text-gray-500">View and manage carer information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Summary Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-bold">
                  {getAvatarInitials(carer.first_name, carer.last_name)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{carer.first_name} {carer.last_name}</CardTitle>
              <p className="text-gray-500">{carer.specialization || "General Care"}</p>
              <Badge 
                variant="outline" 
                className={`mt-2 ${
                  carer.status === "Active" ? "bg-green-50 text-green-700 border-green-200" : 
                  carer.status === "Inactive" ? "bg-red-50 text-red-700 border-red-200" : 
                  "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {carer.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{carer.email || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{carer.phone || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{carer.address || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-gray-500" />
                <span>{carer.experience || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Hired: {formatDate(carer.hire_date)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Information */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-sm font-medium">{carer.first_name} {carer.last_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-sm">{carer.email || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-sm">{carer.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Address</label>
                        <p className="text-sm">{carer.address || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="text-sm">{formatDate(carer.date_of_birth)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Professional Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Specialization</label>
                        <p className="text-sm">{carer.specialization || "General Care"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Experience</label>
                        <p className="text-sm">{carer.experience || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Availability</label>
                        <p className="text-sm">{carer.availability}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <Badge 
                          variant="outline" 
                          className={`${
                            carer.status === "Active" ? "bg-green-50 text-green-700 border-green-200" : 
                            carer.status === "Inactive" ? "bg-red-50 text-red-700 border-red-200" : 
                            "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {carer.status}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Hire Date</label>
                        <p className="text-sm">{formatDate(carer.hire_date)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="schedule" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Schedule & Availability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500">Schedule management functionality coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="assignments" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Assignments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500">Assignment management functionality coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="documents" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents & Certifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500">Document management functionality coming soon...</p>
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

export default CarerProfilePage;
