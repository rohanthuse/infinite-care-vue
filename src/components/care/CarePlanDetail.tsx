
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
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
} from "@/hooks/useClientData";
import { useCarePlanDialogs } from "./hooks/useCarePlanDialogs";
import { CarePlanHeader } from "./CarePlanHeader";
import { CarePlanContent } from "./CarePlanContent";
import { CarePlanDialogs } from "./CarePlanDialogs";

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
  
  const navigate = useNavigate();
  const params = useParams();

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

  // Use the custom hook for dialog management
  const dialogState = useCarePlanDialogs(carePlan.id, carePlan.patientId, branchId, branchName);

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

  // Action handlers that open dialogs
  const handleUploadDocument = () => {
    toast.info("Document upload functionality available in Documents tab");
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <CarePlanHeader 
          carePlan={carePlan}
          onClose={handleClose}
          onEdit={handleEdit}
        />
        
        <CarePlanContent
          carePlan={carePlan}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          clientProfile={clientProfile}
          personalInfo={personalInfo}
          medicalInfo={medicalInfo}
          dietaryRequirements={dietaryRequirements}
          personalCare={personalCare}
          assessments={assessments}
          equipment={equipment}
          riskAssessments={riskAssessments}
          serviceActions={serviceActions}
          onAddNote={() => dialogState.setAddNoteDialogOpen(true)}
          onScheduleFollowUp={dialogState.handleScheduleFollowUp}
          onRecordActivity={() => dialogState.setAddActivityDialogOpen(true)}
          onUploadDocument={handleUploadDocument}
          onAddEvent={() => dialogState.setAddEventDialogOpen(true)}
          onAddGoal={() => dialogState.setAddGoalDialogOpen(true)}
          onAddAssessment={() => dialogState.setAddAssessmentDialogOpen(true)}
          onAddEquipment={() => dialogState.setAddEquipmentDialogOpen(true)}
          onAddRiskAssessment={() => dialogState.setAddRiskAssessmentDialogOpen(true)}
          onAddServicePlan={() => dialogState.setAddServicePlanDialogOpen(true)}
          onAddServiceAction={() => dialogState.setAddServiceActionDialogOpen(true)}
          onEditPersonalInfo={() => dialogState.setEditPersonalInfoOpen(true)}
          onEditMedicalInfo={() => dialogState.setEditMedicalInfoOpen(true)}
          onEditAboutMe={() => dialogState.setEditAboutMeOpen(true)}
          onEditDietaryRequirements={() => dialogState.setEditDietaryOpen(true)}
          onEditPersonalCare={() => dialogState.setEditPersonalCareOpen(true)}
        />
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
};
