import React, { useState } from "react";
import { X, FileEdit, Download, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { generatePDF } from "@/utils/pdfGenerator";
import { useComprehensiveCarePlanData } from "@/hooks/useCarePlanData";
import { useClientNotes, useCreateClientNote } from "@/hooks/useClientNotes";
import { useAuth } from "@/hooks/useAuth";
import { useCreateClientAssessment } from "@/hooks/useClientAssessments";
import { useUpdateClient } from "@/hooks/useUpdateClient";
import { useUpdateClientPersonalInfo } from "@/hooks/useClientPersonalInfo";
import { useClientPersonalCare, useUpdateClientPersonalCare } from "@/hooks/useClientPersonalCare";
import { useUpdateClientMedicalInfo } from "@/hooks/useClientMedicalInfo";
import { useClientDietaryRequirements, useUpdateClientDietaryRequirements } from "@/hooks/useClientDietaryRequirements";
import { useCreateGoal, useUpdateGoal } from "@/hooks/useCarePlanGoalsMutations";
import { toast } from "@/hooks/use-toast";

import { PatientHeader } from "./PatientHeader";
import { CarePlanSidebar } from "./CarePlanSidebar";
import { CarePlanTabBar } from "./CarePlanTabBar";
import { PersonalInfoTab } from "./tabs/PersonalInfoTab";
import { AboutMeTab } from "./tabs/AboutMeTab";
import { GoalsTab } from "./tabs/GoalsTab";
import { DietaryTab } from "./tabs/DietaryTab";
import { PersonalCareTab } from "./tabs/PersonalCareTab";
import { AssessmentsTab } from "./tabs/AssessmentsTab";
import { EquipmentTab } from "./tabs/EquipmentTab";
import { RiskTab } from "./tabs/RiskTab";
import { ServiceActionsTab } from "./tabs/ServiceActionsTab";
import { ServicePlanTab } from "./tabs/ServicePlanTab";
import { ActivitiesTab } from "./tabs/ActivitiesTab";
import { NotesTab } from "./tabs/NotesTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { EventsLogsTab } from "./tabs/EventsLogsTab";
import { AddAssessmentDialog } from "./dialogs/AddAssessmentDialog";
import { EditPersonalInfoDialog } from "./dialogs/EditPersonalInfoDialog";
import { EditAboutMeDialog } from "./dialogs/EditAboutMeDialog";
import { EditMedicalInfoDialog } from "./dialogs/EditMedicalInfoDialog";
import { EditDietaryDialog } from "./dialogs/EditDietaryDialog";
import { EditPersonalCareDialog } from "./dialogs/EditPersonalCareDialog";
import { AddGoalDialog } from "./dialogs/AddGoalDialog";
import { EditGoalDialog } from "./dialogs/EditGoalDialog";

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
  } | null;
  onClose: () => void;
  onAddNote?: () => void;
  onScheduleFollowUp?: () => void;
  onRecordActivity?: () => void;
  onUploadDocument?: () => void;
  onAddEvent?: () => void;
}

