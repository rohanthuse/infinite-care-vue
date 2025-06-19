
import React, { useState } from "react";
import { X, FileEdit, Download, PenLine, MessageCircle, Clock, Activity, FileBarChart2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { generatePDF, exportCarePlanPDF } from "@/utils/pdfGenerator";
import { useClientNotes, useCreateClientNote } from "@/hooks/useClientNotes";
import { useClientEvents, useCreateClientEvent } from "@/hooks/useClientEvents";
import { useAuth } from "@/hooks/useAuth";
import { ClientServiceAction } from "@/hooks/useClientServiceActions";

import { CarePlanSidebar } from "./CarePlanSidebar";
import { CarePlanTabBar } from "./CarePlanTabBar";
import { PersonalInfoTab } from "./tabs/PersonalInfoTab";
import { AboutMeTab } from "./tabs/AboutMeTab";
import { GoalsTab } from "./tabs/GoalsTab";
import { ActivitiesTab } from "./tabs/ActivitiesTab";
import { DietaryTab } from "./tabs/DietaryTab";
import { NotesTab } from "./tabs/NotesTab";
import { PersonalCareTab } from "./tabs/PersonalCareTab";
import { EventsLogsTab } from "./tabs/EventsLogsTab";
import { ServiceActionsTab } from "./tabs/ServiceActionsTab";
import { ServicePlanTab } from "./tabs/ServicePlanTab";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { mockPatientData } from "@/data/mockPatientData";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AddEventDialog as ClientEventDialog } from "@/components/clients/dialogs/AddEventDialog";

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

// Note form schema
const noteFormSchema = z.object({
  note: z.string().min(10, {
    message: "Note must be at least 10 characters.",
  }),
});

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
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [showAddActivityDialog, setShowAddActivityDialog] = useState(false);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [patientDataState, setPatientDataState] = useState(mockPatientData);
  const { user } = useAuth();

  // Database hooks for notes and events
  const { data: dbNotes = [], isLoading: notesLoading } = useClientNotes(carePlan.id);
  const createNoteMutation = useCreateClientNote();
  const createEventMutation = useCreateClientEvent();

  // Form for adding notes
  const noteForm = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      note: "",
    },
  });

  // Get current user's role and name for author field
  const getCurrentUserAuthor = () => {
    return user?.email || "Care Provider";
  };

  const handleExportCarePlan = () => {
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

  const handleAddNote = async (values: z.infer<typeof noteFormSchema>) => {
    try {
      await createNoteMutation.mutateAsync({
        client_id: carePlan.id,
        title: "Care Note",
        content: values.note,
        author: getCurrentUserAuthor(),
      });
      setShowAddNoteDialog(false);
      noteForm.reset();
      toast.success("Note added successfully");
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

  const handleAddEvent = async (eventData: any) => {
    try {
      await createEventMutation.mutateAsync({
        client_id: carePlan.id,
        event_type: eventData.event_type,
        title: eventData.title,
        description: eventData.description,
        severity: eventData.severity,
        reporter: eventData.reporter,
      });
      setShowAddEventDialog(false);
      toast.success("Event logged successfully");
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("Failed to log event");
    }
  };

  // Transform database notes to match component expected format
  const transformedNotes = dbNotes.map(note => ({
    date: new Date(note.created_at),
    author: note.author,
    content: note.content
  }));

  // Use database notes if available, otherwise fall back to mock data
  const notesToDisplay = transformedNotes.length > 0 ? transformedNotes : patientDataState.notes;

  // Create mock data for other tabs based on the existing mockPatientData
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <div className="bg-blue-100 text-blue-600 w-full h-full flex items-center justify-center text-lg font-medium">
              {carePlan.avatar}
            </div>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{carePlan.patientName}</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Plan ID: {carePlan.id}</span>
              <span>•</span>
              <Badge>{carePlan.status}</Badge>
              <span>•</span>
              <span>Updated {format(carePlan.lastUpdated, "MMM dd, yyyy")}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportCarePlan} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <PenLine className="h-4 w-4" />
            <span>Edit Plan</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="w-full lg:w-1/3">
          <CarePlanSidebar 
            carePlan={carePlan} 
            onAddNote={() => setShowAddNoteDialog(true)}
            onScheduleFollowUp={onScheduleFollowUp}
            onRecordActivity={() => setShowAddActivityDialog(true)}
            onUploadDocument={onUploadDocument}
            onAddEvent={() => setShowAddEventDialog(true)}
          />
        </div>
        
        <div className="w-full lg:w-2/3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CarePlanTabBar activeTab={activeTab} onChange={setActiveTab} />
            
            <TabsContent value="personal">
              <PersonalInfoTab 
                client={{
                  id: carePlan.id,
                  first_name: carePlan.patientName.split(' ')[0],
                  last_name: carePlan.patientName.split(' ')[1] || '',
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
              />
            </TabsContent>
            
            <TabsContent value="goals">
              <GoalsTab goals={patientDataState.goals} />
            </TabsContent>
            
            <TabsContent value="activities">
              <ActivitiesTab 
                activities={mockActivities} 
                onAddActivity={() => setShowAddActivityDialog(true)} 
              />
            </TabsContent>
            
            <TabsContent value="notes">
              <NotesTab 
                notes={notesToDisplay} 
                onAddNote={() => setShowAddNoteDialog(true)} 
              />
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
                patientName={carePlan.patientName}
                onAddEvent={() => setShowAddEventDialog(true)}
              />
            </TabsContent>
          </Tabs>
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

      {/* Add Activity Dialog - simplified for now */}
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

      {/* Add Event Dialog */}
      <ClientEventDialog
        open={showAddEventDialog}
        onOpenChange={setShowAddEventDialog}
        onSave={handleAddEvent}
      />
    </div>
  );
};
