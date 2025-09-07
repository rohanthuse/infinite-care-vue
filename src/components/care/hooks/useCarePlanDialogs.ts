
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
  useUpdateClientProfile
} from '@/hooks/useClientData';
import { useCreateClientRiskAssessment } from '@/hooks/useClientRiskAssessments';
import { useCreateClientServiceAction } from '@/hooks/useClientServiceActionMutations';
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
    console.log('Attempting to schedule follow-up with params:', { branchId, branchName, patientId, carePlanId });
    
    if (!branchId || !branchName) {
      console.error('Missing navigation parameters for follow-up:', { branchId, branchName });
      toast.error("Unable to navigate to booking page. Missing branch information.");
      return;
    }

    try {
      const encodedBranchName = encodeURIComponent(branchName);
      const navigationPath = `/branch-dashboard/${branchId}/${encodedBranchName}/bookings/new`;
      
      console.log('Navigating to:', navigationPath);
      
      navigate(navigationPath, {
        state: { 
          clientId: patientId, 
          clientName: patientId,
          carePlanId: carePlanId 
        }
      });
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error("Unable to navigate to booking page. Please try again.");
    }
  };

  // Database-connected save handlers
  const handleSaveNote = async (noteData: { title: string; content: string }) => {
    try {
      console.log('Saving note:', noteData);
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
      console.log('Saving event:', eventData);
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
      console.log('Saving goal:', goalData);
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
      console.log('Saving activity:', activityData);
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
      console.log('Saving assessment:', assessmentData);
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
      console.log('Saving equipment:', equipmentData);
      await createEquipmentMutation.mutateAsync({
        client_id: patientId,
        equipment_name: equipmentData.equipment_name,
        equipment_type: equipmentData.equipment_type,
        manufacturer: equipmentData.manufacturer,
        model_number: equipmentData.model_number,
        serial_number: equipmentData.serial_number,
        status: equipmentData.status || 'active',
        location: equipmentData.location,
        installation_date: equipmentData.installation_date,
        maintenance_schedule: equipmentData.maintenance_schedule,
        notes: equipmentData.notes,
      });
      setAddEquipmentDialogOpen(false);
    } catch (error) {
      console.error("Error saving equipment:", error);
      toast.error("Failed to save equipment");
    }
  };

  const handleSaveRiskAssessment = async (riskData: any) => {
    try {
      console.log('Saving risk assessment:', riskData);
      await createRiskAssessmentMutation.mutateAsync({
        client_id: patientId,
        risk_type: riskData.risk_type,
        risk_level: riskData.risk_level,
        risk_factors: riskData.risk_factors || [],
        mitigation_strategies: riskData.mitigation_strategies || [],
        assessment_date: riskData.assessment_date,
        assessed_by: riskData.assessed_by,
        status: riskData.status || 'active',
        review_date: riskData.review_date,

        // Risk section
        rag_status: riskData.rag_status,
        has_pets: riskData.has_pets,
        fall_risk: riskData.fall_risk,
        risk_to_staff: riskData.risk_to_staff || [],
        adverse_weather_plan: riskData.adverse_weather_plan,

        // Personal Risk section
        lives_alone: riskData.lives_alone,
        rural_area: riskData.rural_area,
        cared_in_bed: riskData.cared_in_bed,
        smoker: riskData.smoker,
        can_call_for_assistance: riskData.can_call_for_assistance,
        communication_needs: riskData.communication_needs,
        social_support: riskData.social_support,
        fallen_past_six_months: riskData.fallen_past_six_months,
        has_assistance_device: riskData.has_assistance_device,
        arrange_assistance_device: riskData.arrange_assistance_device,
      });
      setAddRiskAssessmentDialogOpen(false);
    } catch (error) {
      console.error("Error saving risk assessment:", error);
      toast.error("Failed to save risk assessment");
    }
  };

  const handleSaveServiceAction = async (serviceActionData: any) => {
    try {
      console.log('Saving service action:', serviceActionData);
      await createServiceActionMutation.mutateAsync({
        client_id: patientId,
        care_plan_id: carePlanId,
        service_name: serviceActionData.service_name,
        service_category: serviceActionData.service_category,
        provider_name: serviceActionData.provider_name,
        frequency: serviceActionData.frequency,
        duration: serviceActionData.duration,
        schedule_details: serviceActionData.schedule_details,
        goals: serviceActionData.goals || [],
        progress_status: serviceActionData.progress_status || 'active',
        start_date: serviceActionData.start_date,
        end_date: serviceActionData.end_date,
        next_scheduled_date: serviceActionData.next_scheduled_date,
        notes: serviceActionData.notes,
      });
      setAddServiceActionDialogOpen(false);
    } catch (error) {
      console.error("Error saving service action:", error);
      toast.error("Failed to save service action");
    }
  };

  // Enhanced save handler for different data types
  const handleSavePersonalInfo = async (data: any) => {
    try {
      console.log('Saving personal info with data type detection:', data);
      
      if (data.dietary_restrictions || data.food_allergies || data.food_preferences) {
        // This is dietary data - use dietary requirements mutation
        console.log('Detected dietary data, using dietary requirements mutation');
        await updateDietaryRequirementsMutation.mutateAsync({
          client_id: patientId,
          ...data
        });
      } else if (data.personal_hygiene_needs || data.bathing_preferences || data.dressing_assistance_level ||
                 data.washing_showering_bathing_assistance_level || data.oral_care_assist_cleaning_teeth ||
                 data.oral_care_assist_cleaning_dentures || data.oral_care_summary || data.has_podiatrist ||
                 data.personal_care_risks_explanation) {
        // This is personal care data - use personal care mutation
        console.log('Detected personal care data, using personal care mutation');
        await updatePersonalCareMutation.mutateAsync({
          client_id: patientId,
          ...data
        });
      } else if (data.allergies || data.current_medications || data.medical_conditions) {
        // This is medical data - use medical info mutation
        console.log('Detected medical data, using medical info mutation');
        await updateMedicalInfoMutation.mutateAsync({
          client_id: patientId,
          ...data
        });
      } else if (data.cultural_preferences || data.language_preferences || data.emergency_contact_name) {
        // This is personal info data - use personal info mutation
        console.log('Detected personal info data, using personal info mutation');
        await updatePersonalInfoMutation.mutateAsync({
          client_id: patientId,
          ...data
        });
      } else {
        // Default to client profile update for basic client data
        console.log('Using default client profile update');
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
