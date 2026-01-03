import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBookingAttendance, BookingAttendanceData } from "@/hooks/useBookingAttendance";
import { useCarerAuth } from "@/hooks/useCarerAuth";
import { useCarerContext } from "@/hooks/useCarerContext";
import { useVisitRecord } from "@/hooks/useVisitRecord";
import { useVisitTasks } from "@/hooks/useVisitTasks";
import { useVisitMedications } from "@/hooks/useVisitMedications";
import { useVisitEvents } from "@/hooks/useVisitEvents";
import { useVisitVitals } from "@/hooks/useVisitVitals";
import { useCarerTasks } from "@/hooks/useCarerTasks";
import { useCreateServiceReport } from "@/hooks/useServiceReports";
import { generateServiceReportFromVisit } from "@/utils/generateServiceReport";
import { withTimeout } from "@/utils/promiseTimeout";
import { VisitCompletionModal } from "@/components/carer/VisitCompletionModal";
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
  Target,
  Calendar,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";
import { useCarePlanGoals } from "@/hooks/useCarePlanGoals";
import { useCreateGoal, useUpdateGoal } from "@/hooks/useCarePlanGoalsMutations";
import { useClientActivities, useCreateClientActivity, useUpdateClientActivity } from "@/hooks/useClientActivities";
import { useCarePlanJsonData } from "@/hooks/useCarePlanJsonData";
import { GoalStatusButton } from "@/components/care/GoalStatusButton";
import { ActivityStatusButton } from "@/components/care/ActivityStatusButton";
import { InlineNotesEditor } from "@/components/care/InlineNotesEditor";
import { MedicationDetailsDialog } from "@/components/care/medication/MedicationDetailsDialog";
import { Eye } from "lucide-react";

interface NextBookingInfo {
  id: string;
  start_time: string;
  clients?: {
    first_name?: string;
    last_name?: string;
  };
}

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

// Mood and engagement options for Complete tab
const MOOD_OPTIONS = [
  { value: 'happy', label: 'Happy' },
  { value: 'content', label: 'Content' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'sad', label: 'Sad' },
  { value: 'confused', label: 'Confused' },
  { value: 'agitated', label: 'Agitated' },
];

const ENGAGEMENT_OPTIONS = [
  { value: 'highly_engaged', label: 'Highly Engaged' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'somewhat_engaged', label: 'Somewhat Engaged' },
  { value: 'passive', label: 'Passive' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'unresponsive', label: 'Unresponsive' },
];

// Helper function to determine shift from booking start time - defined at top level to avoid TDZ
const getShiftFromTime = (startTime: string | Date): string[] => {
  const hour = new Date(startTime).getHours();
  
  // Morning: 6 AM - 12 PM (6-11)
  if (hour >= 6 && hour < 12) return ['morning', 'any_time'];
  
  // Afternoon: 12 PM - 5 PM (12-16)
  if (hour >= 12 && hour < 17) return ['afternoon', 'any_time'];
  
  // Evening: 5 PM - 9 PM (17-20)
  if (hour >= 17 && hour < 21) return ['evening', 'any_time'];
  
  // Night: 9 PM - 6 AM (21-5)
  return ['night', 'any_time'];
};

