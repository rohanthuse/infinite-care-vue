
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Clock,
  MapPin,
  CheckCircle2,
  Clipboard,
  Pill,
  FileText,
  Camera,
  AlertCircle,
  CheckCircle,
  Pencil,
  PauseCircle,
  UserCheck,
  ArrowRight,
  Edit,
  Send,
  PanelLeftClose,
  Activity,
  Newspaper,
  MessageCircle,
  FileBarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { SignatureCanvas } from "@/components/ui/signature-canvas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { News2PatientTrend } from "@/components/reports/news2/news2Types";

interface Task {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  required: boolean;
}

interface MedicationTask {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  time: string;
  completed: boolean;
}

interface News2Reading {
  id: string;
  respRate: number;
  spo2: number;
  systolicBP: number;
  pulse: number;
  consciousness: string;
  temperature: number;
  o2Therapy: boolean;
  dateTime: string;
  score: number;
}

interface Event {
  id: string;
  title: string;
  category: string;
  status: string;
  details: string;
  location: string;
  date: string;
  time: string;
}

const CarerVisitWorkflow = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("check-in");
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState<any>(null);
  const [visitStarted, setVisitStarted] = useState(false);
  const [visitTimer, setVisitTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [clientSignature, setClientSignature] = useState<string | null>(null);
  const [carerSignature, setCarerSignature] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [photoAdded, setPhotoAdded] = useState(false);
  const [eventCategory, setEventCategory] = useState("accident");
  const [eventDetails, setEventDetails] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  
  // NEWS2 state
  const [news2Readings, setNews2Readings] = useState<News2Reading[]>([]);
  const [respRate, setRespRate] = useState(16);
  const [spo2, setSpo2] = useState(96);
  const [systolicBP, setSystolicBP] = useState(120);
  const [pulse, setPulse] = useState(80);
  const [consciousness, setConsciousness] = useState("Alert");
  const [temperature, setTemperature] = useState(37.0);
  const [o2Therapy, setO2Therapy] = useState(false);
  
  // Events state
  const [events, setEvents] = useState<Event[]>([]);
  
  // Mock client tasks from care plan
  const [tasks, setTasks] = useState<Task[]>([
    { id: "task1", name: "Personal hygiene assistance", description: "Help client with washing and dressing", completed: false, required: true },
    { id: "task2", name: "Meal preparation", description: "Prepare lunch according to dietary requirements", completed: false, required: true },
    { id: "task3", name: "Check blood pressure", description: "Record reading in notes", completed: false, required: true },
    { id: "task4", name: "Mobility exercises", description: "Follow physiotherapist plan", completed: false, required: false },
  ]);
  
  // Mock medications from care plan
  const [medications, setMedications] = useState<MedicationTask[]>([
    { id: "med1", name: "Amlodipine", dosage: "5mg", instructions: "Take with water", time: "12:00 PM", completed: false },
    { id: "med2", name: "Metformin", dosage: "500mg", instructions: "Take with food", time: "12:30 PM", completed: false },
  ]);
  
  // Mock appointment data - in a real app, this would be fetched from API
  useEffect(() => {
    const fetchAppointmentData = async () => {
      // Simulating API call delay
      setTimeout(() => {
        setAppointment({
          id: appointmentId || "1",
          clientName: "Emma Thompson",
          clientId: "CLT001",
          address: "15 Oak Street, Milton Keynes",
          time: "10:30 AM - 11:30 AM",
          date: new Date(),
          type: "Home Care Visit"
        });
        setIsLoading(false);
      }, 1000);
    };
    
    fetchAppointmentData();
  }, [appointmentId]);
  
  // Timer functionality
  useEffect(() => {
    if (visitStarted && !timerInterval) {
      const interval = setInterval(() => {
        setVisitTimer(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } else if (!visitStarted && timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [visitStarted, timerInterval]);
  
  // Format time for display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate NEWS2 score
  const calculateNews2Score = () => {
    let score = 0;
    
    // Respiration rate scoring
    if (respRate <= 8 || respRate >= 25) score += 3;
    else if (respRate >= 21) score += 2;
    else if (respRate <= 11) score += 1;
    
    // Oxygen saturation scoring
    if (spo2 <= 91) score += 3;
    else if (spo2 <= 93) score += 2;
    else if (spo2 <= 95) score += 1;
    
    // Systolic BP scoring
    if (systolicBP <= 90 || systolicBP >= 220) score += 3;
    else if (systolicBP <= 100) score += 2;
    else if (systolicBP <= 110) score += 1;
    
    // Pulse scoring
    if (pulse <= 40 || pulse >= 131) score += 3;
    else if (pulse >= 111) score += 2;
    else if (pulse <= 50 || pulse >= 91) score += 1;
    
    // Consciousness scoring
    if (consciousness !== "Alert") score += 3;
    
    // Temperature scoring
    if (temperature <= 35.0 || temperature >= 39.1) score += 3;
    else if (temperature >= 38.1) score += 1;
    else if (temperature <= 36.0) score += 1;
    
    return score;
  };
  
  const handleStartVisit = () => {
    setVisitStarted(true);
    toast.success("Visit started");
  };
  
  const handlePauseVisit = () => {
    setVisitStarted(!visitStarted);
    toast.info(visitStarted ? "Visit paused" : "Visit resumed");
  };
  
  const handleTaskToggle = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };
  
  const handleMedicationToggle = (medId: string) => {
    setMedications(medications.map(med => 
      med.id === medId ? { ...med, completed: !med.completed } : med
    ));
  };
  
  const handleCapturePhoto = () => {
    // In a real app, this would access the camera
    setPhotoAdded(true);
    toast.success("Photo added to visit record");
  };
  
  const recordNews2Reading = () => {
    const score = calculateNews2Score();
    const newReading: News2Reading = {
      id: `reading-${news2Readings.length + 1}`,
      respRate,
      spo2,
      systolicBP,
      pulse,
      consciousness,
      temperature,
      o2Therapy,
      dateTime: format(new Date(), "yyyy-MM-dd HH:mm"),
      score
    };
    
    setNews2Readings([...news2Readings, newReading]);
    toast.success("Vital signs recorded successfully");
    
    // Show alert for high scores
    if (score >= 7) {
      toast.error("High NEWS2 score detected! Please notify clinical lead immediately.");
    } else if (score >= 5) {
      toast.warning("Medium risk NEWS2 score. Consider further assessment.");
    }
  };
  
  const handleAddEvent = () => {
    if (!eventTitle) {
      toast.error("Please enter an event title");
      return;
    }
    
    if (!eventDetails) {
      toast.error("Please enter event details");
      return;
    }
    
    const newEvent: Event = {
      id: `event-${events.length + 1}`,
      title: eventTitle,
      category: eventCategory,
      status: "Pending Review",
      details: eventDetails,
      location: eventLocation || appointment?.address || "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm")
    };
    
    setEvents([...events, newEvent]);
    setEventTitle("");
    setEventDetails("");
    setEventLocation("");
    toast.success("Event recorded successfully");
  };
  
  const handleStepChange = (stepNumber: number) => {
    setCurrentStep(stepNumber);
    
    // Map steps to tabs
    switch (stepNumber) {
      case 1:
        setActiveTab("check-in");
        break;
      case 2:
        setActiveTab("tasks");
        break;
      case 3:
        setActiveTab("medication");
        break;
      case 4:
        setActiveTab("news2");
        break;
      case 5:
        setActiveTab("events");
        break;
      case 6:
        setActiveTab("notes");
        break;
      case 7:
        setActiveTab("sign-off");
        break;
      case 8:
        setActiveTab("complete");
        break;
      default:
        break;
    }
  };
  
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    
    // Map tabs to steps
    switch (tabValue) {
      case "check-in":
        setCurrentStep(1);
        break;
      case "tasks":
        setCurrentStep(2);
        break;
      case "medication":
        setCurrentStep(3);
        break;
      case "news2":
        setCurrentStep(4);
        break;
      case "events":
        setCurrentStep(5);
        break;
      case "notes":
        setCurrentStep(6);
        break;
      case "sign-off":
        setCurrentStep(7);
        break;
      case "complete":
        setCurrentStep(8);
        break;
      default:
        break;
    }
  };
  
  const handleNextStep = () => {
    // Validate current step
    if (currentStep === 2) {
      const requiredTasksCompleted = tasks
        .filter(task => task.required)
        .every(task => task.completed);
        
      if (!requiredTasksCompleted) {
        toast.error("Please complete all required tasks");
        return;
      }
    }
    
    if (currentStep === 3 && medications.length > 0) {
      const allMedicationsCompleted = medications.every(med => med.completed);
      
      if (!allMedicationsCompleted) {
        toast.error("Please complete all medication tasks");
        return;
      }
    }
    
    if (currentStep === 7 && !clientSignature) {
      toast.error("Client signature is required");
      return;
    }
    
    handleStepChange(currentStep + 1);
  };
  
  const handlePreviousStep = () => {
    handleStepChange(currentStep - 1);
  };
  
  const handleCompleteVisit = () => {
    setVisitStarted(false);
    
    // Format the visit data
    const visitData = {
      appointmentId,
      clientId: appointment?.clientId,
      clientName: appointment?.clientName,
      visitDate: format(new Date(), "yyyy-MM-dd"),
      startTime: format(new Date(Date.now() - visitTimer * 1000), "HH:mm:ss"),
      endTime: format(new Date(), "HH:mm:ss"),
      duration: visitTimer,
      tasks: tasks.filter(task => task.completed).map(task => task.name),
      medications: medications.filter(med => med.completed).map(med => med.name),
      news2Readings,
      events,
      notes,
      clientSignature,
      carerSignature,
      hasPhoto: photoAdded,
      status: "Completed"
    };
    
    // Save visit data - in a real app this would be an API call
    console.log("Visit completed:", visitData);
    
    toast.success("Visit completed successfully");
    navigate("/carer-dashboard/appointments");
  };
  
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'accident':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Accident</Badge>;
      case 'incident':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Incident</Badge>;
      case 'near_miss':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Near Miss</Badge>;
      case 'medication_error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Medication Error</Badge>;
      case 'safeguarding':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Safeguarding</Badge>;
      case 'complaint':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Complaint</Badge>;
      case 'compliment':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Compliment</Badge>;
      case 'review':
        return <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">Review</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };
  
  const getVitalStatus = (vital: number, type: string) => {
    switch (type) {
      case "resp":
        if (vital <= 8 || vital >= 25) return "high";
        if (vital >= 21 || vital <= 11) return "medium";
        return "normal";
      case "spo2":
        if (vital <= 91) return "high";
        if (vital <= 93) return "medium";
        if (vital <= 95) return "medium";
        return "normal";
      case "bp":
        if (vital <= 90 || vital >= 220) return "high";
        if (vital <= 100) return "medium";
        if (vital <= 110) return "medium";
        return "normal";
      case "pulse":
        if (vital <= 40 || pulse >= 131) return "high";
        if (vital >= 111) return "medium";
        if (vital <= 50 || vital >= 91) return "medium";
        return "normal";
      case "temp":
        if (vital <= 35.0 || vital >= 39.1) return "high";
        if (vital >= 38.1) return "medium";
        if (vital <= 36.0) return "medium";
        return "normal";
      default:
        return "normal";
    }
  };
  
  const getVitalStatusColor = (status: string) => {
    if (status === "high") return "text-red-500";
    if (status === "medium") return "text-orange-500";
    return "text-green-500";
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 7) return "bg-red-500";
    if (score >= 5) return "bg-orange-500";
    if (score >= 3) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading visit details...</span>
      </div>
    );
  }
  
  // Calculate step progress
  const totalSteps = 8;
  const progress = (currentStep / totalSteps) * 100;
  
  // Define tab items for better responsive display
  const tabItems = [
    { id: "check-in", label: "Check In", icon: <MapPin className="h-4 w-4" /> },
    { id: "tasks", label: "Tasks", icon: <Clipboard className="h-4 w-4" /> },
    { id: "medication", label: "Medication", icon: <Pill className="h-4 w-4" /> },
    { id: "news2", label: "NEWS2", icon: <Activity className="h-4 w-4" /> },
    { id: "events", label: "Events", icon: <FileBarChart2 className="h-4 w-4" /> },
    { id: "notes", label: "Notes", icon: <MessageCircle className="h-4 w-4" /> },
    { id: "sign-off", label: "Sign-off", icon: <Pencil className="h-4 w-4" /> },
    { id: "complete", label: "Complete", icon: <CheckCircle2 className="h-4 w-4" /> },
  ];
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-2">
        <div>
          <h1 className="text-2xl font-bold">Visit Workflow</h1>
          <p className="text-gray-500">Client: {appointment?.clientName}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
          {visitStarted ? (
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handlePauseVisit}
            >
              {visitStarted ? <PauseCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              <span>{visitStarted ? "Pause" : "Resume"} Visit</span>
            </Button>
          ) : (
            <Button 
              className="flex items-center gap-2"
              onClick={handleStartVisit}
              disabled={visitTimer > 0}
            >
              <Clock className="h-4 w-4" />
              <span>Start Visit</span>
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="bg-blue-50 border-blue-200 text-blue-700"
          >
            <Clock className="h-4 w-4 mr-2" />
            {formatTime(visitTimer)}
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Visit Progress</CardTitle>
            <div className="text-sm font-medium">Step {currentStep} of {totalSteps}</div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="p-0 pb-1">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="px-4 pt-4 pb-1">
              <ScrollArea className="pb-4 w-full" orientation="horizontal">
                <TabsList className="inline-flex h-auto w-max p-1 items-center gap-1">
                  {tabItems.map((tab) => (
                    <TabsTrigger 
                      key={tab.id} 
                      value={tab.id} 
                      className="flex items-center gap-1.5 h-10 px-3 md:px-4 py-2 whitespace-nowrap text-sm"
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>
            </div>
            
            <div className="px-4 py-6">
              <TabsContent value="check-in">
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-full text-blue-700">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{appointment?.address}</h3>
                        <p className="text-sm text-gray-500">{format(appointment?.date, "EEEE, MMMM d, yyyy")}</p>
                        <p className="text-sm text-gray-500">{appointment?.time}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-semibold">Initial Observations</h3>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="initialNotes">Record any initial observations</Label>
                        <Textarea 
                          id="initialNotes" 
                          placeholder="Note any observations upon arrival..."
                          className="h-24"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 flex justify-end">
                    <Button 
                      onClick={handleNextStep}
                      disabled={!visitStarted}
                      className="flex items-center gap-2"
                    >
                      Continue to Tasks
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tasks">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Care Plan Tasks</h3>
                    <p className="text-sm text-gray-500">Complete the following tasks according to client's care plan</p>
                    
                    <div className="divide-y border rounded-lg">
                      {tasks.map((task) => (
                        <div key={task.id} className="p-4 flex items-start gap-3">
                          <Checkbox 
                            id={task.id} 
                            checked={task.completed}
                            onCheckedChange={() => handleTaskToggle(task.id)}
                          />
                          <div className="flex-1">
                            <Label 
                              htmlFor={task.id} 
                              className={`font-medium ${task.required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}`}
                            >
                              {task.name}
                            </Label>
                            {task.description && (
                              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousStep}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleNextStep}
                      disabled={!visitStarted}
                      className="flex items-center gap-2"
                    >
                      Continue to Medication
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="medication">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Medication Administration</h3>
                    
                    {medications.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border">
                        <Pill className="h-8 w-8 mx-auto text-gray-400" />
                        <p className="mt-2 text-gray-500">No medications scheduled for this visit</p>
                      </div>
                    ) : (
                      <div className="divide-y border rounded-lg">
                        {medications.map((med) => (
                          <div key={med.id} className="p-4">
                            <div className="flex items-start gap-3">
                              <Checkbox 
                                id={med.id} 
                                checked={med.completed}
                                onCheckedChange={() => handleMedicationToggle(med.id)}
                              />
                              <div className="flex-1">
                                <Label htmlFor={med.id} className="font-medium">
                                  {med.name} - {med.dosage}
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm">
                                  <div>
                                    <span className="text-gray-500">Instructions:</span> {med.instructions}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Time:</span> {med.time}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t pt-4 flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousStep}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleNextStep}
                      disabled={!visitStarted}
                      className="flex items-center gap-2"
                    >
                      Continue to NEWS2
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="news2">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">NEWS2 Vital Signs</h3>
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-500">Record vital signs to calculate NEWS2 score</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="respRate">Respiration Rate (breaths/min)</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="respRate" 
                            type="number" 
                            value={respRate} 
                            onChange={(e) => setRespRate(Number(e.target.value))}
                            className={`${getVitalStatusColor(getVitalStatus(respRate, "resp"))}`}
                          />
                          <span className="text-sm">/min</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="spo2">Oxygen Saturation (%)</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="spo2" 
                            type="number" 
                            value={spo2} 
                            onChange={(e) => setSpo2(Number(e.target.value))}
                            className={`${getVitalStatusColor(getVitalStatus(spo2, "spo2"))}`}
                          />
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="systolicBP">Systolic Blood Pressure (mmHg)</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="systolicBP" 
                            type="number" 
                            value={systolicBP} 
                            onChange={(e) => setSystolicBP(Number(e.target.value))}
                            className={`${getVitalStatusColor(getVitalStatus(systolicBP, "bp"))}`}
                          />
                          <span className="text-sm">mmHg</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="pulse">Pulse Rate (beats/min)</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="pulse" 
                            type="number" 
                            value={pulse} 
                            onChange={(e) => setPulse(Number(e.target.value))}
                            className={`${getVitalStatusColor(getVitalStatus(pulse, "pulse"))}`}
                          />
                          <span className="text-sm">bpm</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="consciousness">Consciousness</Label>
                        <Select value={consciousness} onValueChange={setConsciousness}>
                          <SelectTrigger id="consciousness">
                            <SelectValue placeholder="Select level of consciousness" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Alert">Alert</SelectItem>
                            <SelectItem value="New Confusion">New Confusion</SelectItem>
                            <SelectItem value="Voice">Responds to Voice</SelectItem>
                            <SelectItem value="Pain">Responds to Pain</SelectItem>
                            <SelectItem value="Unresponsive">Unresponsive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="temperature">Temperature (°C)</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="temperature" 
                            type="number" 
                            step="0.1" 
                            value={temperature} 
                            onChange={(e) => setTemperature(Number(e.target.value))}
                            className={`${getVitalStatusColor(getVitalStatus(temperature, "temp"))}`}
                          />
                          <span className="text-sm">°C</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center h-10 mt-6">
                          <Checkbox 
                            id="o2Therapy" 
                            checked={o2Therapy}
                            onCheckedChange={(value) => setO2Therapy(value === true)}
                          />
                          <Label htmlFor="o2Therapy" className="ml-2">
                            On Supplemental Oxygen
                          </Label>
                        </div>
                      </div>
                      
                      <div className="flex items-end">
                        <Button 
                          onClick={recordNews2Reading} 
                          disabled={!visitStarted}
                          className="mt-4"
                        >
                          Record Vital Signs
                        </Button>
                      </div>
                    </div>
                    
                    {news2Readings.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3">Recorded Readings</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resp</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SpO2</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BP</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pulse</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consciousness</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temp</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {news2Readings.map((reading) => (
                                <tr key={reading.id}>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm">{reading.dateTime}</td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm">{reading.respRate}/min</td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm">{reading.spo2}%</td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm">{reading.systolicBP} mmHg</td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm">{reading.pulse} bpm</td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm">{reading.consciousness}</td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm">{reading.temperature}°C</td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                                    <span className={`${getScoreColor(reading.score)} text-white px-2 py-1 rounded-full`}>
                                      {reading.score}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t pt-4 flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousStep}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleNextStep}
                      disabled={!visitStarted}
                      className="flex items-center gap-2"
                    >
                      Continue to Events
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="events">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Record Events</h3>
                    <p className="text-sm text-gray-500">Record any incidents, accidents, or other events that occurred during the visit</p>
                    
                    <div className="grid grid-cols-1 gap-4 border rounded-lg p-4">
                      <div>
                        <Label htmlFor="eventTitle">Event Title</Label>
                        <Input 
                          id="eventTitle" 
                          value={eventTitle}
                          onChange={(e) => setEventTitle(e.target.value)}
                          placeholder="Enter event title"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="eventCategory">Event Category</Label>
                        <Select value={eventCategory} onValueChange={setEventCategory}>
                          <SelectTrigger id="eventCategory" className="mt-1">
                            <SelectValue placeholder="Select event category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="accident">Accident</SelectItem>
                            <SelectItem value="incident">Incident</SelectItem>
                            <SelectItem value="near_miss">Near Miss</SelectItem>
                            <SelectItem value="medication_error">Medication Error</SelectItem>
                            <SelectItem value="safeguarding">Safeguarding</SelectItem>
                            <SelectItem value="complaint">Complaint</SelectItem>
                            <SelectItem value="compliment">Compliment</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="eventLocation">Location</Label>
                        <Input 
                          id="eventLocation" 
                          value={eventLocation}
                          onChange={(e) => setEventLocation(e.target.value)}
                          placeholder={appointment?.address}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="eventDetails">Details</Label>
                        <Textarea 
                          id="eventDetails" 
                          value={eventDetails}
                          onChange={(e) => setEventDetails(e.target.value)}
                          placeholder="Describe what happened..."
                          className="h-24 mt-1"
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleAddEvent}
                          disabled={!visitStarted}
                          className="flex items-center gap-2"
                        >
                          Record Event
                          <PanelLeftClose className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {events.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3">Recorded Events</h4>
                        <div className="divide-y border rounded-lg">
                          {events.map((event) => (
                            <div key={event.id} className="p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium">{event.title}</h5>
                                  {getCategoryBadge(event.category)}
                                </div>
                                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                  {event.date} {event.time}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm text-gray-600">{event.details}</p>
                              <div className="mt-2 text-xs text-gray-500">Location: {event.location}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t pt-4 flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousStep}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleNextStep}
                      disabled={!visitStarted}
                      className="flex items-center gap-2"
                    >
                      Continue to Notes
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="notes">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Visit Notes</h3>
                    <p className="text-sm text-gray-500">Enter any additional notes or observations about this visit</p>
                    
                    <div className="border rounded-lg p-4">
                      <Textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Enter visit notes here..."
                        className="h-36 mt-1"
                      />
                      
                      <div className="mt-4 flex items-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCapturePhoto}
                          disabled={photoAdded || !visitStarted}
                          className="flex items-center gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          <span>{photoAdded ? "Photo Added" : "Add Photo"}</span>
                        </Button>
                        
                        {photoAdded && (
                          <div className="ml-3 text-sm text-green-600 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Photo attached
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousStep}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleNextStep}
                      disabled={!visitStarted}
                      className="flex items-center gap-2"
                    >
                      Continue to Sign-off
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="sign-off">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Sign-off</h3>
                    <p className="text-sm text-gray-500">Please obtain signatures to confirm the visit</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="space-y-3">
                        <h4 className="font-medium">Client Signature</h4>
                        <div className="border rounded-lg p-4">
                          <SignatureCanvas 
                            onSave={setClientSignature}
                            height={150}
                            initialSignature={clientSignature || undefined}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium">Carer Signature</h4>
                        <div className="border rounded-lg p-4">
                          <SignatureCanvas 
                            onSave={setCarerSignature}
                            height={150}
                            initialSignature={carerSignature || undefined}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="my-6">
                      <div className="flex items-center h-5">
                        <Checkbox id="confirmVisit" />
                        <Label htmlFor="confirmVisit" className="ml-2 text-sm">
                          I confirm all information provided is accurate and all required tasks have been completed
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousStep}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleNextStep}
                      disabled={!visitStarted || !clientSignature}
                      className="flex items-center gap-2"
                    >
                      Review and Complete
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="complete">
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold">Visit Complete</h3>
                    <p className="text-gray-500 max-w-md mt-2">
                      You have completed all steps for this visit. Please review all information before finalizing.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700">Visit Summary</h4>
                        <ul className="mt-2 space-y-1 text-sm">
                          <li><span className="text-gray-500">Client:</span> {appointment?.clientName}</li>
                          <li><span className="text-gray-500">Address:</span> {appointment?.address}</li>
                          <li><span className="text-gray-500">Date:</span> {format(appointment?.date, "EEEE, MMMM d, yyyy")}</li>
                          <li><span className="text-gray-500">Visit Duration:</span> {formatTime(visitTimer)}</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700">Tasks Summary</h4>
                        <div className="mt-2 text-sm">
                          <p><span className="text-gray-500">Completed Tasks:</span> {tasks.filter(t => t.completed).length} of {tasks.length}</p>
                          <p><span className="text-gray-500">Medications Administered:</span> {medications.filter(m => m.completed).length} of {medications.length}</p>
                          <p><span className="text-gray-500">NEWS2 Readings:</span> {news2Readings.length}</p>
                          <p><span className="text-gray-500">Events Recorded:</span> {events.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousStep}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleCompleteVisit}
                      disabled={!visitStarted}
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Finalize Visit
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarerVisitWorkflow;
