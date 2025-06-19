import React, { useState } from "react";
import { X, FileEdit, Download, PenLine, MessageCircle, Clock, Activity, FileBarChart2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { generatePDF, exportCarePlanPDF } from "@/utils/pdfGenerator";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

// Import all the hooks we need
import { useCreateClientNote } from "@/hooks/useClientNotes";
import { useCreateClientEvent } from "@/hooks/useClientEvents";
import { useCreateGoal } from "@/hooks/useCarePlanGoalsMutations";
import { useCreateClientActivity } from "@/hooks/useClientActivities";
import { 
  useClientProfile, 
  useClientPersonalInfo, 
  useClientMedicalInfo, 
  useClientDietaryRequirements, 
  useClientPersonalCare, 
  useClientAssessments, 
  useClientEquipment, 
  useClientRiskAssessments, 
  useClientServiceActions 
} from "@/hooks/useClientData";

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
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [addGoalDialogOpen, setAddGoalDialogOpen] = useState(false);
  const [addActivityDialogOpen, setAddActivityDialogOpen] = useState(false);
  const navigate = useNavigate();
  const params = useParams();

  const branchId = params.branchId || '';
  const branchName = params.branchName || '';

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

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      if (branchId && branchName) {
        navigate(`/branch-dashboard/${branchId}/${branchName}`);
      } else {
        navigate("/");
      }
    }
  };

  const handleEdit = () => {
    if (branchId && branchName && carePlan.patientId) {
      navigate(`/branch-dashboard/${branchId}/${branchName}/clients/${carePlan.patientId}/edit`);
    } else {
      toast.error("Unable to navigate to edit page. Please try again.");
    }
  };

  const handleScheduleFollowUp = () => {
    if (branchId && branchName) {
      navigate(`/branch-dashboard/${branchId}/${branchName}/bookings/new`, {
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

  // Add handlers for Personal Info tab
  const handleEditPersonalInfo = () => {
    if (branchId && branchName && carePlan.patientId) {
      navigate(`/branch-dashboard/${branchId}/${branchName}/clients/${carePlan.patientId}/edit`);
    } else {
      toast.error("Unable to navigate to edit page. Please try again.");
    }
  };

  const handleEditMedicalInfo = () => {
    if (branchId && branchName && carePlan.patientId) {
      navigate(`/branch-dashboard/${branchId}/${branchName}/clients/${carePlan.patientId}/edit`);
    } else {
      toast.error("Unable to navigate to edit page. Please try again.");
    }
  };

  // Add handlers for About Me tab
  const handleEditAboutMe = () => {
    if (branchId && branchName && carePlan.patientId) {
      navigate(`/branch-dashboard/${branchId}/${branchName}/clients/${carePlan.patientId}/edit`);
    } else {
      toast.error("Unable to navigate to edit page. Please try again.");
    }
  };

  // Add handlers for other tabs
  const handleAddAssessment = () => {
    toast.info("Assessment functionality will be available soon");
  };

  const handleAddEquipment = () => {
    toast.info("Equipment functionality will be available soon");
  };

  const handleEditDietaryRequirements = () => {
    if (branchId && branchName && carePlan.patientId) {
      navigate(`/branch-dashboard/${branchId}/${branchName}/clients/${carePlan.patientId}/edit`);
    } else {
      toast.error("Unable to navigate to edit page. Please try again.");
    }
  };

  const handleEditPersonalCare = () => {
    if (branchId && branchName && carePlan.patientId) {
      navigate(`/branch-dashboard/${branchId}/${branchName}/clients/${carePlan.patientId}/edit`);
    } else {
      toast.error("Unable to navigate to edit page. Please try again.");
    }
  };

  const handleAddRiskAssessment = () => {
    toast.info("Risk assessment functionality will be available soon");
  };

  const handleAddServicePlan = () => {
    toast.info("Service plan functionality will be available soon");
  };

  const handleAddServiceAction = () => {
    toast.info("Service action functionality will be available soon");
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

  // Database-connected handlers
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
                      created_at: "",
                      updated_at: "",
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
    </div>
  );
};