export const CarePlanDetail: React.FC<CarePlanDetailProps> = ({ 
  carePlan, 
  onClose,
  onAddNote,
  onScheduleFollowUp,
  onRecordActivity,
  onUploadDocument,
  onAddEvent
}) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [personalInfoDialogOpen, setPersonalInfoDialogOpen] = useState(false);
  const [aboutMeDialogOpen, setAboutMeDialogOpen] = useState(false);
  const [medicalInfoDialogOpen, setMedicalInfoDialogOpen] = useState(false);
  const [dietaryDialogOpen, setDietaryDialogOpen] = useState(false);
  const [personalCareDialogOpen, setPersonalCareDialogOpen] = useState(false);
  const [addGoalDialogOpen, setAddGoalDialogOpen] = useState(false);
  const [editGoalDialogOpen, setEditGoalDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const { user } = useAuth();

  // Fetch comprehensive care plan data
  const {
    data: comprehensiveData,
    isLoading,
    error
  } = useComprehensiveCarePlanData(carePlan?.patientId || "");

  // Add debugging for comprehensive data
  console.log('[CarePlanDetail] Comprehensive data loaded:', {
    hasData: !!comprehensiveData,
    client: comprehensiveData?.client,
    medicalInfo: comprehensiveData?.medicalInfo,
    patientId: carePlan?.patientId
  });

  // Get the actual client UUID from comprehensive data or use a fallback
  const clientId = comprehensiveData?.client?.id || carePlan?.patientId || "";
  
  console.log('[CarePlanDetail] Client ID resolution:', {
    fromComprehensiveData: comprehensiveData?.client?.id,
    fromCarePlan: carePlan?.patientId,
    finalClientId: clientId
  });
  
  // Database hooks for notes - now using the correct client UUID
  const { data: dbNotes = [], isLoading: notesLoading } = useClientNotes(clientId);
  const createNoteMutation = useCreateClientNote();
  const createAssessmentMutation = useCreateClientAssessment();
  
  // Dietary requirements hooks
  const { data: dietaryRequirements, isLoading: dietaryLoading } = useClientDietaryRequirements(clientId);
  const updateDietaryMutation = useUpdateClientDietaryRequirements();
  
  // Personal care hooks
  const { data: personalCare, isLoading: personalCareLoading } = useClientPersonalCare(clientId);
  const updatePersonalCareMutation = useUpdateClientPersonalCare();
  
  // New mutation hooks for editing functionality
  const updateClientMutation = useUpdateClient();
  const updatePersonalInfoMutation = useUpdateClientPersonalInfo();
  const updateMedicalInfoMutation = useUpdateClientMedicalInfo();
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();

  if (!carePlan) return null;

  const handlePrintCarePlan = () => {
    generatePDF({
      id: carePlan.id,
      title: `Care Plan for ${carePlan.patientName}`,
      date: format(carePlan.lastUpdated, 'yyyy-MM-dd'),
      status: carePlan.status,
      signedBy: carePlan.assignedTo
    });
  };

  const handleAddNoteWithDB = async () => {
    if (onAddNote) {
      onAddNote();
    }
  };

  const handleSaveAssessment = async (assessment: any) => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID not found. Cannot save assessment.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createAssessmentMutation.mutateAsync({
        client_id: clientId,
        assessment_type: assessment.assessment_type,
        assessment_name: assessment.assessment_name,
        assessment_date: assessment.assessment_date.toISOString().split('T')[0],
        performed_by: assessment.performed_by,
        results: assessment.results || null,
        score: assessment.score || null,
        recommendations: assessment.recommendations || null,
        next_review_date: assessment.next_review_date ? assessment.next_review_date.toISOString().split('T')[0] : null,
        status: 'completed',
        performed_by_id: user?.id || null,
      });

      setAssessmentDialogOpen(false);
      toast({
        title: "Assessment created",
        description: "The assessment has been successfully added to the patient's record."
      });
    } catch (error) {
      console.error("Error saving assessment:", error);
      toast({
        title: "Error",
        description: "Failed to save assessment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSavePersonalInfo = async (data: any) => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID not found. Cannot save personal information.",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateClientMutation.mutateAsync({
        clientId,
        updates: data
      });

      setPersonalInfoDialogOpen(false);
      toast({
        title: "Personal information updated",
        description: "The personal information has been successfully updated."
      });
    } catch (error) {
      console.error("Error updating personal info:", error);
      toast({
        title: "Error",
        description: "Failed to update personal information. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveAboutMe = async (data: any) => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID not found. Cannot save about me information.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Split data into personal info and personal care
      const personalInfoData = {
        cultural_preferences: data.cultural_preferences,
        language_preferences: data.language_preferences,
        religion: data.religion,
        marital_status: data.marital_status,
        preferred_communication: data.preferred_communication,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        emergency_contact_relationship: data.emergency_contact_relationship,
        next_of_kin_name: data.next_of_kin_name,
        next_of_kin_phone: data.next_of_kin_phone,
        next_of_kin_relationship: data.next_of_kin_relationship,
        gp_name: data.gp_name,
        gp_practice: data.gp_practice,
        gp_phone: data.gp_phone,
      };

      const personalCareData = {
        personal_hygiene_needs: data.personal_hygiene_needs,
        bathing_preferences: data.bathing_preferences,
        dressing_assistance_level: data.dressing_assistance_level,
        toileting_assistance_level: data.toileting_assistance_level,
        continence_status: data.continence_status,
        sleep_patterns: data.sleep_patterns,
        behavioral_notes: data.behavioral_notes,
        comfort_measures: data.comfort_measures,
        pain_management: data.pain_management,
        skin_care_needs: data.skin_care_needs,
      };

      // Update both tables
      await Promise.all([
        updatePersonalInfoMutation.mutateAsync({
          client_id: clientId,
          ...personalInfoData
        }),
        updatePersonalCareMutation.mutateAsync({
          client_id: clientId,
          ...personalCareData
        })
      ]);

      setAboutMeDialogOpen(false);
      toast({
        title: "About me information updated",
        description: "The about me information has been successfully updated."
      });
    } catch (error) {
      console.error("Error updating about me info:", error);
      toast({
        title: "Error",
        description: "Failed to update about me information. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveMedicalInfo = async (data: any) => {
    console.log('[CarePlanDetail] handleSaveMedicalInfo called with data:', data);
    console.log('[CarePlanDetail] clientId for medical info save:', clientId);
    
    if (!clientId) {
      console.error('[CarePlanDetail] No client ID found for medical info save');
      toast({
        title: "Error",
        description: "Client ID not found. Cannot save medical information.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('[CarePlanDetail] Attempting to save medical info...');
      const result = await updateMedicalInfoMutation.mutateAsync({
        client_id: clientId,
        ...data
      });
      
      console.log('[CarePlanDetail] Medical info save successful:', result);

      setMedicalInfoDialogOpen(false);
      toast({
        title: "Medical information updated",
        description: "The medical information has been successfully updated."
      });
    } catch (error) {
      console.error('[CarePlanDetail] Error updating medical info:', error);
      toast({
        title: "Error",
        description: "Failed to update medical information. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveDietaryRequirements = async (data: any) => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID not found. Cannot save dietary requirements.",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateDietaryMutation.mutateAsync({
        client_id: clientId,
        ...data
      });

      setDietaryDialogOpen(false);
      toast({
        title: "Dietary requirements updated",
        description: "The dietary requirements have been successfully updated."
      });
    } catch (error) {
      console.error("Error updating dietary requirements:", error);
      toast({
        title: "Error",
        description: "Failed to update dietary requirements. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSavePersonalCare = async (data: any) => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID not found. Cannot save personal care information.",
        variant: "destructive"
      });
      return;
    }

    try {
      await updatePersonalCareMutation.mutateAsync({
        client_id: clientId,
        ...data
      });

      setPersonalCareDialogOpen(false);
      toast({
        title: "Personal care updated",
        description: "The personal care information has been successfully updated."
      });
    } catch (error) {
      console.error("Error updating personal care:", error);
      toast({
        title: "Error",
        description: "Failed to update personal care information. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveGoal = async (data: any) => {
    // Use the care plan ID from the carePlan prop instead of from comprehensive data
    const carePlanId = carePlan?.id;
    if (!carePlanId) {
      toast({
        title: "Error",
        description: "Care plan ID not found. Cannot save goal.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createGoalMutation.mutateAsync({
        care_plan_id: carePlanId,
        ...data
      });

      setAddGoalDialogOpen(false);
      toast({
        title: "Goal added",
        description: "The goal has been successfully added to the care plan."
      });
    } catch (error) {
      console.error("Error saving goal:", error);
      toast({
        title: "Error",
        description: "Failed to save goal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateGoal = async (data: any) => {
    if (!selectedGoal?.id) {
      toast({
        title: "Error",
        description: "Goal ID not found. Cannot update goal.",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateGoalMutation.mutateAsync({
        goalId: selectedGoal.id,
        updates: data
      });

      setEditGoalDialogOpen(false);
      setSelectedGoal(null);
      toast({
        title: "Goal updated",
        description: "The goal has been successfully updated."
      });
    } catch (error) {
      console.error("Error updating goal:", error);
      toast({
        title: "Error",
        description: "Failed to update goal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditGoal = (goal: any) => {
    setSelectedGoal(goal);
    setEditGoalDialogOpen(true);
  };

  // Get current user's role and name for author field - simplified to just show "Admin"
  const getCurrentUserAuthor = () => {
    // For admin users, just return "Admin"
    return "Admin";
  };

  // Add debugging for medical info dialog state
  const handleEditMedicalInfo = () => {
    console.log('[CarePlanDetail] Edit medical info button clicked');
    console.log('[CarePlanDetail] Current medical info data:', comprehensiveData?.medicalInfo);
    console.log('[CarePlanDetail] Setting medicalInfoDialogOpen to true');
    setMedicalInfoDialogOpen(true);
  };

  if (isLoading || dietaryLoading || personalCareLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading care plan data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading care plan</h3>
              <p className="text-gray-600">Unable to load care plan data. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Transform data to match component expectations
  const transformedGoals = comprehensiveData?.goals?.map(goal => ({
    id: goal.id,
    title: goal.description,
    description: goal.description,
    target: "100%", // Default target
    status: goal.status,
    progress: goal.progress || 0,
    notes: goal.notes || ""
  })) || [];

  const transformedActivities = comprehensiveData?.activities?.map(activity => ({
    date: new Date(),
    action: activity.name,
    performer: "Care Team",
    status: activity.status
  })) || [];

  const transformedServicePlan = comprehensiveData?.serviceActions?.map(action => ({
    service: action.service_name,
    provider: action.provider_name,
    frequency: action.frequency,
    duration: action.duration,
    schedule: action.schedule_details || "",
    goals: action.goals || [],
    progress: action.progress_status
  })) || [];

  // Transform database notes to match expected Note interface
  const transformedNotes = dbNotes.map(note => ({
    id: note.id,
    date: new Date(note.created_at),
    author: note.author,
    content: note.content
  }));

  // Use database notes if available, otherwise fall back to comprehensive data
  const notesToDisplay = transformedNotes.length > 0 ? transformedNotes : (comprehensiveData?.notes?.map(note => ({
    id: note.id,
    date: new Date(note.created_at),
    author: note.author,
    content: note.content
  })) || []);

  // Transform documents to match expected Document interface  
  const transformedDocuments = comprehensiveData?.documents?.map(doc => ({
    id: doc.id,
    name: doc.name,
    type: doc.type,
    date: new Date(doc.upload_date),
    author: doc.uploaded_by,
    file_path: doc.file_path,
    file_size: doc.file_size
  })) || [];

  // Transform assessments to match expected interface
  const transformedAssessments = comprehensiveData?.assessments?.map(assessment => ({
    ...assessment,
    client_id: assessment.client_id,
    created_at: assessment.created_at,
    updated_at: assessment.updated_at
  })) || [];

  // Transform equipment to match expected interface
  const transformedEquipment = comprehensiveData?.equipment?.map(equipment => ({
    ...equipment,
    client_id: equipment.client_id,
    created_at: equipment.created_at,
    updated_at: equipment.updated_at
  })) || [];

  // Transform risk assessments to match expected interface
  const transformedRiskAssessments = comprehensiveData?.riskAssessments?.map(risk => ({
    ...risk,
    client_id: risk.client_id,
    created_at: risk.created_at,
    updated_at: risk.updated_at
  })) || [];

  // Transform service actions to match expected interface
  const transformedServiceActions = comprehensiveData?.serviceActions?.map(action => ({
    ...action,
    client_id: action.client_id,
    created_at: action.created_at,
    updated_at: action.updated_at
  })) || [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
              {carePlan.avatar}
            </div>
            <div>
              <h2 className="text-xl font-bold">{carePlan.patientName}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Patient ID: {carePlan.patientId}</span>
                <span>•</span>
                <span>Plan ID: {carePlan.id}</span>
              </div>
            </div>
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
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-full md:w-1/3">
              <CarePlanSidebar 
                carePlan={carePlan}
                onAddNote={handleAddNoteWithDB}
                onScheduleFollowUp={onScheduleFollowUp}
                onRecordActivity={onRecordActivity}
                onUploadDocument={onUploadDocument}
              />
            </div>
            
            <div className="w-full md:w-2/3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <CarePlanTabBar activeTab={activeTab} onChange={setActiveTab} />
                
                <TabsContent value="personal">
                  <PersonalInfoTab 
                    client={comprehensiveData?.client}
                    personalInfo={comprehensiveData?.personalInfo}
                    medicalInfo={comprehensiveData?.medicalInfo}
                    onEditPersonalInfo={() => setPersonalInfoDialogOpen(true)}
                    onEditMedicalInfo={handleEditMedicalInfo}
                  />
                </TabsContent>
                
                <TabsContent value="aboutme">
                  <AboutMeTab 
                    personalInfo={comprehensiveData?.personalInfo}
                    personalCare={comprehensiveData?.personalCare}
                    onEditAboutMe={() => setAboutMeDialogOpen(true)}
                  />
                </TabsContent>
                
                <TabsContent value="goals">
                  <GoalsTab 
                    goals={transformedGoals} 
                    onAddGoal={() => setAddGoalDialogOpen(true)}
                    onEditGoal={handleEditGoal}
                  />
                </TabsContent>
                
                <TabsContent value="activities">
                  <ActivitiesTab activities={transformedActivities} />
                </TabsContent>
                
                <TabsContent value="notes">
                  <NotesTab 
                    notes={notesToDisplay} 
                    onAddNote={handleAddNoteWithDB} 
                  />
                </TabsContent>
                
                <TabsContent value="documents">
                  <DocumentsTab 
                    documents={transformedDocuments} 
                    onUploadDocument={onUploadDocument} 
                  />
                </TabsContent>
                
                <TabsContent value="assessments">
                  <AssessmentsTab 
                    assessments={transformedAssessments} 
                    onAddAssessment={() => setAssessmentDialogOpen(true)}
                  />
                </TabsContent>
                
                <TabsContent value="equipment">
                  <EquipmentTab equipment={transformedEquipment} />
                </TabsContent>
                
                <TabsContent value="dietary">
                  <DietaryTab 
                    dietaryRequirements={dietaryRequirements} 
                    onEditDietaryRequirements={() => setDietaryDialogOpen(true)}
                  />
                </TabsContent>

                <TabsContent value="personalcare">
                  <PersonalCareTab 
                    personalCare={personalCare} 
                    onEditPersonalCare={() => setPersonalCareDialogOpen(true)}
                  />
                </TabsContent>
                
                <TabsContent value="risk">
                  <RiskTab riskAssessments={transformedRiskAssessments} />
                </TabsContent>
                
                <TabsContent value="serviceplan">
                  <ServicePlanTab serviceActions={transformedServicePlan} />
                </TabsContent>
                
                <TabsContent value="serviceactions">
                  <ServiceActionsTab serviceActions={transformedServiceActions} />
                </TabsContent>

                <TabsContent value="eventslogs">
                  <EventsLogsTab 
                    carePlanId={carePlan.id}
                    patientName={carePlan.patientName}
                    onAddEvent={onAddEvent}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      
      <AddAssessmentDialog
        open={assessmentDialogOpen}
        onOpenChange={setAssessmentDialogOpen}
        onSave={handleSaveAssessment}
        clientId={clientId}
        isLoading={createAssessmentMutation.isPending}
      />

      <EditPersonalInfoDialog
        open={personalInfoDialogOpen}
        onOpenChange={setPersonalInfoDialogOpen}
        onSave={handleSavePersonalInfo}
        clientData={comprehensiveData?.client}
        isLoading={updateClientMutation.isPending}
      />

      <EditAboutMeDialog
        open={aboutMeDialogOpen}
        onOpenChange={setAboutMeDialogOpen}
        onSave={handleSaveAboutMe}
        personalInfo={comprehensiveData?.personalInfo}
        personalCare={comprehensiveData?.personalCare}
        isLoading={updatePersonalInfoMutation.isPending || updatePersonalCareMutation.isPending}
      />

      <EditMedicalInfoDialog
        open={medicalInfoDialogOpen}
        onOpenChange={(open) => {
          console.log('[CarePlanDetail] Medical info dialog onOpenChange called with:', open);
          setMedicalInfoDialogOpen(open);
        }}
        onSave={handleSaveMedicalInfo}
        medicalInfo={comprehensiveData?.medicalInfo}
        isLoading={updateMedicalInfoMutation.isPending}
      />

      <EditDietaryDialog
        open={dietaryDialogOpen}
        onOpenChange={setDietaryDialogOpen}
        onSave={handleSaveDietaryRequirements}
        dietaryRequirements={dietaryRequirements}
        isLoading={updateDietaryMutation.isPending}
      />

      <EditPersonalCareDialog
        open={personalCareDialogOpen}
        onOpenChange={setPersonalCareDialogOpen}
        onSave={handleSavePersonalCare}
        personalCare={personalCare}
        isLoading={updatePersonalCareMutation.isPending}
      />

      <AddGoalDialog
        open={addGoalDialogOpen}
        onOpenChange={setAddGoalDialogOpen}
        onSave={handleSaveGoal}
        isLoading={createGoalMutation.isPending}
      />

      <EditGoalDialog
        open={editGoalDialogOpen}
        onOpenChange={setEditGoalDialogOpen}
        onSave={handleUpdateGoal}
        goal={selectedGoal}
        isLoading={updateGoalMutation.isPending}
      />
    </div>
  );
};
