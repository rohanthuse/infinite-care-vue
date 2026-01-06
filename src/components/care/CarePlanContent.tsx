
import React from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CarePlanSidebar } from "./CarePlanSidebar";
import { CarePlanTabBar } from "./CarePlanTabBar";
import { PersonalInfoTab } from "./tabs/PersonalInfoTab";
import { AboutMeTab } from "./tabs/AboutMeTab";
import { MedicalMentalTab } from "./tabs/MedicalMentalTab";
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
import { CarePlanFormsTab } from "./forms/CarePlanFormsTab";
import { AdminMedicationTab } from "./tabs/AdminMedicationTab";
import { TasksTab } from "./tabs/TasksTab";
import { ClientKeyContactsTab } from "@/components/clients/tabs/ClientKeyContactsTab";
import {
  ClientProfile,
  ClientPersonalInfo,
  ClientMedicalInfo,
  ClientDietaryRequirements,
  ClientPersonalCare,
  ClientAssessment,
  ClientEquipment,
  ClientServiceAction,
} from "@/hooks/useClientData";
import { ClientRiskAssessment } from "@/hooks/useClientRiskAssessments";

interface CarePlanContentProps {
  carePlan: {
    id: string;
    patientName: string;
    patientId: string;
    dateCreated: Date;
    lastUpdated: Date;
    status: string;
    assignedTo: string;
    avatar: string;
    news2_monitoring_enabled?: boolean;
    news2_monitoring_frequency?: string;
    news2_monitoring_notes?: string;
  };
  activeTab: string;
  setActiveTab: (tab: string) => void;
  clientProfile?: ClientProfile;
  personalInfo?: ClientPersonalInfo;
  medicalInfo?: ClientMedicalInfo;
  dietaryRequirements?: ClientDietaryRequirements;
  personalCare?: ClientPersonalCare;
  assessments: ClientAssessment[];
  equipment: ClientEquipment[];
  riskAssessments: ClientRiskAssessment[];
  serviceActions: ClientServiceAction[];
  branchId?: string;
  aboutMeData?: {
    has_key_safe?: boolean;
    key_safe_code?: string;
    requires_heating_help?: boolean;
    home_type?: string;
    living_status?: string;
    is_visually_impaired?: boolean;
    vision_description?: string;
    is_hearing_impaired?: boolean;
    hearing_description?: string;
    mobility?: string;
    communication_needs?: string;
    how_i_communicate?: string;
    ethnicity?: string;
    living_arrangement?: string;
    has_dnr?: boolean;
    has_respect?: boolean;
    has_dols?: boolean;
    has_lpa?: boolean;
  } | null;
  onAddNote: () => void;
  onScheduleFollowUp: () => void;
  onRecordActivity: () => void;
  onUploadDocument: () => void;
  onAddEvent: () => void;
  onAddGoal: () => void;
  onAddAssessment: () => void;
  onAddEquipment: () => void;
  onAddRiskAssessment: () => void;
  onAddServicePlan: () => void;
  onAddServiceAction: () => void;
  onEditPersonalInfo: () => void;
  onEditMedicalInfo: () => void;
  onEditAboutMe: () => void;
  onEditDietaryRequirements: () => void;
  onEditPersonalCare: () => void;
}

