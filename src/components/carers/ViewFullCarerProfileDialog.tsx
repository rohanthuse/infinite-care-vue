import React, { useState, useCallback } from "react";
import { 
  User, Mail, Phone, MapPin, Briefcase, Calendar, CheckCircle, Share2,
  AlertTriangle, Star, GraduationCap, FileText, UserPlus, ClipboardList,
  Award, Heart, DollarSign, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ControlledDialog } from "@/components/ui/controlled-dialog";
import { useCarerProfileById } from "@/hooks/useCarerProfile";
import { useCarerBookings } from "@/hooks/useCarerBookings";
import { useCarerDocuments } from "@/hooks/useCarerDocuments";
import { useCarerPerformance } from "@/hooks/useCarerPerformance";
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
import { CarerDocumentsTab } from "@/components/carer-profile/CarerDocumentsTab";
import { CarerRateTab } from "@/components/carer-profile/CarerRateTab";
import { CarerSettingsTab } from "@/components/carer-profile/CarerSettingsTab";
import { CarerProfileSharingDialog } from "@/components/carers/CarerProfileSharingDialog";

interface ViewFullCarerProfileDialogProps {
  carerId: string;
  branchId: string;
  branchName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewFullCarerProfileDialog({
  carerId,
  branchId,
  branchName,
  isOpen,
  onClose
}: ViewFullCarerProfileDialogProps) {
  const [showSharingDialog, setShowSharingDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { value: "overview", label: "Overview", icon: User },
    { value: "personal", label: "Personal", icon: User },
    { value: "communication", label: "Communication", icon: Mail },
    { value: "suspend", label: "Suspend", icon: AlertTriangle },
    { value: "quality", label: "Quality", icon: Star },
    { value: "attendance", label: "Attendance", icon: Calendar },
    { value: "essentials", label: "Essentials", icon: CheckCircle },
    { value: "employment", label: "Employment", icon: Briefcase },
    { value: "training", label: "Training", icon: GraduationCap },
    { value: "statement", label: "Statement", icon: FileText },
    { value: "contacts", label: "Contacts", icon: Phone },
    { value: "refer", label: "Refer Friend", icon: UserPlus },
    { value: "forms", label: "Forms", icon: ClipboardList },
    { value: "skills", label: "Skills", icon: Award },
    { value: "work-type", label: "Work Type", icon: Briefcase },
    { value: "hobbies", label: "Hobbies", icon: Heart },
    { value: "meetings", label: "Meetings", icon: Calendar },
    { value: "documents", label: "Files", icon: FileText },
    { value: "rate", label: "Rate", icon: DollarSign },
    { value: "settings", label: "Settings", icon: Settings },
  ];
  
  const { data: carer, isLoading, error } = useCarerProfileById(carerId);
  const { data: bookings = [] } = useCarerBookings(carerId);
  const { data: documents = [] } = useCarerDocuments(carerId);
  const { data: performanceData } = useCarerPerformance(carerId);

  const forceUIUnlock = useCallback(() => {
    const overlays = document.querySelectorAll(
      '[data-radix-dialog-overlay], [data-radix-alert-dialog-overlay], .modal-backdrop'
    );
    overlays.forEach(el => el.remove());
    
    document.querySelectorAll('[aria-hidden="true"], [inert]').forEach(el => {
      el.removeAttribute('aria-hidden');
      el.removeAttribute('inert');
    });
    
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('pointer-events');
    document.documentElement.style.removeProperty('overflow');
    document.body.classList.remove('overflow-hidden');
    document.documentElement.classList.remove('overflow-hidden');
    document.body.removeAttribute('data-scroll-locked');
    document.documentElement.removeAttribute('data-scroll-locked');
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(forceUIUnlock, 50);
  }, [onClose, forceUIUnlock]);

  const getAvatarInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "?";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
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
      <ControlledDialog
        id="view-full-carer-profile"
        open={isOpen}
        onOpenChange={(open) => !open && handleClose()}
        title="Loading Profile..."
        description="Please wait while we load the carer profile"
        className="max-w-[95vw] max-h-[95vh] z-[60]"
      >
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading full profile...</p>
          </div>
        </div>
      </ControlledDialog>
    );
  }

  if (error || !carer) {
    return (
      <ControlledDialog
        id="view-full-carer-profile"
        open={isOpen}
        onOpenChange={(open) => !open && handleClose()}
        title="Error Loading Profile"
        description="Unable to load carer profile"
        className="max-w-[95vw] max-h-[95vh] z-[60]"
      >
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load carer profile</p>
            <Button onClick={handleClose} variant="outline">Close</Button>
          </div>
        </div>
      </ControlledDialog>
    );
  }

  return (
    <>
      <ControlledDialog
        id="view-full-carer-profile"
        open={isOpen}
        onOpenChange={(open) => !open && handleClose()}
        title={`${carer.first_name} ${carer.last_name} - Full Profile`}
        description="Comprehensive view of carer information, performance, and details"
        className="max-w-[95vw] max-h-[95vh] overflow-hidden z-[60]"
        onEscapeKeyDown={handleClose}
        onPointerDownOutside={handleClose}
      >
        <div className="overflow-y-auto max-h-[80vh] px-2">
          {/* Header with Share Button */}
          <div className="flex items-center justify-end mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSharingDialog(true)}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Profile Summary Card */}
            <Card className="lg:col-span-3 shadow-lg">
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

            {/* Vertical Tab Sidebar */}
            <div className="lg:col-span-2 order-1 lg:order-1">
              <Card className="shadow-lg sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Navigation</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <nav className="space-y-1 max-h-[60vh] overflow-y-auto pr-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.value;
                      return (
                        <button
                          key={tab.value}
                          onClick={() => setActiveTab(tab.value)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-md scale-105"
                              : "text-foreground hover:bg-muted hover:text-primary"
                          )}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate text-left">{tab.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-7 order-2 lg:order-2">
              <Card className="shadow-lg">
                <CardHeader className="border-b">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    {React.createElement(tabs.find(t => t.value === activeTab)?.icon || User, { 
                      className: "h-5 w-5 text-primary" 
                    })}
                    {tabs.find(t => t.value === activeTab)?.label || "Overview"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="animate-in fade-in-50 duration-300">
                    {activeTab === "overview" && <CarerOverviewTab carerId={carerId} />}
                    {activeTab === "personal" && <CarerPersonalDetailsTab carerId={carerId} />}
                    {activeTab === "communication" && <CarerCommunicationTab carerId={carerId} />}
                    {activeTab === "suspend" && <CarerSuspendTab carerId={carerId} />}
                    {activeTab === "quality" && <CarerQualityAssuranceTab carerId={carerId} />}
                    {activeTab === "attendance" && <CarerAttendanceTab carerId={carerId} />}
                    {activeTab === "essentials" && <CarerEssentialsTab carerId={carerId} />}
                    {activeTab === "employment" && <CarerEmploymentHistoryTab carerId={carerId} />}
                    {activeTab === "training" && <CarerTrainingTab carerId={carerId} />}
                    {activeTab === "statement" && <CarerSupportingStatementTab carerId={carerId} />}
                    {activeTab === "contacts" && <CarerImportantContactTab carerId={carerId} />}
                    {activeTab === "refer" && <CarerReferFriendTab carerId={carerId} />}
                    {activeTab === "forms" && <CarerFormsTab carerId={carerId} />}
                    {activeTab === "skills" && <CarerSkillsTab carerId={carerId} />}
                    {activeTab === "work-type" && <CarerTypeOfWorkTab carerId={carerId} />}
                    {activeTab === "hobbies" && <CarerHobbiesTab carerId={carerId} />}
                    {activeTab === "meetings" && <CarerMeetingsTab carerId={carerId} />}
                    {activeTab === "documents" && <CarerDocumentsTab carerId={carerId} />}
                    {activeTab === "rate" && <CarerRateTab carerId={carerId} />}
                    {activeTab === "settings" && <CarerSettingsTab carerId={carerId} />}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ControlledDialog>

      {/* Sharing Dialog */}
      {carer && showSharingDialog && (
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
          branchId={branchId}
        />
      )}
    </>
  );
}
