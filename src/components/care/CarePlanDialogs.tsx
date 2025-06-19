
import React from "react";
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
import {
  ClientProfile,
  ClientPersonalInfo,
  ClientMedicalInfo,
  ClientDietaryRequirements,
  ClientPersonalCare,
} from "@/hooks/useClientData";

interface CarePlanDialogsProps {
  carePlan: {
    id: string;
    patientName: string;
    patientId: string;
  };
  clientProfile?: ClientProfile;
  personalInfo?: ClientPersonalInfo;
  medicalInfo?: ClientMedicalInfo;
  dietaryRequirements?: ClientDietaryRequirements;
  personalCare?: ClientPersonalCare;
  dialogs: {
    addNoteDialogOpen: boolean;
    setAddNoteDialogOpen: (open: boolean) => void;
    addEventDialogOpen: boolean;
    setAddEventDialogOpen: (open: boolean) => void;
    addGoalDialogOpen: boolean;
    setAddGoalDialogOpen: (open: boolean) => void;
    addActivityDialogOpen: boolean;
    setAddActivityDialogOpen: (open: boolean) => void;
    addAssessmentDialogOpen: boolean;
    setAddAssessmentDialogOpen: (open: boolean) => void;
    addEquipmentDialogOpen: boolean;
    setAddEquipmentDialogOpen: (open: boolean) => void;
    addRiskAssessmentDialogOpen: boolean;
    setAddRiskAssessmentDialogOpen: (open: boolean) => void;
    addServicePlanDialogOpen: boolean;
    setAddServicePlanDialogOpen: (open: boolean) => void;
    addServiceActionDialogOpen: boolean;
    setAddServiceActionDialogOpen: (open: boolean) => void;
    editPersonalInfoOpen: boolean;
    setEditPersonalInfoOpen: (open: boolean) => void;
    editMedicalInfoOpen: boolean;
    setEditMedicalInfoOpen: (open: boolean) => void;
    editAboutMeOpen: boolean;
    setEditAboutMeOpen: (open: boolean) => void;
    editDietaryOpen: boolean;
    setEditDietaryOpen: (open: boolean) => void;
    editPersonalCareOpen: boolean;
    setEditPersonalCareOpen: (open: boolean) => void;
  };
  mutations: {
    createNoteMutation: any;
    createEventMutation: any;
    createGoalMutation: any;
    createActivityMutation: any;
    createAssessmentMutation: any;
    createEquipmentMutation: any;
    createRiskAssessmentMutation: any;
    createServiceActionMutation: any;
    updateClientMutation: any;
  };
  handlers: {
    handleSaveNote: (data: any) => void;
    handleSaveEvent: (data: any) => void;
    handleSaveGoal: (data: any) => void;
    handleSaveActivity: (data: any) => void;
    handleSaveAssessment: (data: any) => void;
    handleSaveEquipment: (data: any) => void;
    handleSaveRiskAssessment: (data: any) => void;
    handleSaveServiceAction: (data: any) => void;
    handleSavePersonalInfo: (data: any) => void;
  };
}

