
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  User, Shield, Calendar, ClipboardList, Activity, 
  FileText, MessageCircle, AlertCircle, ArrowLeft
} from "lucide-react";

// Activity logging dialog
import { CarerAddActivityDialog } from "@/components/carer/dialogs/CarerAddActivityDialog";
import { CarerAddEventDialog } from "@/components/carer/dialogs/CarerAddEventDialog";
import { CarerProgressDialog } from "@/components/carer/dialogs/CarerProgressDialog";
import { CarerClientActivitiesTab } from "@/components/carer/tabs/CarerClientActivitiesTab";
import { CarerClientGoalsTab } from "@/components/carer/tabs/CarerClientGoalsTab";
import { CarerClientNotesTab } from "@/components/carer/tabs/CarerClientNotesTab";
import { CarerClientCarePlanTab } from "@/components/carer/tabs/CarerClientCarePlanTab";
import { useToast } from "@/hooks/use-toast";

const CarerClientView: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("careplan");
  
  // Dialog states
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  
  // Mock client data - in a real app, this would be fetched based on clientId
  const client = {
    id: clientId || "CL-001",
    name: "Emma Thompson",
    age: 75,
    status: "Active",
    careNeeds: ["Medication Management", "Personal Care", "Mobility Assistance"],
    carePlanId: "CP-2023-001"
  };

  // Handle activity submission
  const handleActivitySubmit = (activityData: any) => {
    console.log("Activity submitted:", activityData);
    toast({
      title: "Activity logged",
      description: `Activity successfully recorded for ${client.name}`,
    });
    setActivityDialogOpen(false);
  };

  // Handle event submission
  const handleEventSubmit = (eventData: any) => {
    console.log("Event submitted:", eventData);
    toast({
      title: "Event logged",
      description: `Event successfully recorded for ${client.name}`,
    });
    setEventDialogOpen(false);
  };

  // Handle progress update submission
  const handleProgressSubmit = (progressData: any) => {
    console.log("Progress updated:", progressData);
    toast({
      title: "Progress updated",
      description: `Progress update recorded for ${client.name}`,
    });
    setProgressDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/carer-dashboard/clients")}
            className="h-8 w-8 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Client Details</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Client summary card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div>{client.name}</div>
                <Badge variant="outline" className="text-xs">
                  {client.id}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Age</p>
              <p>{client.age} years</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge 
                variant="outline" 
                className={client.status === "Active" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}
              >
                {client.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Care Plan ID</p>
              <p>{client.carePlanId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Care Needs</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {client.careNeeds.map((need, i) => (
                  <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700">
                    {need}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="pt-4 space-y-2">
              <Button 
                className="w-full" 
                onClick={() => setActivityDialogOpen(true)}
              >
                <Activity className="mr-2 h-4 w-4" />
                Log Activity
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setEventDialogOpen(true)}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Record Event
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setProgressDialogOpen(true)}
              >
                <Activity className="mr-2 h-4 w-4" />
                Update Progress
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start mb-4 overflow-x-auto">
              <TabsTrigger value="careplan" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>Care Plan</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>Goals</span>
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex items-center gap-1">
                <ClipboardList className="h-4 w-4" />
                <span>Activities</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>Notes</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="careplan">
              <CarerClientCarePlanTab clientId={client.id} />
            </TabsContent>
            
            <TabsContent value="goals">
              <CarerClientGoalsTab 
                clientId={client.id} 
                onUpdateProgress={() => setProgressDialogOpen(true)} 
              />
            </TabsContent>
            
            <TabsContent value="activities">
              <CarerClientActivitiesTab 
                clientId={client.id}
                onAddActivity={() => setActivityDialogOpen(true)}
              />
            </TabsContent>
            
            <TabsContent value="notes">
              <CarerClientNotesTab clientId={client.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Activity logging dialog */}
      <CarerAddActivityDialog
        open={activityDialogOpen}
        onOpenChange={setActivityDialogOpen}
        onSubmit={handleActivitySubmit}
        client={client}
      />
      
      {/* Event logging dialog */}
      <CarerAddEventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        onSubmit={handleEventSubmit}
        client={client}
      />
      
      {/* Progress update dialog */}
      <CarerProgressDialog
        open={progressDialogOpen}
        onOpenChange={setProgressDialogOpen}
        onSubmit={handleProgressSubmit}
        client={client}
      />
    </div>
  );
};

export default CarerClientView;
