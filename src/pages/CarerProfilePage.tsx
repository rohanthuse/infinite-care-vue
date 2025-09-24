import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { ArrowLeft, User, Mail, Phone, MapPin, Briefcase, Calendar, CheckCircle, Clock, Users, FileText, BarChart3, Award, Star, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCarerProfileById } from "@/hooks/useCarerProfile";
import { useCarerBookings } from "@/hooks/useCarerBookings";
import { useCarerDocuments } from "@/hooks/useCarerDocuments";
import { useCarerPerformance } from "@/hooks/useCarerPerformance";
import { CarerScheduleTab } from "@/components/carer-profile/CarerScheduleTab";
import { CarerPerformanceTab } from "@/components/carer-profile/CarerPerformanceTab";
import { CarerDocumentsTab } from "@/components/carer-profile/CarerDocumentsTab";
import { CarerOverviewTab } from "@/components/carer-profile/CarerOverviewTab";
import { CarerPersonalDetailsTab } from "@/components/carer-profile/CarerPersonalDetailsTab";
import { CarerCommunicationTab } from "@/components/carer-profile/CarerCommunicationTab";
import { CarerSuspendTab } from "@/components/carer-profile/CarerSuspendTab";
import { CarerQualityAssuranceTab } from "@/components/carer-profile/CarerQualityAssuranceTab";
import { CarerAttendanceTab } from "@/components/carer-profile/CarerAttendanceTab";
import { CarerEssentialsTab } from "@/components/carer-profile/CarerEssentialsTab";
import { CarerEmploymentHistoryTab } from "@/components/carer-profile/CarerEmploymentHistoryTab";
import { CarerTrainingTab } from "@/components/carer-profile/CarerTrainingTab";
import { CarerSupportingStatementTab } from "@/components/carer-profile/CarerSupportingStatementTab";
import { CarerImportantContactTab } from "@/components/carer-profile/CarerImportantContactTab";
import { CarerReferFriendTab } from "@/components/carer-profile/CarerReferFriendTab";
import { CarerFormsTab } from "@/components/carer-profile/CarerFormsTab";
import { CarerSkillsTab } from "@/components/carer-profile/CarerSkillsTab";
import { CarerTypeOfWorkTab } from "@/components/carer-profile/CarerTypeOfWorkTab";
import { CarerHobbiesTab } from "@/components/carer-profile/CarerHobbiesTab";
import { CarerMeetingsTab } from "@/components/carer-profile/CarerMeetingsTab";
import { CarerRateTab } from "@/components/carer-profile/CarerRateTab";
import { CarerSettingsTab } from "@/components/carer-profile/CarerSettingsTab";
import { CarerProfileSharingDialog } from "@/components/carers/CarerProfileSharingDialog";
import { ErrorBoundary } from "@/components/care/ErrorBoundary";

