import React, { useState } from "react";
import { X, FileEdit, Download, PenLine, MessageCircle, Clock, Activity, FileBarChart2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { generatePDF } from "@/utils/pdfGenerator";

import { CarerCarePlanSidebar } from "./CarerCarePlanSidebar";
import { CarerCarePlanTabBar } from "./CarerCarePlanTabBar";
import { PersonalInfoTab } from "../care/tabs/PersonalInfoTab";
import { AboutMeTab } from "../care/tabs/AboutMeTab";
import { GoalsTab } from "../care/tabs/GoalsTab";
import { ActivitiesTab } from "../care/tabs/ActivitiesTab";
import { DietaryTab } from "../care/tabs/DietaryTab";
import { NotesTab } from "../care/tabs/NotesTab";
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
import { toast } from "sonner";
import { AddEventDialog } from "@/components/care/dialogs/AddEventDialog";

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

  // Form for adding notes
  const noteForm = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      note: "",
    },
  });

  const handlePrintCarePlan = () => {
    generatePDF({
      id: parseInt(carePlan.id),
      title: `Care Plan for ${carePlan.clientName}`,
      date: format(carePlan.lastUpdated, 'yyyy-MM-dd'),
      status: carePlan.status,
      signedBy: "Carer"
    });
  };

  const handleAddNote = (values: z.infer<typeof noteFormSchema>) => {
    // In a real app, this would send the note to an API
    console.log("Adding note:", values.note);
    toast.success("Note added successfully");
    setShowAddNoteDialog(false);
    noteForm.reset();
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

  // Create mock data for the carer view based on the existing mockPatientData
  const mockNotes = mockPatientData.notes;
  const mockActivities = mockPatientData.activities;
  const mockServiceActions = mockPatientData.serviceActions;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <div className="bg-blue-100 text-blue-600 w-full h-full flex items-center justify-center text-sm font-medium">
                {carePlan.clientName.split(" ").map(name => name[0]).join("")}
              </div>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{carePlan.clientName}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Plan ID: {carePlan.id}</span>
                <span>•</span>
                <Badge>{carePlan.type}</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handlePrintCarePlan} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              <span>Update</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
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
                onScheduleFollowUp={() => toast.info("Schedule follow-up feature coming soon")}
                onRecordActivity={() => setShowAddActivityDialog(true)}
                onAddEvent={() => setShowAddEventDialog(true)}
              />
            </div>
            
            <div className="w-full md:w-2/3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <CarerCarePlanTabBar activeTab={activeTab} onChange={setActiveTab} />
                
                <TabsContent value="personal">
                  <PersonalInfoTab carePlan={{
                    patientName: carePlan.clientName,
                    patientId: carePlan.id,
                  }} mockPatientData={mockPatientData} />
                </TabsContent>
                
                <TabsContent value="aboutme">
                  <AboutMeTab aboutMe={mockPatientData.aboutMe} />
                </TabsContent>
                
                <TabsContent value="goals">
                  <GoalsTab goals={mockPatientData.goals} />
                </TabsContent>
                
                <TabsContent value="activities">
                  <ActivitiesTab 
                    activities={mockActivities} 
                    onAddActivity={() => setShowAddActivityDialog(true)} 
                  />
                </TabsContent>
                
                <TabsContent value="notes">
                  <NotesTab 
                    notes={mockNotes} 
                    onAddNote={() => setShowAddNoteDialog(true)} 
                  />
                </TabsContent>
                
                <TabsContent value="dietary">
                  <DietaryTab dietaryRequirements={mockPatientData.dietaryRequirements} />
                </TabsContent>
                
                <TabsContent value="personalcare">
                  <PersonalCareTab personalCare={mockPatientData.personalCare} />
                </TabsContent>

                <TabsContent value="serviceplan">
                  <ServicePlanTab serviceActions={mockServiceActions} />
                </TabsContent>
                
                <TabsContent value="serviceactions">
                  <ServiceActionsTab serviceActions={mockServiceActions} />
                </TabsContent>
                
                <TabsContent value="eventslogs">
                  <EventsLogsTab 
                    carePlanId={carePlan.id}
                    patientName={carePlan.clientName}
                    onAddEvent={() => setShowAddEventDialog(true)}
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
                <Button type="submit">Save Note</Button>
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
        patientId={carePlan.id}
      />
    </div>
  );
};
