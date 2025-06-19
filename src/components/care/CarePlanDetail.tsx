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
import { AddNoteDialog } from "./dialogs/AddNoteDialog";
import { AddEventDialog } from "./dialogs/AddEventDialog";

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
  onAddNote?: () => void;
  onScheduleFollowUp?: () => void;
  onRecordActivity?: () => void;
  onUploadDocument?: () => void;
  onAddEvent?: () => void;
}

export const CarePlanDetail: React.FC<CarePlanDetailProps> = ({
  carePlan,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const navigate = useNavigate();
  const params = useParams();

  const branchId = params.branchId || '';
  const branchName = params.branchName || '';

  const handleClose = () => {
    // Use the onClose prop first, then fallback to navigation
    if (onClose) {
      onClose();
    } else {
      // Navigate back to the main branch dashboard
      if (branchId && branchName) {
        navigate(`/branch-dashboard/${branchId}/${branchName}`);
      } else {
        // Fallback navigation to main dashboard
        navigate("/");
      }
    }
  };

  const handleEdit = () => {
    // Navigate to client edit page
    if (branchId && branchName && carePlan.patientId) {
      navigate(`/branch-dashboard/${branchId}/${branchName}/clients/${carePlan.patientId}/edit`);
    } else {
      toast.error("Unable to navigate to edit page. Please try again.");
    }
  };

  const handleScheduleFollowUp = () => {
    // Navigate to booking page with client context
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

  const handleAddNote = () => {
    setAddNoteDialogOpen(true);
  };

  const handleRecordActivity = () => {
    toast.info("Activity recording functionality coming soon");
  };

  const handleUploadDocument = () => {
    toast.info("Document upload functionality available in Documents tab");
  };

  const handleAddEvent = () => {
    setAddEventDialogOpen(true);
  };

  const handleSaveNote = (noteData: { title: string; content: string }) => {
    // This would typically save to database
    console.log("Saving note:", noteData);
    toast.success("Note added successfully");
    setAddNoteDialogOpen(false);
  };

  const handleSaveEvent = (eventData: any) => {
    // This would typically save to database
    console.log("Saving event:", eventData);
    toast.success("Event recorded successfully");
    setAddEventDialogOpen(false);
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
                    client={{
                      id: carePlan.patientId,
                      first_name: carePlan.patientName.split(' ')[0],
                      last_name: carePlan.patientName.split(' ')[1] || '',
                      email: "",
                      phone: "",
                      date_of_birth: "",
                      address: "",
                      gender: "",
                    }}
                    personalInfo={{
                      emergency_contact_name: "",
                      emergency_contact_phone: "",
                      preferred_communication: "",
                    }}
                    medicalInfo={{
                      allergies: [],
                      current_medications: [],
                      medical_conditions: [],
                      medical_history: "",
                    }}
                  />
                </TabsContent>
                
                <TabsContent value="aboutme">
                  <AboutMeTab 
                    personalInfo={{
                      cultural_preferences: "",
                      language_preferences: "",
                    }}
                    personalCare={{
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
                  />
                </TabsContent>
                
                <TabsContent value="goals">
                  <GoalsTab goals={[]} />
                </TabsContent>
                
                <TabsContent value="activities">
                  <ActivitiesTab 
                    activities={[]} 
                    onAddActivity={handleRecordActivity} 
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
                  <DietaryTab dietaryRequirements={{
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
                  }} />
                </TabsContent>
                
                <TabsContent value="personalcare">
                  <PersonalCareTab personalCare={{
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
                  }} />
                </TabsContent>

                <TabsContent value="serviceplan">
                  <ServicePlanTab serviceActions={[]} />
                </TabsContent>
                
                <TabsContent value="serviceactions">
                  <ServiceActionsTab serviceActions={[]} />
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

      {/* Add Note Dialog */}
      <AddNoteDialog
        open={addNoteDialogOpen}
        onOpenChange={setAddNoteDialogOpen}
        onSave={handleSaveNote}
      />

      {/* Add Event Dialog */}
      <AddEventDialog
        open={addEventDialogOpen}
        onOpenChange={setAddEventDialogOpen}
        onSave={handleSaveEvent}
        carePlanId={carePlan.id}
        patientName={carePlan.patientName}
      />
    </div>
  );
};
