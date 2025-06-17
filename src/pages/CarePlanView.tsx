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
import { mockPatientData } from "@/data/mockPatientData";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CarePlanSidebar } from "@/components/care/CarePlanSidebar";
import { AddNoteDialog } from "@/components/care/dialogs/AddNoteDialog";
import { ScheduleFollowUpDialog } from "@/components/care/dialogs/ScheduleFollowUpDialog";
import { RecordActivityDialog } from "@/components/care/dialogs/RecordActivityDialog";
import { UploadDocumentDialog } from "@/components/care/dialogs/UploadDocumentDialog";
import { AddEventDialog } from "@/components/care/dialogs/AddEventDialog";
import { useClientCarePlansWithDetails } from "@/hooks/useCarePlanData";
import { useClientNotes, useCreateClientNote } from "@/hooks/useClientNotes";
import { useClientDocuments, useUploadClientDocument } from "@/hooks/useClientDocuments";
import { useClientEvents, useCreateClientEvent } from "@/hooks/useClientEvents";

const CarePlanView = () => {
  const { id: branchId, branchName, carePlanId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  // Get the client ID (John Michael's ID from the database)
  const clientId = "76394b1f-d2e3-43f2-b0ae-4605dcb75551";
  
  // Fetch real care plan data
  const { data: carePlans, isLoading: carePlansLoading, error: carePlansError } = useClientCarePlansWithDetails(clientId);
  
  // Enhanced care plan selection logic
  const carePlan = React.useMemo(() => {
    if (!carePlans || carePlans.length === 0) return null;
    
    // If carePlanId is provided, try to find exact match first
    if (carePlanId) {
      const exactMatch = carePlans.find(plan => plan.id === carePlanId);
      if (exactMatch) {
        console.log('[CarePlanView] Found exact care plan match:', exactMatch.id);
        return exactMatch;
      }
      
      // If no exact match and it's a mock ID (like CP-001), use the first available care plan
      if (carePlanId.startsWith('CP-')) {
        console.log('[CarePlanView] Mock ID detected, using first available care plan');
        return carePlans[0];
      }
    }
    
    // Default to first care plan
    console.log('[CarePlanView] Using first available care plan');
    return carePlans[0];
  }, [carePlans, carePlanId]);
  
  // Fetch related data
  const { data: notes, isLoading: notesLoading } = useClientNotes(clientId);
  const { data: documents, isLoading: documentsLoading } = useClientDocuments(clientId);
  const { data: events, isLoading: eventsLoading } = useClientEvents(clientId);
  
  // Mutations
  const createNoteMutation = useCreateClientNote();
  const uploadDocumentMutation = useUploadClientDocument();
  const createEventMutation = useCreateClientEvent();

  // Add debug logging
  useEffect(() => {
    console.log('[CarePlanView] Route params:', { branchId, branchName, carePlanId });
    console.log('[CarePlanView] Care plans data:', carePlans);
    console.log('[CarePlanView] Selected care plan:', carePlan);
  }, [branchId, branchName, carePlanId, carePlans, carePlan]);

  const handlePrintCarePlan = () => {
    if (!carePlan) return;
    
    generatePDF({
      id: carePlan.id,
      title: `Care Plan for ${carePlan.title}`,
      date: format(new Date(carePlan.updated_at), 'yyyy-MM-dd'),
      status: carePlan.status,
      signedBy: carePlan.provider_name
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
    
    createNoteMutation.mutate({
      client_id: clientId,
      title: "Care Note",
      content: note.content,
      author: carePlan?.provider_name || "Care Provider"
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
    
    uploadDocumentMutation.mutate({
      clientId: clientId,
      file: document.file,
      name: document.name,
      type: document.type,
      uploaded_by: document.author
    });
  };

  const handleSaveEvent = (event: any) => {
    console.log("Creating new event:", event);
    
    createEventMutation.mutate({
      client_id: clientId,
      title: event.title,
      description: event.description,
      event_type: event.type,
      severity: event.severity,
      reporter: carePlan?.provider_name || "Care Provider"
    });
  };

  // Loading state
  if (carePlansLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <DashboardHeader />
        <BranchInfoHeader 
          branchId={branchId || ""} 
          branchName={branchName || ""} 
          onNewBooking={handleNewBooking} 
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

  // Error state - Enhanced with better debugging info
  if (carePlansError || !carePlan) {
    const errorMessage = carePlansError?.message || `No care plan found for ID: ${carePlanId}`;
    const debugInfo = `Available care plans: ${carePlans?.length || 0}`;
    
    console.error('[CarePlanView] Error details:', { carePlansError, carePlanId, carePlans });
    
    return (
      <div className="flex flex-col min-h-screen">
        <DashboardHeader />
        <BranchInfoHeader 
          branchId={branchId || ""} 
          branchName={branchName || ""} 
          onNewBooking={handleNewBooking} 
        />
        <div className="flex-1 p-6 space-y-6">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading care plan</h3>
            <p className="text-gray-600 mb-2">{errorMessage}</p>
            <p className="text-sm text-gray-500">{debugInfo}</p>
            <Button 
              onClick={() => navigate(`/branch-dashboard/${branchId}/${branchName}/care-plan`)}
              className="mt-4"
            >
              Back to Care Plans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Transform care plan data to match the expected format
  const transformedCarePlan = {
    id: carePlan.id,
    patientName: carePlan.title.replace('Comprehensive Care Plan for ', ''),
    patientId: carePlan.client_id,
    dateCreated: new Date(carePlan.created_at),
    lastUpdated: new Date(carePlan.updated_at),
    status: carePlan.status,
    assignedTo: carePlan.provider_name,
    avatar: carePlan.title.replace('Comprehensive Care Plan for ', '').split(' ').map(n => n[0]).join('')
  };

  // Transform goals for GoalsTab
  const transformedGoals = carePlan.goals?.map(goal => ({
    title: goal.description,
    status: goal.status === 'in-progress' ? 'In Progress' : 
            goal.status === 'completed' ? 'Completed' : 'Active',
    target: `Progress: ${goal.progress || 0}%`,
    notes: goal.notes || 'No additional notes'
  })) || [];

  // Transform activities for ActivitiesTab
  const transformedActivities = carePlan.activities?.map(activity => ({
    date: new Date(activity.created_at),
    action: activity.name,
    performer: carePlan.provider_name,
    status: activity.status === 'active' ? 'Completed' : activity.status
  })) || [];

  // Transform notes for NotesTab
  const transformedNotes = notes?.map(note => ({
    date: new Date(note.created_at),
    author: note.author,
    content: note.content
  })) || [];

  // Transform documents for DocumentsTab
  const transformedDocuments = documents?.map(doc => ({
    name: doc.name,
    date: new Date(doc.upload_date),
    type: doc.type,
    author: doc.uploaded_by
  })) || [];

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
                          <InfoCard 
                            icon={<User className="h-5 w-5 text-med-500" />}
                            title="Basic Information"
                            items={[
                              { label: "Full Name", value: transformedCarePlan.patientName },
                              { label: "Patient ID", value: transformedCarePlan.patientId },
                              { label: "Gender", value: mockPatientData.gender },
                              { label: "Date of Birth", value: `${format(mockPatientData.dateOfBirth, 'MMM dd, yyyy')} (Age: ${new Date().getFullYear() - mockPatientData.dateOfBirth.getFullYear()})` }
                            ]}
                          />
                          
                          <InfoCard 
                            icon={<Phone className="h-5 w-5 text-med-500" />}
                            title="Contact Information"
                            items={[
                              { label: "Address", value: mockPatientData.address },
                              { label: "Phone", value: mockPatientData.phone },
                              { label: "Email", value: mockPatientData.email },
                              { label: "Preferred Language", value: mockPatientData.preferredLanguage }
                            ]}
                          />
                          
                          <div className="md:col-span-2">
                            <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
                              <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
                                <Shield className="h-5 w-5 mr-2 text-med-600" />
                                Emergency Contact
                              </h3>
                              <div className="p-4 rounded-lg bg-med-50 border border-med-100">
                                <p className="text-gray-700">{mockPatientData.emergencyContact}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="overflow-hidden border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
                      <CardHeader className="pb-3 bg-gradient-to-r from-med-50 to-white border-b border-med-100">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Heart className="h-5 w-5 text-med-600" />
                          <span className="bg-gradient-to-r from-med-700 to-med-500 bg-clip-text text-transparent">Medical Information</span>
                        </CardTitle>
                        <CardDescription>Allergies, conditions, and current medications</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-6">
                          <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
                            <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
                              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                              Allergies
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {mockPatientData.allergies.map((allergy, index) => (
                                <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200 px-3 py-1 hover:bg-red-100 transition-colors">
                                  {allergy}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
                            <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
                              <FileBarChart2 className="h-5 w-5 mr-2 text-med-600" />
                              Medical Conditions
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {mockPatientData.medicalConditions.map((condition, index) => (
                                <Badge key={index} variant="outline" className="bg-med-50 text-med-700 border-med-200 px-3 py-1 hover:bg-med-100 transition-colors">
                                  {condition}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
                            <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
                              <Activity className="h-5 w-5 mr-2 text-med-600" />
                              Medications
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {mockPatientData.medications.map((medication, index) => (
                                <MedicationCard key={index} medication={medication} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="aboutme" className="space-y-4">
                    <AboutMeTab aboutMe={mockPatientData.aboutMe} />
                  </TabsContent>
                  
                  <TabsContent value="goals" className="space-y-4">
                    <GoalsTab goals={transformedGoals} />
                  </TabsContent>
                  
                  <TabsContent value="activities" className="space-y-4">
                    <ActivitiesTab 
                      activities={transformedActivities} 
                      onAddActivity={() => setActivityDialogOpen(true)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="notes" className="space-y-4">
                    <NotesTab 
                      notes={transformedNotes} 
                      onAddNote={() => setNoteDialogOpen(true)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="documents" className="space-y-4">
                    <DocumentsTab 
                      documents={transformedDocuments} 
                      onUploadDocument={() => setDocumentDialogOpen(true)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="assessments" className="space-y-4">
                    <AssessmentsTab assessments={mockPatientData.assessments} />
                  </TabsContent>
                  
                  <TabsContent value="equipment" className="space-y-4">
                    <EquipmentTab equipment={mockPatientData.equipment} />
                  </TabsContent>
                  
                  <TabsContent value="dietary" className="space-y-4">
                    <DietaryTab dietaryRequirements={mockPatientData.dietaryRequirements} />
                  </TabsContent>
                  
                  <TabsContent value="personalcare" className="space-y-4">
                    <PersonalCareTab personalCare={mockPatientData.personalCare} />
                  </TabsContent>
                  
                  <TabsContent value="risk" className="space-y-4">
                    <RiskTab riskAssessments={mockPatientData.riskAssessments} />
                  </TabsContent>
                  
                  <TabsContent value="serviceplan" className="space-y-4">
                    <ServicePlanTab serviceActions={mockPatientData.serviceActions} />
                  </TabsContent>
                  
                  <TabsContent value="serviceactions" className="space-y-4">
                    <ServiceActionsTab serviceActions={mockPatientData.serviceActions} />
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
      
      <AddNoteDialog 
        open={noteDialogOpen} 
        onOpenChange={setNoteDialogOpen}
        onSave={handleSaveNote}
      />
      
      <ScheduleFollowUpDialog 
        open={followUpDialogOpen} 
        onOpenChange={setFollowUpDialogOpen}
        onSave={handleSaveFollowUp}
      />
      
      <RecordActivityDialog 
        open={activityDialogOpen} 
        onOpenChange={setActivityDialogOpen}
        onSave={handleSaveActivity}
      />
      
      <UploadDocumentDialog
        open={documentDialogOpen}
        onOpenChange={setDocumentDialogOpen}
        onSave={handleSaveDocument}
      />

      <AddEventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        onSave={handleSaveEvent}
        carePlanId={transformedCarePlan.id}
        patientName={transformedCarePlan.patientName}
        patientId={transformedCarePlan.patientId}
      />
    </div>
  );
};

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  items: { label: string; value: string }[];
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, title, items }) => {
  return (
    <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
      <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
        {icon}
        <span className="ml-2">{title}</span>
      </h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-2 gap-2">
            <p className="text-sm font-medium text-gray-500">{item.label}</p>
            <p className="text-sm text-gray-700">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

interface MedicationCardProps {
  medication: {
    name: string;
    dosage: string;
    frequency: string;
    purpose: string;
  };
}

const MedicationCard: React.FC<MedicationCardProps> = ({ medication }) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="p-4 rounded-lg bg-white border border-med-100 hover:border-med-300 shadow-sm hover:shadow-md transition-all cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-med-700">{medication.name}</h4>
              <p className="text-sm text-gray-600">{medication.dosage}</p>
            </div>
            <Badge variant="outline" className="bg-med-50 text-med-600 border-med-200">
              {medication.frequency}
            </Badge>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-semibold text-med-700">{medication.name}</h4>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-gray-500">Dosage:</span>
            <span>{medication.dosage}</span>
            <span className="text-gray-500">Frequency:</span>
            <span>{medication.frequency}</span>
            <span className="text-gray-500">Purpose:</span>
            <span>{medication.purpose}</span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default CarePlanView;
