import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBookingAttendance, BookingAttendanceData } from "@/hooks/useBookingAttendance";
import { useCarerAuth } from "@/hooks/useCarerAuth";
import { useVisitRecord } from "@/hooks/useVisitRecord";
import { useVisitTasks } from "@/hooks/useVisitTasks";
import { useVisitMedications } from "@/hooks/useVisitMedications";
import { useVisitEvents } from "@/hooks/useVisitEvents";
import { useVisitVitals } from "@/hooks/useVisitVitals";
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
import VisitCarePlanUpdate from "@/components/carer/VisitCarePlanUpdate";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";

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
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useCarerAuth();
  const bookingAttendance = useBookingAttendance();
  
  // Get appointment data from location state or fetch from API
  const appointment = location.state?.appointment;
  
  // Visit management hooks
  const { visitRecord, isLoading: visitLoading, updateVisitRecord, completeVisit, autoCreateVisitRecord } = useVisitRecord(appointmentId);
  const { tasks, addTask, updateTask, addCommonTasks, isLoading: tasksLoading } = useVisitTasks(visitRecord?.id);
  const { medications, administerMedication, addCommonMedications, isLoading: medicationsLoading } = useVisitMedications(visitRecord?.id);
  const { events, recordIncident, recordAccident, recordObservation, isLoading: eventsLoading } = useVisitEvents(visitRecord?.id);

  // Fetch real appointment data from database
  const { data: appointmentData, isLoading: appointmentLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          clients(first_name, last_name, phone, address, branch_id),
          services(title, description),
          branches(name)
        `)
        .eq('id', appointmentId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!appointmentId,
  });

  const { vitals: news2Readings, recordNEWS2, calculateNEWS2Score, isLoading: vitalsLoading } = useVisitVitals(visitRecord?.id, (appointment || appointmentData)?.client_id);
  
  const [activeTab, setActiveTab] = useState("check-in");
  const [currentStep, setCurrentStep] = useState(1);
  const [completedTabs, setCompletedTabs] = useState<string[]>([]);
  const [visitStarted, setVisitStarted] = useState(false);
  const [visitTimer, setVisitTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [clientSignature, setClientSignature] = useState<string | null>(null);
  const [carerSignature, setCarerSignature] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [photoAdded, setPhotoAdded] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  
  const { uploadPhoto, deletePhoto, uploading } = usePhotoUpload();
  const [eventCategory, setEventCategory] = useState("incident");
  const [eventDetails, setEventDetails] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  
  // NEWS2 state
  const [respRate, setRespRate] = useState(16);
  const [spo2, setSpo2] = useState(96);
  const [systolicBP, setSystolicBP] = useState(120);
  const [diastolicBP, setDiastolicBP] = useState(80);
  const [pulse, setPulse] = useState(80);
  const [consciousness, setConsciousness] = useState("A");
  const [temperature, setTemperature] = useState(37.0);
  const [o2Therapy, setO2Therapy] = useState(false);
  
  // Use appointmentData if available, otherwise fall back to location state
  const currentAppointment = appointmentData || appointment;

  // Auto-create visit record for in-progress appointments without visit records
  const [autoCreateAttempted, setAutoCreateAttempted] = useState(false);
  
  useEffect(() => {
    if (currentAppointment?.status === 'in_progress' && !visitRecord && !visitLoading && user && !autoCreateAttempted) {
      console.log('Auto-creating visit record for in-progress appointment');
      setAutoCreateAttempted(true);
      autoCreateVisitRecord.mutate({
        id: currentAppointment.id,
        client_id: currentAppointment.client_id,
        staff_id: user.id,
        branch_id: currentAppointment.clients?.branch_id || currentAppointment.branch_id,
      });
    }
  }, [currentAppointment, visitRecord, visitLoading, user, autoCreateVisitRecord, autoCreateAttempted]);

  // Check if visit has been started and initialize data
  useEffect(() => {
    if (currentAppointment?.status === 'in_progress') {
      setVisitStarted(true);
    }
  }, [currentAppointment]);

  // Initialize tasks and medications when visit record is created
  const [tasksInitialized, setTasksInitialized] = useState(false);
  const [medicationsInitialized, setMedicationsInitialized] = useState(false);

  useEffect(() => {
    if (visitRecord && !tasksInitialized && (tasks?.length === 0 || tasks === undefined)) {
      console.log('Initializing common tasks for visit record:', visitRecord.id);
      setTasksInitialized(true);
      addCommonTasks.mutate(visitRecord.id);
    }
  }, [visitRecord, tasks, addCommonTasks, tasksInitialized]);

  useEffect(() => {
    if (visitRecord && !medicationsInitialized && (medications?.length === 0 || medications === undefined) && currentAppointment?.client_id) {
      console.log('Initializing common medications for visit record:', visitRecord.id);
      setMedicationsInitialized(true);
      addCommonMedications.mutate({ 
        visitRecordId: visitRecord.id, 
        clientId: currentAppointment.client_id 
      });
    }
  }, [visitRecord, medications, addCommonMedications, currentAppointment?.client_id, medicationsInitialized]);

  // Load existing visit data
  useEffect(() => {
    if (visitRecord) {
      setNotes(visitRecord.visit_notes || "");
      setClientSignature(visitRecord.client_signature_data || null);
      setCarerSignature(visitRecord.staff_signature_data || null);
      
      // Calculate visit timer from start time
      if (visitRecord.visit_start_time) {
        const startTime = new Date(visitRecord.visit_start_time);
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setVisitTimer(elapsedSeconds);
      }
    }
  }, [visitRecord]);
  
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
  
  const handleStartVisit = async () => {
    if (!currentAppointment || !user?.id) return;
    
    try {
      const attendanceData: BookingAttendanceData = {
        bookingId: currentAppointment.id,
        staffId: user.id,
        branchId: currentAppointment.clients?.branch_id || '',
        action: 'start_visit',
        location: undefined // Could get geolocation here if needed
      };

      await bookingAttendance.mutateAsync(attendanceData);
      setVisitStarted(true);
    } catch (error) {
      console.error('Error starting visit:', error);
      // Error already handled in the hook
    }
  };
  
  const handlePauseVisit = () => {
    setVisitStarted(!visitStarted);
    toast.info(visitStarted ? "Visit paused" : "Visit resumed");
  };
  
  const handleTaskToggle = (taskId: string) => {
    const task = tasks?.find(t => t.id === taskId);
    if (task) {
      updateTask.mutate({
        taskId,
        isCompleted: !task.is_completed,
        notes: `Task ${task.is_completed ? 'unchecked' : 'completed'} at ${format(new Date(), 'HH:mm')}`,
        completionTimeMinutes: task.is_completed ? undefined : 15, // Estimated time
      });
    }
  };
  
  const handleMedicationToggle = (medId: string) => {
    const medication = medications?.find(m => m.id === medId);
    if (medication) {
      administerMedication.mutate({
        medicationId: medId,
        isAdministered: !medication.is_administered,
        notes: `Medication ${medication.is_administered ? 'not administered' : 'administered'} at ${format(new Date(), 'HH:mm')}`,
        administeredBy: user?.id,
      });
    }
  };
  
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !currentAppointment?.client_id) return;

    for (const file of Array.from(files)) {
      try {
        const photoUrl = await uploadPhoto(file, currentAppointment.client_id);
        if (photoUrl) {
          setUploadedPhotos(prev => [...prev, photoUrl]);
          toast.success("Photo uploaded successfully!");
        }
      } catch (error) {
        console.error("Photo upload error:", error);
        toast.error("Failed to upload photo");
      }
    }
    // Clear the input
    event.target.value = '';
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    try {
      const success = await deletePhoto(photoUrl);
      if (success) {
        setUploadedPhotos(prev => prev.filter(url => url !== photoUrl));
        toast.success("Photo deleted successfully!");
      } else {
        toast.error("Failed to delete photo");
      }
    } catch (error) {
      toast.error("Failed to delete photo");
    }
  };
  
  const recordNews2Reading = () => {
    if (!visitRecord || !currentAppointment?.client_id) {
      toast.error("Visit record not found");
      return;
    }

    recordNEWS2.mutate({
      respiratory_rate: respRate,
      oxygen_saturation: spo2,
      supplemental_oxygen: o2Therapy,
      systolic_bp: systolicBP,
      diastolic_bp: diastolicBP,
      pulse_rate: pulse,
      consciousness_level: consciousness as 'A' | 'V' | 'P' | 'U',
      temperature: temperature,
      notes: `NEWS2 reading recorded during visit`,
      taken_by: user?.id,
    });
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

    if (!visitRecord) {
      toast.error("Visit record not found");
      return;
    }

    // Determine severity based on category
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (eventCategory === 'accident' || eventCategory === 'medication_error') {
      severity = 'high';
    } else if (eventCategory === 'near_miss' || eventCategory === 'compliment') {
      severity = 'low';
    }

    // Record the appropriate event type
    if (eventCategory === 'accident') {
      recordAccident({
        title: eventTitle,
        description: eventDetails,
        location: eventLocation || currentAppointment?.clients?.address || "",
        immediateAction: "Assessed and documented",
      });
    } else if (eventCategory === 'incident') {
      recordIncident({
        title: eventTitle,
        description: eventDetails,
        severity: severity,
        location: eventLocation || currentAppointment?.clients?.address || "",
        immediateAction: "Documented and assessed",
      });
    } else {
      recordObservation({
        title: eventTitle,
        description: eventDetails,
        category: eventCategory,
      });
    }
    
    setEventTitle("");
    setEventDetails("");
    setEventLocation("");
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
        setActiveTab("care-plan");
        break;
      case 7:
        setActiveTab("notes");
        break;
      case 8:
        setActiveTab("sign-off");
        break;
      case 9:
        setActiveTab("complete");
        break;
      default:
        break;
    }
  };
  
  // Define tab order and completion requirements
  const tabOrder = ["check-in", "tasks", "medication", "news2", "events", "care-plan", "notes", "sign-off", "complete"];
  
  // Check if a tab is completed
  const isTabCompleted = (tabName: string): boolean => {
    switch (tabName) {
      case "check-in":
        return visitStarted;
      case "tasks":
        return tasks ? 
          tasks.filter(task => task.priority === 'high' || task.priority === 'urgent')
            .every(task => task.is_completed) : false;
      case "medication":
        return medications ? 
          medications.length === 0 || medications.every(med => med.is_administered || med.missed_reason) : true;
      case "news2":
        return news2Readings ? news2Readings.length > 0 : false; // Optional but good to have
      case "events":
        return true; // Events are optional
      case "care-plan":
        return true; // Care plan updates are optional
      case "notes":
        return notes.trim().length >= 10; // Minimum note length
      case "sign-off":
        return !!clientSignature;
      case "complete":
        return tabOrder.slice(0, -1).every(tab => isTabCompleted(tab));
      default:
        return false;
    }
  };
  
  // Check if a tab can be accessed
  const canAccessTab = (tabName: string): boolean => {
    const tabIndex = tabOrder.indexOf(tabName);
    if (tabIndex === 0) return true; // Check-in is always accessible
    
    // Can access if it's the current active tab
    if (tabName === activeTab) return true;
    
    // Can access any previously completed tab
    if (completedTabs.includes(tabName)) return true;
    
    // Can access next tab if current tab is completed
    const currentTabIndex = tabOrder.indexOf(activeTab);
    const isCurrentCompleted = isTabCompleted(activeTab);
    
    return tabIndex <= currentTabIndex + (isCurrentCompleted ? 1 : 0);
  };

  const handleTabChange = (tabValue: string) => {
    if (!canAccessTab(tabValue)) {
      const currentTabIndex = tabOrder.indexOf(activeTab);
      const targetTabIndex = tabOrder.indexOf(tabValue);
      
      if (targetTabIndex > currentTabIndex) {
        toast.error(`Please complete the current tab before proceeding to ${tabValue}`);
      }
      return;
    }
    
    // Mark previous tab as completed if it meets requirements
    if (isTabCompleted(activeTab) && !completedTabs.includes(activeTab)) {
      setCompletedTabs(prev => [...prev, activeTab]);
    }
    
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
      case "care-plan":
        setCurrentStep(6);
        break;
      case "notes":
        setCurrentStep(7);
        break;
      case "sign-off":
        setCurrentStep(8);
        break;
      case "complete":
        setCurrentStep(9);
        break;
      default:
        break;
    }
  };
  
  const handleNextStep = () => {
    // Auto-save visit progress
    if (visitRecord) {
        updateVisitRecord.mutate({
          id: visitRecord.id,
          updates: {
            completion_percentage: Math.round((currentStep / 9) * 100),
            visit_notes: notes,
            visit_photos: uploadedPhotos,
          }
        });
    }

    // Check if current tab is completed
    if (!isTabCompleted(activeTab)) {
      let errorMessage = "";
      switch (activeTab) {
        case "check-in":
          errorMessage = "Please start the visit first";
          break;
        case "tasks":
          errorMessage = "Please complete all high priority tasks";
          break;
        case "medication":
          errorMessage = "Please complete all medication tasks or mark as not administered";
          break;
        case "news2":
          errorMessage = "Please record at least one NEWS2 reading";
          break;
        case "notes":
          errorMessage = "Please enter visit notes (minimum 10 characters)";
          break;
        case "sign-off":
          errorMessage = "Client signature is required";
          break;
        default:
          errorMessage = "Please complete this section before proceeding";
      }
      toast.error(errorMessage);
      return;
    }
    
    // Mark current tab as completed
    if (!completedTabs.includes(activeTab)) {
      setCompletedTabs(prev => [...prev, activeTab]);
    }
    
    // Move to next tab
    const currentTabIndex = tabOrder.indexOf(activeTab);
    if (currentTabIndex < tabOrder.length - 1) {
      const nextTab = tabOrder[currentTabIndex + 1];
      handleTabChange(nextTab);
    }
  };
  
  const handlePreviousStep = () => {
    const currentTabIndex = tabOrder.indexOf(activeTab);
    if (currentTabIndex > 0) {
      const previousTab = tabOrder[currentTabIndex - 1];
      handleTabChange(previousTab);
    }
  };
  
  const handleCompleteVisit = async () => {
    if (!currentAppointment || !user?.id || !visitRecord) return;
    
    try {
      // Complete the visit record with all final data
      await completeVisit.mutateAsync({
        visitRecordId: visitRecord.id,
        visitNotes: notes,
        clientSignature: clientSignature || undefined,
        staffSignature: carerSignature || undefined,
        visitSummary: `Visit completed with ${tasks?.filter(t => t.is_completed).length} tasks completed, ${medications?.filter(m => m.is_administered).length} medications administered, and ${events?.length} events recorded.`,
        visitPhotos: uploadedPhotos,
      });

      // Mark booking as completed
      const attendanceData: BookingAttendanceData = {
        bookingId: currentAppointment.id,
        staffId: user.id,
        branchId: currentAppointment.clients?.branch_id || '',
        action: 'end_visit',
        location: undefined
      };

      await bookingAttendance.mutateAsync(attendanceData);
      
      // Success message already handled in the hook
      navigate("/carer-dashboard");
    } catch (error) {
      console.error('Error completing visit:', error);
      toast.error('Failed to complete visit');
    }
  };

  // Show loading state
  if (appointmentLoading || !currentAppointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading visit details...</p>
        </div>
      </div>
    );
  }

  // Helper functions for styling
  const getScoreColor = (score: number) => {
    if (score >= 7) return "bg-red-500";
    if (score >= 5) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Low</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "accident":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Accident</Badge>;
      case "incident":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Incident</Badge>;
      case "near_miss":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Near Miss</Badge>;
      case "medication_error":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Medication Error</Badge>;
      case "compliment":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Compliment</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Other</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Visit with {currentAppointment.clients?.first_name} {currentAppointment.clients?.last_name}
              </h1>
              <p className="text-sm text-gray-500">
                {format(new Date(currentAppointment.start_time), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{formatTime(visitTimer)}</div>
              <div className="text-xs text-gray-500">Visit Duration</div>
            </div>
            <Button
              onClick={handlePauseVisit}
              variant={visitStarted ? "destructive" : "default"}
              size="sm"
              className="flex items-center gap-2"
            >
              <PauseCircle className="w-4 h-4" />
              {visitStarted ? "Pause" : "Resume"}
            </Button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 8) * 100)}% complete</span>
          </div>
          <Progress value={(currentStep / 8) * 100} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger 
              value="check-in" 
              disabled={!canAccessTab("check-in")}
              className={`${isTabCompleted("check-in") ? "bg-green-50 border-green-200" : ""}`}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <UserCheck className="w-4 h-4" />
                  {isTabCompleted("check-in") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                </div>
                <span className="text-xs">Check-in</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              disabled={!canAccessTab("tasks")}
              className={`${isTabCompleted("tasks") ? "bg-green-50 border-green-200" : ""}`}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <Clipboard className="w-4 h-4" />
                  {isTabCompleted("tasks") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                </div>
                <span className="text-xs">Tasks</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="medication" 
              disabled={!canAccessTab("medication")}
              className={`${isTabCompleted("medication") ? "bg-green-50 border-green-200" : ""}`}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <Pill className="w-4 h-4" />
                  {isTabCompleted("medication") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                </div>
                <span className="text-xs">Medication</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="news2" 
              disabled={!canAccessTab("news2")}
              className={`${isTabCompleted("news2") ? "bg-green-50 border-green-200" : ""}`}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  {isTabCompleted("news2") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                </div>
                <span className="text-xs">NEWS2</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              disabled={!canAccessTab("events")}
              className={`${isTabCompleted("events") ? "bg-green-50 border-green-200" : ""}`}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {isTabCompleted("events") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                </div>
                <span className="text-xs">Events</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="care-plan" 
              disabled={!canAccessTab("care-plan")}
              className={`${isTabCompleted("care-plan") ? "bg-green-50 border-green-200" : ""}`}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <FileBarChart2 className="w-4 h-4" />
                  {isTabCompleted("care-plan") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                </div>
                <span className="text-xs">Care Plan</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              disabled={!canAccessTab("notes")}
              className={`${isTabCompleted("notes") ? "bg-green-50 border-green-200" : ""}`}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {isTabCompleted("notes") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                </div>
                <span className="text-xs">Notes</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="sign-off" 
              disabled={!canAccessTab("sign-off")}
              className={`${isTabCompleted("sign-off") ? "bg-green-50 border-green-200" : ""}`}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <Edit className="w-4 h-4" />
                  {isTabCompleted("sign-off") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                </div>
                <span className="text-xs">Sign-off</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="complete" 
              disabled={!canAccessTab("complete")}
              className={`${isTabCompleted("complete") ? "bg-green-50 border-green-200" : ""}`}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {isTabCompleted("complete") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                </div>
                <span className="text-xs">Complete</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Check-in Tab */}
          <TabsContent value="check-in" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Check-in
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Client Information</Label>
                    <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                      <p className="font-medium">{currentAppointment.clients?.first_name} {currentAppointment.clients?.last_name}</p>
                      <p className="text-sm text-gray-600">{currentAppointment.clients?.phone}</p>
                      <p className="text-sm text-gray-600">{currentAppointment.clients?.address}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Service Details</Label>
                    <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                      <p className="font-medium">{currentAppointment.services?.title}</p>
                      <p className="text-sm text-gray-600">{currentAppointment.services?.description}</p>
                    </div>
                  </div>
                </div>

                {!visitStarted ? (
                  <div className="text-center py-8">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Clock className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Ready to start your visit?</h3>
                        <p className="text-gray-600 mt-1">Click the button below to begin the visit timer and workflow.</p>
                      </div>
                      <Button onClick={handleStartVisit} size="lg" className="mt-4">
                        <UserCheck className="w-5 h-5 mr-2" />
                        Start Visit
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Visit in progress</h3>
                        <p className="text-gray-600 mt-1">Visit started at {format(new Date(), "h:mm a")}</p>
                        <p className="text-lg font-mono text-blue-600 mt-2">{formatTime(visitTimer)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              
              {visitStarted && (
                <div className="border-t p-6 flex justify-end">
                  <Button 
                    onClick={handleNextStep}
                    disabled={!isTabCompleted("check-in")}
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clipboard className="w-5 h-5" />
                  Care Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasksLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading tasks...</p>
                    </div>
                  ) : tasks && tasks.length > 0 ? (
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <Checkbox
                            checked={task.is_completed}
                            onCheckedChange={() => handleTaskToggle(task.id)}
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {task.task_name}
                              </p>
                              {task.priority && getPriorityBadge(task.priority)}
                            </div>
                            {task.task_description && (
                              <p className="text-sm text-gray-600 mt-1">{task.task_description}</p>
                            )}
                            {task.completed_at && (
                              <p className="text-xs text-green-600 mt-1">
                                Completed at {format(new Date(task.completed_at), 'h:mm a')}
                              </p>
                            )}
                          </div>
                          {task.is_completed && (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clipboard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No tasks assigned for this visit</p>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <div className="border-t p-6 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handlePreviousStep}
                  disabled={activeTab === "check-in"}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleNextStep}
                  disabled={!isTabCompleted("tasks")}
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Medication Tab */}
          <TabsContent value="medication" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Medication Administration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medicationsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading medications...</p>
                    </div>
                  ) : medications && medications.length > 0 ? (
                    <div className="space-y-3">
                      {medications.map((med) => (
                        <div key={med.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                          <Checkbox
                            checked={med.is_administered}
                            onCheckedChange={() => handleMedicationToggle(med.id)}
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${med.is_administered ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {med.medication_name}
                              </p>
                              <Badge variant="outline">{med.dosage}</Badge>
                            </div>
                            {med.prescribed_time && (
                              <p className="text-sm text-gray-600 mt-1">
                                Prescribed time: {format(new Date(`1970-01-01T${med.prescribed_time}`), 'h:mm a')}
                              </p>
                            )}
                            {med.administration_time && (
                              <p className="text-xs text-green-600 mt-1">
                                Administered at {format(new Date(med.administration_time), 'h:mm a')}
                              </p>
                            )}
                            {med.missed_reason && (
                              <p className="text-xs text-orange-600 mt-1">
                                Not administered: {med.missed_reason}
                              </p>
                            )}
                          </div>
                          {med.is_administered && (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No medications scheduled for this visit</p>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <div className="border-t p-6 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handlePreviousStep}
                  disabled={activeTab === "check-in"}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleNextStep}
                  disabled={!isTabCompleted("medication")}
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* NEWS2 Tab */}
          <TabsContent value="news2" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  NEWS2 Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Input form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="respRate">Respiratory Rate (breaths/min)</Label>
                      <Input
                        id="respRate"
                        type="number"
                        value={respRate}
                        onChange={(e) => setRespRate(Number(e.target.value))}
                        min="0"
                        max="50"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="spo2">SpO2 (%)</Label>
                      <Input
                        id="spo2"
                        type="number"
                        value={spo2}
                        onChange={(e) => setSpo2(Number(e.target.value))}
                        min="70"
                        max="100"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="systolicBP">Systolic BP (mmHg)</Label>
                      <Input
                        id="systolicBP"
                        type="number"
                        value={systolicBP}
                        onChange={(e) => setSystolicBP(Number(e.target.value))}
                        min="60"
                        max="250"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="diastolicBP">Diastolic BP (mmHg)</Label>
                      <Input
                        id="diastolicBP"
                        type="number"
                        value={diastolicBP}
                        onChange={(e) => setDiastolicBP(Number(e.target.value))}
                        min="30"
                        max="150"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pulse">Pulse (bpm)</Label>
                      <Input
                        id="pulse"
                        type="number"
                        value={pulse}
                        onChange={(e) => setPulse(Number(e.target.value))}
                        min="30"
                        max="200"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="consciousness">Consciousness</Label>
                      <Select value={consciousness} onValueChange={setConsciousness}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Alert</SelectItem>
                          <SelectItem value="V">Voice</SelectItem>
                          <SelectItem value="P">Pain</SelectItem>
                          <SelectItem value="U">Unresponsive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature (°C)</Label>
                      <Input
                        id="temperature"
                        type="number"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(Number(e.target.value))}
                        min="30"
                        max="45"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Checkbox
                          checked={o2Therapy}
                          onCheckedChange={(checked) => setO2Therapy(checked === true)}
                        />
                        Supplemental Oxygen
                      </Label>
                    </div>
                  </div>
                  
                  {/* Current score */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Current NEWS2 Score</h4>
                        <p className="text-sm text-gray-600">Based on current readings</p>
                      </div>
                      <div className={`text-2xl font-bold px-4 py-2 rounded-full text-white ${getScoreColor(calculateNews2Score())}`}>
                        {calculateNews2Score()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button onClick={recordNews2Reading}>
                      <Activity className="w-4 h-4 mr-2" />
                      Record Reading
                    </Button>
                  </div>
                  
                  {/* Previous readings */}
                  {news2Readings && news2Readings.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Previous Readings</h4>
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
                                <td className="px-3 py-4 whitespace-nowrap text-sm">{format(new Date(reading.created_at), 'HH:mm')}</td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm">{reading.respiratory_rate}/min</td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm">{reading.oxygen_saturation}%</td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm">{reading.systolic_bp} mmHg</td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm">{reading.pulse_rate} bpm</td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm">{reading.consciousness_level}</td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm">{reading.temperature}°C</td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm">
                                  <span className={`${getScoreColor(reading.news2_total_score || 0)} text-white px-2 py-1 rounded-full`}>
                                    {reading.news2_total_score || 0}
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
              </CardContent>
              
              <div className="border-t p-6 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handlePreviousStep}
                  disabled={activeTab === "check-in"}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleNextStep}
                  disabled={!isTabCompleted("news2")}
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Events & Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Add new event form */}
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-4">Record New Event</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="eventTitle">Event Title</Label>
                          <Input
                            id="eventTitle"
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                            placeholder="Brief description of the event"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="eventCategory">Category</Label>
                          <Select value={eventCategory} onValueChange={setEventCategory}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="incident">Incident</SelectItem>
                              <SelectItem value="accident">Accident</SelectItem>
                              <SelectItem value="near_miss">Near Miss</SelectItem>
                              <SelectItem value="medication_error">Medication Error</SelectItem>
                              <SelectItem value="compliment">Compliment</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="eventLocation">Location (optional)</Label>
                        <Input
                          id="eventLocation"
                          value={eventLocation}
                          onChange={(e) => setEventLocation(e.target.value)}
                          placeholder="Where did this occur?"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="eventDetails">Details</Label>
                        <Textarea
                          id="eventDetails"
                          value={eventDetails}
                          onChange={(e) => setEventDetails(e.target.value)}
                          placeholder="Provide detailed information about what happened..."
                          rows={3}
                        />
                      </div>
                      
                      <Button onClick={handleAddEvent} className="w-full md:w-auto">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Record Event
                      </Button>
                    </div>
                  </div>
                  
                  {/* Recorded events */}
                  <div>
                    <h4 className="font-medium mb-3">Recorded Events</h4>
                    {eventsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-500">Loading events...</p>
                      </div>
                    ) : events && events.length > 0 ? (
                      <div className="space-y-3">
                        {events.map((event) => (
                          <div key={event.id} className="border rounded-lg divide-y">
                            <div className="p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium">{event.event_title}</h5>
                                  {getCategoryBadge(event.event_category || 'other')}
                                </div>
                                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                  {format(new Date(event.event_time), 'MMM d, HH:mm')}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm text-gray-600">{event.event_description}</p>
                              <div className="mt-2 text-xs text-gray-500">Location: {event.location_in_home || 'Not specified'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No events recorded for this visit</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              
              <div className="border-t p-6 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handlePreviousStep}
                  disabled={activeTab === "check-in"}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleNextStep}
                  disabled={!isTabCompleted("events")}
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Care Plan Tab */}
          <TabsContent value="care-plan" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileBarChart2 className="w-5 h-5" />
                  Care Plan Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VisitCarePlanUpdate 
                  clientId={currentAppointment.client_id}
                  visitRecordId={visitRecord?.id}
                />
              </CardContent>
              
              <div className="border-t p-6 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handlePreviousStep}
                  disabled={activeTab === "check-in"}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleNextStep}
                  disabled={!isTabCompleted("care-plan")}
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Visit Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="visitNotes">Additional Notes</Label>
                    <Textarea
                      id="visitNotes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Record any additional observations, concerns, or notes about the visit..."
                      rows={8}
                      className="min-h-[200px]"
                    />
                    <p className="text-sm text-gray-500">
                      Use this space to document any observations, client feedback, or important information for the next visit.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          disabled={uploading}
                        >
                          <Camera className="w-4 h-4" />
                          {uploading ? "Uploading..." : "Add Photos"}
                        </Button>
                      </label>
                      
                      {uploadedPhotos.length > 0 && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">{uploadedPhotos.length} photo(s) added</span>
                        </div>
                      )}
                    </div>

                    {/* Photo Gallery */}
                    {uploadedPhotos.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Visit Photos</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {uploadedPhotos.map((photoUrl, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={photoUrl}
                                alt={`Visit photo ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                              <Button
                                size="sm"
                                variant="destructive"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                onClick={() => handleDeletePhoto(photoUrl)}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              
              <div className="border-t p-6 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handlePreviousStep}
                  disabled={activeTab === "check-in"}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleNextStep}
                  disabled={!isTabCompleted("notes")}
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Sign-off Tab */}
          <TabsContent value="sign-off" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Sign-off
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Client Signature</Label>
                        <p className="text-sm text-gray-500 mb-3">
                          Please ask the client to sign below to confirm the visit
                        </p>
                        <div className="border rounded-lg p-2">
                          <SignatureCanvas
                            width={300}
                            height={150}
                            onSave={setClientSignature}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Carer Signature</Label>
                        <p className="text-sm text-gray-500 mb-3">
                          Sign below to confirm the completion of the visit
                        </p>
                        <div className="border rounded-lg p-2">
                          <SignatureCanvas
                            width={300}
                            height={150}
                            onSave={setCarerSignature}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {clientSignature && carerSignature && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-green-800 font-medium">Signatures collected</p>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        Both client and carer signatures have been captured successfully.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <div className="border-t p-6 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handlePreviousStep}
                  disabled={activeTab === "check-in"}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleNextStep}
                  disabled={!isTabCompleted("sign-off")}
                >
                  Complete Visit
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Complete Tab */}
          <TabsContent value="complete" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Visit Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Visit Ready for Completion</h3>
                    <p className="text-gray-600 mt-1">Review the summary below and click Complete Visit to finish.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700">Visit Details</h4>
                      <ul className="mt-2 text-sm space-y-1">
                        <li><span className="text-gray-500">Client:</span> {currentAppointment?.clients?.first_name} {currentAppointment?.clients?.last_name}</li>
                        <li><span className="text-gray-500">Address:</span> {currentAppointment?.clients?.address}</li>
                        <li><span className="text-gray-500">Date:</span> {format(new Date(currentAppointment?.start_time), "EEEE, MMMM d, yyyy")}</li>
                        <li><span className="text-gray-500">Visit Duration:</span> {formatTime(visitTimer)}</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700">Tasks Summary</h4>
                      <div className="mt-2 text-sm">
                        <p><span className="text-gray-500">Completed Tasks:</span> {tasks?.filter(t => t.is_completed).length || 0} of {tasks?.length || 0}</p>
                        <p><span className="text-gray-500">Medications Administered:</span> {medications?.filter(m => m.is_administered).length || 0} of {medications?.length || 0}</p>
                        <p><span className="text-gray-500">NEWS2 Readings:</span> {news2Readings?.length || 0}</p>
                        <p><span className="text-gray-500">Events Recorded:</span> {events?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <div className="border-t p-6 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handlePreviousStep}
                  disabled={activeTab === "check-in"}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleCompleteVisit} 
                  size="lg"
                  disabled={!isTabCompleted("complete")}
                >
                  <Send className="w-5 h-5 mr-2" />
                  Complete Visit
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CarerVisitWorkflow;