const CarerVisitWorkflow = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, loading: authLoading } = useCarerAuth();
  const { data: carerContext, isLoading: carerContextLoading } = useCarerContext();
  const { navigateToCarerPage } = useCarerNavigation();
  const bookingAttendance = useBookingAttendance();
  const createServiceReport = useCreateServiceReport();
  const queryClient = useQueryClient();
  
  // Early validation - if no appointmentId, show error
  if (!appointmentId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Invalid Visit</h2>
          <p className="text-muted-foreground">No appointment ID provided.</p>
          <Button onClick={() => navigateToCarerPage('/appointments')}>
            Return to Appointments
          </Button>
        </div>
      </div>
    );
  }
  
  // Get appointment data from location state or fetch from API
  const appointment = location.state?.appointment;
  
  // Determine if we're in view-only mode - check multiple sources
  const searchParams = new URLSearchParams(location.search);
  const urlViewMode = searchParams.get('mode') === 'view';
  const stateViewOnly = location.state?.viewOnly;
  
  // Visit management hooks
  const { visitRecord, isLoading: visitLoading, updateVisitRecord, completeVisit, autoCreateVisitRecord } = useVisitRecord(appointmentId);
  const { tasks, addTask, updateTask, addCommonTasks, isLoading: tasksLoading } = useVisitTasks(visitRecord?.id);
  const { medications, administerMedication, addCommonMedications, isLoading: medicationsLoading } = useVisitMedications(visitRecord?.id);
  const { events, recordIncident, recordAccident, recordObservation, isLoading: eventsLoading } = useVisitEvents(visitRecord?.id);
  
  // Fetch real appointment data from database - session-stable for long visits
  const { data: appointmentData, isLoading: appointmentLoading, error: appointmentError } = useQuery({
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
        .maybeSingle();

      if (error) {
        console.error('[CarerVisitWorkflow] Error fetching appointment:', error);
        return null;
      }
      return data;
    },
    enabled: !!appointmentId,
    retry: 1,
    // Session-stable: prevent unnecessary refetches during long visits
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Use appointmentData if available, otherwise fall back to location state
  const currentAppointment = appointmentData || appointment;

  // Get assigned tasks from staff/admin for this client
  const { tasks: carerTasks, completeTask, isLoading: carerTasksLoading } = useCarerTasks();
  const assignedTasks = useMemo(() => {
    if (!carerTasks || !currentAppointment?.client_id) return [];
    return carerTasks.filter(task => task.client_id === currentAppointment.client_id);
  }, [carerTasks, currentAppointment?.client_id]);

  const { vitals: news2Readings, recordNEWS2, calculateNEWS2Score, isLoading: vitalsLoading } = useVisitVitals(visitRecord?.id, currentAppointment?.client_id);
  
  // Fetch care plan for goals and activities - prioritize active, fallback to other statuses
  const { data: activeCareplan, isLoading: carePlanLoading } = useQuery({
    queryKey: ['client-active-care-plan', currentAppointment?.client_id],
    queryFn: async () => {
      if (!currentAppointment?.client_id) return null;
      
      // First try to get an active care plan
      const { data: activeData, error: activeError } = await supabase
        .from('client_care_plans')
        .select('*')
        .eq('client_id', currentAppointment.client_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeData) {
        console.log('[CarerVisitWorkflow] Found active care plan:', activeData.id);
        return activeData;
      }

      // Fallback: get the most recent care plan with usable statuses
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('client_care_plans')
        .select('*')
        .eq('client_id', currentAppointment.client_id)
        .in('status', ['approved', 'pending_approval', 'pending_client_approval', 'draft'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackError) {
        console.error('Error fetching care plan:', fallbackError);
        return null;
      }
      
      if (fallbackData) {
        console.log('[CarerVisitWorkflow] Using fallback care plan with status:', fallbackData.status);
      }
      
      return fallbackData;
    },
    enabled: !!currentAppointment?.client_id,
    // Session-stable: prevent unnecessary refetches during long visits
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Fetch goals and activities from both normalized tables and JSON
  const { data: normalizedGoals, isLoading: goalsLoading } = useCarePlanGoals(activeCareplan?.id || '');
  const { data: normalizedActivities, isLoading: activitiesLoading } = useClientActivities(activeCareplan?.id || '');
  const { data: jsonData, isLoading: jsonLoading } = useCarePlanJsonData(activeCareplan?.id || '');
  
  // Fetch database medications for merging with JSON - session-stable
  const { data: dbMedications, isLoading: dbMedicationsLoading } = useQuery({
    queryKey: ['care-plan-db-medications', activeCareplan?.id],
    queryFn: async () => {
      if (!activeCareplan?.id) return [];
      const { data, error } = await supabase
        .from('client_medications')
        .select('*')
        .eq('care_plan_id', activeCareplan.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[CarerVisitWorkflow] Error fetching medications:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!activeCareplan?.id,
    // Session-stable: prevent unnecessary refetches during long visits
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  
  // Mutations for goals and activities
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const createActivityMutation = useCreateClientActivity();
  const updateActivityMutation = useUpdateClientActivity();
  
  // Loading states to prevent duplicate clicks
  const [isUpdatingGoal, setIsUpdatingGoal] = useState<string | null>(null);
  const [isUpdatingActivity, setIsUpdatingActivity] = useState<string | null>(null);
  
  // Merge data: COMBINE normalized tables AND JSON data, then filter by time
  const carePlanGoals = useMemo((): any[] => {
    // Get the current booking's shift
    const currentShifts = currentAppointment?.start_time 
      ? getShiftFromTime(currentAppointment.start_time) 
      : [];
    
    // MERGE both sources instead of OR - prevents goals from disappearing
    let rawGoals: any[] = [];
    
    // Add all normalized (database) goals first
    if (normalizedGoals && normalizedGoals.length > 0) {
      rawGoals = [...normalizedGoals];
    }
    
    // Add JSON goals that don't exist in database (by description match)
    const dbGoalDescriptions = new Set(rawGoals.map((g: any) => (g.description || '').toLowerCase().trim()));
    (jsonData?.goals || []).forEach((jsonGoal: any) => {
      const goalDesc = (jsonGoal.description || '').toLowerCase().trim();
      if (!dbGoalDescriptions.has(goalDesc)) {
        rawGoals.push(jsonGoal);
      }
    });
    
    // If we have a booking time, filter goals by time_of_day
    if (currentShifts.length > 0 && rawGoals.length > 0) {
      rawGoals = rawGoals.filter((goal: any) => {
        const goalTimes = goal.time_of_day;
        
        // If no time_of_day specified, show the goal (backwards compatibility)
        if (!goalTimes || goalTimes.length === 0) return true;
        
        // Check if goal's time_of_day includes the current shift
        const timesArray = Array.isArray(goalTimes) ? goalTimes : [goalTimes];
        return timesArray.some((time: string) => currentShifts.includes(time));
      });
    }
    
    return rawGoals;
  }, [normalizedGoals, jsonData?.goals, currentAppointment?.start_time]);
  
  // Note: getShiftFromTime is now defined above the component to avoid TDZ issues

  const carePlanActivities = useMemo((): any[] => {
    // Get the current booking's shift
    const currentShifts = currentAppointment?.start_time 
      ? getShiftFromTime(currentAppointment.start_time) 
      : [];
    
    // MERGE both sources instead of OR - prevents activities from disappearing when one is started
    let rawActivities: any[] = [];
    
    // Add all normalized (database) activities first
    if (normalizedActivities && normalizedActivities.length > 0) {
      rawActivities = [...normalizedActivities];
    }
    
    // Add JSON activities that don't exist in database (by name match)
    const dbActivityNames = new Set(rawActivities.map((a: any) => (a.name || '').toLowerCase().trim()));
    (jsonData?.activities || []).forEach((jsonActivity: any) => {
      const activityName = (jsonActivity.name || '').toLowerCase().trim();
      if (!dbActivityNames.has(activityName)) {
        rawActivities.push(jsonActivity);
      }
    });
    
    // If we have a booking time, filter activities by time_of_day
    if (currentShifts.length > 0 && rawActivities.length > 0) {
      rawActivities = rawActivities.filter((activity: any) => {
        const activityTimes = activity.time_of_day;
        
        // If no time_of_day specified, show the activity (backwards compatibility)
        if (!activityTimes || activityTimes.length === 0) return true;
        
        // Check if activity's time_of_day includes the current shift or 'any_time'
        const timesArray = Array.isArray(activityTimes) ? activityTimes : [activityTimes];
        return timesArray.some((time: string) => currentShifts.includes(time));
      });
    }
    
    return rawActivities;
  }, [normalizedActivities, jsonData?.activities, currentAppointment?.start_time]);

  // Care plan medications: Merge database and JSON, then filter by time slot
  const carePlanMedications = useMemo((): any[] => {
    // Get the current booking's shift
    const currentShifts = currentAppointment?.start_time 
      ? getShiftFromTime(currentAppointment.start_time) 
      : [];
    
    // Merge database medications with JSON medications
    let allMedications: any[] = [];
    
    // Add database medications first (normalized format)
    if (dbMedications && dbMedications.length > 0) {
      allMedications = dbMedications.map((m: any) => ({
        id: m.id,
        name: m.name || '',
        dosage: m.dosage || '',
        frequency: m.frequency || '',
        instructions: m.instruction || m.notes || '',
        status: m.status || 'active',
        time_of_day: m.time_of_day || [],
        route: m.route || '',
        shape: m.shape || '',
        who_administers: m.who_administers || '',
        level: m.level || '',
        warning: m.warning || '',
        side_effect: m.side_effect || '',
        start_date: m.start_date || '',
        end_date: m.end_date || '',
        prescriber: m.prescriber || '',
        source: 'database',
      }));
    }
    
    // Add JSON medications that aren't already in database
    const jsonMedications = jsonData?.medications || [];
    if (jsonMedications.length > 0) {
      const dbMedNames = new Set(allMedications.map(m => m.name.toLowerCase().trim()));
      
      jsonMedications.forEach((med: any) => {
        const medName = (med.name || '').toLowerCase().trim();
        if (medName && !dbMedNames.has(medName)) {
          allMedications.push({
            id: med.id || `json-med-${Date.now()}-${Math.random()}`,
            name: med.name || '',
            dosage: med.dosage || '',
            frequency: med.frequency || '',
            instructions: med.instructions || med.instruction || '',
            status: med.status || 'active',
            time_of_day: med.time_of_day || [],
            route: med.route || '',
            shape: med.shape || '',
            who_administers: med.who_administers || '',
            level: med.level || '',
            warning: med.warning || '',
            side_effect: med.side_effect || '',
            start_date: med.start_date || '',
            end_date: med.end_date || '',
            prescriber: med.prescriber || '',
            source: 'json',
          });
        }
      });
    }
    
    // If we have a booking time, filter medications by time_of_day
    if (currentShifts.length > 0 && allMedications.length > 0) {
      allMedications = allMedications.filter((medication: any) => {
        const medTimes = medication.time_of_day;
        
        // If no time_of_day specified, show the medication (backwards compatibility)
        if (!medTimes || medTimes.length === 0) return true;
        
        // Check if medication's time_of_day includes the current shift
        const timesArray = Array.isArray(medTimes) ? medTimes : [medTimes];
        return timesArray.some((time: string) => currentShifts.includes(time));
      });
    }
    
    return allMedications;
  }, [dbMedications, jsonData?.medications, currentAppointment?.start_time]);

  // Helper to get current shift label for display
  const getCurrentShiftLabel = () => {
    if (!currentAppointment?.start_time) return null;
    const shifts = getShiftFromTime(currentAppointment.start_time);
    const shift = shifts[0];
    if (!shift || shift === 'any_time') return null;
    return shift.charAt(0).toUpperCase() + shift.slice(1);
  };
  
  // Handler for goal status/progress updates
  const handleGoalUpdate = async (goal: any, newStatus: string, newProgress?: number) => {
    if (isUpdatingGoal === goal.id) return; // Prevent duplicate calls
    
    // Validate care plan exists before proceeding
    if (!activeCareplan?.id) {
      toast.error("No active care plan found for this client");
      return;
    }
    
    setIsUpdatingGoal(goal.id);
    try {
      if (goal.id.startsWith('json-')) {
        // First time: Create with all updates
        console.log('[handleGoalUpdate] Creating new goal from JSON:', goal.id);
        await createGoalMutation.mutateAsync({
          care_plan_id: activeCareplan.id,
          description: goal.description,
          status: newStatus,
          progress: newProgress ?? (newStatus === 'completed' ? 100 : newStatus === 'in-progress' ? 25 : 0),
          notes: goal.notes || null,
        });
        // Invalidate queries to refresh data from database
        queryClient.invalidateQueries({ queryKey: ['care-plan-goals', activeCareplan?.id] });
        queryClient.invalidateQueries({ queryKey: ['care-plan-json-data', activeCareplan?.id] });
      } else {
        // Existing goal: Just update
        console.log('[handleGoalUpdate] Updating existing goal:', goal.id);
        await updateGoalMutation.mutateAsync({
          goalId: goal.id,
          updates: { 
            status: newStatus, 
            progress: newProgress ?? (newStatus === 'completed' ? 100 : newStatus === 'in-progress' ? 25 : 0)
          }
        });
      }

      toast.success("Goal status has been updated successfully");
    } catch (error) {
      console.error('[handleGoalUpdate] Error:', error);
      toast.error("Failed to update goal status");
    } finally {
      setIsUpdatingGoal(null);
    }
  };

  // Handler for goal notes updates
  const handleGoalNotesUpdate = async (goal: any, notes: string) => {
    if (isUpdatingGoal === goal.id) return; // Prevent duplicate calls
    
    // Validate care plan exists before proceeding
    if (!activeCareplan?.id) {
      toast.error("No active care plan found for this client");
      return;
    }
    
    setIsUpdatingGoal(goal.id);
    try {
      if (goal.id.startsWith('json-')) {
        // First time: Create with notes
        console.log('[handleGoalNotesUpdate] Creating new goal from JSON:', goal.id);
        await createGoalMutation.mutateAsync({
          care_plan_id: activeCareplan.id,
          description: goal.description,
          status: goal.status || 'not-started',
          progress: goal.progress || 0,
          notes: notes,
        });
      } else {
        // Existing goal: Just update notes
        console.log('[handleGoalNotesUpdate] Updating existing goal notes:', goal.id);
        await updateGoalMutation.mutateAsync({
          goalId: goal.id,
          updates: { notes }
        });
      }

      toast.success("Goal notes have been saved successfully");
    } catch (error) {
      console.error('[handleGoalNotesUpdate] Error:', error);
      toast.error("Failed to save goal notes");
    } finally {
      setIsUpdatingGoal(null);
    }
  };

  // Handler for activity status updates
  const handleActivityUpdate = async (activity: any, newStatus: string) => {
    if (isUpdatingActivity === activity.id) return; // Prevent duplicate calls
    
    // Validate care plan exists before proceeding
    if (!activeCareplan?.id) {
      toast.error("No active care plan found for this client");
      return;
    }
    
    setIsUpdatingActivity(activity.id);
    try {
      if (activity.id.startsWith('json-')) {
        // First time: Create with all updates
        console.log('[handleActivityUpdate] Creating new activity from JSON:', activity.id);
        await createActivityMutation.mutateAsync({
          care_plan_id: activeCareplan.id,
          name: activity.name,
          description: activity.description || null,
          frequency: activity.frequency || 'daily',
          status: newStatus,
        });
        // Invalidate queries to refresh data from database
        queryClient.invalidateQueries({ queryKey: ['client-activities', activeCareplan?.id] });
        queryClient.invalidateQueries({ queryKey: ['care-plan-json-data', activeCareplan?.id] });
      } else {
        // Existing activity: Just update
        console.log('[handleActivityUpdate] Updating existing activity:', activity.id);
        await updateActivityMutation.mutateAsync({
          id: activity.id,
          updates: { status: newStatus }
        });
      }

      toast.success("Activity status has been updated successfully");
    } catch (error) {
      console.error('[handleActivityUpdate] Error:', error);
      toast.error("Failed to update activity status");
    } finally {
      setIsUpdatingActivity(null);
    }
  };
  
  // State for auto-loading care plan items as visit tasks
  const [carePlanTasksLoaded, setCarePlanTasksLoaded] = useState(false);
  
  const [activeTab, setActiveTab] = useState("check-in");
  const [currentStep, setCurrentStep] = useState(1);
  const [completedTabs, setCompletedTabs] = useState<string[]>([]);
  const [visitStarted, setVisitStarted] = useState(false);
  const [visitTimer, setVisitTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [clientSignature, setClientSignature] = useState<string | null>(null);
  const [carerSignature, setCarerSignature] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [notesIsSaving, setNotesIsSaving] = useState(false);
  const [notesLastSaved, setNotesLastSaved] = useState<Date | null>(null);
  const [photoAdded, setPhotoAdded] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  
  // Visit completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<'completing' | 'success' | 'error'>('completing');
  const [completionStep, setCompletionStep] = useState('');
  const [completionProgress, setCompletionProgress] = useState(0);
  const [completionError, setCompletionError] = useState<string | undefined>();
  const [nextBooking, setNextBooking] = useState<NextBookingInfo | null>(null);
  
  const { uploadPhoto, deletePhoto, uploading } = usePhotoUpload();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [eventCategory, setEventCategory] = useState("incident");
  const [eventDetails, setEventDetails] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  
  // Medication notes state
  const [medicationNotes, setMedicationNotes] = useState<Record<string, string>>({});
  const [expandedMedication, setExpandedMedication] = useState<string | null>(null);
  const [viewMedicationDetails, setViewMedicationDetails] = useState<any>(null);
  
  // Track if notes have been initialized from database to prevent overwriting user input
  const [notesInitialized, setNotesInitialized] = useState(false);
  
  // NEWS2 state
  const [respRate, setRespRate] = useState(16);
  const [spo2, setSpo2] = useState(96);
  const [systolicBP, setSystolicBP] = useState(120);
  const [diastolicBP, setDiastolicBP] = useState(80);
  const [pulse, setPulse] = useState(80);
  const [consciousness, setConsciousness] = useState("A");
  const [temperature, setTemperature] = useState(37.0);
  const [o2Therapy, setO2Therapy] = useState(false);
  
  // Client Mood & Engagement state for Complete tab
  const [clientMood, setClientMood] = useState<string>('');
  const [clientEngagement, setClientEngagement] = useState<string>('');
  const [activitiesUndertaken, setActivitiesUndertaken] = useState<string>('');
  
  // Visit Notes state for Complete tab
  const [carerObservations, setCarerObservations] = useState<string>('');
  const [clientFeedback, setClientFeedback] = useState<string>('');
  const [nextVisitPreparations, setNextVisitPreparations] = useState<string>('');
  
  // Track if Complete tab assessment fields have been initialized
  const [assessmentInitialized, setAssessmentInitialized] = useState(false);
  
  // Refs for debounced save timeouts (to flush before completion)
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Enhanced view-only check: URL param, state, completed status, or existing visit record status
  const isViewOnly = urlViewMode || stateViewOnly || 
    currentAppointment?.status === 'completed' || 
    visitRecord?.status === 'completed';

  // Auto-create visit record for in-progress appointments without visit records
  const [autoCreateAttempted, setAutoCreateAttempted] = useState(false);
  
  useEffect(() => {
    // Don't auto-create visit records in view-only mode
    // Wait for carerContext to load to get correct staff_id (not auth user id)
    const staffId = carerContext?.staffId;
    if (!isViewOnly && currentAppointment?.status === 'in_progress' && !visitRecord && !visitLoading && staffId && !autoCreateAttempted) {
      console.log('Auto-creating visit record for in-progress appointment with staff_id:', staffId);
      setAutoCreateAttempted(true);
      autoCreateVisitRecord.mutate({
        id: currentAppointment.id,
        client_id: currentAppointment.client_id,
        staff_id: staffId,
        branch_id: currentAppointment.clients?.branch_id || currentAppointment.branch_id,
      });
    }
  }, [currentAppointment, visitRecord, visitLoading, carerContext?.staffId, autoCreateVisitRecord, autoCreateAttempted, isViewOnly]);

  // NOTE: Goals and Activities are NOT loaded into visit_tasks anymore.
  // They are displayed in their own dedicated tabs (Goals, Activities).
  // Only admin-assigned tasks should appear in the Tasks tab.
  // This effect is removed to prevent data mixing between tabs.

  // Check if visit has been started and initialize data
  useEffect(() => {
    if (currentAppointment?.status === 'in_progress') {
      setVisitStarted(true);
    }
    
    // Set initial tab to "complete" immediately for view-only mode
    if (isViewOnly) {
      console.log('Setting view-only mode to complete tab');
      setActiveTab("complete");
      
      // Set visit timer from actual duration if available
      if (visitRecord?.actual_duration_minutes) {
        setVisitTimer(visitRecord.actual_duration_minutes * 60);
      }
    }
  }, [isViewOnly, currentAppointment, visitRecord]);

  // Initialize tasks and medications when visit record is created
  const [tasksInitialized, setTasksInitialized] = useState(false);
  const medicationsInitializedRef = useRef(false);

  // Reset medications ref when appointment changes
  useEffect(() => {
    medicationsInitializedRef.current = false;
  }, [appointmentId]);

  // Removed auto-generation of common tasks - only show admin-assigned tasks
  // useEffect(() => {
  //   if (!isViewOnly && visitRecord && !tasksInitialized && (tasks?.length === 0 || tasks === undefined)) {
  //     console.log('Initializing common tasks for visit record:', visitRecord.id);
  //     setTasksInitialized(true);
  //     addCommonTasks.mutate(visitRecord.id);
  //   }
  // }, [visitRecord, tasks, addCommonTasks, tasksInitialized, isViewOnly]);

  useEffect(() => {
    // Don't initialize medications in view-only mode
    // Use ref to prevent duplicate calls (synchronous update vs async state)
    if (!isViewOnly && visitRecord && !medicationsInitializedRef.current && currentAppointment?.client_id) {
      console.log('Initializing common medications for visit record:', visitRecord.id);
      medicationsInitializedRef.current = true;
      addCommonMedications.mutate({ 
        visitRecordId: visitRecord.id, 
        clientId: currentAppointment.client_id,
        visitStartTime: currentAppointment.start_time
      });
    }
  }, [visitRecord?.id, currentAppointment?.client_id, isViewOnly]);

  // Load existing visit data (but don't overwrite existing signatures)
  // Initialize medication notes from existing data
  useEffect(() => {
    if (medications && medications.length > 0) {
      const notesMap: Record<string, string> = {};
      medications.forEach(med => {
        if (med.administration_notes) {
          notesMap[med.id] = med.administration_notes;
        }
      });
      setMedicationNotes(notesMap);
    }
  }, [medications]);

  useEffect(() => {
    if (visitRecord) {
      // Only set notes from visitRecord if not already initialized (prevents overwriting user input)
      if (!notesInitialized && visitRecord.visit_notes) {
        setNotes(visitRecord.visit_notes);
        setNotesInitialized(true);
      }
      
      // Only load signatures if they don't already exist locally
      if (!clientSignature) {
        setClientSignature(visitRecord.client_signature_data || null);
      }
      if (!carerSignature) {
        setCarerSignature(visitRecord.staff_signature_data || null);
      }
      
      // Calculate visit timer from start time
      if (visitRecord.visit_start_time) {
        const startTime = new Date(visitRecord.visit_start_time);
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setVisitTimer(elapsedSeconds);
      }
    }
  }, [visitRecord, clientSignature, carerSignature, notesInitialized]);

  // Auto-save visit notes with debouncing
  useEffect(() => {
    // Skip if no visit record or notes haven't changed from loaded value
    if (!visitRecord?.id || notes === (visitRecord.visit_notes || '')) return;
    // Skip in view-only mode
    if (isViewOnly) return;

    const timeoutId = setTimeout(async () => {
      setNotesIsSaving(true);
      try {
        await updateVisitRecord.mutateAsync({
          id: visitRecord.id,
          updates: { visit_notes: notes }
        });
        setNotesLastSaved(new Date());
        console.log('[CarerVisitWorkflow] Auto-saved visit notes');
      } catch (error) {
        console.error('[CarerVisitWorkflow] Error auto-saving notes:', error);
      } finally {
        setNotesIsSaving(false);
      }
    }, 2000); // 2-second debounce

    return () => clearTimeout(timeoutId);
  }, [notes, visitRecord?.id, visitRecord?.visit_notes, isViewOnly]);
  
  // Load draft assessment data from location_data on mount (once)
  useEffect(() => {
    if (visitRecord && !assessmentInitialized && !isViewOnly) {
      const draft = visitRecord.location_data?.draft_assessment;
      if (draft) {
        console.log('[CarerVisitWorkflow] Loading draft assessment from database');
        if (draft.clientMood && !clientMood) setClientMood(draft.clientMood);
        if (draft.clientEngagement && !clientEngagement) setClientEngagement(draft.clientEngagement);
        if (draft.activitiesUndertaken && !activitiesUndertaken) setActivitiesUndertaken(draft.activitiesUndertaken);
        if (draft.carerObservations && !carerObservations) setCarerObservations(draft.carerObservations);
        if (draft.clientFeedback && !clientFeedback) setClientFeedback(draft.clientFeedback);
        if (draft.nextVisitPreparations && !nextVisitPreparations) setNextVisitPreparations(draft.nextVisitPreparations);
      }
      setAssessmentInitialized(true);
    }
  }, [visitRecord, assessmentInitialized, isViewOnly]);
  
  // Auto-save Complete tab assessment fields with debouncing (draft persistence)
  useEffect(() => {
    if (!visitRecord?.id || isViewOnly || !assessmentInitialized) return;
    
    // Clear any existing timeout
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }
    
    draftSaveTimeoutRef.current = setTimeout(async () => {
      const draftAssessment = {
        clientMood,
        clientEngagement,
        activitiesUndertaken,
        carerObservations,
        clientFeedback,
        nextVisitPreparations,
      };
      
      // Only save if there's meaningful data
      const hasData = Object.values(draftAssessment).some(v => v && v.trim().length > 0);
      if (!hasData) return;
      
      try {
        const currentLocationData = visitRecord.location_data || {};
        await updateVisitRecord.mutateAsync({
          id: visitRecord.id,
          updates: {
            location_data: {
              ...currentLocationData,
              draft_assessment: draftAssessment,
            }
          }
        });
        console.log('[CarerVisitWorkflow] Auto-saved assessment draft');
      } catch (error) {
        console.error('[CarerVisitWorkflow] Error auto-saving assessment:', error);
      }
    }, 2000); // 2-second debounce
    
    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, [clientMood, clientEngagement, activitiesUndertaken, carerObservations, clientFeedback, nextVisitPreparations, visitRecord?.id, isViewOnly, assessmentInitialized]);
  
  // Function to flush all pending draft saves before completion
  const flushDraftSaves = useCallback(async () => {
    if (!visitRecord?.id || isViewOnly) return;
    
    // Clear pending timeout
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
      draftSaveTimeoutRef.current = null;
    }
    
    // Save all pending data immediately
    try {
      const currentLocationData = visitRecord.location_data || {};
      await updateVisitRecord.mutateAsync({
        id: visitRecord.id,
        updates: {
          visit_notes: notes,
          location_data: {
            ...currentLocationData,
            draft_assessment: {
              clientMood,
              clientEngagement,
              activitiesUndertaken,
              carerObservations,
              clientFeedback,
              nextVisitPreparations,
            }
          }
        }
      });
      console.log('[CarerVisitWorkflow] Flushed all draft saves');
    } catch (error) {
      console.error('[CarerVisitWorkflow] Error flushing drafts:', error);
    }
  }, [visitRecord, notes, clientMood, clientEngagement, activitiesUndertaken, carerObservations, clientFeedback, nextVisitPreparations, isViewOnly, updateVisitRecord]);
  
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
    console.log('[handleTaskToggle] Called', { taskId, isViewOnly, visitRecordId: visitRecord?.id });
    
    if (isViewOnly) {
      toast.info("Task details are read-only for completed visits");
      return;
    }
    
    const task = tasks?.find(t => t.id === taskId);
    console.log('[handleTaskToggle] Task found:', task);
    
    if (task) {
      console.log('[handleTaskToggle] Calling mutation to toggle task');
      updateTask.mutate({
        taskId,
        isCompleted: !task.is_completed,
        notes: `Task ${task.is_completed ? 'unchecked' : 'completed'} at ${format(new Date(), 'HH:mm')}`,
        completionTimeMinutes: task.is_completed ? undefined : 15,
      });
    } else {
      console.error('[handleTaskToggle] Task not found!', { taskId, tasksCount: tasks?.length });
      toast.error('Task not found. Please refresh the page.');
    }
  };
  
  const handleMedicationToggle = (medId: string, customNotes?: string) => {
    console.log('[handleMedicationToggle] Called', { medId, customNotes, isViewOnly, visitRecordId: visitRecord?.id });
    
    if (isViewOnly) {
      toast.info("Medication records are read-only for completed visits");
      return;
    }
    
    const medication = medications?.find(m => m.id === medId);
    console.log('[handleMedicationToggle] Medication found:', medication);
    
    if (medication) {
      console.log('[handleMedicationToggle] Calling mutation to toggle medication');
      administerMedication.mutate({
        medicationId: medId,
        isAdministered: !medication.is_administered,
        notes: customNotes || `Medication ${medication.is_administered ? 'not administered' : 'administered'} at ${format(new Date(), 'HH:mm')}`,
        administeredBy: user?.id,
      });
    } else {
      console.error('[handleMedicationToggle] Medication not found!', { medId, medicationsCount: medications?.length });
      toast.error('Medication not found. Please refresh the page.');
    }
  };
  
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    console.log("Photo upload started:", { files: files?.length, clientId: currentAppointment?.client_id });
    
    if (!files || files.length === 0) {
      console.log("No files selected");
      toast.error("Please select files to upload");
      return;
    }

    if (!currentAppointment?.client_id) {
      console.error("Missing client ID:", currentAppointment);
      toast.error("Cannot upload photos: Client information not available");
      return;
    }

    console.log("Starting upload for", files.length, "files with client ID:", currentAppointment.client_id);

    for (const file of Array.from(files)) {
      try {
        console.log("Uploading file:", file.name, "size:", file.size);
        const photoUrl = await uploadPhoto(file, currentAppointment.client_id);
        console.log("Upload result:", photoUrl);
        
        if (photoUrl) {
          setUploadedPhotos(prev => [...prev, photoUrl]);
          toast.success(`Photo ${file.name} uploaded successfully!`);
        } else {
          console.error("Upload returned null/undefined");
          toast.error(`Failed to upload ${file.name}: No URL returned`);
        }
      } catch (error) {
        console.error("Photo upload error for", file.name, ":", error);
        toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    console.log('[recordNews2Reading] Called', { 
      visitRecordId: visitRecord?.id, 
      clientId: currentAppointment?.client_id,
      isViewOnly,
      readingData: { respRate, spo2, systolicBP, diastolicBP, pulse, consciousness, temperature, o2Therapy }
    });
    
    if (isViewOnly) {
      toast.info("Cannot record readings for completed visits");
      return;
    }
    
    if (!visitRecord || !currentAppointment?.client_id) {
      console.error('[recordNews2Reading] Missing required data', { 
        visitRecord: visitRecord?.id, 
        appointmentId: currentAppointment?.id,
        clientId: currentAppointment?.client_id 
      });
      toast.error("Visit record not found. Please refresh the page.");
      return;
    }

    console.log('[recordNews2Reading] Calling mutation with data');
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
  const tabOrder = ["check-in", "tasks", "medication", "news2", "events", "goals", "activities", "notes", "care-plan", "sign-off", "complete"];
  
  // Check if a tab is completed
  const isTabCompleted = (tabName: string): boolean => {
    switch (tabName) {
      case "check-in":
        return visitStarted;
      case "tasks":
        return true; // Allow progression regardless of task completion status
      case "medication":
        return true; // Allow progression regardless of medication completion status
      case "news2":
        return news2Readings ? news2Readings.length > 0 : false; // Optional but good to have
      case "events":
        return true; // Events are optional
      case "care-plan":
        return true; // Care plan updates are optional
      case "goals":
        return true; // Goals are optional
      case "activities":
        return true; // Activities are optional
      case "notes":
        return notes.trim().length >= 10; // Minimum note length
      case "sign-off":
        return !!carerSignature; // Client signature is optional
      case "complete":
        // Complete tab requires mood, engagement, observations, and all previous tabs
        return !!clientMood && !!clientEngagement && carerObservations.trim().length >= 10 && 
               tabOrder.slice(0, -1).every(tab => isTabCompleted(tab));
      default:
        return false;
    }
  };
  
  // Tab access restrictions removed - carers can navigate freely between all tabs

  const handleTabChange = (tabValue: string) => {
    // No validation - allow free navigation between tabs
    
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
    // Removed auto-save on tab navigation to reduce database load
    // Data will be saved on Complete Visit action
    
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
  
  const [isCompletingVisit, setIsCompletingVisit] = useState(false);

  // Debug button state - helps identify why button is disabled
  useEffect(() => {
    console.log('[CompleteVisit Button] State Debug:', {
      isCompletingVisit,
      carerSignature: !!carerSignature,
      visitLoading,
      authLoading,
      visitRecord: !!visitRecord,
      visitRecordId: visitRecord?.id,
      userId: !!user?.id,
      userIdValue: user?.id,
      userEmail: user?.email,
      hasUserObject: !!user,
      isDisabled: isCompletingVisit || !carerSignature || visitLoading || authLoading || !visitRecord || !user?.id
    });
  }, [isCompletingVisit, carerSignature, visitLoading, authLoading, visitRecord, user]);

  // Helper function to determine why button is disabled
  const getButtonDisabledReason = () => {
    if (isCompletingVisit) return "Completing visit...";
    if (!carerSignature) return "Carer signature required";
    if (!clientMood) return "Select client mood";
    if (!clientEngagement) return "Select client engagement";
    if (carerObservations.trim().length < 10) return "Add carer observations (min 10 characters)";
    if (visitLoading) return "Loading visit data...";
    if (authLoading) return "Loading user data...";
    if (!visitRecord) return "Visit record not found";
    if (!user?.id) return "User not authenticated";
    return null;
  };

  const handleRefreshData = async () => {
    console.log('[CarerVisitWorkflow] Manually refreshing data...');
    
    // Refresh queries
    queryClient.invalidateQueries({ queryKey: ['visit-record', appointmentId] });
    queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
    
    // If user is missing, try to refresh the session
    if (!user?.id) {
      console.log('[CarerVisitWorkflow] User missing, refreshing auth session...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[CarerVisitWorkflow] Error refreshing session:', error);
          toast.error('Failed to refresh authentication. Please try logging in again.');
        } else if (session?.user) {
          console.log('[CarerVisitWorkflow] Session refreshed successfully:', session.user.id);
          toast.success('Authentication refreshed');
          // Trigger a re-render by reloading
          window.location.reload();
        } else {
          console.warn('[CarerVisitWorkflow] No session available');
          toast.error('No active session. Please log in again.');
          navigate('/carer-login');
        }
      } catch (error) {
        console.error('[CarerVisitWorkflow] Unexpected error refreshing session:', error);
        toast.error('Failed to refresh session');
      }
    } else {
      toast.success('Data refreshed');
    }
  };

  // Navigation callbacks for completion modal
  const handleGoToNextClient = useCallback(() => {
    if (nextBooking) {
      setShowCompletionModal(false);
      navigate(`/carer/visit/${nextBooking.id}`, {
        state: { appointment: nextBooking }
      });
    }
  }, [nextBooking, navigate]);

  const handleGoToDashboard = useCallback(() => {
    setShowCompletionModal(false);
    navigateToCarerPage("");
  }, [navigateToCarerPage]);

  const handleCompleteVisit = async (retryCount = 0) => {
    console.log('Starting visit completion process...');
    
    // Check connectivity before starting
    if (!navigator.onLine) {
      toast.error('No internet connection. Please check your network and try again.');
      return;
    }
    
    // Pre-completion: Flush all pending draft saves
    console.log('[handleCompleteVisit] Flushing pending draft saves...');
    await flushDraftSaves();
    
    // Pre-completion: Refresh auth session to ensure token is fresh for long sessions
    console.log('[handleCompleteVisit] Refreshing auth session...');
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn('[handleCompleteVisit] Session refresh warning:', sessionError);
      } else if (session) {
        // Optionally refresh if token is older than 30 minutes
        const tokenAge = session.expires_at ? (Date.now() / 1000) - (session.expires_at - 3600) : 0;
        if (tokenAge > 1800) { // 30 minutes
          console.log('[handleCompleteVisit] Token is old, refreshing...');
          await supabase.auth.refreshSession();
        }
      }
    } catch (refreshError) {
      console.warn('[handleCompleteVisit] Auth refresh failed, continuing:', refreshError);
    }
    
    if (!currentAppointment || !user?.id || !visitRecord) {
      const missingData = [];
      if (!currentAppointment) missingData.push('appointment');
      if (!user?.id) missingData.push('user ID');
      if (!visitRecord) missingData.push('visit record');
      
      console.error('Missing required data:', {
        missing: missingData,
        currentAppointment: !!currentAppointment,
        userId: !!user?.id,
        visitRecord: !!visitRecord,
        visitRecordId: visitRecord?.id
      });
      
      toast.error(`Missing required data: ${missingData.join(', ')}`);
      return;
    }

    // Validation checks
    if (!carerSignature) {
      toast.error('Carer signature is required to complete the visit');
      setActiveTab("sign-off");
      return;
    }

    // Reset modal state and show it
    setIsCompletingVisit(true);
    setShowCompletionModal(true);
    setCompletionStatus('completing');
    setCompletionStep('Saving visit record...');
    setCompletionProgress(10);
    setCompletionError(undefined);
    setNextBooking(null);
    
    // Global timeout to prevent infinite hangs (2 minutes)
    const globalTimeoutId = setTimeout(() => {
      console.error('Global completion timeout reached after 2 minutes');
      setCompletionError('The visit completion process is taking too long. Please try again or contact support.');
      setCompletionStatus('error');
      setIsCompletingVisit(false);
    }, 120000);

    try {
      // Step 1: Complete visit record - with 60s timeout (increased for long sessions)
      console.log('Step 1: Completing visit record...');
      setCompletionStep('Saving signatures and visit data...');
      setCompletionProgress(20);
      
      const completedVisit = await withTimeout(
        completeVisit.mutateAsync({
          visitRecordId: visitRecord.id,
          visitNotes: notes,
          clientSignature: clientSignature || undefined,
          staffSignature: carerSignature || undefined,
          visitSummary: `Visit completed with ${tasks?.filter(t => t.is_completed).length || 0} tasks completed, ${medications?.filter(m => m.is_administered).length || 0} medications administered, and ${events?.length || 0} events recorded.`,
          visitPhotos: uploadedPhotos,
        }),
        60000, // Increased from 30s to 60s for reliability on slow connections
        'Saving visit data timed out. Please check your connection and try again.'
      );

      // Step 2: Fetch booking details for service report - with 15s timeout
      console.log('Step 2: Fetching organization ID for service report...');
      setCompletionStep('Preparing service report...');
      setCompletionProgress(40);
      
      const bookingResult = await withTimeout(
        Promise.resolve(
          supabase
            .from('bookings')
            .select('branch_id, branches(organization_id)')
            .eq('id', currentAppointment.id)
            .single()
        ),
        15000,
        'Fetching booking details timed out.'
      );
      const bookingData = bookingResult.data;

      // Step 3: Generate and create service report
      console.log('Step 3: Generating service report...');
      setCompletionStep('Generating service report...');
      setCompletionProgress(55);
      
      const serviceReportData = generateServiceReportFromVisit({
        visitRecord: {
          id: completedVisit.id,
          booking_id: completedVisit.booking_id,
          client_id: completedVisit.client_id,
          staff_id: completedVisit.staff_id,
          branch_id: completedVisit.branch_id,
          organization_id: bookingData?.branches?.organization_id,
          visit_start_time: completedVisit.visit_start_time,
          visit_end_time: completedVisit.visit_end_time,
          actual_duration_minutes: completedVisit.actual_duration_minutes,
          visit_notes: completedVisit.visit_notes,
          visit_summary: completedVisit.visit_summary,
          client_signature_data: completedVisit.client_signature_data,
          staff_signature_data: completedVisit.staff_signature_data,
          visit_photos: Array.isArray(completedVisit.visit_photos) ? completedVisit.visit_photos : [],
        },
        tasks: [...(assignedTasks || []), ...(tasks || [])],
        medications: medications || [],
        events: events || [],
        goals: carePlanGoals || [],
        activities: carePlanActivities || [],
        createdBy: user.id,
        assessmentData: {
          clientMood,
          clientEngagement,
          activitiesUndertaken: activitiesUndertaken || undefined,
          carerObservations,
          clientFeedback: clientFeedback || undefined,
          nextVisitPreparations: nextVisitPreparations || undefined,
        },
      });

      // Step 4: Upsert service report (update if exists, create if not) - with 30s timeout
      console.log('Step 4: Upserting service report in database...');
      setCompletionStep('Saving service report...');
      setCompletionProgress(70);
      
      // Check if report already exists for this booking
      const existingReportResult = await withTimeout(
        Promise.resolve(
          supabase
            .from('client_service_reports')
            .select('id')
            .eq('booking_id', currentAppointment.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        ),
        15000,
        'Checking for existing report timed out.'
      );
      const existingReport = existingReportResult.data;
      
      if (existingReport) {
        // Update existing report - with 30s timeout
        console.log('Updating existing service report:', existingReport.id);
        const updateResult = await withTimeout(
          Promise.resolve(
            supabase
              .from('client_service_reports')
              .update({
                ...serviceReportData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingReport.id)
          ),
          30000,
          'Updating service report timed out.'
        );
        
        if (updateResult.error) throw updateResult.error;
      } else {
        // Create new report - with 30s timeout
        await withTimeout(
          createServiceReport.mutateAsync(serviceReportData),
          30000,
          'Creating service report timed out.'
        );
      }

      // Step 5: Update booking status - with 30s timeout
      console.log('Step 5: Updating booking status to completed...');
      setCompletionStep('Marking booking as complete...');
      setCompletionProgress(85);
      
      const attendanceData: BookingAttendanceData = {
        bookingId: currentAppointment.id,
        staffId: user.id,
        branchId: currentAppointment.clients?.branch_id || currentAppointment.branch_id || '',
        action: 'end_visit',
        location: undefined
      };

      // Make attendance processing non-blocking - don't fail completion if this step fails
      try {
        await withTimeout(
          bookingAttendance.mutateAsync(attendanceData),
          30000,
          'Marking booking as complete timed out.'
        );
      } catch (attendanceError) {
        console.warn('Attendance update failed, continuing with completion:', attendanceError);
        // Don't throw - allow visit completion to proceed
      }
      
      // Step 6: Check for next booking - with 10s timeout (non-critical)
      console.log('Step 6: Checking for next scheduled booking...');
      setCompletionStep('Checking for next client...');
      setCompletionProgress(95);
      
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
      
      try {
        const nextBookingsResult = await withTimeout(
          Promise.resolve(
            supabase
              .from('bookings')
              .select(`
                id,
                start_time,
                end_time,
                status,
                clients(first_name, last_name)
              `)
              .eq('staff_id', user.id)
              .gte('start_time', todayStart)
              .lte('start_time', todayEnd)
              .in('status', ['scheduled', 'confirmed'])
              .order('start_time', { ascending: true })
              .limit(1)
          ),
          10000,
          'Next booking check timed out.'
        );
        
        const foundNextBooking = nextBookingsResult.data?.[0] || null;
        setNextBooking(foundNextBooking);
      } catch (nextBookingError) {
        // Don't fail completion if next booking query fails
        console.warn('Failed to fetch next booking, continuing with success:', nextBookingError);
        setNextBooking(null);
      }
      
      // Success! Clear global timeout
      clearTimeout(globalTimeoutId);
      console.log('Visit completion successful!');
      setCompletionProgress(100);
      setCompletionStep('Complete!');
      setCompletionStatus('success');
      
    } catch (error: any) {
      clearTimeout(globalTimeoutId);
      console.error('Error completing visit:', error);
      
      // ALWAYS reset loading state immediately on error
      setIsCompletingVisit(false);
      
      // Retry logic for timeout errors (but not our custom timeout messages)
      const isDbTimeout = (error?.message?.includes('timeout') && !error?.message?.includes('timed out.')) || error?.code === '57014';
      if (isDbTimeout && retryCount < 2) {
        const delayMs = Math.pow(2, retryCount) * 1500;
        setCompletionStep(`Database busy, retrying in ${delayMs / 1000}s...`);
        await new Promise(r => setTimeout(r, delayMs));
        setShowCompletionModal(false);
        return handleCompleteVisit(retryCount + 1);
      }
      
      // Set error state in modal
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof Error || error?.message) {
        const message = error.message || error?.message;
        if (message.includes('timed out')) {
          errorMessage = message; // Use our custom timeout message
        } else if (message.includes('policy') || message.includes('permission') || message.includes('row-level security')) {
          errorMessage = 'Permission denied. Please check your access rights or contact your administrator.';
        } else if (message.includes('network') || message.includes('fetch') || message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (message.includes('timeout')) {
          errorMessage = 'The request timed out. The server may be busy. Please try again.';
        } else {
          errorMessage = message;
        }
      }
      
      setCompletionError(errorMessage);
      setCompletionStatus('error');
      // Ensure modal stays visible with error state
      setShowCompletionModal(true);
    } finally {
      clearTimeout(globalTimeoutId);
      // Loading state already handled in catch block, only clear here for success path
    }
  };

  // Show error state for query errors
  if (appointmentError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Visit</h2>
          <p className="text-muted-foreground mb-6">
            There was a problem loading the visit details. Please try again.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Button onClick={() => navigateToCarerPage("/appointments")}>
              Back to Appointments
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (appointmentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading visit details...</p>
        </div>
      </div>
    );
  }

  // Show visit not found state
  if (!currentAppointment && appointmentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Visit Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The visit you're looking for doesn't exist or you don't have permission to access it.
          </p>
          <Button onClick={() => navigateToCarerPage("/appointments")}>
            Return to Appointments
          </Button>
        </div>
      </div>
    );
  }

  // Fallback if no appointment ID provided
  if (!currentAppointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Visit Selected</h2>
          <p className="text-muted-foreground mb-6">
            Please select a visit from your appointments.
          </p>
          <Button onClick={() => navigateToCarerPage("/appointments")}>
            Go to Appointments
          </Button>
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
        return <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700">Medium</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-border">Low</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "accident":
        return <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700">Accident</Badge>;
      case "incident":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700">Incident</Badge>;
      case "near_miss":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700">Near Miss</Badge>;
      case "medication_error":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700">Medication Error</Badge>;
      case "compliment":
        return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700">Compliment</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-border">Other</Badge>;
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => isViewOnly ? navigateToCarerPage("") : navigate(-1)}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {isViewOnly ? "Visit Summary - " : "Visit with "}{currentAppointment.clients?.first_name} {currentAppointment.clients?.last_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(currentAppointment.start_time), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
          
          {!isViewOnly ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">{formatTime(visitTimer)}</div>
                <div className="text-xs text-muted-foreground">Visit Duration</div>
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
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-green-700 dark:text-green-400">Visit Completed</div>
                <div className="text-xs text-muted-foreground">
                  Duration: {visitRecord?.actual_duration_minutes ? 
                    `${Math.floor(visitRecord.actual_duration_minutes / 60)}h ${visitRecord.actual_duration_minutes % 60}m` : 
                    formatTime(visitTimer)
                  }
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Progress bar - only show for non-view mode */}
        {!isViewOnly && (
          <div className="max-w-4xl mx-auto mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round((currentStep / 11) * 100)}% complete</span>
            </div>
            <Progress value={(currentStep / 11) * 100} className="h-2" />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="w-full max-w-full mx-auto p-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex h-auto w-max min-w-full gap-1 p-1 md:grid md:w-full md:grid-cols-11">
              <TabsTrigger 
                value="check-in"
                className={`flex-shrink-0 min-w-[60px] px-2 py-2 md:min-w-0 md:px-3 ${isTabCompleted("check-in") ? "bg-green-50 border-green-200" : ""}`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <UserCheck className="w-4 h-4" />
                    {isTabCompleted("check-in") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className="text-[10px] md:text-xs whitespace-nowrap">Check-in</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="tasks"
                className={`flex-shrink-0 min-w-[60px] px-2 py-2 md:min-w-0 md:px-3 ${isTabCompleted("tasks") ? "bg-green-50 border-green-200" : ""}`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <Clipboard className="w-4 h-4" />
                    {isTabCompleted("tasks") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className="text-[10px] md:text-xs whitespace-nowrap">Tasks</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="medication"
                className={`flex-shrink-0 min-w-[60px] px-2 py-2 md:min-w-0 md:px-3 ${isTabCompleted("medication") ? "bg-green-50 border-green-200" : ""}`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <Pill className="w-4 h-4" />
                    {isTabCompleted("medication") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className="text-[10px] md:text-xs whitespace-nowrap">Medication</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="news2"
                className={`flex-shrink-0 min-w-[60px] px-2 py-2 md:min-w-0 md:px-3 ${isTabCompleted("news2") ? "bg-green-50 border-green-200" : ""}`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    {isTabCompleted("news2") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className="text-[10px] md:text-xs whitespace-nowrap">NEWS2</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="events"
                className={`flex-shrink-0 min-w-[60px] px-2 py-2 md:min-w-0 md:px-3 ${isTabCompleted("events") ? "bg-green-50 border-green-200" : ""}`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {isTabCompleted("events") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className="text-[10px] md:text-xs whitespace-nowrap">Events</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="goals"
                className={`flex-shrink-0 min-w-[60px] px-2 py-2 md:min-w-0 md:px-3 ${isTabCompleted("goals") ? "bg-green-50 border-green-200" : ""}`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {isTabCompleted("goals") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className="text-[10px] md:text-xs whitespace-nowrap">Goals</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="activities"
                className={`flex-shrink-0 min-w-[60px] px-2 py-2 md:min-w-0 md:px-3 ${isTabCompleted("activities") ? "bg-green-50 border-green-200" : ""}`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {isTabCompleted("activities") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className="text-[10px] md:text-xs whitespace-nowrap">Activities</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="notes"
                className={`flex-shrink-0 min-w-[60px] px-2 py-2 md:min-w-0 md:px-3 ${isTabCompleted("notes") ? "bg-green-50 border-green-200" : ""}`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {isTabCompleted("notes") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className="text-[10px] md:text-xs whitespace-nowrap">Notes</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="care-plan"
                className={`flex-shrink-0 min-w-[60px] px-2 py-2 md:min-w-0 md:px-3 ${isTabCompleted("care-plan") ? "bg-green-50 border-green-200" : ""}`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <FileBarChart2 className="w-4 h-4" />
                    {isTabCompleted("care-plan") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className="text-[10px] md:text-xs whitespace-nowrap">Care Plan</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="sign-off"
                className={`flex-shrink-0 min-w-[60px] px-2 py-2 md:min-w-0 md:px-3 ${isTabCompleted("sign-off") ? "bg-green-50 border-green-200" : ""}`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <Edit className="w-4 h-4" />
                    {isTabCompleted("sign-off") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className="text-[10px] md:text-xs whitespace-nowrap">Sign-off</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="complete"
                className={`flex-shrink-0 min-w-[60px] px-2 py-2 md:min-w-0 md:px-3 ${isTabCompleted("complete") ? "bg-green-50 border-green-200" : ""}`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {isTabCompleted("complete") && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className="text-[10px] md:text-xs whitespace-nowrap">Complete</span>
                </div>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" className="md:hidden" />
          </ScrollArea>

          {/* Check-in Tab */}
          <TabsContent value="check-in" className="w-full mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Check-in
                  </div>
                  {getCurrentShiftLabel() && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                      {getCurrentShiftLabel()} Visit
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Client Information</Label>
                    <div className="p-3 bg-muted rounded-lg space-y-1">
                      <p className="font-medium">{currentAppointment.clients?.first_name} {currentAppointment.clients?.last_name}</p>
                      <p className="text-sm text-muted-foreground">{currentAppointment.clients?.phone}</p>
                      <p className="text-sm text-muted-foreground">{currentAppointment.clients?.address}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Service Details</Label>
                    <div className="p-3 bg-muted rounded-lg space-y-1">
                      <p className="font-medium">{currentAppointment.services?.title}</p>
                      <p className="text-sm text-muted-foreground">{currentAppointment.services?.description}</p>
                    </div>
                  </div>
                </div>

                {!visitStarted && !isViewOnly ? (
                  <div className="text-center py-8">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto">
                        <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-foreground">Ready to start your visit?</h3>
                        <p className="text-muted-foreground mt-1">Click the button below to begin the visit timer and workflow.</p>
                      </div>
                      <Button onClick={handleStartVisit} size="lg" className="mt-4">
                        <UserCheck className="w-5 h-5 mr-2" />
                        Start Visit
                      </Button>
                    </div>
                  </div>
                ) : isViewOnly ? (
                  <div className="text-center py-8">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-foreground">Visit Completed</h3>
                        <p className="text-muted-foreground mt-1">This visit has been completed and archived.</p>
                        {visitRecord?.actual_duration_minutes && (
                          <p className="text-lg font-mono text-blue-600 mt-2">
                            Duration: {Math.floor(visitRecord.actual_duration_minutes / 60)}h {visitRecord.actual_duration_minutes % 60}m
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-foreground">Visit in progress</h3>
                        <p className="text-muted-foreground mt-1">Visit started at {format(new Date(), "h:mm a")}</p>
                        <p className="text-lg font-mono text-blue-600 dark:text-blue-400 mt-2">{formatTime(visitTimer)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              
              {(visitStarted || isViewOnly) && !isViewOnly && (
                <div className="border-t p-6 flex justify-end">
                  <Button 
                    onClick={handleNextStep}
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="w-full mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clipboard className="w-5 h-5" />
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Assigned Tasks from Admin/Staff */}
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">Assigned Tasks (Admin/Staff)</h3>
                    {carerTasksLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-500">Loading assigned tasks...</p>
                      </div>
                    ) : assignedTasks && assignedTasks.length > 0 ? (
                      <div className="space-y-3">
                        {assignedTasks.map((task) => (
                          <div key={task.id} className="flex items-center space-x-3 p-3 border border-blue-200 rounded-lg hover:bg-blue-50">
                            <Checkbox
                              checked={task.status === 'done'}
                              onCheckedChange={() => !isViewOnly && completeTask(task.id)}
                              className="flex-shrink-0"
                              disabled={isViewOnly}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  {task.title}
                                </p>
                                {task.priority && getPriorityBadge(task.priority)}
                                <Badge variant="outline" className="text-xs">
                                  Admin/Staff
                                </Badge>
                              </div>
                              {task.description && (
                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                              )}
                              {task.dueDate && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                            {task.status === 'done' && (
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <p>No tasks assigned by admin/staff for this client</p>
                      </div>
                    )}
                  </div>

                  {/* Visit Tasks Section (from Care Plan Goals & Activities) */}
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-foreground mb-3">Visit Tasks</h3>
                    {tasksLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">Loading visit tasks...</p>
                      </div>
                    ) : !visitRecord && !isViewOnly ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>Start the visit to load tasks from the care plan</p>
                      </div>
                    ) : tasks && tasks.length > 0 ? (
                      <div className="space-y-3">
                        {tasks.map((task) => (
                          <div key={task.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                            <Checkbox
                              checked={task.is_completed}
                              onCheckedChange={() => {
                                if (!isViewOnly) {
                                  updateTask.mutate({
                                    taskId: task.id,
                                    isCompleted: !task.is_completed,
                                  });
                                }
                              }}
                              className="flex-shrink-0"
                              disabled={isViewOnly || updateTask.isPending}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`font-medium ${task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {task.task_name}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {task.task_category}
                                </Badge>
                                {task.priority && task.priority !== 'medium' && getPriorityBadge(task.priority)}
                              </div>
                              {task.task_description && (
                                <p className="text-sm text-muted-foreground mt-1">{task.task_description}</p>
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
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No visit tasks loaded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              
              <div className="border-t p-6 flex justify-between">
                {!isViewOnly && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousStep}
                      disabled={activeTab === "check-in"}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleNextStep}
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Medication Tab */}
          <TabsContent value="medication" className="w-full mt-6">
            <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Pill className="w-5 h-5" />
                   Medication Administration
                   {getCurrentShiftLabel() && (
                     <Badge variant="outline" className="ml-2 capitalize">
                       {getCurrentShiftLabel()} shift
                     </Badge>
                   )}
                 </CardTitle>
               </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {medicationsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading medications...</p>
                    </div>
                  ) : (
                    <>
                      {/* Care Plan Medications Section */}
                      <div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Pill className="h-3 w-3 text-blue-600" />
                            </div>
                            <div className="text-sm text-blue-700">
                              <p className="font-medium">Care Plan Medications</p>
                              <p className="mt-0.5">These medications were added to the client's care plan by staff. Record administrations here to create MAR entries.</p>
                            </div>
                          </div>
                        </div>

                        {medications?.filter(med => med.medication_id).length > 0 ? (
                          <div className="space-y-3">
                            {medications.filter(med => med.medication_id).map((med) => (
                              <div key={med.id} className="border rounded-lg hover:bg-gray-50 transition-all">
                                <div className="flex items-center space-x-3 p-4">
                                  <Checkbox
                                    checked={med.is_administered}
                                    onCheckedChange={() => {
                                      if (!med.is_administered) {
                                        setExpandedMedication(med.id);
                                      }
                                      handleMedicationToggle(med.id, medicationNotes[med.id]);
                                    }}
                                    className="flex-shrink-0"
                                    disabled={isViewOnly || administerMedication.isPending}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <p className={`font-medium ${med.is_administered ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                          {med.medication_name}
                                        </p>
                                        <Badge variant="outline">{med.dosage}</Badge>
                                        <Badge variant="secondary" className="text-xs">Care Plan</Badge>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setExpandedMedication(expandedMedication === med.id ? null : med.id)}
                                        disabled={isViewOnly}
                                      >
                                        {expandedMedication === med.id ? 'Hide Notes' : 'Add Notes'}
                                      </Button>
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
                                  </div>
                                  {med.is_administered && (
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  )}
                                </div>
                                
                                {expandedMedication === med.id && (
                                  <div className="px-4 pb-4 space-y-3 border-t bg-gray-50">
                                    <div className="pt-3">
                                      <Label htmlFor={`med-notes-${med.id}`} className="text-xs text-gray-600 block mb-1">
                                        Notes (e.g., "Client refused", "Taken with food", "No side effects observed")
                                      </Label>
                                      <Textarea
                                        id={`med-notes-${med.id}`}
                                        value={medicationNotes[med.id] || ''}
                                        onChange={(e) => setMedicationNotes({
                                          ...medicationNotes,
                                          [med.id]: e.target.value
                                        })}
                                        placeholder="Enter any relevant notes about medication administration..."
                                        rows={3}
                                        className="resize-none"
                                        disabled={isViewOnly}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setExpandedMedication(null)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          handleMedicationToggle(med.id, medicationNotes[med.id]);
                                          setExpandedMedication(null);
                                        }}
                                      >
                                        Save Notes
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                
                                {med.administration_notes && expandedMedication !== med.id && (
                                  <div className="px-4 pb-3 pt-1 border-t bg-blue-50">
                                    <p className="text-xs text-blue-700 font-medium mb-1">Notes:</p>
                                    <p className="text-sm text-blue-900">{med.administration_notes}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : carePlanMedications.length > 0 ? (
                          <div className="space-y-3">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                <div className="text-sm text-amber-700">
                                  <p className="font-medium">Care Plan Medications (Draft)</p>
                                  <p className="mt-0.5">These medications are from the care plan but not yet synced to the medication tracker.</p>
                                </div>
                              </div>
                            </div>
                            {carePlanMedications.map((med) => (
                              <div key={med.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-all">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{med.name}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      {med.dosage && <Badge variant="outline">{med.dosage}</Badge>}
                                      <Badge variant="secondary">{med.frequency}</Badge>
                                      {med.time_of_day?.length > 0 && (
                                        <Badge variant="outline" className="capitalize">
                                          {med.time_of_day.join(', ')}
                                        </Badge>
                                      )}
                                      {med.route && (
                                        <Badge variant="outline" className="capitalize">
                                          {med.route}
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {/* Instructions */}
                                    {med.instructions && (
                                      <p className="text-sm text-gray-600 mt-2">{med.instructions}</p>
                                    )}
                                    
                                    {/* Additional Details Grid */}
                                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                                      {med.who_administers && (
                                        <div>
                                          <span className="text-muted-foreground">Administered by:</span>
                                          <span className="ml-1 font-medium">{med.who_administers}</span>
                                        </div>
                                      )}
                                      {med.prescriber && (
                                        <div>
                                          <span className="text-muted-foreground">Prescriber:</span>
                                          <span className="ml-1 font-medium">{med.prescriber}</span>
                                        </div>
                                      )}
                                      {med.start_date && (
                                        <div>
                                          <span className="text-muted-foreground">Start:</span>
                                          <span className="ml-1 font-medium">{format(new Date(med.start_date), 'MMM dd, yyyy')}</span>
                                        </div>
                                      )}
                                      {med.end_date && (
                                        <div>
                                          <span className="text-muted-foreground">End:</span>
                                          <span className="ml-1 font-medium">{format(new Date(med.end_date), 'MMM dd, yyyy')}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Warnings */}
                                    {med.warning && (
                                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                                        <span className="text-amber-700 font-medium">⚠️ Warning: </span>
                                        <span className="text-amber-600">{med.warning}</span>
                                      </div>
                                    )}
                                    
                                    {/* Side Effects */}
                                    {med.side_effect && (
                                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                                        <span className="text-blue-700 font-medium">ℹ️ Side Effects: </span>
                                        <span className="text-blue-600">{med.side_effect}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-2 items-end">
                                    <Badge variant="secondary">Care Plan</Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setViewMedicationDetails({
                                        ...med,
                                        instruction: med.instructions,
                                      })}
                                      className="h-8"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      View Details
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <Pill className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p>No care plan medications for this visit</p>
                            {getCurrentShiftLabel() && (
                              <p className="text-xs mt-1">Showing medications for {getCurrentShiftLabel().toLowerCase()} shift</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Admin-Assigned Medications Section */}
                      <div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Pill className="h-3 w-3 text-purple-600" />
                            </div>
                            <div className="text-sm text-purple-700">
                              <p className="font-medium">Admin-Assigned Medications</p>
                              <p className="mt-0.5">Medications added specifically for this visit outside the care plan.</p>
                            </div>
                          </div>
                        </div>

                        {medications?.filter(med => !med.medication_id).length > 0 ? (
                          <div className="space-y-3">
                            {medications.filter(med => !med.medication_id).map((med) => (
                              <div key={med.id} className="border border-purple-200 rounded-lg hover:bg-purple-50 transition-all">
                                <div className="flex items-center space-x-3 p-4">
                                  <Checkbox
                                    checked={med.is_administered}
                                    onCheckedChange={() => {
                                      if (!med.is_administered) {
                                        setExpandedMedication(med.id);
                                      }
                                      handleMedicationToggle(med.id, medicationNotes[med.id]);
                                    }}
                                    className="flex-shrink-0"
                                    disabled={isViewOnly || administerMedication.isPending}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <p className={`font-medium ${med.is_administered ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                          {med.medication_name}
                                        </p>
                                        <Badge variant="outline">{med.dosage}</Badge>
                                        <Badge variant="default" className="text-xs bg-purple-600">Admin</Badge>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setExpandedMedication(expandedMedication === med.id ? null : med.id)}
                                        disabled={isViewOnly}
                                      >
                                        {expandedMedication === med.id ? 'Hide Notes' : 'Add Notes'}
                                      </Button>
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
                                  </div>
                                  {med.is_administered && (
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  )}
                                </div>
                                
                                {expandedMedication === med.id && (
                                  <div className="px-4 pb-4 space-y-3 border-t bg-gray-50">
                                    <div className="pt-3">
                                      <Label htmlFor={`med-notes-${med.id}`} className="text-xs text-gray-600 block mb-1">
                                        Notes (e.g., "Client refused", "Taken with food", "No side effects observed")
                                      </Label>
                                      <Textarea
                                        id={`med-notes-${med.id}`}
                                        value={medicationNotes[med.id] || ''}
                                        onChange={(e) => setMedicationNotes({
                                          ...medicationNotes,
                                          [med.id]: e.target.value
                                        })}
                                        placeholder="Enter any relevant notes about medication administration..."
                                        rows={3}
                                        className="resize-none"
                                        disabled={isViewOnly}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setExpandedMedication(null)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          handleMedicationToggle(med.id, medicationNotes[med.id]);
                                          setExpandedMedication(null);
                                        }}
                                      >
                                        Save Notes
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                
                                {med.administration_notes && expandedMedication !== med.id && (
                                  <div className="px-4 pb-3 pt-1 border-t bg-purple-50">
                                    <p className="text-xs text-purple-700 font-medium mb-1">Notes:</p>
                                    <p className="text-sm text-purple-900">{med.administration_notes}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <Pill className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p>No admin-assigned medications for this visit</p>
                          </div>
                        )}
                      </div>

                      {/* Show empty state only if no medications at all */}
                      {medications?.length === 0 && (
                        <div className="text-center py-8">
                          <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No medications scheduled for this visit</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
              
              <div className="border-t p-6 flex justify-between">
                {!isViewOnly && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousStep}
                      disabled={activeTab === "check-in"}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleNextStep}
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* NEWS2 Tab */}
          <TabsContent value="news2" className="w-full mt-6">
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
                    <Button 
                      onClick={recordNews2Reading}
                      disabled={isViewOnly || recordNEWS2.isPending}
                    >
                      {recordNEWS2.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Recording...
                        </>
                      ) : (
                        <>
                          <Activity className="w-4 h-4 mr-2" />
                          Record Reading
                        </>
                      )}
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
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="w-full mt-6">
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
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Care Plan Tab - forceMount prevents state loss on tab switch */}
          <TabsContent value="care-plan" className="w-full mt-6" forceMount>
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
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="w-full mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Care Plan Goals
                  {getCurrentShiftLabel() && (
                    <Badge variant="outline" className="ml-2 capitalize">
                      {getCurrentShiftLabel()} shift
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(goalsLoading || jsonLoading) ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : !activeCareplan ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No active care plan found for this client.</p>
                  </div>
                ) : !carePlanGoals || carePlanGoals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No goals have been set in the care plan yet.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {carePlanGoals.map((goal) => (
                        <Card key={goal.id} className="border-l-4 border-l-primary">
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              {/* Header with description and status */}
                              <div className="flex items-start justify-between gap-3">
                                <h4 className="font-semibold text-foreground flex-1 text-base">
                                  {goal.description}
                                </h4>
                              </div>

                              {/* Goal Details Grid */}
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                {(goal as any).priority && (
                                  <div>
                                    <span className="text-muted-foreground">Priority:</span>
                                    <Badge 
                                      variant="outline" 
                                      className={`ml-2 ${
                                        (goal as any).priority === 'high' ? 'border-red-500 text-red-500' :
                                        (goal as any).priority === 'medium' ? 'border-amber-500 text-amber-500' :
                                        'border-green-500 text-green-500'
                                      }`}
                                    >
                                      {(goal as any).priority}
                                    </Badge>
                                  </div>
                                )}
                                {(goal as any).target_date && (
                                  <div>
                                    <span className="text-muted-foreground">Target Date:</span>
                                    <span className="ml-2 font-medium">
                                      {format(new Date((goal as any).target_date), 'MMM dd, yyyy')}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Measurable Outcome / Success Criteria */}
                              {(goal as any).measurable_outcome && (
                                <div className="bg-muted/30 rounded-md p-3">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Success Criteria:</p>
                                  <p className="text-sm">{(goal as any).measurable_outcome}</p>
                                </div>
                              )}

                              {/* Status and Progress Section */}
                              <div className="space-y-3 pt-2 border-t">
                                <GoalStatusButton
                                  status={goal.status}
                                  progress={goal.progress}
                                  onStatusChange={(newStatus, newProgress) => 
                                    handleGoalUpdate(goal, newStatus, newProgress)
                                  }
                                  disabled={isUpdatingGoal === goal.id}
                                />

                                {goal.progress !== undefined && goal.progress !== null && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Overall Progress</span>
                                      <span className="font-medium text-foreground">{goal.progress}%</span>
                                    </div>
                                    <Progress value={goal.progress} className="h-2" />
                                  </div>
                                )}
                              </div>

                              {/* Notes Section */}
                              <div className="pt-2 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Carer Notes:</p>
                                <InlineNotesEditor
                                  notes={goal.notes}
                                  onSave={(notes) => handleGoalNotesUpdate(goal, notes)}
                                  placeholder="Add notes about progress, observations, or challenges..."
                                  disabled={isUpdatingGoal === goal.id}
                                />
                              </div>

                              {/* Timestamp */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                <Clock className="w-3 h-3" />
                                <span>Last updated {format(new Date(goal.updated_at), 'MMM dd, yyyy')}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
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
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="w-full mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Daily Activities
                  {getCurrentShiftLabel() && (
                    <Badge variant="outline" className="ml-2 capitalize">
                      {getCurrentShiftLabel()} shift
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(activitiesLoading || jsonLoading) ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : !activeCareplan ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No active care plan found for this client.</p>
                  </div>
                ) : !carePlanActivities || carePlanActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No activities have been scheduled in the care plan yet.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {carePlanActivities.map((activity) => (
                        <Card key={activity.id}>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              {/* Header with name and description */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground text-base mb-1">
                                    {activity.name}
                                  </h4>
                                  {activity.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {activity.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Activity Details Grid */}
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Frequency:</span>
                                  <Badge variant="outline" className="ml-2 capitalize">
                                    {activity.frequency}
                                  </Badge>
                                </div>
                                {(activity as any).duration && (
                                  <div>
                                    <span className="text-muted-foreground">Duration:</span>
                                    <span className="ml-2 font-medium">{(activity as any).duration}</span>
                                  </div>
                                )}
                                {(activity as any).time_of_day && (
                                  <div>
                                    <span className="text-muted-foreground">Time:</span>
                                    <span className="ml-2 font-medium capitalize">
                                      {typeof (activity as any).time_of_day === 'string' 
                                        ? (activity as any).time_of_day.replace(/_/g, ' ')
                                        : Array.isArray((activity as any).time_of_day)
                                          ? (activity as any).time_of_day.map((t: string) => String(t).replace(/_/g, ' ')).join(', ')
                                          : String((activity as any).time_of_day)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Status Section */}
                              <div className="pt-2 border-t">
                                <ActivityStatusButton
                                  status={activity.status}
                                  onStatusChange={(newStatus) => 
                                    handleActivityUpdate(activity, newStatus)
                                  }
                                  disabled={isUpdatingActivity === activity.id}
                                />
                              </div>

                              {/* Timestamp */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                <Clock className="w-3 h-3" />
                                <span>Created {format(new Date(activity.created_at), 'MMM dd, yyyy')}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
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
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Notes Tab - forceMount prevents state loss on tab switch */}
          <TabsContent value="notes" className="w-full mt-6" forceMount>
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="visitNotes">Additional Notes</Label>
                      {notesIsSaving && (
                        <span className="text-sm text-blue-600 flex items-center gap-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                          Saving...
                        </span>
                      )}
                      {notesLastSaved && !notesIsSaving && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Saved at {format(notesLastSaved, 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <Textarea
                      id="visitNotes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Record any additional observations, concerns, or notes about the visit..."
                      rows={8}
                      className="min-h-[200px]"
                    />
                    <p className="text-sm text-muted-foreground">
                      Use this space to document any observations, client feedback, or important information for the next visit.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <input
                        ref={photoInputRef}
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
                        onClick={() => photoInputRef.current?.click()}
                      >
                        <Camera className="w-4 h-4" />
                        {uploading ? "Uploading..." : "Add Photos"}
                      </Button>
                      
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
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Sign-off Tab - forceMount prevents signature loss on tab switch */}
          <TabsContent value="sign-off" className="w-full mt-6" forceMount>
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
                        <Label className="text-sm font-medium text-gray-700">Client Signature (Optional)</Label>
                        <p className="text-sm text-gray-500 mb-3">
                          If available, ask the client to sign below to confirm the visit
                        </p>
                          <div className="border rounded-lg p-2">
                            <SignatureCanvas
                              width={300}
                              height={150}
                              onSave={(signature) => {
                                if (isViewOnly) return;
                                setClientSignature(signature);
                                // Immediately save to database
                                if (visitRecord?.id) {
                                  updateVisitRecord.mutate({
                                    id: visitRecord.id,
                                    updates: { client_signature_data: signature }
                                  });
                                }
                              }}
                              initialSignature={clientSignature || undefined}
                              disabled={isViewOnly}
                            />
                          </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Carer Signature <span className="text-red-500 font-semibold">(Required)</span>
                        </Label>
                        <p className="text-sm text-gray-500 mb-3">
                          Your signature is required to complete the visit
                        </p>
                          <div className="border rounded-lg p-2">
                            <SignatureCanvas
                              width={300}
                              height={150}
                              onSave={(signature) => {
                                if (isViewOnly) return;
                                setCarerSignature(signature);
                                // Immediately save to database
                                if (visitRecord?.id) {
                                  updateVisitRecord.mutate({
                                    id: visitRecord.id,
                                    updates: { staff_signature_data: signature }
                                  });
                                }
                              }}
                              initialSignature={carerSignature || undefined}
                              disabled={isViewOnly}
                            />
                          </div>
                      </div>
                    </div>
                  </div>
                  
                  {carerSignature && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-green-800 font-medium">
                          {clientSignature ? "Both signatures collected" : "Carer signature collected"}
                        </p>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        {clientSignature 
                          ? "Both client and carer signatures have been captured successfully."
                          : "Carer signature captured. Client signature is optional."}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <div className="border-t p-6 flex justify-between">
                {!isViewOnly && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousStep}
                      disabled={activeTab === "check-in"}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleNextStep}
                    >
                      Complete Visit
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Complete Tab - forceMount prevents state loss on tab switch */}
          <TabsContent value="complete" className="w-full mt-6" forceMount>
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
                     {isViewOnly ? (
                       <>
                         <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                           <CheckCircle className="w-8 h-8 text-green-600" />
                         </div>
                         <h3 className="text-lg font-medium text-gray-900">Visit Completed</h3>
                         <p className="text-gray-600 mt-1">This visit has been successfully completed and archived.</p>
                       </>
                     ) : isTabCompleted("complete") ? (
                       <>
                         <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                           <CheckCircle className="w-8 h-8 text-green-600" />
                         </div>
                         <h3 className="text-lg font-medium text-gray-900">Visit Ready for Completion</h3>
                         <p className="text-gray-600 mt-1">Review the summary below and click Complete Visit to finish.</p>
                       </>
                     ) : (
                       <>
                         <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                           <CheckCircle className="w-8 h-8 text-orange-600" />
                         </div>
                         <h3 className="text-lg font-medium text-gray-900">Complete Required Sections</h3>
                         <p className="text-gray-600 mt-1">Please complete all required sections before finishing the visit.</p>
                         
                         {/* Validation checklist */}
                         <div className="mt-4 text-left max-w-md mx-auto">
                           <ul className="space-y-2 text-sm">
                             {!visitStarted && (
                               <li className="flex items-center gap-2 text-red-600">
                                 <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                 Complete check-in process
                               </li>
                             )}
                             {tasks && tasks.filter(task => task.priority === 'high' || task.priority === 'urgent').some(task => !task.is_completed) && (
                               <li className="flex items-center gap-2 text-red-600">
                                 <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                 Complete all high/urgent priority tasks
                               </li>
                             )}
                             {medications && medications.some(med => !med.is_administered && !med.missed_reason) && (
                               <li className="flex items-center gap-2 text-red-600">
                                 <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                 Address all medications (administer or record reason)
                               </li>
                             )}
                             {notes.trim().length < 10 && (
                               <li className="flex items-center gap-2 text-red-600">
                                 <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                 Add visit notes (minimum 10 characters)
                               </li>
                             )}
                              {!carerSignature && (
                                <li className="flex items-center gap-2 text-red-600">
                                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                  Add carer signature
                                </li>
                              )}
                              {!clientMood && (
                                <li className="flex items-center gap-2 text-red-600">
                                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                  Select client mood
                                </li>
                              )}
                              {!clientEngagement && (
                                <li className="flex items-center gap-2 text-red-600">
                                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                  Select client engagement level
                                </li>
                              )}
                              {carerObservations.trim().length < 10 && (
                                <li className="flex items-center gap-2 text-red-600">
                                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                  Add carer observations (minimum 10 characters)
                                </li>
                              )}
                            </ul>
                         </div>
                       </>
                     )}
                   </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700">Visit Details</h4>
                      <ul className="mt-2 text-sm space-y-1">
                        <li><span className="text-gray-500">Client:</span> {currentAppointment?.clients?.first_name} {currentAppointment?.clients?.last_name}</li>
                        <li><span className="text-gray-500">Address:</span> {currentAppointment?.clients?.address}</li>
                        <li><span className="text-gray-500">Date:</span> {format(new Date(currentAppointment?.start_time), "EEEE, MMMM d, yyyy")}</li>
                        <li><span className="text-gray-500">Visit Duration:</span> {isViewOnly && visitRecord?.actual_duration_minutes ? `${Math.floor(visitRecord.actual_duration_minutes / 60)}h ${visitRecord.actual_duration_minutes % 60}m` : formatTime(visitTimer)}</li>
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
                  
                  {/* Client Mood & Engagement Section */}
                  {!isViewOnly && (
                    <Card className="mt-6 bg-blue-50/50 border-blue-100">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Smile className="w-5 h-5 text-blue-600" />
                          Client Mood & Engagement
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="clientMood" className="text-sm font-medium">
                              Client Mood <span className="text-red-500">*</span>
                            </Label>
                            <Select value={clientMood} onValueChange={setClientMood}>
                              <SelectTrigger id="clientMood" className="bg-white">
                                <SelectValue placeholder="Select mood..." />
                              </SelectTrigger>
                              <SelectContent>
                                {MOOD_OPTIONS.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="clientEngagement" className="text-sm font-medium">
                              Client Engagement <span className="text-red-500">*</span>
                            </Label>
                            <Select value={clientEngagement} onValueChange={setClientEngagement}>
                              <SelectTrigger id="clientEngagement" className="bg-white">
                                <SelectValue placeholder="Select engagement level..." />
                              </SelectTrigger>
                              <SelectContent>
                                {ENGAGEMENT_OPTIONS.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="activitiesUndertaken" className="text-sm font-medium">
                            Activities Undertaken
                          </Label>
                          <Textarea
                            id="activitiesUndertaken"
                            placeholder="Describe any activities completed during the visit..."
                            value={activitiesUndertaken}
                            onChange={(e) => setActivitiesUndertaken(e.target.value)}
                            className="min-h-[80px] bg-white"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Visit Notes Section */}
                  {!isViewOnly && (
                    <Card className="mt-4 bg-blue-50/50 border-blue-100">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          Visit Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="carerObservations" className="text-sm font-medium">
                            Carer Observations <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="carerObservations"
                            placeholder="Record your observations about the client's condition, behavior, and any notable changes..."
                            value={carerObservations}
                            onChange={(e) => setCarerObservations(e.target.value)}
                            className="min-h-[100px] bg-white"
                          />
                          <p className="text-xs text-muted-foreground">
                            {carerObservations.length}/10 characters minimum
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="clientFeedback" className="text-sm font-medium">
                            Client Feedback
                          </Label>
                          <Textarea
                            id="clientFeedback"
                            placeholder="Record any feedback provided by the client..."
                            value={clientFeedback}
                            onChange={(e) => setClientFeedback(e.target.value)}
                            className="min-h-[80px] bg-white"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="nextVisitPreparations" className="text-sm font-medium">
                            Next Visit Preparations
                          </Label>
                          <Textarea
                            id="nextVisitPreparations"
                            placeholder="Note any preparations or reminders for the next visit..."
                            value={nextVisitPreparations}
                            onChange={(e) => setNextVisitPreparations(e.target.value)}
                            className="min-h-[80px] bg-white"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
              
              <div className="border-t p-6 flex justify-between">
                {!isViewOnly ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousStep}
                      disabled={activeTab === "check-in"}
                    >
                      Back
                    </Button>
                    <div className="flex flex-col items-end gap-2">
                      {(visitLoading || authLoading || !user?.id) && (
                        <Button 
                          variant={!user?.id ? "default" : "ghost"}
                          size="sm"
                          onClick={handleRefreshData}
                          className={!user?.id ? "text-sm" : "text-xs"}
                        >
                          {!user?.id ? "Refresh Authentication" : "Refresh Data"}
                        </Button>
                      )}
                      <Button 
                        onClick={() => handleCompleteVisit()} 
                        size="lg"
                        disabled={
                          isCompletingVisit || 
                          !carerSignature || 
                          !clientMood ||
                          !clientEngagement ||
                          carerObservations.trim().length < 10 ||
                          visitLoading || 
                          authLoading || 
                          !visitRecord || 
                          !user?.id
                        }
                      >
                        {isCompletingVisit ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Completing...
                          </>
                        ) : (visitLoading || authLoading || !visitRecord) ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Complete Visit
                          </>
                        )}
                      </Button>
                      {getButtonDisabledReason() && (
                        <p className="text-xs text-muted-foreground">
                          {getButtonDisabledReason()}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full flex justify-center">
                    <Button 
                      onClick={() => navigateToCarerPage("")}
                      variant="default"
                      size="lg"
                    >
                      Back to Dashboard
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Visit Completion Modal */}
      <VisitCompletionModal
        isOpen={showCompletionModal}
        status={completionStatus}
        completionStep={completionStep}
        completionProgress={completionProgress}
        errorMessage={completionError}
        nextBooking={nextBooking}
        onGoToNextClient={handleGoToNextClient}
        onGoToDashboard={handleGoToDashboard}
        onRetry={() => {
          setShowCompletionModal(false);
          handleCompleteVisit(0);
        }}
        onClose={() => {
          // Only allow closing if not in completing state
          if (completionStatus !== 'completing') {
            setShowCompletionModal(false);
          }
        }}
      />

      {/* Medication Details Dialog */}
      <MedicationDetailsDialog
        isOpen={!!viewMedicationDetails}
        onClose={() => setViewMedicationDetails(null)}
        medication={viewMedicationDetails}
      />
    </div>
  );
};

export default CarerVisitWorkflow;