
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

const CarerVisitWorkflow = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
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
    
    if (currentStep === 5 && !clientSignature) {
      toast.error("Client signature is required");
      return;
    }
    
    setCurrentStep(prev => prev + 1);
  };
  
  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
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
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading visit details...</span>
      </div>
    );
  }
  
  // Calculate step progress
  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
        <div>
          <h1 className="text-2xl font-bold">Visit Workflow</h1>
          <p className="text-gray-500">Client: {appointment?.clientName}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
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
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Visit Progress</CardTitle>
            <div className="text-sm font-medium">Step {currentStep} of {totalSteps}</div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent>
          <Tabs value={`step-${currentStep}`} className="w-full">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2">
              <TabsTrigger 
                value="step-1"
                disabled={currentStep !== 1}
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                Check In
              </TabsTrigger>
              <TabsTrigger 
                value="step-2"
                disabled={currentStep !== 2}
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                Tasks
              </TabsTrigger>
              <TabsTrigger 
                value="step-3"
                disabled={currentStep !== 3}
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                Medication
              </TabsTrigger>
              <TabsTrigger 
                value="step-4"
                disabled={currentStep !== 4}
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                Notes
              </TabsTrigger>
              <TabsTrigger 
                value="step-5"
                disabled={currentStep !== 5}
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                Sign-off
              </TabsTrigger>
              <TabsTrigger 
                value="step-6"
                disabled={currentStep !== 6}
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                Complete
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="step-1">
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
              
              <TabsContent value="step-2">
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
              
              <TabsContent value="step-3">
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
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
                      Continue to Notes
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="step-4">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Visit Notes</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="visitNotes">Record detailed notes about the visit</Label>
                        <Textarea 
                          id="visitNotes" 
                          placeholder="Enter detailed notes about care provided, observations, and any concerns..."
                          className="h-32"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                      
                      <div className="border-t pt-4">
                        <Label className="mb-2 block">Add Photo Evidence (Optional)</Label>
                        <div className="flex items-center gap-3">
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="flex items-center gap-2"
                            onClick={handleCapturePhoto}
                          >
                            <Camera className="h-4 w-4" />
                            <span>Capture Photo</span>
                          </Button>
                          {photoAdded && (
                            <span className="text-sm text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Photo added
                            </span>
                          )}
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
              
              <TabsContent value="step-5">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Client Sign-off</h3>
                    <p className="text-sm text-gray-500">Please ask the client to sign below to confirm the visit was completed satisfactorily.</p>
                    
                    <div className="space-y-2">
                      <Label>Client Signature</Label>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <SignatureCanvas
                          onSave={(signature) => setClientSignature(signature)}
                          width={500}
                          height={200}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setClientSignature(null)}
                          className="text-sm"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-4 border-t">
                      <Label>Carer Signature</Label>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <SignatureCanvas
                          onSave={(signature) => setCarerSignature(signature)}
                          width={500}
                          height={200}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setCarerSignature(null)}
                          className="text-sm"
                        >
                          Clear
                        </Button>
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
                      Continue to Complete
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="step-6">
                <div className="space-y-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-800">Visit Ready to Complete</h3>
                      <p className="text-sm text-green-600">All required information has been collected</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Visit Summary</h3>
                    
                    <div className="divide-y border rounded-lg">
                      <div className="p-3 bg-gray-50">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-sm text-gray-500">Client:</span>
                            <div className="font-medium">{appointment?.clientName}</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Date:</span>
                            <div className="font-medium">{format(appointment?.date, "dd/MM/yyyy")}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <span className="text-sm text-gray-500">Duration:</span>
                        <div className="font-medium">{formatTime(visitTimer)}</div>
                      </div>
                      
                      <div className="p-3">
                        <span className="text-sm text-gray-500">Tasks Completed:</span>
                        <div className="mt-1 space-y-1">
                          {tasks.filter(t => t.completed).map(task => (
                            <div key={task.id} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>{task.name}</span>
                            </div>
                          ))}
                          {tasks.filter(t => t.completed).length === 0 && (
                            <div className="text-sm italic text-gray-500">No tasks completed</div>
                          )}
                        </div>
                      </div>
                      
                      {medications.length > 0 && (
                        <div className="p-3">
                          <span className="text-sm text-gray-500">Medications Administered:</span>
                          <div className="mt-1 space-y-1">
                            {medications.filter(m => m.completed).map(med => (
                              <div key={med.id} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>{med.name} ({med.dosage})</span>
                              </div>
                            ))}
                            {medications.filter(m => m.completed).length === 0 && (
                              <div className="text-sm italic text-gray-500">No medications administered</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {notes && (
                        <div className="p-3">
                          <span className="text-sm text-gray-500">Notes:</span>
                          <div className="mt-1 text-sm whitespace-pre-wrap">{notes}</div>
                        </div>
                      )}
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
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      Complete Visit
                      <CheckCircle2 className="h-4 w-4" />
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
