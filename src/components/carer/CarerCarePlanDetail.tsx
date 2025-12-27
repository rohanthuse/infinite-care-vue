
import React, { useState } from "react";
import { X, FileEdit, Download, PenLine, MessageCircle, Clock, Activity, FileBarChart2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { generatePDF, exportCarePlanPDF } from "@/utils/pdfGenerator";
import { useClientNotes, useCreateClientNote } from "@/hooks/useClientNotes";
import { useAuth } from "@/hooks/useAuth";
import { ClientServiceAction } from "@/hooks/useClientServiceActions";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { CarerCarePlanSidebar } from "./CarerCarePlanSidebar";
import { CarerCarePlanTabBar } from "./CarerCarePlanTabBar";
import { PersonalInfoTab } from "../care/tabs/PersonalInfoTab";
import { AboutMeTab } from "../care/tabs/AboutMeTab";
import { GoalsTab } from "../care/tabs/GoalsTab";
import { ActivitiesTab } from "../care/tabs/ActivitiesTab";
import { DietaryTab } from "../care/tabs/DietaryTab";
import { NotesTab } from "../care/tabs/NotesTab";
import { DocumentsTab } from "../care/tabs/DocumentsTab";
import { PersonalCareTab } from "../care/tabs/PersonalCareTab";
import { EventsLogsTab } from "../care/tabs/EventsLogsTab";
import { ServiceActionsTab } from "../care/tabs/ServiceActionsTab";
import { ServicePlanTab } from "../care/tabs/ServicePlanTab";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { mockPatientData } from "@/data/mockPatientData";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddEventDialog } from "@/components/care/dialogs/AddEventDialog";
import { UpdateCarePlanDialog, CarePlanUpdateData } from "./UpdateCarePlanDialog";

interface CarerCarePlanDetailProps {
  carePlan: {
    id: string;
    clientName: string;
    dateCreated: Date;
    lastUpdated: Date;
    status: string;
    type: string;
    alerts: number;
    tasks: Array<{
      id: string;
      name: string;
      completed: boolean;
    }>;
  };
  onClose: () => void;
}

// Note form schema
const noteFormSchema = z.object({
  note: z.string().min(10, {
    message: "Note must be at least 10 characters.",
  }),
});

