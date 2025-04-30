
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, User, ClipboardList, MessageCircle, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Components for the visit flow
import { VisitCheckIn } from "@/components/carer/visit/VisitCheckIn";
import { VisitTasks } from "@/components/carer/visit/VisitTasks";
import { VisitObservations } from "@/components/carer/visit/VisitObservations";
import { VisitMedication } from "@/components/carer/visit/VisitMedication";
import { VisitSummary } from "@/components/carer/visit/VisitSummary";

const CarerActiveVisit = () => {
  const { clientId, appointmentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Visit state
  const [visitStartTime, setVisitStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [visitStatus, setVisitStatus] = useState<"checking-in" | "in-progress" | "completing">("checking-in");
  const [activeTab, setActiveTab] = useState("check-in");
  
  // Mock client data - in a real app this would be fetched based on clientId
  const [client, setClient] = useState({
    id: clientId || "1",
    name: "Emma Thompson",
    address: "15 Oak Street, Milton Keynes",
    appointmentType: "Home Care Visit",
    scheduledDuration: "60 minutes",
    scheduledTime: "10:30 AM",
    appointmentId: appointmentId || "app123"
  });

  // Initialize timer when visit starts
  useEffect(() => {
    if (visitStatus === "in-progress") {
      const startTime = new Date();
      setVisitStartTime(startTime);
      
      const timer = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [visitStatus]);
  
  // Format elapsed time as HH:MM:SS
  const formatElapsedTime = () => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle check-in completion
  const handleCheckInComplete = () => {
    setVisitStatus("in-progress");
    setActiveTab("tasks");
    
    toast({
      title: "Visit Started",
      description: `Visit with ${client.name} has officially started.`
    });
  };
  
  // Handle visit completion
  const handleCompleteVisit = () => {
    setVisitStatus("completing");
    setActiveTab("summary");
  };
  
  // Handle final submission
  const handleSubmitVisit = () => {
    toast({
      title: "Visit Completed",
      description: "Visit record has been submitted successfully."
    });
    
    // Navigate back to schedule
    navigate("/carer-dashboard/schedule");
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Active Visit</h1>
          <p className="text-gray-500">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        
        <div className="flex gap-2">
          {visitStatus === "in-progress" && (
            <Button 
              variant="outline" 
              className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => {
                if (window.confirm("Are you sure you want to terminate this visit early?")) {
                  handleCompleteVisit();
                }
              }}
            >
              End Visit Early
            </Button>
          )}
          
          {visitStatus === "in-progress" && (
            <Button onClick={handleCompleteVisit}>Complete Visit</Button>
          )}
          
          {visitStatus === "completing" && (
            <Button onClick={handleSubmitVisit}>Submit Visit Record</Button>
          )}
        </div>
      </div>
      
      {/* Client and Visit Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-lg">
                {client.name.split(" ").map(name => name[0]).join("")}
              </div>
              
              <div>
                <h2 className="text-xl font-semibold">{client.name}</h2>
                <div className="text-sm text-gray-600 mt-1">{client.address}</div>
                
                <div className="flex items-center mt-3 gap-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {client.appointmentType}
                  </Badge>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    {client.scheduledTime} ({client.scheduledDuration})
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Visit Duration</div>
              <div className="text-2xl font-mono font-semibold">
                {visitStatus === "in-progress" ? formatElapsedTime() : "00:00:00"}
              </div>
              <div className="mt-2">
                <Badge variant={visitStatus === "in-progress" ? "success" : "outline"}>
                  {visitStatus === "checking-in" ? "Checking In" : 
                   visitStatus === "in-progress" ? "In Progress" : "Completing"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Visit Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="check-in" disabled={visitStatus !== "checking-in" && visitStatus !== "completing"}>
            Check-In
          </TabsTrigger>
          <TabsTrigger value="tasks" disabled={visitStatus === "checking-in"}>
            Tasks
          </TabsTrigger>
          <TabsTrigger value="observations" disabled={visitStatus === "checking-in"}>
            Observations
          </TabsTrigger>
          <TabsTrigger value="medication" disabled={visitStatus === "checking-in"}>
            Medication
          </TabsTrigger>
          <TabsTrigger value="summary" disabled={visitStatus !== "completing"}>
            Summary
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="check-in" className="mt-4">
          <VisitCheckIn 
            client={client} 
            onCheckInComplete={handleCheckInComplete} 
          />
        </TabsContent>
        
        <TabsContent value="tasks" className="mt-4">
          <VisitTasks clientId={client.id} />
        </TabsContent>
        
        <TabsContent value="observations" className="mt-4">
          <VisitObservations clientId={client.id} />
        </TabsContent>
        
        <TabsContent value="medication" className="mt-4">
          <VisitMedication clientId={client.id} />
        </TabsContent>
        
        <TabsContent value="summary" className="mt-4">
          <VisitSummary 
            client={client} 
            visitStartTime={visitStartTime} 
            visitDuration={elapsedTime} 
            onSubmit={handleSubmitVisit} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CarerActiveVisit;