export const CarePlanContent: React.FC<CarePlanContentProps> = ({
  carePlan,
  activeTab,
  setActiveTab,
  clientProfile,
  personalInfo,
  medicalInfo,
  dietaryRequirements,
  personalCare,
  assessments,
  equipment,
  riskAssessments,
  serviceActions,
  branchId,
  aboutMeData,
  onAddNote,
  onScheduleFollowUp,
  onRecordActivity,
  onUploadDocument,
  onAddEvent,
  onAddGoal,
  onAddAssessment,
  onAddEquipment,
  onAddRiskAssessment,
  onAddServicePlan,
  onAddServiceAction,
  onEditPersonalInfo,
  onEditMedicalInfo,
  onEditAboutMe,
  onEditDietaryRequirements,
  onEditPersonalCare,
}) => {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="w-full md:w-1/3">
          <CarePlanSidebar 
            carePlan={carePlan} 
            onAddNote={onAddNote}
            onScheduleFollowUp={onScheduleFollowUp}
            onRecordActivity={onRecordActivity}
            onUploadDocument={onUploadDocument}
            onAddEvent={onAddEvent}
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
                onEditPersonalInfo={onEditPersonalInfo}
                onEditMedicalInfo={onEditMedicalInfo}
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
                aboutMeData={aboutMeData}
                onEditAboutMe={onEditAboutMe}
              />
            </TabsContent>

            <TabsContent value="medicalmental">
              <MedicalMentalTab 
                medicalInfo={medicalInfo || {
                  id: "",
                  client_id: carePlan.patientId,
                  allergies: [],
                  current_medications: [],
                  medical_conditions: [],
                  medical_history: "",
                  mobility_status: "",
                  cognitive_status: "",
                  communication_needs: "",
                  sensory_impairments: [],
                  mental_health_status: "",
                  physical_health_conditions: [],
                  mental_health_conditions: [],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }}
                onEditMedicalInfo={onEditMedicalInfo}
                news2MonitoringEnabled={carePlan.news2_monitoring_enabled}
                news2MonitoringFrequency={carePlan.news2_monitoring_frequency}
                news2MonitoringNotes={carePlan.news2_monitoring_notes}
              />
            </TabsContent>

            <TabsContent value="adminmedication">
              <AdminMedicationTab 
                clientId={carePlan.patientId}
              />
            </TabsContent>
            
            <TabsContent value="goals">
              <GoalsTab 
                carePlanId={carePlan.id}
                onAddGoal={onAddGoal}
              />
            </TabsContent>
            
            <TabsContent value="activities">
              <ActivitiesTab 
                carePlanId={carePlan.id}
                onAddActivity={onRecordActivity} 
              />
            </TabsContent>
            
            <TabsContent value="assessments">
              <AssessmentsTab 
                clientId={carePlan.patientId}
                assessments={assessments}
                onAddAssessment={onAddAssessment}
              />
            </TabsContent>
            
            <TabsContent value="equipment">
              <EquipmentTab 
                clientId={carePlan.patientId}
                equipment={equipment}
                onAddEquipment={onAddEquipment}
              />
            </TabsContent>
            
            <TabsContent value="notes">
              <NotesTab 
                clientId={carePlan.patientId}
                onAddNote={onAddNote} 
              />
            </TabsContent>
            
            <TabsContent value="documents">
              <DocumentsTab clientId={carePlan.patientId} />
            </TabsContent>

            <TabsContent value="forms">
              <CarePlanFormsTab 
                carePlanId={carePlan.id}
                branchId={branchId || ""}
                userRole="admin"
              />
            </TabsContent>
            
            <TabsContent value="dietary">
              <DietaryTab 
                clientId={carePlan.patientId}
                clientName={carePlan.patientName}
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
                onEditDietaryRequirements={onEditDietaryRequirements}
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
                onEditPersonalCare={onEditPersonalCare}
              />
            </TabsContent>

            <TabsContent value="risk">
              <RiskAssessmentsTab 
                clientId={carePlan.patientId}
                riskAssessments={riskAssessments}
                onAddRiskAssessment={onAddRiskAssessment}
              />
            </TabsContent>

            <TabsContent value="riskassessments">
              <RiskAssessmentsTab 
                clientId={carePlan.patientId}
                riskAssessments={riskAssessments}
                onAddRiskAssessment={onAddRiskAssessment}
              />
            </TabsContent>

            <TabsContent value="serviceplan">
              <ServicePlanTab 
                serviceActions={serviceActions}
                onAddServicePlan={onAddServicePlan}
              />
            </TabsContent>
            
            <TabsContent value="serviceactions">
              <ServiceActionsTab 
                serviceActions={serviceActions}
                onAddServiceAction={onAddServiceAction}
              />
            </TabsContent>

            <TabsContent value="tasks">
              <TasksTab carePlanId={carePlan.id} />
            </TabsContent>
            
            <TabsContent value="eventslogs">
              <EventsLogsTab 
                clientId={carePlan.patientId}
                carePlanId={carePlan.id}
                patientName={carePlan.patientName}
                onAddEvent={onAddEvent}
              />
            </TabsContent>

            <TabsContent value="keycontacts">
              <ClientKeyContactsTab clientId={carePlan.patientId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
