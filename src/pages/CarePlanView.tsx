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
import { resolveCarePlanId, getDisplayCarePlanId } from "@/utils/carePlanIdMapping";
import { useCarePlanData } from "@/hooks/useCarePlanData";
import { useCarePlanGoals } from "@/hooks/useCarePlanGoals";
import { useClientNotes, useCreateClientNote } from "@/hooks/useClientNotes";

const mockCarePlans = [
  {
    id: "CP-001",
    patientName: "John Michael",
    patientId: "PT-2356",
    dateCreated: new Date("2023-10-15"),
    lastUpdated: new Date("2023-11-05"),
    status: "Active",
    assignedTo: "Dr. Sarah Johnson",
    avatar: "JM"
  },
  {
    id: "CP-002",
    patientName: "Emma Thompson",
    patientId: "PT-1122",
    dateCreated: new Date("2023-09-22"),
    lastUpdated: new Date("2023-10-30"),
    status: "Under Review",
    assignedTo: "Dr. James Wilson",
    avatar: "ET"
  }
];

const CarePlanView = () => {
  const { id: branchId, branchName, carePlanId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  // Debug logging with better error handling
  console.log('[CarePlanView] Component mounted with params:', { branchId, branchName, carePlanId });
  
  // Resolve the care plan ID properly before making database calls
  const resolvedCarePlanId = carePlanId ? resolveCarePlanId(carePlanId) : '';
  console.log('[CarePlanView] Resolved care plan ID:', resolvedCarePlanId);

  // Fetch data from database with resolved ID
  const { data: carePlanData, isLoading: isCarePlanLoading, error: carePlanError } = useCarePlanData(resolvedCarePlanId);
  const { data: goalsData, isLoading: isGoalsLoading, error: goalsError } = useCarePlanGoals(resolvedCarePlanId);
  
  // Use the client_id from care plan data for notes
  const clientId = carePlanData?.client_id || '';
  const { data: notesData, isLoading: isNotesLoading, error: notesError } = useClientNotes(clientId);
  const createNoteMutation = useCreateClientNote();

  // Debug logging for data fetching
  console.log('[CarePlanView] Data fetching status:', {
    carePlanData,
    isCarePlanLoading,
    carePlanError,
    goalsData,
    isGoalsLoading,
    goalsError,
    notesData,
    isNotesLoading,
    notesError
  });

  // Create unified care plan object combining database and mock data
  const carePlan = carePlanData ? {
    id: getDisplayCarePlanId(carePlanId || ''), // Use display ID for UI
    patientName: carePlanData.client ? `${carePlanData.client.first_name} ${carePlanData.client.last_name}` : "John Michael",
    patientId: carePlanData.client?.other_identifier || "PT-2356",
    dateCreated: new Date(carePlanData.created_at),
    lastUpdated: new Date(carePlanData.updated_at),
    status: carePlanData.status,
    assignedTo: carePlanData.provider_name,
    avatar: carePlanData.client?.avatar_initials || "JM"
  } : null;

  console.log('[CarePlanView] Unified care plan object:', carePlan);

  // Transform database goals to match component expected format
  const transformedGoals = goalsData?.map(goal => ({
    title: goal.description,
    status: goal.status,
    target: `Progress: ${goal.progress || 0}%`,
    notes: goal.notes || 'No additional notes'
  })) || [];

  // Transform database notes to match component expected format
  const transformedNotes = notesData?.map(note => ({
    date: new Date(note.created_at),
    author: note.author,
    content: note.content
  })) || [];

  const handlePrintCarePlan = () => {
    if (!carePlan) return;
    
    generatePDF({
      id: carePlan.id,
      title: `Care Plan for ${carePlan.patientName}`,
      date: format(carePlan.lastUpdated, 'yyyy-MM-dd'),
      status: carePlan.status,
      signedBy: carePlan.assignedTo
    });
  };

  const handleNewBooking = () => {
    toast({
      title: "New Booking",
      description: "Booking functionality will be implemented soon.",
    });
  };

  const handleSaveNote = async (note: { content: string; date: Date }) => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID not found. Cannot save note.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createNoteMutation.mutateAsync({
        client_id: clientId,
        title: "Care Note",
        content: note.content,
        author: carePlan?.assignedTo || "Care Provider",
      });

      toast({
        title: "Note added",
        description: "The note has been successfully added to the patient's record."
      });
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive"
      });
    }
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
    
    const newActivity = {
      date: activity.date,
      action: activity.action,
      performer: activity.performer,
      status: activity.status
    };
    
    mockPatientData.activities.unshift(newActivity);
    
    toast({
      title: "Activity recorded",
      description: `The activity "${activity.action}" has been recorded.`
    });
  };

  const handleSaveDocument = (document: { name: string; date: Date; type: string; author: string; file: File }) => {
    console.log("Uploading document:", document);
    
    const newDocument = {
      name: document.name,
      date: document.date,
      type: document.type,
      author: document.author
    };
    
    mockPatientData.documents.unshift(newDocument);
    
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

  const sidebarProps = {
    carePlan: carePlan!,
    onAddNote: () => setNoteDialogOpen(true),
    onScheduleFollowUp: () => setFollowUpDialogOpen(true),
    onRecordActivity: () => setActivityDialogOpen(true),
    onUploadDocument: () => setDocumentDialogOpen(true)
  };

  // Enhanced error handling with better messaging
  if (carePlanError) {
    console.error('[CarePlanView] Care plan error:', carePlanError);
    return (
      <div className="flex flex-col min-h-screen">
        <DashboardHeader />
        <BranchInfoHeader 
          branchId={branchId || ""} 
          branchName={branchName || ""} 
          onNewBooking={() => {}} 
        />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Care Plan</h3>
            <p className="text-gray-600 mb-2">
              Failed to load care plan "{carePlanId}"
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Error: {carePlanError.message}
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-400">
                Original ID: {carePlanId}<br/>
                Resolved ID: {resolvedCarePlanId}
              </p>
            </div>
            <Button onClick={() => navigate(`/branch-dashboard/${branchId}/${branchName}/care-plan`)}>
              Back to Care Plans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced loading state
  if (isCarePlanLoading) {
    console.log('[CarePlanView] Loading care plan data...');
    return (
      <div className="flex flex-col min-h-screen">
        <DashboardHeader />
        <BranchInfoHeader 
          branchId={branchId || ""} 
          branchName={branchName || ""} 
          onNewBooking={() => {}} 
        />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading care plan {carePlanId}...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where care plan is not found
  if (!carePlan && !isCarePlanLoading) {
    console.warn('[CarePlanView] Care plan not found:', carePlanId);
    return (
      <div className="flex flex-col min-h-screen">
        <DashboardHeader />
        <BranchInfoHeader 
          branchId={branchId || ""} 
          branchName={branchName || ""} 
          onNewBooking={() => {}} 
        />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Care Plan Not Found</h3>
            <p className="text-gray-600 mb-4">
              The care plan "{carePlanId}" could not be found.
            </p>
            <Button onClick={() => navigate(`/branch-dashboard/${branchId}/${branchName}/care-plan`)}>
              Back to Care Plans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  console.log('[CarePlanView] Rendering care plan view for:', carePlan?.patientName);

  // Transform mock data for assessments
  const transformedAssessments = mockPatientData.assessments.map(assessment => ({
    id: `assessment-${Date.now()}-${Math.random()}`,
    client_id: carePlan?.patientId || 'unknown',
    assessment_type: 'general',
    assessment_name: assessment.name,
    assessment_date: assessment.date.toISOString().split('T')[0],
    performed_by: assessment.performer,
    status: assessment.status,
    results: assessment.results,
    score: null,
    recommendations: null,
    next_review_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  // Transform mock data for equipment
  const transformedEquipment = mockPatientData.equipment.map(equipment => ({
    id: `equipment-${Date.now()}-${Math.random()}`,
    client_id: carePlan?.patientId || 'unknown',
    equipment_name: equipment.name,
    equipment_type: equipment.type,
    manufacturer: null,
    model_number: null,
    serial_number: null,
    installation_date: null,
    maintenance_schedule: null,
    last_maintenance_date: equipment.lastInspection.toISOString().split('T')[0],
    next_maintenance_date: null,
    status: equipment.status,
    location: null,
    notes: equipment.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  // Transform dietary requirements
  const transformedDietaryRequirements = {
    id: `dietary-${carePlan?.id || 'unknown'}`,
    client_id: carePlan?.patientId || 'unknown',
    dietary_restrictions: mockPatientData.dietaryRequirements.restrictions.map(r => r.name),
    food_allergies: mockPatientData.dietaryRequirements.restrictions.filter(r => r.reason === 'allergy').map(r => r.name),
    food_preferences: mockPatientData.dietaryRequirements.preferences,
    meal_schedule: { general: mockPatientData.dietaryRequirements.mealPlan },
    nutritional_needs: mockPatientData.dietaryRequirements.nutritionalNotes,
    supplements: mockPatientData.dietaryRequirements.supplements.map(s => s.name),
    feeding_assistance_required: false,
    special_equipment_needed: "",
    texture_modifications: "",
    fluid_restrictions: mockPatientData.dietaryRequirements.hydrationPlan,
    weight_monitoring: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Transform personal care
  const transformedPersonalCare = {
    id: `personalcare-${carePlan?.id || 'unknown'}`,
    client_id: carePlan?.patientId || 'unknown',
    personal_hygiene_needs: mockPatientData.personalCare.routines.map(r => `${r.activity}: ${r.frequency}`).join('; '),
    bathing_preferences: mockPatientData.personalCare.preferences.join(', '),
    dressing_assistance_level: mockPatientData.personalCare.mobility.transferAbility,
    toileting_assistance_level: "Independent",
    continence_status: "Continent",
    sleep_patterns: "Regular sleep pattern",
    behavioral_notes: mockPatientData.personalCare.mobility.notes,
    comfort_measures: mockPatientData.personalCare.preferences.join(', '),
    pain_management: "As needed",
    skin_care_needs: "Standard care",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Transform risk assessments
  const transformedRiskAssessments = mockPatientData.riskAssessments.map(risk => ({
    id: `risk-${Date.now()}-${Math.random()}`,
    client_id: carePlan?.patientId || 'unknown',
    risk_type: risk.type,
    risk_level: risk.level,
    risk_factors: [],
    mitigation_strategies: [risk.mitigationPlan],
    assessment_date: risk.lastAssessed.toISOString().split('T')[0],
    assessed_by: risk.assessedBy,
    review_date: risk.reviewDate.toISOString().split('T')[0],
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  // Transform service actions
  const transformedServiceActions = mockPatientData.serviceActions.map(action => ({
    id: `service-${Date.now()}-${Math.random()}`,
    client_id: carePlan?.patientId || 'unknown',
    care_plan_id: carePlan?.id || 'unknown',
    service_name: action.service,
    service_category: 'Care Service',
    provider_name: action.provider,
    frequency: action.frequency,
    duration: action.duration,
    schedule_details: action.schedule,
    goals: action.goals,
    progress_status: action.progress,
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,
    last_completed_date: null,
    next_scheduled_date: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

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
              {carePlan && (
                <span className="text-sm text-gray-500 ml-2">
                  ({getDisplayCarePlanId(carePlan.id)})
                </span>
              )}
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
          
          {carePlan && (
            <div className="flex flex-col space-y-6">
              <PatientHeader carePlan={carePlan} />
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/4">
                  <CarePlanSidebar 
                    carePlan={carePlan} 
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
                                { label: "Full Name", value: carePlan.patientName },
                                { label: "Patient ID", value: carePlan.patientId },
                                { label: "Gender", value: carePlanData?.client?.gender || mockPatientData.gender },
                                { label: "Date of Birth", value: carePlanData?.client?.date_of_birth ? 
                                  `${format(new Date(carePlanData.client.date_of_birth), 'MMM dd, yyyy')} (Age: ${new Date().getFullYear() - new Date(carePlanData.client.date_of_birth).getFullYear()})` : 
                                  `${format(mockPatientData.dateOfBirth, 'MMM dd, yyyy')} (Age: ${new Date().getFullYear() - mockPatientData.dateOfBirth.getFullYear()})`
                                }
                              ]}
                            />
                            
                            <InfoCard 
                              icon={<Phone className="h-5 w-5 text-med-500" />}
                              title="Contact Information"
                              items={[
                                { label: "Address", value: carePlanData?.client?.address || mockPatientData.address },
                                { label: "Phone", value: carePlanData?.client?.phone || mockPatientData.phone },
                                { label: "Email", value: carePlanData?.client?.email || mockPatientData.email },
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
                      <AboutMeTab 
                        personalInfo={{
                          cultural_preferences: mockPatientData.aboutMe.preferences.join(', '),
                          language_preferences: mockPatientData.preferredLanguage,
                        }}
                        personalCare={transformedPersonalCare}
                      />
                    </TabsContent>
                    
                    <TabsContent value="goals" className="space-y-4">
                      {isGoalsLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <GoalsTab goals={transformedGoals.length > 0 ? transformedGoals : mockPatientData.goals} />
                      )}
                    </TabsContent>
                    
                    <TabsContent value="activities" className="space-y-4">
                      <ActivitiesTab 
                        activities={mockPatientData.activities} 
                        onAddActivity={() => setActivityDialogOpen(true)}
                      />
                    </TabsContent>
                    
                    <TabsContent value="notes" className="space-y-4">
                      {isNotesLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <NotesTab 
                          notes={transformedNotes.length > 0 ? transformedNotes : mockPatientData.notes} 
                          onAddNote={() => setNoteDialogOpen(true)}
                        />
                      )}
                    </TabsContent>
                    
                    <TabsContent value="documents" className="space-y-4">
                      <DocumentsTab 
                        documents={mockPatientData.documents} 
                        onUploadDocument={() => setDocumentDialogOpen(true)}
                      />
                    </TabsContent>
                    
                    <TabsContent value="assessments" className="space-y-4">
                      <AssessmentsTab assessments={transformedAssessments} />
                    </TabsContent>
                    
                    <TabsContent value="equipment" className="space-y-4">
                      <EquipmentTab equipment={transformedEquipment} />
                    </TabsContent>
                    
                    <TabsContent value="dietary" className="space-y-4">
                      <DietaryTab dietaryRequirements={transformedDietaryRequirements} />
                    </TabsContent>
                    
                    <TabsContent value="personalcare" className="space-y-4">
                      <PersonalCareTab personalCare={transformedPersonalCare} />
                    </TabsContent>
                    
                    <TabsContent value="risk" className="space-y-4">
                      <RiskTab riskAssessments={transformedRiskAssessments} />
                    </TabsContent>
                    
                    <TabsContent value="serviceplan" className="space-y-4">
                      <ServicePlanTab serviceActions={mockPatientData.serviceActions} />
                    </TabsContent>
                    
                    <TabsContent value="serviceactions" className="space-y-4">
                      <ServiceActionsTab serviceActions={transformedServiceActions} />
                    </TabsContent>
                    
                    <TabsContent value="eventslogs" className="space-y-4">
                      <EventsLogsTab 
                        carePlanId={carePlan.id}
                        patientName={carePlan.patientName}
                        onAddEvent={() => setEventDialogOpen(true)}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}
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
        carePlanId={carePlan?.id || ""}
        patientName={carePlan?.patientName || ""}
        patientId={carePlan?.patientId || ""}
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