export const CarePlanDialogs: React.FC<CarePlanDialogsProps> = ({
  carePlan,
  clientProfile,
  personalInfo,
  medicalInfo,
  dietaryRequirements,
  personalCare,
  dialogs,
  mutations,
  handlers,
}) => {
  return (
    <>
      <AddNoteDialog
        open={dialogs.addNoteDialogOpen}
        onOpenChange={dialogs.setAddNoteDialogOpen}
        onSave={handlers.handleSaveNote}
        isLoading={mutations.createNoteMutation.isPending}
      />

      <AddEventDialog
        open={dialogs.addEventDialogOpen}
        onOpenChange={dialogs.setAddEventDialogOpen}
        onSave={handlers.handleSaveEvent}
        carePlanId={carePlan.id}
        patientName={carePlan.patientName}
        isLoading={mutations.createEventMutation.isPending}
      />

      <AddGoalDialog
        open={dialogs.addGoalDialogOpen}
        onOpenChange={dialogs.setAddGoalDialogOpen}
        onSave={handlers.handleSaveGoal}
        isLoading={mutations.createGoalMutation.isPending}
      />

      <AddActivityDialog
        open={dialogs.addActivityDialogOpen}
        onOpenChange={dialogs.setAddActivityDialogOpen}
        onSave={handlers.handleSaveActivity}
        isLoading={mutations.createActivityMutation.isPending}
      />

      <AddAssessmentDialog
        open={dialogs.addAssessmentDialogOpen}
        onOpenChange={dialogs.setAddAssessmentDialogOpen}
        onSave={handlers.handleSaveAssessment}
        clientId={carePlan.patientId}
        isLoading={mutations.createAssessmentMutation.isPending}
      />

      <AddEquipmentDialog
        open={dialogs.addEquipmentDialogOpen}
        onOpenChange={dialogs.setAddEquipmentDialogOpen}
        onSave={handlers.handleSaveEquipment}
        clientId={carePlan.patientId}
        isLoading={mutations.createEquipmentMutation.isPending}
      />

      <AddRiskAssessmentDialog
        open={dialogs.addRiskAssessmentDialogOpen}
        onOpenChange={dialogs.setAddRiskAssessmentDialogOpen}
        onSave={handlers.handleSaveRiskAssessment}
        clientId={carePlan.patientId}
        isLoading={mutations.createRiskAssessmentMutation.isPending}
      />

      <AddServicePlanDialog
        open={dialogs.addServicePlanDialogOpen}
        onOpenChange={dialogs.setAddServicePlanDialogOpen}
        onSave={handlers.handleSaveServiceAction}
        clientId={carePlan.patientId}
        carePlanId={carePlan.id}
        isLoading={mutations.createServiceActionMutation.isPending}
      />

      <AddServiceActionDialog
        open={dialogs.addServiceActionDialogOpen}
        onOpenChange={dialogs.setAddServiceActionDialogOpen}
        onSave={handlers.handleSaveServiceAction}
        clientId={carePlan.patientId}
        carePlanId={carePlan.id}
        isLoading={mutations.createServiceActionMutation.isPending}
      />

      <EditPersonalInfoDialog
        open={dialogs.editPersonalInfoOpen}
        onOpenChange={dialogs.setEditPersonalInfoOpen}
        onSave={handlers.handleSavePersonalInfo}
        clientData={clientProfile}
        isLoading={mutations.updateClientMutation.isPending}
      />

      <EditMedicalInfoDialog
        open={dialogs.editMedicalInfoOpen}
        onOpenChange={dialogs.setEditMedicalInfoOpen}
        onSave={handlers.handleSavePersonalInfo}
        medicalData={medicalInfo}
        isLoading={mutations.updateClientMutation.isPending}
      />

      <EditAboutMeDialog
        open={dialogs.editAboutMeOpen}
        onOpenChange={dialogs.setEditAboutMeOpen}
        onSave={handlers.handleSavePersonalInfo}
        personalInfo={personalInfo}
        personalCare={personalCare}
        isLoading={mutations.updateClientMutation.isPending}
      />

      <EditDietaryDialog
        open={dialogs.editDietaryOpen}
        onOpenChange={dialogs.setEditDietaryOpen}
        onSave={handlers.handleSavePersonalInfo}
        dietaryRequirements={dietaryRequirements}
        isLoading={mutations.updateClientMutation.isPending}
      />

      <EditPersonalCareDialog
        open={dialogs.editPersonalCareOpen}
        onOpenChange={dialogs.setEditPersonalCareOpen}
        onSave={handlers.handleSavePersonalInfo}
        personalCare={personalCare}
        isLoading={mutations.updateClientMutation.isPending}
      />
    </>
  );
};
