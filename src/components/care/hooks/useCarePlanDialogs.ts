
import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  useCreateClientNote,
  useCreateClientEvent,
  useCreateGoal,
  useCreateClientActivity,
  useCreateClientEquipment,
  useCreateClientAssessment,
  useCreateClientRiskAssessment,
  useCreateClientServiceAction,
  useUpdateClientProfile
} from '@/hooks/useClientData';
import { useUpdateClientPersonalInfo } from '@/hooks/useClientPersonalInfo';
import { useUpdateClientMedicalInfo } from '@/hooks/useClientMedicalInfo';
import { useUpdateClientDietaryRequirements } from '@/hooks/useClientDietaryRequirements';
import { useUpdateClientPersonalCare } from '@/hooks/useClientPersonalCare';

export const useCarePlanDialogs = (carePlanId: string, patientId: string, branchId: string, branchName: string) => {
  const navigate = useNavigate();

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

  // Navigation handlers
  const handleScheduleFollowUp = () => {
    if (branchId && branchName) {
      const encodedBranchName = encodeURIComponent(branchName);
      navigate(`/branch-dashboard/${branchId}/${encodedBranchName}/bookings/new`, {
        state: { 
          clientId: patientId, 
          clientName: patientId,
          carePlanId: carePlanId 
        }
      });
    } else {
      toast.error("Unable to navigate to booking page. Please try again.");
    }
  };

  // Database-connected save handlers
  const handleSaveNote = async (noteData: { title: string; content: string }) => {
    try {
      await createNoteMutation.mutateAsync({
        client_id: patientId,
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
        client_id: patientId,
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
        care_plan_id: carePlanId,
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
        care_plan_id: carePlanId,
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
        client_id: patientId,
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
          client_id: patientId,
          ...data
        });
      } else if (data.personal_hygiene_needs || data.bathing_preferences || data.dressing_assistance_level) {
        // This is personal care data - use personal care mutation
        await updatePersonalCareMutation.mutateAsync({
          client_id: patientId,
          ...data
        });
      } else if (data.allergies || data.current_medications || data.medical_conditions) {
        // This is medical data - use medical info mutation
        await updateMedicalInfoMutation.mutateAsync({
          client_id: patientId,
          ...data
        });
      } else if (data.cultural_preferences || data.language_preferences || data.emergency_contact_name) {
        // This is personal info data - use personal info mutation
        await updatePersonalInfoMutation.mutateAsync({
          client_id: patientId,
          ...data
        });
      } else {
        // Default to client profile update for basic client data
        await updateClientMutation.mutateAsync({
          clientId: patientId,
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

  return {
    // Dialog states
    addNoteDialogOpen,
    setAddNoteDialogOpen,
    addEventDialogOpen,
    setAddEventDialogOpen,
    addGoalDialogOpen,
    setAddGoalDialogOpen,
    addActivityDialogOpen,
    setAddActivityDialogOpen,
    addAssessmentDialogOpen,
    setAddAssessmentDialogOpen,
    addEquipmentDialogOpen,
    setAddEquipmentDialogOpen,
    addRiskAssessmentDialogOpen,
    setAddRiskAssessmentDialogOpen,
    addServicePlanDialogOpen,
    setAddServicePlanDialogOpen,
    addServiceActionDialogOpen,
    setAddServiceActionDialogOpen,
    editPersonalInfoOpen,
    setEditPersonalInfoOpen,
    editMedicalInfoOpen,
    setEditMedicalInfoOpen,
    editAboutMeOpen,
    setEditAboutMeOpen,
    editDietaryOpen,
    setEditDietaryOpen,
    editPersonalCareOpen,
    setEditPersonalCareOpen,

    // Mutations for loading states
    createNoteMutation,
    createEventMutation,
    createGoalMutation,
    createActivityMutation,
    createAssessmentMutation,
    createEquipmentMutation,
    createRiskAssessmentMutation,
    createServiceActionMutation,
    updateClientMutation,

    // Handlers
    handleScheduleFollowUp,
    handleSaveNote,
    handleSaveEvent,
    handleSaveGoal,
    handleSaveActivity,
    handleSaveAssessment,
    handleSaveEquipment,
    handleSaveRiskAssessment,
    handleSaveServiceAction,
    handleSavePersonalInfo,
  };
};