const CarerProfilePage: React.FC = () => {
  const { id: branchId, branchName, carerId } = useParams();
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();
  const [showSharingDialog, setShowSharingDialog] = useState(false);
  
  console.log('[CarerProfilePage] Rendering with carerId:', carerId);
  
  const { data: carer, isLoading, error } = useCarerProfileById(carerId);
  const { data: bookings = [], isLoading: bookingsLoading } = useCarerBookings(carerId || '');
  const { data: documents = [], isLoading: documentsLoading } = useCarerDocuments(carerId || '');
  const { data: performanceData, isLoading: performanceLoading } = useCarerPerformance(carerId || '');
  
  console.log('[CarerProfilePage] Carer data:', { carer, isLoading, error, carerId });

  const handleGoBack = () => {
    const path = tenantSlug 
      ? `/${tenantSlug}/branch-dashboard/${branchId}/${branchName}/carers`
      : `/branch-dashboard/${branchId}/${branchName}/carers`;
    navigate(path);
  };

  const getAvatarInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "?";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return "bg-green-50 text-green-700 border-green-200";
      case 'inactive':
        return "bg-red-50 text-red-700 border-red-200";
      case 'on leave':
        return "bg-amber-50 text-amber-700 border-amber-200";
      case 'training':
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return "bg-green-100 text-green-800";
      case 'assigned':
        return "bg-blue-100 text-blue-800";
      case 'in-progress':
        return "bg-yellow-100 text-yellow-800";
      case 'cancelled':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.start_time) > new Date()
  ).slice(0, 5);

  const recentBookings = bookings.filter(booking => 
    new Date(booking.start_time) <= new Date()
  ).slice(0, 10);

  const totalHoursThisMonth = bookings
    .filter(booking => {
      const bookingDate = new Date(booking.start_time);
      const now = new Date();
      return bookingDate.getMonth() === now.getMonth() && 
             bookingDate.getFullYear() === now.getFullYear();
    })
    .reduce((total, booking) => {
      const start = new Date(booking.start_time);
      const end = new Date(booking.end_time);
      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

  const uniqueClients = new Set(bookings.map(b => b.client_id)).size;

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Carer Profile</h1>
              <p className="text-gray-600">View and manage carer information</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowSharingDialog(true)}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Enhanced Profile Summary Card */}
          <Card className="lg:col-span-1 shadow-lg">
            <CardHeader className="text-center pb-4">
              <Avatar className="w-28 h-28 mx-auto mb-4 shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold">
                  {getAvatarInitials(carer.first_name, carer.last_name)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {carer.first_name} {carer.last_name}
              </CardTitle>
              <p className="text-gray-600 font-medium">{carer.specialization || "General Care"}</p>
              <Badge 
                variant="outline" 
                className={`mt-3 px-4 py-1 ${getStatusColor(carer.status)}`}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {carer.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-blue-500" />
                <span className="text-gray-700">{carer.email || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-green-500" />
                <span className="text-gray-700">{carer.phone || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-red-500" />
                <span className="text-gray-700">{carer.address || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 text-purple-500" />
                <span className="text-gray-700">{carer.experience || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span className="text-gray-700">Hired: {formatDate(carer.hire_date)}</span>
              </div>
              
              {/* Quick Stats */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Quick Stats</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">{uniqueClients}</div>
                    <div className="text-xs text-blue-700">Clients</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">{Math.round(totalHoursThisMonth)}</div>
                    <div className="text-xs text-green-700">Hours/Month</div>
                  </div>
                  {performanceData && (
                    <>
                      <div className="text-center p-2 bg-yellow-50 rounded-lg">
                        <div className="text-xl font-bold text-yellow-600">{performanceData.averageRating.toFixed(1)}</div>
                        <div className="text-xs text-yellow-700">Rating</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded-lg">
                        <div className="text-xl font-bold text-purple-600">{performanceData.completionRate.toFixed(0)}%</div>
                        <div className="text-xs text-purple-700">Success</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="overview" className="w-full">
              <div className="overflow-x-auto mb-6">
                <TabsList className="flex w-max gap-1 p-1">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="communication">Communication</TabsTrigger>
                  <TabsTrigger value="suspend">Suspend</TabsTrigger>
                  <TabsTrigger value="quality">Quality</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="essentials">Essentials</TabsTrigger>
                  <TabsTrigger value="employment">Employment</TabsTrigger>
                  <TabsTrigger value="training">Training</TabsTrigger>
                  <TabsTrigger value="statement">Statement</TabsTrigger>
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                  <TabsTrigger value="refer">Refer Friend</TabsTrigger>
                  <TabsTrigger value="forms">Forms</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="work-type">Work Type</TabsTrigger>
                  <TabsTrigger value="hobbies">Hobbies</TabsTrigger>
                  <TabsTrigger value="meetings">Meetings</TabsTrigger>
                  <TabsTrigger value="documents">Files</TabsTrigger>
                  <TabsTrigger value="rate">Rate</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="details" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Full Name</label>
                        <p className="text-base font-medium text-gray-900">{carer.first_name} {carer.last_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Email</label>
                        <p className="text-base text-gray-700">{carer.email || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Phone</label>
                        <p className="text-base text-gray-700">{carer.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Address</label>
                        <p className="text-base text-gray-700">{carer.address || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Date of Birth</label>
                        <p className="text-base text-gray-700">{formatDate(carer.date_of_birth)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-md">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-green-600" />
                        Professional Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Specialization</label>
                        <p className="text-base text-gray-700">{carer.specialization || "General Care"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Experience</label>
                        <p className="text-base text-gray-700">{carer.experience || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Availability</label>
                        <p className="text-base text-gray-700">{carer.availability}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Status</label>
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(carer.status)} px-3 py-1`}
                        >
                          {carer.status}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Hire Date</label>
                        <p className="text-base text-gray-700">{formatDate(carer.hire_date)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="schedule" className="mt-6">
                <ErrorBoundary>
                  <CarerScheduleTab carerId={carerId || ''} />
                </ErrorBoundary>
              </TabsContent>
              
              <TabsContent value="assignments" className="mt-6">
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-orange-600" />
                      Client Assignments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {bookingsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading assignments...</p>
                      </div>
                    ) : uniqueClients > 0 ? (
                      <div>
                        <p className="text-lg font-semibold text-gray-900 mb-4">
                          Currently serving {uniqueClients} client{uniqueClients !== 1 ? 's' : ''}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Array.from(new Set(bookings.map(b => b.client_id))).map((clientId) => {
                            const clientBookings = bookings.filter(b => b.client_id === clientId);
                            const latestBooking = clientBookings[0];
                            return (
                              <div key={clientId} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h4 className="font-semibold text-gray-900">{latestBooking.client_name}</h4>
                                <p className="text-sm text-gray-600">{clientBookings.length} appointment{clientBookings.length !== 1 ? 's' : ''}</p>
                                <p className="text-xs text-gray-500">Last visit: {formatDate(latestBooking.start_time)}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No client assignments</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="documents" className="mt-6">
                <ErrorBoundary>
                  <CarerDocumentsTab carerId={carerId || ''} />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="performance" className="mt-6">
                <ErrorBoundary>
                  <CarerPerformanceTab carerId={carerId || ''} />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="bookings" className="mt-6">
                <div className="space-y-6">
                  <Card className="shadow-md">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-purple-600" />
                        Upcoming Appointments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {bookingsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                          <p className="text-gray-500 mt-2">Loading appointments...</p>
                        </div>
                      ) : upcomingBookings.length > 0 ? (
                        <div className="space-y-4">
                          {upcomingBookings.map((booking) => (
                            <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div>
                                <p className="font-semibold text-gray-900">{booking.client_name}</p>
                                <p className="text-sm text-gray-600">{booking.service_name}</p>
                                <p className="text-sm text-gray-500">{formatDateTime(booking.start_time)}</p>
                              </div>
                              <Badge className={`${getBookingStatusColor(booking.status)} px-3 py-1`}>
                                {booking.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No upcoming appointments</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {recentBookings.length > 0 ? (
                        <div className="space-y-3">
                          {recentBookings.map((booking) => (
                            <div key={booking.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{booking.client_name}</p>
                                <p className="text-sm text-gray-600">{booking.service_name}</p>
                                <p className="text-xs text-gray-500">{formatDate(booking.start_time)}</p>
                              </div>
                              <Badge className={`${getBookingStatusColor(booking.status)} text-xs px-2 py-1`}>
                                {booking.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No recent activity</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sharing Dialog */}
        {carer && (
          <CarerProfileSharingDialog
            open={showSharingDialog}
            onOpenChange={setShowSharingDialog}
            carer={{
              id: carer.id,
              first_name: carer.first_name,
              last_name: carer.last_name,
              email: carer.email || '',
              phone: carer.phone || '',
              address: carer.address || '',
              status: carer.status,
              specialization: carer.specialization || '',
              experience: carer.experience || '',
              hire_date: carer.hire_date || '',
            }}
            branchId={branchId || ''}
          />
        )}
      </div>
    </div>
  );
};

export default CarerProfilePage;
