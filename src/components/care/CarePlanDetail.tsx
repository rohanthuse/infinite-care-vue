import React, { useState } from "react";
import { X, FileEdit, Download, PenLine, MessageCircle, Clock, Activity, FileBarChart2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { generatePDF, exportCarePlanPDF } from "@/utils/pdfGenerator";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Import all the hooks we need
import { useCreateClientNote } from "@/hooks/useClientNotes";
import { useCreateClientEvent } from "@/hooks/useClientEvents";
import { useCreateGoal } from "@/hooks/useCarePlanGoalsMutations";
import { useCreateClientActivity } from "@/hooks/useClientActivities";
import { useCreateClientEquipment } from "@/hooks/useClientEquipmentMutations";
import { useCreateClientAssessment } from "@/hooks/useClientAssessmentMutations";
import { useCreateClientRiskAssessment } from "@/hooks/useClientRiskAssessmentMutations";
import { useCreateClientServiceAction } from "@/hooks/useClientServiceActionMutations";
import { 
  useClientProfile, 
  useClientPersonalInfo, 
  useClientMedicalInfo, 
  useClientDietaryRequirements, 
  useClientPersonalCare, 
  useClientAssessments, 
  useClientEquipment, 
  useClientRiskAssessments, 
  useClientServiceActions,
  useUpdateClientProfile
} from "@/hooks/useClientData";

// Import individual mutation hooks for proper data updates
import { useUpdateClientPersonalInfo } from "@/hooks/useClientPersonalInfo";
import { useUpdateClientMedicalInfo } from "@/hooks/useClientMedicalInfo";
import { useUpdateClientDietaryRequirements } from "@/hooks/useClientDietaryRequirements";
import { useUpdateClientPersonalCare } from "@/hooks/useClientPersonalCare";

import { CarePlanSidebar } from "./CarePlanSidebar";
import { CarePlanTabBar } from "./CarePlanTabBar";
import { PersonalInfoTab } from "./tabs/PersonalInfoTab";
import { AboutMeTab } from "./tabs/AboutMeTab";
import { GoalsTab } from "./tabs/GoalsTab";
import { ActivitiesTab } from "./tabs/ActivitiesTab";
import { DietaryTab } from "./tabs/DietaryTab";
import { NotesTab } from "./tabs/NotesTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { PersonalCareTab } from "./tabs/PersonalCareTab";
import { EventsLogsTab } from "./tabs/EventsLogsTab";
import { ServiceActionsTab } from "./tabs/ServiceActionsTab";
import { ServicePlanTab } from "./tabs/ServicePlanTab";
import { AssessmentsTab } from "./tabs/AssessmentsTab";
import { EquipmentTab } from "./tabs/EquipmentTab";
import { RiskAssessmentsTab } from "./tabs/RiskAssessmentsTab";
import { AddNoteDialog } from "./dialogs/AddNoteDialog";
import { AddEventDialog } from "./dialogs/AddEventDialog";
import { AddGoalDialog } from "./dialogs/AddGoalDialog";
import { AddActivityDialog } from "./dialogs/AddActivityDialog";
import { AddEquipmentDialog } from "./dialogs/AddEquipmentDialog";
import { AddAssessmentDialog } from "./dialogs/AddAssessmentDialog";
import { AddRiskAssessmentDialog } from "./dialogs/AddRiskAssessmentDialog";
import { AddServicePlanDialog } from "./dialogs/AddServicePlanDialog";
import { AddServiceActionDialog } from "./dialogs/AddServiceActionDialog";
import { EditPersonalInfoDialog } from "./dialogs/EditPersonalInfoDialog";
import { EditMedicalInfoDialog } from "./dialogs/EditMedicalInfoDialog";
import { EditAboutMeDialog } from "./dialogs/EditAboutMeDialog";
import { EditDietaryDialog } from "./dialogs/EditDietaryDialog";
import { EditPersonalCareDialog } from "./dialogs/EditPersonalCareDialog";

interface CarePlanDetailProps {
  carePlan: {
    id: string;
    patientName: string;
    patientId: string;
    dateCreated: Date;
    lastUpdated: Date;
    status: string;
    assignedTo: string;
    avatar: string;
  };
  onClose: () => void;
}

export const CarePlanDetail: React.FC<CarePlanDetailProps> = ({
  carePlan,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState("personal");
  
  // Dialog states for all functionalities
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [addGoalDialogOpen, setAddGoalDialogOpen] = useState(false);
  const [addActivityDialogOpen, setAddActivityDialogOpen] = useState(false);
  const [addAssessmentDialogOpen, setAddAssessmentDialogOpen] = useState(false);
  const [addEquipmentDialogOpen, setAddEquipmentDialogOpen] = useState(false);
  const [addRiskAssessmentDialogOpen, setAddRiskAssessmentDialogOpen] = useState(false);
  const [addServicePlanDialogOpen, setAddServicePlanDialogOpen] = useState(false);
  const [addServiceActionDialogOpen, setAddServiceActionDialogOpen] = useState(false);
  
  // Edit dialog states
  const [editPersonalInfoOpen, setEditPersonalInfoOpen] = useState(false);
  const [editMedicalInfoOpen, setEditMedicalInfoOpen] = useState(false);
  const [editAboutMeOpen, setEditAboutMeOpen] = useState(false);
  const [editDietaryOpen, setEditDietaryOpen] = useState(false);
  const [editPersonalCareOpen, setEditPersonalCareOpen] = useState(false);
  
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  // Extract parameters from URL with proper decoding
  const branchId = params.branchId || '';
  const branchName = params.branchName ? decodeURIComponent(params.branchName) : '';

  console.log('CarePlanDetail - URL params:', { branchId, branchName, carePlanId: carePlan.id, patientId: carePlan.patientId });

  // Fetch all the real data from database
  const { data: clientProfile } = useClientProfile(carePlan.patientId);
  const { data: personalInfo } = useClientPersonalInfo(carePlan.patientId);
  const { data: medicalInfo } = useClientMedicalInfo(carePlan.patientId);
  const { data: dietaryRequirements } = useClientDietaryRequirements(carePlan.patientId);
  const { data: personalCare } = useClientPersonalCare(carePlan.patientId);
  const { data: assessments = [] } = useClientAssessments(carePlan.patientId);
  const { data: equipment = [] } = useClientEquipment(carePlan.patientId);
  const { data: riskAssessments = [] } = useClientRiskAssessments(carePlan.patientId);
  const { data: serviceActions = [] } = useClientServiceActions(carePlan.patientId);

  // Initialize all the mutation hooks
  const createNoteMutation = useCreateClientNote();
  const createEventMutation = useCreateClientEvent();
  const createGoalMutation = useCreateGoal();
  const createActivityMutation = useCreateClientActivity();
  const createAssessmentMutation = useCreateClientAssessment();
  const createEquipmentMutation = useCreateClientEquipment();
  const createRiskAssessmentMutation = useCreateClientRiskAssessment();
  const createServiceActionMutation = useCreateClientServiceAction();
  
  // Initialize update mutations for different data types
  const updateClientMutation = useUpdateClientProfile();
  const updatePersonalInfoMutation = useUpdateClientPersonalInfo();
  const updateMedicalInfoMutation = useUpdateClientMedicalInfo();
  const updateDietaryRequirementsMutation = useUpdateClientDietaryRequirements();
  const updatePersonalCareMutation = useUpdateClientPersonalCare();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Navigate back with proper URL structure
      if (branchId && branchName) {
        const encodedBranchName = encodeURIComponent(branchName);
        navigate(`/branch-dashboard/${branchId}/${encodedBranchName}/care`);
      } else {
        navigate("/");
      }
    }
  };

  const handleEdit = () => {
    if (branchId && branchName && carePlan.patientId) {
      const encodedBranchName = encodeURIComponent(branchName);
      navigate(`/branch-dashboard/${branchId}/${encodedBranchName}/clients/${carePlan.patientId}/edit`);
    } else {
      console.error('Missing navigation parameters:', { branchId, branchName, patientId: carePlan.patientId });
      toast.error("Unable to navigate to edit page. Missing required parameters.");
    }
  };

  const handleScheduleFollowUp = () => {
    if (branchId && branchName) {
      const encodedBranchName = encodeURIComponent(branchName);
      navigate(`/branch-dashboard/${branchId}/${encodedBranchName}/bookings/new`, {
        state: { 
          clientId: carePlan.patientId, 
          clientName: carePlan.patientName,
          carePlanId: carePlan.id 
        }
      });
    } else {
      toast.error("Unable to navigate to booking page. Please try again.");
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

  // Edit handlers that open dialogs instead of navigating away
  const handleEditPersonalInfo = () => {
    setEditPersonalInfoOpen(true);
  };

  const handleEditMedicalInfo = () => {
    setEditMedicalInfoOpen(true);
  };

  const handleEditAboutMe = () => {
    setEditAboutMeOpen(true);
  };

  const handleEditDietaryRequirements = () => {
    setEditDietaryOpen(true);
  };

  const handleEditPersonalCare = () => {
    setEditPersonalCareOpen(true);
  };

  // Functional handlers that open dialogs
  const handleAddAssessment = () => {
    setAddAssessmentDialogOpen(true);
  };

  const handleAddEquipment = () => {
    setAddEquipmentDialogOpen(true);
  };

  const handleAddRiskAssessment = () => {
    setAddRiskAssessmentDialogOpen(true);
  };

  const handleAddServicePlan = () => {
    setAddServicePlanDialogOpen(true);
  };

  const handleAddServiceAction = () => {
    setAddServiceActionDialogOpen(true);
  };

  const handleAddNote = () => {
    setAddNoteDialogOpen(true);
  };

  const handleRecordActivity = () => {
    setAddActivityDialogOpen(true);
  };

  const handleUploadDocument = () => {
    toast.info("Document upload functionality available in Documents tab");
  };

  const handleAddEvent = () => {
    setAddEventDialogOpen(true);
  };

  const handleAddGoal = () => {
    setAddGoalDialogOpen(true);
  };

  // Database-connected save handlers
  const handleSaveNote = async (noteData: { title: string; content: string }) => {
    try {
      await createNoteMutation.mutateAsync({
        client_id: carePlan.patientId,
        title: noteData.title,
        content: noteData.content,
        author: "Admin",
      });
      setAddNoteDialogOpen(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    }
  };

  const handleSaveEvent = async (eventData: any) => {
    try {
      await createEventMutation.mutateAsync({
        client_id: carePlan.patientId,
        title: eventData.title,
        event_type: eventData.event_type,
        severity: eventData.severity,
        description: eventData.description,
        reporter: eventData.reporter,
        status: 'open',
      });
      setAddEventDialogOpen(false);
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event");
    }
  };

  const handleSaveGoal = async (goalData: any) => {
    try {
      await createGoalMutation.mutateAsync({
        care_plan_id: carePlan.id,
        description: goalData.description,
        status: goalData.status,
        progress: goalData.progress,
        notes: goalData.notes,
      });
      setAddGoalDialogOpen(false);
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error("Failed to save goal");
    }
  };

  const handleSaveActivity = async (activityData: any) => {
    try {
      await createActivityMutation.mutateAsync({
        care_plan_id: carePlan.id,
        name: activityData.name,
        description: activityData.description,
        frequency: activityData.frequency,
        status: activityData.status,
      });
      setAddActivityDialogOpen(false);
    } catch (error) {
      console.error("Error saving activity:", error);
      toast.error("Failed to save activity");
    }
  };

  const handleSaveAssessment = async (assessmentData: any) => {
    try {
      await createAssessmentMutation.mutateAsync({
        client_id: carePlan.patientId,
        assessment_name: assessmentData.assessment_name,
        assessment_type: assessmentData.assessment_type,
        assessment_date: assessmentData.assessment_date,
        performed_by: assessmentData.performed_by,
        status: 'completed',
        score: assessmentData.score,
        results: assessmentData.results,
        recommendations: assessmentData.recommendations,
        next_review_date: assessmentData.next_review_date,
      });
      setAddAssessmentDialogOpen(false);
    } catch (error) {
      console.error("Error saving assessment:", error);
      toast.error("Failed to save assessment");
    }
  };

  const handleSaveEquipment = async (equipmentData: any) => {
    try {
      await createEquipmentMutation.mutateAsync(equipmentData);
      setAddEquipmentDialogOpen(false);
    } catch (error) {
      console.error("Error saving equipment:", error);
      toast.error("Failed to save equipment");
    }
  };

  const handleSaveRiskAssessment = async (riskData: any) => {
    try {
      await createRiskAssessmentMutation.mutateAsync(riskData);
      setAddRiskAssessmentDialogOpen(false);
    } catch (error) {
      console.error("Error saving risk assessment:", error);
      toast.error("Failed to save risk assessment");
    }
  };

  const handleSaveServiceAction = async (serviceActionData: any) => {
    try {
      await createServiceActionMutation.mutateAsync(serviceActionData);
      setAddServiceActionDialogOpen(false);
    } catch (error) {
      console.error("Error saving service action:", error);
      toast.error("Failed to save service action");
    }
  };

  // Fixed save handler that uses appropriate mutation hooks for different data types
  const handleSavePersonalInfo = async (data: any) => {
    try {
      if (data.dietary_restrictions || data.food_allergies || data.food_preferences) {
        // This is dietary data - use dietary requirements mutation
        await updateDietaryRequirementsMutation.mutateAsync({
          client_id: carePlan.patientId,
          ...data
        });
      } else if (data.personal_hygiene_needs || data.bathing_preferences || data.dressing_assistance_level) {
        // This is personal care data - use personal care mutation
        await updatePersonalCareMutation.mutateAsync({
          client_id: carePlan.patientId,
          ...data
        });
      } else if (data.allergies || data.current_medications || data.medical_conditions) {
        // This is medical data - use medical info mutation
        await updateMedicalInfoMutation.mutateAsync({
          client_id: carePlan.patientId,
          ...data
        });
      } else if (data.cultural_preferences || data.language_preferences || data.emergency_contact_name) {
        // This is personal info data - use personal info mutation
        await updatePersonalInfoMutation.mutateAsync({
          client_id: carePlan.patientId,
          ...data
        });
      } else {
        // Default to client profile update for basic client data
        await updateClientMutation.mutateAsync({
          clientId: carePlan.patientId,
          updates: data
        });
      }
      
      setEditPersonalInfoOpen(false);
      setEditMedicalInfoOpen(false);
      setEditAboutMeOpen(false);
      setEditDietaryOpen(false);
      setEditPersonalCareOpen(false);
      toast.success("Information updated successfully");
    } catch (error) {
      console.error("Error updating information:", error);
      toast.error("Failed to update information");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <div className="bg-blue-100 text-blue-600 w-full h-full flex items-center justify-center text-sm font-medium">
                {carePlan.avatar}
              </div>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{carePlan.patientName}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Plan ID: {carePlan.id}</span>
                <span>•</span>
                <Badge>{carePlan.status}</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleExportCarePlan} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button variant="outline" onClick={handleEdit} className="flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-full md:w-1/3">
              <CarePlanSidebar 
                carePlan={carePlan} 
                onAddNote={handleAddNote}
                onScheduleFollowUp={handleScheduleFollowUp}
                onRecordActivity={handleRecordActivity}
                onUploadDocument={handleUploadDocument}
                onAddEvent={handleAddEvent}
              />
            </div>
            
            <div className="w-full md:w-2/3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <CarePlanTabBar activeTab={activeTab} onChange={setActiveTab} />
                
                <TabsContent value="personal">
                  <PersonalInfoTab 
                    client={clientProfile || {
                      id: carePlan.patientId,
                      first_name: carePlan.patientName.split(' ')[0],
                      last_name: carePlan.patientName.split(' ')[1] || '',
                      email: "",
                      phone: "",
                      date_of_birth: "",
                      address: "",
                      gender: "",
                    }}
                    personalInfo={personalInfo || {
                      emergency_contact_name: "",
                      emergency_contact_phone: "",
                      preferred_communication: "",
                    }}
                    medicalInfo={medicalInfo || {
                      allergies: [],
                      current_medications: [],
                      medical_conditions: [],
                      medical_history: "",
                    }}
                    onEditPersonalInfo={handleEditPersonalInfo}
                    onEditMedicalInfo={handleEditMedicalInfo}
                  />
                </TabsContent>
                
                <TabsContent value="aboutme">
                  <AboutMeTab 
                    personalInfo={personalInfo || {
                      cultural_preferences: "",
                      language_preferences: "",
                    }}
                    personalCare={personalCare || {
                      id: "",
                      client_id: carePlan.patientId,
                      personal_hygiene_needs: "",
                      bathing_preferences: "",
                      dressing_assistance_level: "",
                      toileting_assistance_level: "",
                      continence_status: "",
                      sleep_patterns: "",
                      behavioral_notes: "",
                      comfort_measures: "",
                      pain_management: "",
                      skin_care_needs: "",
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    }}
                    onEditAboutMe={handleEditAboutMe}
                  />
                </TabsContent>
                
                <TabsContent value="goals">
                  <GoalsTab 
                    carePlanId={carePlan.id}
                    onAddGoal={handleAddGoal}
                  />
                </TabsContent>
                
                <TabsContent value="activities">
                  <ActivitiesTab 
                    carePlanId={carePlan.id}
                    onAddActivity={handleRecordActivity} 
                  />
                </TabsContent>
                
                <TabsContent value="assessments">
                  <AssessmentsTab 
                    clientId={carePlan.patientId}
                    assessments={assessments}
                    onAddAssessment={handleAddAssessment}
                  />
                </TabsContent>
                
                <TabsContent value="equipment">
                  <EquipmentTab 
                    clientId={carePlan.patientId}
                    equipment={equipment}
                    onAddEquipment={handleAddEquipment}
                  />
                </TabsContent>
                
                <TabsContent value="notes">
                  <NotesTab 
                    clientId={carePlan.patientId}
                    onAddNote={handleAddNote} 
                  />
                </TabsContent>
                
                <TabsContent value="documents">
                  <DocumentsTab clientId={carePlan.patientId} />
                </TabsContent>
                
                <TabsContent value="dietary">
                  <DietaryTab 
                    dietaryRequirements={dietaryRequirements || {
                      dietary_restrictions: [],
                      food_allergies: [],
                      food_preferences: [],
                      meal_schedule: {},
                      nutritional_needs: "",
                      supplements: [],
                      feeding_assistance_required: false,
                      special_equipment_needed: "",
                      texture_modifications: "",
                      fluid_restrictions: "",
                      weight_monitoring: false,
                    }}
                    onEditDietaryRequirements={handleEditDietaryRequirements}
                  />
                </TabsContent>
                
                <TabsContent value="personalcare">
                  <PersonalCareTab 
                    personalCare={personalCare || {
                      personal_hygiene_needs: "",
                      bathing_preferences: "",
                      dressing_assistance_level: "",
                      toileting_assistance_level: "",
                      continence_status: "",
                      sleep_patterns: "",
                      behavioral_notes: "",
                      comfort_measures: "",
                      pain_management: "",
                      skin_care_needs: "",
                    }}
                    onEditPersonalCare={handleEditPersonalCare}
                  />
                </TabsContent>

                <TabsContent value="riskassessments">
                  <RiskAssessmentsTab 
                    clientId={carePlan.patientId}
                    riskAssessments={riskAssessments}
                    onAddRiskAssessment={handleAddRiskAssessment}
                  />
                </TabsContent>

                <TabsContent value="serviceplan">
                  <ServicePlanTab 
                    serviceActions={serviceActions}
                    onAddServicePlan={handleAddServicePlan}
                  />
                </TabsContent>
                
                <TabsContent value="serviceactions">
                  <ServiceActionsTab 
                    serviceActions={serviceActions}
                    onAddServiceAction={handleAddServiceAction}
                  />
                </TabsContent>
                
                <TabsContent value="eventslogs">
                  <EventsLogsTab 
                    clientId={carePlan.patientId}
                    carePlanId={carePlan.id}
                    patientName={carePlan.patientName}
                    onAddEvent={handleAddEvent}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* All Dialog Components */}
      <AddNoteDialog
        open={addNoteDialogOpen}
        onOpenChange={setAddNoteDialogOpen}
        onSave={handleSaveNote}
        isLoading={createNoteMutation.isPending}
      />

      <AddEventDialog
        open={addEventDialogOpen}
        onOpenChange={setAddEventDialogOpen}
        onSave={handleSaveEvent}
        carePlanId={carePlan.id}
        patientName={carePlan.patientName}
        isLoading={createEventMutation.isPending}
      />

      <AddGoalDialog
        open={addGoalDialogOpen}
        onOpenChange={setAddGoalDialogOpen}
        onSave={handleSaveGoal}
        isLoading={createGoalMutation.isPending}
      />

      <AddActivityDialog
        open={addActivityDialogOpen}
        onOpenChange={setAddActivityDialogOpen}
        onSave={handleSaveActivity}
        isLoading={createActivityMutation.isPending}
      />

      <AddAssessmentDialog
        open={addAssessmentDialogOpen}
        onOpenChange={setAddAssessmentDialogOpen}
        onSave={handleSaveAssessment}
        clientId={carePlan.patientId}
        isLoading={createAssessmentMutation.isPending}
      />

      <AddEquipmentDialog
        open={addEquipmentDialogOpen}
        onOpenChange={setAddEquipmentDialogOpen}
        onSave={handleSaveEquipment}
        clientId={carePlan.patientId}
        isLoading={createEquipmentMutation.isPending}
      />

      <AddRiskAssessmentDialog
        open={addRiskAssessmentDialogOpen}
        onOpenChange={setAddRiskAssessmentDialogOpen}
        onSave={handleSaveRiskAssessment}
        clientId={carePlan.patientId}
        isLoading={createRiskAssessmentMutation.isPending}
      />

      <AddServicePlanDialog
        open={addServicePlanDialogOpen}
        onOpenChange={setAddServicePlanDialogOpen}
        onSave={handleSaveServiceAction}
        clientId={carePlan.patientId}
        carePlanId={carePlan.id}
        isLoading={createServiceActionMutation.isPending}
      />

      <AddServiceActionDialog
        open={addServiceActionDialogOpen}
        onOpenChange={setAddServiceActionDialogOpen}
        onSave={handleSaveServiceAction}
        clientId={carePlan.patientId}
        carePlanId={carePlan.id}
        isLoading={createServiceActionMutation.isPending}
      />

      <EditPersonalInfoDialog
        open={editPersonalInfoOpen}
        onOpenChange={setEditPersonalInfoOpen}
        onSave={handleSavePersonalInfo}
        clientData={clientProfile}
        isLoading={updateClientMutation.isPending}
      />

      <EditMedicalInfoDialog
        open={editMedicalInfoOpen}
        onOpenChange={setEditMedicalInfoOpen}
        onSave={handleSavePersonalInfo}
        medicalData={medicalInfo}
        isLoading={updateClientMutation.isPending}
      />

      <EditAboutMeDialog
        open={editAboutMeOpen}
        onOpenChange={setEditAboutMeOpen}
        onSave={handleSavePersonalInfo}
        personalInfo={personalInfo}
        personalCare={personalCare}
        isLoading={updateClientMutation.isPending}
      />

      <EditDietaryDialog
        open={editDietaryOpen}
        onOpenChange={setEditDietaryOpen}
        onSave={handleSavePersonalInfo}
        dietaryRequirements={dietaryRequirements}
        isLoading={updateClientMutation.isPending}
      />

      <EditPersonalCareDialog
        open={editPersonalCareOpen}
        onOpenChange={setEditPersonalCareOpen}
        onSave={handleSavePersonalInfo}
        personalCare={personalCare}
        isLoading={updateClientMutation.isPending}
      />
    </div>
  );
};
