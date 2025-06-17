
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  User, Info, Calendar, FileText, FileCheck, 
  MessageCircle, AlertTriangle, Clock, Activity, ChevronLeft,
  ChevronRight, FileEdit, Download, ArrowLeft, 
  ShieldAlert, Utensils, Bath, Wrench, ClipboardList, FileBarChart2,
  Phone, Mail, Heart, MapPin, ExternalLink, Edit2, Shield
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { generatePDF } from "@/utils/pdfGenerator";
import { toast } from "@/components/ui/use-toast";
import { PatientHeader } from "@/components/care/PatientHeader";
import { AboutMeTab } from "@/components/care/tabs/AboutMeTab";
import { GoalsTab } from "@/components/care/tabs/GoalsTab";
import { CarePlanTabBar } from "@/components/care/CarePlanTabBar";
import { NotesTab } from "@/components/care/tabs/NotesTab";
import { DocumentsTab } from "@/components/care/tabs/DocumentsTab";
import { AssessmentsTab } from "@/components/care/tabs/AssessmentsTab";
import { ActivitiesTab } from "@/components/care/tabs/ActivitiesTab";
import { EquipmentTab } from "@/components/care/tabs/EquipmentTab";
import { DietaryTab } from "@/components/care/tabs/DietaryTab";
import { PersonalCareTab } from "@/components/care/tabs/PersonalCareTab";
import { RiskTab } from "@/components/care/tabs/RiskTab";
import { ServicePlanTab } from "@/components/care/tabs/ServicePlanTab";
import { ServiceActionsTab } from "@/components/care/tabs/ServiceActionsTab";
import { EventsLogsTab } from "@/components/care/tabs/EventsLogsTab";
import { getStatusBadgeClass, getRiskLevelClass, calculateProgressPercentage } from "@/utils/statusHelpers";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CarePlanSidebar } from "@/components/care/CarePlanSidebar";
import { AddNoteDialog } from "@/components/care/dialogs/AddNoteDialog";
import { ScheduleFollowUpDialog } from "@/components/care/dialogs/ScheduleFollowUpDialog";
import { RecordActivityDialog } from "@/components/care/dialogs/RecordActivityDialog";
import { UploadDocumentDialog } from "@/components/care/dialogs/UploadDocumentDialog";
import { AddEventDialog } from "@/components/care/dialogs/AddEventDialog";

// Import dynamic data hooks
import { useClientCarePlansWithDetails } from "@/hooks/useCarePlanData";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useClientNotes } from "@/hooks/useClientNotes";
import { useClientDocuments } from "@/hooks/useClientDocuments";
import { useClientEvents } from "@/hooks/useClientEvents";

