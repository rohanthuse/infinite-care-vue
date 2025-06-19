
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileEdit, Download, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useCarePlanData } from "@/hooks/useCarePlanData";
import { useCarePlanDialogs } from "@/components/care/hooks/useCarePlanDialogs";
import { 
  useClientProfile, 
  useClientPersonalInfo, 
  useClientMedicalInfo, 
  useClientDietaryRequirements, 
  useClientPersonalCare, 
  useClientAssessments, 
  useClientEquipment, 
  useClientServiceActions,
} from "@/hooks/useClientData";
import { useClientRiskAssessments } from "@/hooks/useClientRiskAssessments";
import { generatePDF } from "@/utils/pdfGenerator";
import { toast } from "sonner";
import { format } from "date-fns";
import { ErrorBoundary } from "@/components/care/ErrorBoundary";

// Import all the tab components
import { CarePlanTabBar } from "@/components/care/CarePlanTabBar";
import { CarePlanDialogs } from "@/components/care/CarePlanDialogs";
import { PersonalInfoTab } from "@/components/care/tabs/PersonalInfoTab";
import { AboutMeTab } from "@/components/care/tabs/AboutMeTab";
import { GoalsTab } from "@/components/care/tabs/GoalsTab";
import { ActivitiesTab } from "@/components/care/tabs/ActivitiesTab";
import { NotesTab } from "@/components/care/tabs/NotesTab";
import { DocumentsTab } from "@/components/care/tabs/DocumentsTab";
import { AssessmentsTab } from "@/components/care/tabs/AssessmentsTab";
import { EquipmentTab } from "@/components/care/tabs/EquipmentTab";
import { DietaryTab } from "@/components/care/tabs/DietaryTab";
import { PersonalCareTab } from "@/components/care/tabs/PersonalCareTab";
import { RiskAssessmentsTab } from "@/components/care/tabs/RiskAssessmentsTab";
import { ServicePlanTab } from "@/components/care/tabs/ServicePlanTab";
import { ServiceActionsTab } from "@/components/care/tabs/ServiceActionsTab";
import { EventsLogsTab } from "@/components/care/tabs/EventsLogsTab";