export const CarerCarePlanDetail: React.FC<CarerCarePlanDetailProps> = ({
  carePlan,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [showAddActivityDialog, setShowAddActivityDialog] = useState(false);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [showUpdateCarePlanDialog, setShowUpdateCarePlanDialog] = useState(false);
  const [patientDataState, setPatientDataState] = useState(mockPatientData);
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();

  const branchId = params.branchId || '';
  const branchName = params.branchName || '';

  // Database hooks for notes
  const { data: dbNotes = [], isLoading: notesLoading } = useClientNotes(carePlan.id);
  const createNoteMutation = useCreateClientNote();

  // Form for adding notes
  const noteForm = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      note: "",
    },
  });

  // Get current user's role and name for author field - simplified to just show "Carer"
  const getCurrentUserAuthor = () => {
    // For carers, just return "Carer"
    return "Carer";
  };

  const handleClose = () => {
    // Navigate back to the care plans page with proper branch context
    if (branchId && branchName) {
      navigate(`/branch-dashboard/${branchId}/${branchName}/care`);
    } else {
      // Fallback - call the onClose prop
      onClose();
    }
  };

  const handleEdit = () => {
    // Navigate to edit care plan page
    if (branchId && branchName) {
      navigate(`/branch-dashboard/${branchId}/${branchName}/care-plan/${carePlan.id}/edit`);
    } else {
      toast.error("Unable to navigate to edit page. Please try again.");
    }
  };

  const handleExportCarePlan = () => {
    // Use the enhanced export function instead of the simple generatePDF
    try {
      exportCarePlanPDF(
        carePlan, 
        patientDataState,
        "Med-Infinite"
      );
      toast.success("Care plan exported successfully");
    } catch (error) {
      console.error("Error exporting care plan:", error);
      toast.error("Failed to export care plan");
    }
  };

  const handleScheduleFollowUp = () => {
    // Navigate to booking page with client context
    if (branchId && branchName) {
      navigate(`/branch-dashboard/${branchId}/${branchName}/bookings/new`, {
        state: { 
          clientId: carePlan.id, 
          clientName: carePlan.clientName,
          carePlanId: carePlan.id 
        }
      });
    } else {
      toast.error("Unable to navigate to booking page. Please try again.");
    }
  };

  const handleUpdateCarePlan = (values: CarePlanUpdateData) => {
    console.log("Updating care plan with data:", values);
    
    // Create a deep copy of the current patient data to modify
    const updatedPatientData = JSON.parse(JSON.stringify(patientDataState));
    
    // Update goals if provided
    if (values.goals) {
      values.goals.forEach((goal, index) => {
        if (updatedPatientData.goals[index]) {
          if (goal.status) updatedPatientData.goals[index].status = goal.status;
          if (goal.notes) updatedPatientData.goals[index].notes = goal.notes;
        }
      });
    }
    
    // Update activities if provided
    if (values.activities) {
      values.activities.forEach((activity, index) => {
        if (updatedPatientData.activities[index]) {
          if (activity.status) updatedPatientData.activities[index].status = activity.status;
          if (activity.notes) updatedPatientData.activities[index].notes = activity.notes;
        }
      });
    }
    
    // Add new note if provided
    if (values.generalNotes && values.generalNotes.trim() !== "") {
      updatedPatientData.notes.unshift({
        date: new Date(),
        author: "Carer",
        content: values.generalNotes,
      });
    }
    
    // Update the state with the modified data
    setPatientDataState(updatedPatientData);
    toast.success("Care plan updated successfully");
  };

  const handleAddNote = async (values: z.infer<typeof noteFormSchema>) => {
    try {
      await createNoteMutation.mutateAsync({
        client_id: carePlan.id,
        title: "Care Note",
        content: values.note,
        author: getCurrentUserAuthor(), // Use simplified author field
      });
      setShowAddNoteDialog(false);
      noteForm.reset();
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    }
  };

  const handleAddActivity = () => {
    // In a real app, this would open a form to add an activity
    toast.success("Activity recorded successfully");
    setShowAddActivityDialog(false);
  };

  const handleAddEvent = (eventData: any) => {
    // Enhanced event handling with better logging and processing of body map data
    console.log("Event data received:", eventData);
    
    if (eventData.injuryOccurred === "yes" && eventData.bodyMapPoints && eventData.bodyMapPoints.length > 0) {
      console.log("Body map points detected:", eventData.bodyMapPoints);
      
      // In a real app, this would send the event data to an API
      // with proper handling of the body map points
      toast.success("Event with injury details recorded successfully");
    } else if (eventData.injuryOccurred === "yes" && (!eventData.bodyMapPoints || eventData.bodyMapPoints.length === 0)) {
      console.warn("Injury was marked as occurred but no body map points were provided");
      toast.warning("Event saved, but injury details are incomplete");
    } else {
      // Regular event without injury
      console.log("Regular event without injury recorded");
      toast.success("Event recorded successfully");
    }
    
    setShowAddEventDialog(false);
  };

  // Transform database notes to match component expected format
  const transformedNotes = dbNotes.map(note => ({
    date: new Date(note.created_at),
    author: note.author,
    content: note.content
  }));

  // Use database notes if available, otherwise fall back to mock data
  const notesToDisplay = transformedNotes.length > 0 ? transformedNotes : patientDataState.notes;

  // Create mock data for the carer view based on the existing mockPatientData
  const mockNotes = patientDataState.notes;
  const mockActivities = patientDataState.activities;

  // Transform service actions to match expected ClientServiceAction interface
  const mockServiceActions: ClientServiceAction[] = patientDataState.serviceActions.map((action, index) => ({
    id: `sa-${Date.now()}-${index}`,
    client_id: carePlan.id,
    care_plan_id: carePlan.id,
    service_name: action.service,
    service_category: "Care Service",
    provider_name: action.provider,
    frequency: action.frequency,
    duration: action.duration,
    schedule_details: action.schedule,
    goals: action.goals,
    progress_status: action.progress,
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,
    last_completed_date: null,
    next_scheduled_date: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  // Transform dietary data to match expected interface
  const transformedDietaryRequirements = {
    id: `dr-${carePlan.id}`,
    client_id: carePlan.id,
    dietary_restrictions: patientDataState.dietaryRequirements.restrictions.map(r => r.name),
    food_allergies: patientDataState.dietaryRequirements.restrictions.filter(r => r.reason === 'allergy').map(r => r.name),
    food_preferences: patientDataState.dietaryRequirements.preferences,
    meal_schedule: { general: patientDataState.dietaryRequirements.mealPlan },
    nutritional_needs: patientDataState.dietaryRequirements.nutritionalNotes,
    supplements: patientDataState.dietaryRequirements.supplements.map(s => s.name),
    feeding_assistance_required: false,
    special_equipment_needed: "",
    texture_modifications: "",
    fluid_restrictions: patientDataState.dietaryRequirements.hydrationPlan,
    weight_monitoring: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Transform personal care data to match expected interface
  const transformedPersonalCare = {
    id: `pc-${carePlan.id}`,
    client_id: carePlan.id,
    personal_hygiene_needs: patientDataState.personalCare.routines.map(r => `${r.activity}: ${r.frequency}`).join('; '),
    bathing_preferences: patientDataState.personalCare.preferences.join(', '),
    dressing_assistance_level: patientDataState.personalCare.mobility.transferAbility,
    toileting_assistance_level: "Independent",
    continence_status: "Continent",
    sleep_patterns: "Regular sleep pattern",
    behavioral_notes: patientDataState.personalCare.mobility.notes,
    comfort_measures: patientDataState.personalCare.preferences.join(', '),
    pain_management: "As needed",
    skin_care_needs: "Standard care",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-card text-card-foreground rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <div className="bg-blue-600 text-white w-full h-full flex items-center justify-center text-sm font-medium">
                {carePlan.clientName.split(" ").map(name => name[0]).join("")}
              </div>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{carePlan.clientName}</h2>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Plan ID: {carePlan.id}</span>
                <span>•</span>
                <Badge>{carePlan.type}</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleExportCarePlan} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2" onClick={handleEdit}>
              <PenLine className="h-4 w-4" />
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
              <CarerCarePlanSidebar 
                carePlan={carePlan} 
                onAddNote={() => setShowAddNoteDialog(true)}
                onScheduleFollowUp={handleScheduleFollowUp}
                onRecordActivity={() => setShowAddActivityDialog(true)}
                onAddEvent={() => setShowAddEventDialog(true)}
              />
            </div>
            
            <div className="w-full md:w-2/3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <CarerCarePlanTabBar activeTab={activeTab} onChange={setActiveTab} />
                
                <TabsContent value="personal">
                  <PersonalInfoTab 
                    client={{
                      id: carePlan.id,
                      first_name: carePlan.clientName.split(' ')[0],
                      last_name: carePlan.clientName.split(' ')[1] || '',
                      email: patientDataState.email,
                      phone: patientDataState.phone,
                      date_of_birth: patientDataState.dateOfBirth.toISOString().split('T')[0],
                      address: patientDataState.address,
                      gender: patientDataState.gender,
                    }}
                    personalInfo={{
                      emergency_contact_name: patientDataState.emergencyContact,
                      emergency_contact_phone: patientDataState.phone,
                      preferred_communication: patientDataState.preferredLanguage,
                    }}
                    medicalInfo={{
                      allergies: patientDataState.allergies,
                      current_medications: patientDataState.medications.map(m => m.name),
                      medical_conditions: patientDataState.medicalConditions,
                      medical_history: "See medical conditions and medications",
                    }}
                  />
                </TabsContent>
                
                <TabsContent value="aboutme">
                  <AboutMeTab 
                    personalInfo={{
                      cultural_preferences: patientDataState.aboutMe.preferences.join(', '),
                      language_preferences: patientDataState.preferredLanguage,
                    }}
                    personalCare={transformedPersonalCare}
                    aboutMeData={(patientDataState.aboutMe as any)?.has_key_safe !== undefined ? {
                      has_key_safe: (patientDataState.aboutMe as any)?.has_key_safe,
                      key_safe_code: (patientDataState.aboutMe as any)?.key_safe_code,
                      requires_heating_help: (patientDataState.aboutMe as any)?.requires_heating_help,
                      home_type: (patientDataState.aboutMe as any)?.home_type,
                      living_status: (patientDataState.aboutMe as any)?.living_status,
                      is_visually_impaired: (patientDataState.aboutMe as any)?.is_visually_impaired,
                      vision_description: (patientDataState.aboutMe as any)?.vision_description,
                      is_hearing_impaired: (patientDataState.aboutMe as any)?.is_hearing_impaired,
                      hearing_description: (patientDataState.aboutMe as any)?.hearing_description,
                      mobility: (patientDataState.aboutMe as any)?.mobility,
                      communication_needs: (patientDataState.aboutMe as any)?.communication_needs,
                      how_i_communicate: (patientDataState.aboutMe as any)?.how_i_communicate,
                      ethnicity: (patientDataState.aboutMe as any)?.ethnicity,
                      living_arrangement: (patientDataState.aboutMe as any)?.living_arrangement,
                      has_dnr: (patientDataState.aboutMe as any)?.has_dnr,
                      has_respect: (patientDataState.aboutMe as any)?.has_respect,
                      has_dols: (patientDataState.aboutMe as any)?.has_dols,
                      has_lpa: (patientDataState.aboutMe as any)?.has_lpa,
                    } : null}
                  />
                </TabsContent>
                
                <TabsContent value="goals">
                  <GoalsTab 
                    carePlanId={carePlan.id}
                    onAddGoal={() => setShowUpdateCarePlanDialog(true)}
                  />
                </TabsContent>
                
                <TabsContent value="activities">
                  <ActivitiesTab 
                    carePlanId={carePlan.id}
                    onAddActivity={() => setShowAddActivityDialog(true)} 
                  />
                </TabsContent>
                
                <TabsContent value="notes">
                  <NotesTab 
                    notes={notesToDisplay} 
                    onAddNote={() => setShowAddNoteDialog(true)} 
                  />
                </TabsContent>
                
                <TabsContent value="documents">
                  <DocumentsTab clientId={carePlan.id} />
                </TabsContent>
                
                <TabsContent value="dietary">
                  <DietaryTab dietaryRequirements={transformedDietaryRequirements} />
                </TabsContent>
                
                <TabsContent value="personalcare">
                  <PersonalCareTab personalCare={transformedPersonalCare} />
                </TabsContent>

                <TabsContent value="serviceplan">
                  <ServicePlanTab serviceActions={mockServiceActions} />
                </TabsContent>
                
                <TabsContent value="serviceactions">
                  <ServiceActionsTab serviceActions={mockServiceActions} />
                </TabsContent>
                
                <TabsContent value="eventslogs">
                  <EventsLogsTab 
                    clientId={carePlan.id}
                    carePlanId={carePlan.id}
                    patientName={carePlan.clientName}
                    onAddEvent={() => setShowAddEventDialog(true)}
                    branchId={branchId}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Dialog */}
      <Dialog open={showAddNoteDialog} onOpenChange={setShowAddNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Care Note</DialogTitle>
          </DialogHeader>
          <Form {...noteForm}>
            <form onSubmit={noteForm.handleSubmit(handleAddNote)} className="space-y-4">
              <FormField
                control={noteForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your observations, issues or notes..." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddNoteDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createNoteMutation.isPending}>
                  {createNoteMutation.isPending ? "Saving..." : "Save Note"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* This would be expanded in a real app */}
      <Dialog open={showAddActivityDialog} onOpenChange={setShowAddActivityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Activity</DialogTitle>
          </DialogHeader>
          <p className="py-4">Activity recording form would go here.</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAddActivityDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddActivity}>Save Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Event Dialog with Body Map Support */}
      <AddEventDialog 
        open={showAddEventDialog} 
        onOpenChange={setShowAddEventDialog}
        onSave={handleAddEvent}
        carePlanId={carePlan.id}
        patientName={carePlan.clientName}
      />

      {/* Update Care Plan Dialog */}
      <UpdateCarePlanDialog
        open={showUpdateCarePlanDialog}
        onOpenChange={setShowUpdateCarePlanDialog}
        onUpdate={handleUpdateCarePlan}
        carePlan={carePlan}
        patientData={patientDataState}
      />
    </div>
  );
};