const CarePlanView = () => {
  const { id: branchId, branchName, carePlanId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  // Use John Michael's client ID for now - this would come from the care plan in real implementation
  const clientId = "76394b1f-d2e3-43f2-b0ae-4605dcb75551";
  
  // Fetch dynamic data
  const { data: carePlans, isLoading: carePlansLoading, error: carePlansError } = useClientCarePlansWithDetails(clientId);
  const { data: clientProfile, isLoading: profileLoading, error: profileError } = useClientProfile(clientId);
  const { data: clientNotes, isLoading: notesLoading } = useClientNotes(clientId);
  const { data: clientDocuments, isLoading: documentsLoading } = useClientDocuments(clientId);
  const { data: clientEvents, isLoading: eventsLoading } = useClientEvents(clientId);

  const carePlan = carePlans?.[0]; // Get the first care plan

  const isLoading = carePlansLoading || profileLoading;
  const hasError = carePlansError || profileError;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <DashboardHeader />
        <BranchInfoHeader 
          branchId={branchId || ""} 
          branchName={branchName || ""} 
          onNewBooking={() => {}} 
        />
        
        <div className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading care plan...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hasError || !carePlan || !clientProfile) {
    return (
      <div className="flex flex-col min-h-screen">
        <DashboardHeader />
        <BranchInfoHeader 
          branchId={branchId || ""} 
          branchName={branchName || ""} 
          onNewBooking={() => {}} 
        />
        
        <div className="flex-1 p-6 space-y-6">
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading care plan</h3>
            <p className="text-gray-600">
              {hasError ? 'Failed to load care plan data' : 'Care plan not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const transformedCarePlan = {
    id: carePlan.id,
    patientName: `${clientProfile.first_name} ${clientProfile.last_name}`,
    patientId: clientProfile.id,
    dateCreated: new Date(carePlan.created_at),
    lastUpdated: new Date(carePlan.updated_at),
    status: carePlan.status === 'approved' ? 'Active' : carePlan.status,
    assignedTo: carePlan.provider_name,
    avatar: `${clientProfile.first_name[0]}${clientProfile.last_name[0]}`
  };

  const handlePrintCarePlan = () => {
    generatePDF({
      id: transformedCarePlan.id,
      title: `Care Plan for ${transformedCarePlan.patientName}`,
      date: format(transformedCarePlan.lastUpdated, 'yyyy-MM-dd'),
      status: transformedCarePlan.status,
      signedBy: transformedCarePlan.assignedTo
    });
  };

  const handleNewBooking = () => {
    toast({
      title: "New Booking",
      description: "Booking functionality will be implemented soon.",
    });
  };

  const handleSaveNote = (note: { content: string; date: Date }) => {
    console.log("Saving note:", note);
    toast({
      title: "Note added",
      description: "The note has been successfully added to the patient's record."
    });
  };

  const handleSaveFollowUp = (followUp: any) => {
    console.log("Scheduling follow-up:", followUp);
    toast({
      title: "Follow-up scheduled",
      description: `Follow-up "${followUp.title}" scheduled for ${format(followUp.date, 'MMM dd, yyyy')} at ${followUp.time}.`
    });
  };

  const handleSaveActivity = (activity: any) => {
    console.log("Recording activity:", activity);
    toast({
      title: "Activity recorded",
      description: `The activity "${activity.action}" has been recorded.`
    });
  };

  const handleSaveDocument = (document: { name: string; date: Date; type: string; author: string; file: File }) => {
    console.log("Uploading document:", document);
    toast({
      title: "Document uploaded",
      description: `The document "${document.name}" has been uploaded.`
    });
  };

  const handleSaveEvent = (event: any) => {
    console.log("Creating new event:", event);
    toast({
      title: "Event recorded",
      description: `The event "${event.title}" has been recorded.`
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      <BranchInfoHeader 
        branchId={branchId || ""} 
        branchName={branchName || ""} 
        onNewBooking={handleNewBooking} 
      />
      
      <div className="flex-1 p-6 space-y-6">
        <TabNavigation
          activeTab="care-plan"
          onChange={(tab) => navigate(`/branch-dashboard/${branchId}/${branchName}/${tab}`)}
        />
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="border-b pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-4 bg-blue-50 p-2 rounded-lg">
                  <h3 className="text-blue-700 font-bold">Med-Infinite</h3>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Care Plan Management</h1>
                  <p className="text-gray-500">Comprehensive patient care documentation</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/branch-dashboard/${branchId}/${branchName}/care-plan`)}
                className="h-8 w-8 rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Care Plan Details</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handlePrintCarePlan} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <FileEdit className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col space-y-6">
            <PatientHeader carePlan={transformedCarePlan} />
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/4">
                <CarePlanSidebar 
                  carePlan={transformedCarePlan} 
                  onAddNote={() => setNoteDialogOpen(true)}
                  onScheduleFollowUp={() => setFollowUpDialogOpen(true)}
                  onRecordActivity={() => setActivityDialogOpen(true)}
                  onUploadDocument={() => setDocumentDialogOpen(true)}
                />
              </div>
              
              <div className="w-full md:w-3/4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <CarePlanTabBar activeTab={activeTab} onChange={setActiveTab} />
                  
                  <TabsContent value="personal" className="space-y-6">
                    <Card className="overflow-hidden border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
                      <CardHeader className="pb-3 bg-gradient-to-r from-med-50 to-white border-b border-med-100">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5 text-med-600" />
                          <span className="bg-gradient-to-r from-med-700 to-med-500 bg-clip-text text-transparent">Personal Information</span>
                        </CardTitle>
                        <CardDescription>Patient demographic and contact details</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
                            <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
                              <User className="h-5 w-5 mr-2 text-med-600" />
                              Basic Information
                            </h3>
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-medium text-gray-500">Full Name</p>
                                <p className="text-sm">{transformedCarePlan.patientName}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">Patient ID</p>
                                <p className="text-sm">{transformedCarePlan.patientId}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">Gender</p>
                                <p className="text-sm">{clientProfile.gender || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                                <p className="text-sm">
                                  {clientProfile.date_of_birth 
                                    ? `${format(new Date(clientProfile.date_of_birth), 'MMM dd, yyyy')} (Age: ${new Date().getFullYear() - new Date(clientProfile.date_of_birth).getFullYear()})`
                                    : 'Not specified'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
                            <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
                              <Phone className="h-5 w-5 mr-2 text-med-600" />
                              Contact Information
                            </h3>
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-medium text-gray-500">Address</p>
                                <p className="text-sm">{clientProfile.address || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">Phone</p>
                                <p className="text-sm">{clientProfile.phone || clientProfile.telephone_number || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">Email</p>
                                <p className="text-sm">{clientProfile.email || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">Mobile</p>
                                <p className="text-sm">{clientProfile.mobile_number || 'Not specified'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="aboutme" className="space-y-4">
                    <AboutMeTab aboutMe={{
                      interests: clientProfile.additional_information || 'No additional information provided',
                      preferences: 'Patient preferences to be updated',
                      background: `Registered on: ${clientProfile.registered_on ? format(new Date(clientProfile.registered_on), 'MMM dd, yyyy') : 'Not specified'}`,
                      notes: clientProfile.referral_route ? `Referral route: ${clientProfile.referral_route}` : 'No referral information'
                    }} />
                  </TabsContent>
                  
                  <TabsContent value="goals" className="space-y-4">
                    <GoalsTab goals={carePlan.goals?.map(goal => ({
                      title: goal.description,
                      status: goal.status === 'in-progress' ? 'In Progress' : 
                             goal.status === 'completed' ? 'Completed' : 'Active',
                      target: `Progress: ${goal.progress || 0}%`,
                      notes: goal.notes || 'No notes available'
                    })) || []} />
                  </TabsContent>
                  
                  <TabsContent value="activities" className="space-y-4">
                    <ActivitiesTab 
                      activities={carePlan.activities?.map(activity => ({
                        date: new Date(activity.created_at),
                        action: activity.name,
                        performer: carePlan.provider_name,
                        status: activity.status === 'active' ? 'Completed' : 'Pending'
                      })) || []}
                      onAddActivity={() => setActivityDialogOpen(true)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="notes" className="space-y-4">
                    <NotesTab 
                      notes={clientNotes?.map(note => ({
                        date: new Date(note.created_at),
                        author: note.author,
                        content: note.content
                      })) || []}
                      onAddNote={() => setNoteDialogOpen(true)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="documents" className="space-y-4">
                    <DocumentsTab 
                      documents={clientDocuments?.map(doc => ({
                        name: doc.name,
                        date: new Date(doc.upload_date),
                        type: doc.type,
                        author: doc.uploaded_by
                      })) || []}
                      onUploadDocument={() => setDocumentDialogOpen(true)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="assessments" className="space-y-4">
                    <AssessmentsTab assessments={[]} />
                  </TabsContent>
                  
                  <TabsContent value="equipment" className="space-y-4">
                    <EquipmentTab equipment={[]} />
                  </TabsContent>
                  
                  <TabsContent value="dietary" className="space-y-4">
                    <DietaryTab dietaryRequirements={[]} />
                  </TabsContent>

                  <TabsContent value="personalcare" className="space-y-4">
                    <PersonalCareTab personalCare={[]} />
                  </TabsContent>
                  
                  <TabsContent value="risk" className="space-y-4">
                    <RiskTab riskAssessments={[]} />
                  </TabsContent>
                  
                  <TabsContent value="serviceplan" className="space-y-4">
                    <ServicePlanTab serviceActions={[]} />
                  </TabsContent>
                  
                  <TabsContent value="serviceactions" className="space-y-4">
                    <ServiceActionsTab serviceActions={[]} />
                  </TabsContent>

                  <TabsContent value="eventslogs" className="space-y-4">
                    <EventsLogsTab 
                      carePlanId={transformedCarePlan.id}
                      patientName={transformedCarePlan.patientName}
                      onAddEvent={() => setEventDialogOpen(true)}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Components */}
      <AddNoteDialog 
        open={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        onSave={handleSaveNote}
      />
      
      <ScheduleFollowUpDialog 
        open={followUpDialogOpen}
        onClose={() => setFollowUpDialogOpen(false)}
        onSave={handleSaveFollowUp}
      />
      
      <RecordActivityDialog 
        open={activityDialogOpen}
        onClose={() => setActivityDialogOpen(false)}
        onSave={handleSaveActivity}
      />
      
      <UploadDocumentDialog 
        open={documentDialogOpen}
        onClose={() => setDocumentDialogOpen(false)}
        onSave={handleSaveDocument}
      />
      
      <AddEventDialog 
        open={eventDialogOpen}
        onClose={() => setEventDialogOpen(false)}
        onSave={handleSaveEvent}
      />
    </div>
  );
};

export default CarePlanView;