export default function CarePlanView() {
  const { carePlanId, branchId, branchName } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");

  console.log('[CarePlanView] URL params:', { carePlanId, branchId, branchName });
  console.log('[CarePlanView] Current location:', window.location.pathname);

  // Check if we have a care plan ID
  if (!carePlanId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Missing Care Plan ID</h2>
          <p className="text-gray-600 mb-4">No care plan ID was provided in the URL.</p>
          <Button 
            onClick={() => {
              if (branchId && branchName) {
                const decodedBranchName = decodeURIComponent(branchName);
                navigate(`/branch-dashboard/${branchId}/${decodedBranchName}/care`);
              } else {
                navigate("/");
              }
            }} 
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Care Plans
          </Button>
        </div>
      </div>
    );
  }

  // Fetch care plan data
  const { data: carePlanData, isLoading, error } = useCarePlanData(carePlanId);

  // Fetch all the real data from database
  const clientId = carePlanData?.client_id || '';
  const { data: clientProfile } = useClientProfile(clientId);
  const { data: personalInfo, isLoading: isLoadingPersonalInfo } = useClientPersonalInfo(clientId);
  const { data: medicalInfo } = useClientMedicalInfo(clientId);
  const { data: dietaryRequirements } = useClientDietaryRequirements(clientId);
  const { data: personalCare, isLoading: isLoadingPersonalCare } = useClientPersonalCare(clientId);
  const { data: assessments = [] } = useClientAssessments(clientId);
  const { data: equipment = [] } = useClientEquipment(clientId);
  const { data: riskAssessments = [] } = useClientRiskAssessments(clientId);
  const { data: serviceActions = [] } = useClientServiceActions(clientId);

  // Use the custom hook for dialog management
  const dialogState = useCarePlanDialogs(carePlanId || '', clientId, branchId || '', branchName || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading care plan...</p>
        </div>
      </div>
    );
  }

  if (error || !carePlanData) {
    console.error('[CarePlanView] Error loading care plan:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Care Plan Not Found</h2>
          <p className="text-gray-600 mb-2">The requested care plan could not be found.</p>
          <p className="text-sm text-gray-500 mb-4">Care Plan ID: {carePlanId}</p>
          {error && (
            <p className="text-sm text-red-600 mb-4">Error: {error.message}</p>
          )}
          <Button 
            onClick={() => {
              if (branchId && branchName) {
                const decodedBranchName = decodeURIComponent(branchName);
                navigate(`/branch-dashboard/${branchId}/${decodedBranchName}/care`);
              } else {
                navigate("/");
              }
            }} 
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Care Plans
          </Button>
        </div>
      </div>
    );
  }

  // Helper function to get provider display name and type
  const getProviderInfo = () => {
    if (carePlanData.staff && carePlanData.staff_id) {
      return {
        name: `${carePlanData.staff.first_name} ${carePlanData.staff.last_name}`,
        type: 'Staff Member',
        isStaff: true
      };
    }
    return {
      name: carePlanData.provider_name || 'Unknown Provider',
      type: 'External Provider',
      isStaff: false
    };
  };

  const providerInfo = getProviderInfo();

  // Transform the data to match CarePlanDetail expected interface
  const carePlan = {
    id: carePlanData.id,
    patientName: carePlanData.client ? `${carePlanData.client.first_name} ${carePlanData.client.last_name}` : 'Unknown Patient',
    patientId: carePlanData.client_id,
    dateCreated: new Date(carePlanData.created_at),
    lastUpdated: new Date(carePlanData.updated_at),
    status: carePlanData.status,
    assignedTo: providerInfo.name,
    assignedToType: providerInfo.type,
    isStaffProvider: providerInfo.isStaff,
    avatar: carePlanData.client?.avatar_initials || `${carePlanData.client?.first_name?.[0] || 'U'}${carePlanData.client?.last_name?.[0] || 'P'}`
  };

  const handleBack = () => {
    console.log('[CarePlanView] handleBack called with params:', { branchId, branchName });
    console.log('[CarePlanView] Current pathname:', window.location.pathname);
    
    // Extract branchId and branchName from current URL if not available in params
    let finalBranchId = branchId;
    let finalBranchName = branchName;
    
    if (!finalBranchId || !finalBranchName) {
      // Parse the current pathname to extract branch info
      const pathSegments = window.location.pathname.split('/');
      console.log('[CarePlanView] Path segments:', pathSegments);
      
      // Expected format: /branch-dashboard/{branchId}/{branchName}/care-plan/{carePlanId}
      if (pathSegments.length >= 4 && pathSegments[1] === 'branch-dashboard') {
        finalBranchId = pathSegments[2];
        finalBranchName = pathSegments[3];
        console.log('[CarePlanView] Extracted from URL:', { finalBranchId, finalBranchName });
      }
    }
    
    if (finalBranchId && finalBranchName) {
      const decodedBranchName = decodeURIComponent(finalBranchName);
      const carePagePath = `/branch-dashboard/${finalBranchId}/${encodeURIComponent(decodedBranchName)}/care`;
      console.log('[CarePlanView] Navigating to:', carePagePath);
      navigate(carePagePath);
    } else {
      console.error('[CarePlanView] Could not determine branch information for navigation');
      toast.error("Could not determine the correct care plans page. Please navigate manually.");
      // As a last resort, go back in browser history
      window.history.back();
    }
  };

  const handleEdit = () => {
    if (branchId && branchName && carePlan.patientId) {
      const decodedBranchName = decodeURIComponent(branchName);
      navigate(`/branch-dashboard/${branchId}/${decodedBranchName}/clients/${carePlan.patientId}/edit`);
    } else {
      console.error('Missing navigation parameters:', { branchId, branchName, patientId: carePlan.patientId });
      toast.error("Unable to navigate to edit page. Missing required parameters.");
    }
  };

  const handleExportCarePlan = () => {
    try {
      generatePDF({
        id: carePlan.id,
        title: `Care Plan for ${carePlan.patientName}`,
        date: format(carePlan.dateCreated, 'yyyy-MM-dd'),
        status: carePlan.status,
        signedBy: "System Generated"
      });
      toast.success("Care plan exported successfully");
    } catch (error) {
      console.error("Error exporting care plan:", error);
      toast.error("Failed to export care plan");
    }
  };

  const handleScheduleFollowUp = () => {
    console.log('Schedule follow-up called with params:', { branchId, branchName, carePlan });
    
    if (!branchId || !branchName) {
      console.error('Missing branch parameters for follow-up:', { branchId, branchName });
      toast.error("Unable to navigate to booking page. Missing branch information.");
      return;
    }

    try {
      const decodedBranchName = decodeURIComponent(branchName);
      const navigationPath = `/branch-dashboard/${branchId}/${decodedBranchName}/bookings/new`;
      
      console.log('Navigating to booking page:', navigationPath);
      
      navigate(navigationPath, {
        state: { 
          clientId: carePlan.patientId, 
          clientName: carePlan.patientName,
          carePlanId: carePlan.id 
        }
      });
      
      toast.success("Navigating to booking page...");
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error("Unable to navigate to booking page. Please try again.");
    }
  };

  const handleUploadDocument = () => {
    toast.info("Document upload functionality available in Documents tab");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Care Plans
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <div className="bg-blue-100 text-blue-600 w-full h-full flex items-center justify-center text-sm font-medium">
                    {carePlan.avatar}
                  </div>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold">{carePlan.patientName}</h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>Plan ID: {carePlan.id}</span>
                    <span>•</span>
                    <Badge>{carePlan.status}</Badge>
                    <span>•</span>
                    <span>Provider: {carePlan.assignedTo}</span>
                    <Badge variant={carePlan.isStaffProvider ? "default" : "outline"} className="text-xs">
                      {carePlan.assignedToType}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleExportCarePlan} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              <Button variant="outline" className="flex items-center gap-2" onClick={handleEdit}>
                <PenLine className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CarePlanTabBar activeTab={activeTab} onChange={setActiveTab} />
          
          <div className="mt-6">
            <TabsContent value="personal">
              <ErrorBoundary>
                <PersonalInfoTab 
                  client={clientProfile}
                  personalInfo={personalInfo}
                  medicalInfo={medicalInfo}
                  onEditPersonalInfo={() => dialogState.setEditPersonalInfoOpen(true)}
                  onEditMedicalInfo={() => dialogState.setEditMedicalInfoOpen(true)}
                />
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="aboutme">
              <ErrorBoundary>
                <AboutMeTab 
                  personalInfo={personalInfo}
                  personalCare={personalCare}
                  isLoadingPersonalInfo={isLoadingPersonalInfo}
                  isLoadingPersonalCare={isLoadingPersonalCare}
                  onEditAboutMe={() => dialogState.setEditAboutMeOpen(true)}
                />
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="goals">
              <ErrorBoundary>
                <GoalsTab 
                  carePlanId={carePlan.id}
                  onAddGoal={() => dialogState.setAddGoalDialogOpen(true)}
                />
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="activities">
              <ErrorBoundary>
                <ActivitiesTab 
                  carePlanId={carePlan.id}
                  onAddActivity={() => dialogState.setAddActivityDialogOpen(true)} 
                />
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="notes">
              <ErrorBoundary>
                <NotesTab 
                  clientId={carePlan.patientId}
                  onAddNote={() => dialogState.setAddNoteDialogOpen(true)} 
                />
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="documents">
              <ErrorBoundary>
                <DocumentsTab clientId={carePlan.patientId} />
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="assessments">
              <ErrorBoundary>
                <AssessmentsTab 
                  clientId={carePlan.patientId}
                  assessments={assessments}
                  onAddAssessment={() => dialogState.setAddAssessmentDialogOpen(true)}
                />
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="equipment">
              <ErrorBoundary>
                <EquipmentTab 
                  clientId={carePlan.patientId}
                  equipment={equipment}
                  onAddEquipment={() => dialogState.setAddEquipmentDialogOpen(true)}
                />
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="dietary">
              <ErrorBoundary>
                <DietaryTab 
                  dietaryRequirements={dietaryRequirements}
                  onEditDietaryRequirements={() => dialogState.setEditDietaryOpen(true)}
                />
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="personalcare">
              <ErrorBoundary>
                <PersonalCareTab 
                  personalCare={personalCare}
                  onEditPersonalCare={() => dialogState.setEditPersonalCareOpen(true)}
                />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="risk">
              <ErrorBoundary>
                <RiskAssessmentsTab 
                  clientId={carePlan.patientId}
                  riskAssessments={riskAssessments}
                  onAddRiskAssessment={() => dialogState.setAddRiskAssessmentDialogOpen(true)}
                />
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="serviceplan">
              <ErrorBoundary>
                <ServicePlanTab 
                  serviceActions={serviceActions}
                  onAddServicePlan={() => dialogState.setAddServicePlanDialogOpen(true)}
                />
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="serviceactions">
              <ErrorBoundary>
                <ServiceActionsTab 
                  serviceActions={serviceActions}
                  onAddServiceAction={() => dialogState.setAddServiceActionDialogOpen(true)}
                />
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="eventslogs">
              <ErrorBoundary>
                <EventsLogsTab 
                  clientId={carePlan.patientId}
                  carePlanId={carePlan.id}
                  patientName={carePlan.patientName}
                  onAddEvent={() => dialogState.setAddEventDialogOpen(true)}
                />
              </ErrorBoundary>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* All Dialog Components */}
      <CarePlanDialogs
        carePlan={carePlan}
        clientProfile={clientProfile}
        personalInfo={personalInfo}
        medicalInfo={medicalInfo}
        dietaryRequirements={dietaryRequirements}
        personalCare={personalCare}
        dialogs={{
          addNoteDialogOpen: dialogState.addNoteDialogOpen,
          setAddNoteDialogOpen: dialogState.setAddNoteDialogOpen,
          addEventDialogOpen: dialogState.addEventDialogOpen,
          setAddEventDialogOpen: dialogState.setAddEventDialogOpen,
          addGoalDialogOpen: dialogState.addGoalDialogOpen,
          setAddGoalDialogOpen: dialogState.setAddGoalDialogOpen,
          addActivityDialogOpen: dialogState.addActivityDialogOpen,
          setAddActivityDialogOpen: dialogState.setAddActivityDialogOpen,
          addAssessmentDialogOpen: dialogState.addAssessmentDialogOpen,
          setAddAssessmentDialogOpen: dialogState.setAddAssessmentDialogOpen,
          addEquipmentDialogOpen: dialogState.addEquipmentDialogOpen,
          setAddEquipmentDialogOpen: dialogState.setAddEquipmentDialogOpen,
          addRiskAssessmentDialogOpen: dialogState.addRiskAssessmentDialogOpen,
          setAddRiskAssessmentDialogOpen: dialogState.setAddRiskAssessmentDialogOpen,
          addServicePlanDialogOpen: dialogState.addServicePlanDialogOpen,
          setAddServicePlanDialogOpen: dialogState.setAddServicePlanDialogOpen,
          addServiceActionDialogOpen: dialogState.addServiceActionDialogOpen,
          setAddServiceActionDialogOpen: dialogState.setAddServiceActionDialogOpen,
          editPersonalInfoOpen: dialogState.editPersonalInfoOpen,
          setEditPersonalInfoOpen: dialogState.setEditPersonalInfoOpen,
          editMedicalInfoOpen: dialogState.editMedicalInfoOpen,
          setEditMedicalInfoOpen: dialogState.setEditMedicalInfoOpen,
          editAboutMeOpen: dialogState.editAboutMeOpen,
          setEditAboutMeOpen: dialogState.setEditAboutMeOpen,
          editDietaryOpen: dialogState.editDietaryOpen,
          setEditDietaryOpen: dialogState.setEditDietaryOpen,
          editPersonalCareOpen: dialogState.editPersonalCareOpen,
          setEditPersonalCareOpen: dialogState.setEditPersonalCareOpen,
        }}
        mutations={{
          createNoteMutation: dialogState.createNoteMutation,
          createEventMutation: dialogState.createEventMutation,
          createGoalMutation: dialogState.createGoalMutation,
          createActivityMutation: dialogState.createActivityMutation,
          createAssessmentMutation: dialogState.createAssessmentMutation,
          createEquipmentMutation: dialogState.createEquipmentMutation,
          createRiskAssessmentMutation: dialogState.createRiskAssessmentMutation,
          createServiceActionMutation: dialogState.createServiceActionMutation,
          updateClientMutation: dialogState.updateClientMutation,
        }}
        handlers={{
          handleSaveNote: dialogState.handleSaveNote,
          handleSaveEvent: dialogState.handleSaveEvent,
          handleSaveGoal: dialogState.handleSaveGoal,
          handleSaveActivity: dialogState.handleSaveActivity,
          handleSaveAssessment: dialogState.handleSaveAssessment,
          handleSaveEquipment: dialogState.handleSaveEquipment,
          handleSaveRiskAssessment: dialogState.handleSaveRiskAssessment,
          handleSaveServiceAction: dialogState.handleSaveServiceAction,
          handleSavePersonalInfo: dialogState.handleSavePersonalInfo,
        }}
      />
    </div>
  );
}
