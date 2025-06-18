import React, { useState } from "react";
import { X, FileEdit, Download, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { generatePDF } from "@/utils/pdfGenerator";
import { useComprehensiveCarePlanData } from "@/hooks/useCarePlanData";
import { useClientNotes, useCreateClientNote } from "@/hooks/useClientNotes";

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

  // Fetch comprehensive care plan data
  const {
    data: comprehensiveData,
    isLoading,
    error
  } = useComprehensiveCarePlanData(carePlan?.patientId || "");

  // Database hooks for notes
  const { data: dbNotes = [], isLoading: notesLoading } = useClientNotes(carePlan?.patientId || "");
  const createNoteMutation = useCreateClientNote();

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

  if (isLoading) {
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
                  />
                </TabsContent>
                
                <TabsContent value="aboutme">
                  <AboutMeTab 
                    personalInfo={comprehensiveData?.personalInfo}
                    personalCare={comprehensiveData?.personalCare}
                  />
                </TabsContent>
                
                <TabsContent value="goals">
                  <GoalsTab goals={transformedGoals} />
                </TabsContent>
                
                <TabsContent value="activities">
                  <ActivitiesTab activities={transformedActivities} />
                </TabsContent>
                
                <TabsContent value="notes">
                  <NotesTab notes={notesToDisplay} onAddNote={handleAddNoteWithDB} />
                </TabsContent>
                
                <TabsContent value="documents">
                  <DocumentsTab 
                    documents={transformedDocuments} 
                    onUploadDocument={onUploadDocument} 
                  />
                </TabsContent>
                
                <TabsContent value="assessments">
                  <AssessmentsTab assessments={transformedAssessments} />
                </TabsContent>
                
                <TabsContent value="equipment">
                  <EquipmentTab equipment={transformedEquipment} />
                </TabsContent>
                
                <TabsContent value="dietary">
                  <DietaryTab dietaryRequirements={comprehensiveData?.dietaryRequirements} />
                </TabsContent>

                <TabsContent value="personalcare">
                  <PersonalCareTab personalCare={comprehensiveData?.personalCare} />
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
    </div>
  );
};
