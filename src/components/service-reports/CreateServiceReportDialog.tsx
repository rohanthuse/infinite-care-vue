import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateServiceReport, useUpdateServiceReport } from '@/hooks/useServiceReports';
import { useCarerContext } from '@/hooks/useCarerContext';
import { useCarePlanJsonData } from '@/hooks/useCarePlanJsonData';
import { format, differenceInMinutes } from 'date-fns';
import { Calendar, Clock, CheckCircle, FileText, ClipboardList, Pill, AlertTriangle, Loader2, User, PenTool, Smile, Heart, Timer, Activity, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVisitTasks } from '@/hooks/useVisitTasks';
import { useVisitEvents } from '@/hooks/useVisitEvents';
import { useVisitVitals } from '@/hooks/useVisitVitals';
import { SignatureDisplay } from './view-report/SignatureDisplay';
import { EditableTasksTable } from './edit-report/EditableTasksTable';
import { EditableMedicationsTable } from './edit-report/EditableMedicationsTable';
import { EditableNEWS2Form } from './edit-report/EditableNEWS2Form';
import { EditableEventsList } from './edit-report/EditableEventsList';
import { EditableVisitSummary } from './edit-report/EditableVisitSummary';
import { EditableActivitiesSection } from './edit-report/EditableActivitiesSection';
import { EditableGoalsSection } from './edit-report/EditableGoalsSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { formatSafeDate } from '@/lib/dateUtils';
import { formatDurationHoursMinutes } from '@/lib/utils';
import { getTimeOfDayFromTimestamp, doesMedicationMatchTimeOfDay } from '@/utils/timeOfDayUtils';

// Normalize mood values from database (lowercase) to UI display format (Title Case)
const normalizeMood = (mood: string | null | undefined): string => {
  if (!mood) return '';
  const moodMap: Record<string, string> = {
    'happy': 'Happy', 'content': 'Content', 'neutral': 'Neutral',
    'anxious': 'Anxious', 'sad': 'Sad', 'confused': 'Confused',
    'agitated': 'Agitated', 'calm': 'Calm',
    'Happy': 'Happy', 'Content': 'Content', 'Neutral': 'Neutral',
    'Anxious': 'Anxious', 'Sad': 'Sad', 'Confused': 'Confused',
    'Agitated': 'Agitated', 'Calm': 'Calm',
  };
  return moodMap[mood] || mood;
};

// Normalize engagement values from database to UI display format
const normalizeEngagement = (engagement: string | null | undefined): string => {
  if (!engagement) return '';
  const engagementMap: Record<string, string> = {
    'highly_engaged': 'Very Engaged', 'very_engaged': 'Very Engaged',
    'engaged': 'Engaged', 'somewhat_engaged': 'Somewhat Engaged',
    'passive': 'Limited Engagement', 'limited_engagement': 'Limited Engagement',
    'withdrawn': 'Not Engaged', 'unresponsive': 'Not Engaged', 'not_engaged': 'Not Engaged',
    'Very Engaged': 'Very Engaged', 'Engaged': 'Engaged',
    'Somewhat Engaged': 'Somewhat Engaged', 'Limited Engagement': 'Limited Engagement',
    'Not Engaged': 'Not Engaged',
  };
  return engagementMap[engagement] || engagement;
};
const formSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  booking_id: z.string().optional(),
  tasks_completed: z.array(z.string()).optional(),
  client_mood: z.string().min(1, 'Client mood is required'),
  client_engagement: z.string().min(1, 'Client engagement is required'),
  activities_undertaken: z.string().optional(),
  next_visit_preparations: z.string().optional(),
  carer_observations: z.string().min(1, 'Carer observations are required'),
  client_feedback: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateServiceReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedClient?: {
    id: string;
    name: string;
  };
  preSelectedDate?: string;
  visitRecordId?: string;
  bookingId?: string;
  preSelectedBooking?: any;
  existingReport?: any;
  mode?: 'create' | 'edit';
  /** Admin mode allows editing without carer context - preserves original staff attribution */
  adminMode?: boolean;
  /** Branch ID for admin context when adminMode is true */
  adminBranchId?: string;
}

const moodOptions = [
  { value: 'Happy', emoji: '😊' },
  { value: 'Content', emoji: '😌' },
  { value: 'Neutral', emoji: '😐' },
  { value: 'Anxious', emoji: '😰' },
  { value: 'Sad', emoji: '😢' },
  { value: 'Confused', emoji: '😕' },
  { value: 'Agitated', emoji: '😠' },
  { value: 'Calm', emoji: '😇' },
];

const engagementOptions = [
  'Very Engaged', 'Engaged', 'Somewhat Engaged', 'Limited Engagement', 'Not Engaged'
];

export function CreateServiceReportDialog({
  open,
  onOpenChange,
  preSelectedClient,
  preSelectedDate,
  visitRecordId,
  bookingId,
  preSelectedBooking,
  existingReport,
  mode = 'create',
  adminMode = false,
  adminBranchId,
}: CreateServiceReportDialogProps) {
  const { data: carerContext } = useCarerContext();
  const createServiceReport = useCreateServiceReport();
  const updateServiceReport = useUpdateServiceReport();
  const queryClient = useQueryClient();

  // State for pending changes in edit mode
  const [pendingTaskChanges, setPendingTaskChanges] = useState<Map<string, { is_completed: boolean; completion_notes: string }>>(new Map());
  const [pendingMedicationChanges, setPendingMedicationChanges] = useState<Map<string, { is_administered: boolean; administration_time: string; administration_notes: string; not_administered_reason: string }>>(new Map());
  const [pendingVitalChanges, setPendingVitalChanges] = useState<{
    respiratory_rate: number;
    oxygen_saturation: number;
    supplemental_oxygen: boolean;
    systolic_bp: number;
    diastolic_bp: number;
    pulse_rate: number;
    consciousness_level: 'A' | 'V' | 'P' | 'U';
    temperature: number;
  } | null>(null);
  const [pendingEventChanges, setPendingEventChanges] = useState<Map<string, { event_title: string; event_description: string; severity: string; follow_up_required: boolean; follow_up_notes: string }>>(new Map());
  const [pendingVisitNotes, setPendingVisitNotes] = useState<string | null>(null);

  // State for NEW items (to be saved on submit)
  const [newTasks, setNewTasks] = useState<{ task_category: string; task_name: string; is_completed: boolean; completion_notes: string }[]>([]);
  const [newMedications, setNewMedications] = useState<{ medication_name: string; dosage: string; is_administered: boolean; administration_time: string; administration_notes: string; not_administered_reason: string }[]>([]);
  const [newEvents, setNewEvents] = useState<{ event_type: string; event_title: string; event_description: string; severity: string; follow_up_required: boolean; follow_up_notes: string }[]>([]);

  // State for Activity and Goal changes
  const [pendingActivityChanges, setPendingActivityChanges] = useState<Map<string, { performed: boolean; duration_minutes: number; notes: string }>>(new Map());
  const [pendingGoalChanges, setPendingGoalChanges] = useState<Map<string, { status: string; progress: number; notes: string }>>(new Map());

  // Reset all pending states when dialog opens to prevent stale data
  useEffect(() => {
    if (open) {
      setNewTasks([]);
      setNewMedications([]);
      setNewEvents([]);
      setPendingVitalChanges(null);
      setPendingTaskChanges(new Map());
      setPendingMedicationChanges(new Map());
      setPendingEventChanges(new Map());
      setPendingVisitNotes(null);
      setPendingActivityChanges(new Map());
      setPendingGoalChanges(new Map());
    }
  }, [open]);

  // In edit mode, use existing report's visit_record_id for fetching data
  const actualVisitRecordId = mode === 'edit' && existingReport?.visit_record_id 
    ? existingReport.visit_record_id 
    : visitRecordId;

  // State to track the visit record ID we're working with (may be created as fallback)
  const [localVisitRecordId, setLocalVisitRecordId] = useState<string | null>(null);
  const effectiveVisitRecordId = actualVisitRecordId || localVisitRecordId;

  // Fetch client's care plan ID
  const { data: clientCarePlan } = useQuery({
    queryKey: ['client-care-plan', preSelectedClient?.id],
    queryFn: async () => {
      if (!preSelectedClient?.id) return null;
      // Import ACTIVE_CARE_PLAN_STATUSES constant for consistent status filtering
      const ACTIVE_STATUSES = ['draft', 'pending_approval', 'pending_client_approval', 'active', 'approved', 'confirmed'];
      const { data, error } = await supabase
        .from('client_care_plans')
        .select('id')
        .eq('client_id', preSelectedClient.id)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!preSelectedClient?.id && open,
  });

  // Fetch care plan JSON data for fallback (when no visit record exists)
  const { data: carePlanJsonData } = useCarePlanJsonData(clientCarePlan?.id || '');

  // Transform care plan medications from JSON for fallback (same logic as ViewServiceReportDialog)
  const carePlanMedicationsFallback = React.useMemo(() => {
    if (!carePlanJsonData?.medications || carePlanJsonData.medications.length === 0) return [];
    return carePlanJsonData.medications.map(med => ({
      id: med.id || `cp-med-${Date.now()}-${Math.random()}`,
      medication_name: med.name,
      dosage: med.dosage,
      prescribed_time: '08:00',
      is_administered: false,
      administration_time: null,
      administration_notes: null,
      missed_reason: null,
    }));
  }, [carePlanJsonData?.medications]);

  // Fetch visit medications when visitRecordId is provided
  const { data: visitMedicationsRaw = [] } = useQuery({
    queryKey: ['visit-medications', effectiveVisitRecordId],
    queryFn: async () => {
      if (!effectiveVisitRecordId) return [];
      
      const { data, error } = await supabase
        .from('visit_medications')
        .select('*')
        .eq('visit_record_id', effectiveVisitRecordId)
        .order('prescribed_time', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!effectiveVisitRecordId && open,
  });

  // Use visit medications if available, otherwise fallback to care plan JSON medications (same as ViewServiceReportDialog)
  const visitMedicationsWithFallback = visitMedicationsRaw.length > 0 ? visitMedicationsRaw : carePlanMedicationsFallback;

  // Deduplicate medications by normalized name + dosage to handle legacy duplicates
  const visitMedications = React.useMemo(() => {
    const seen = new Set<string>();
    return visitMedicationsWithFallback.filter(med => {
      const key = `${(med.medication_name || '').toLowerCase().trim()}:${(med.dosage || '').toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [visitMedicationsWithFallback]);

  // Fetch visit record details when visitRecordId is provided
  const { data: visitRecord } = useQuery({
    queryKey: ['visit-record-details', effectiveVisitRecordId],
    queryFn: async () => {
      if (!effectiveVisitRecordId) return null;
      
      const { data, error } = await supabase
        .from('visit_records')
        .select('*')
        .eq('id', effectiveVisitRecordId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!effectiveVisitRecordId && open,
  });

  // Fetch visit tasks
  const { tasks: visitTasksRaw = [], isLoading: isLoadingTasks, updateTask } = useVisitTasks(effectiveVisitRecordId);
  
  // Transform care plan tasks from JSON for fallback
  const carePlanTasksFallback = React.useMemo(() => {
    if (!carePlanJsonData?.tasks || carePlanJsonData.tasks.length === 0) return [];
    return carePlanJsonData.tasks.map(task => ({
      id: task.id,
      task_category: task.task_category,
      task_name: task.task_name,
      is_completed: false,
      completed_at: null,
      completion_notes: null,
      priority: 'medium',
    }));
  }, [carePlanJsonData?.tasks]);

  // Use visit tasks if available, otherwise fallback to care plan tasks
  const visitTasksWithFallback = visitTasksRaw.length > 0 ? visitTasksRaw : carePlanTasksFallback;

  // Deduplicate tasks by category + normalized name to handle legacy duplicates
  const visitTasks = React.useMemo(() => {
    const seen = new Set<string>();
    return visitTasksWithFallback.filter(task => {
      const key = `${task.task_category}:${(task.task_name || '').toLowerCase().trim().replace(/\s+/g, ' ')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [visitTasksWithFallback]);

  // Filter out Activities and Goals from Task Details - they have their own sections
  const taskDetailsTasks = React.useMemo(() => {
    const excludeCategories = ['activity', 'activities', 'goal', 'goals'];
    return visitTasks.filter(task => {
      const category = (task.task_category || '').toLowerCase().trim();
      return !excludeCategories.includes(category);
    });
  }, [visitTasks]);

  // Fetch visit events (incidents, accidents, observations)
  const { 
    events: visitEvents = [], 
    incidents = [], 
    accidents = [], 
    observations = [],
    updateEvent
  } = useVisitEvents(effectiveVisitRecordId);

  // Fetch visit vitals (NEWS2 readings)
  const { 
    news2Readings = [], 
    latestNEWS2,
    otherVitals = [],
    isLoading: isLoadingVitals,
    updateVital
  } = useVisitVitals(effectiveVisitRecordId);

  // Fetch full visit record with signatures
  const { data: fullVisitRecord } = useQuery({
    queryKey: ['full-visit-record', effectiveVisitRecordId],
    queryFn: async () => {
      if (!effectiveVisitRecordId) return null;
      
      const { data, error } = await supabase
        .from('visit_records')
        .select('*')
        .eq('id', effectiveVisitRecordId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveVisitRecordId && open,
  });

  // Fetch booking data for scheduled times in Edit mode (when preSelectedBooking is not available)
  const { data: bookingDataForEdit } = useQuery({
    queryKey: ['booking-for-edit', bookingId, existingReport?.booking_id],
    queryFn: async () => {
      const id = bookingId || existingReport?.booking_id;
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!(bookingId || existingReport?.booking_id) && open && !preSelectedBooking,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: preSelectedClient?.id || '',
      tasks_completed: [],
      client_mood: '',
      client_engagement: '',
      activities_undertaken: '',
      next_visit_preparations: '',
      carer_observations: '',
      client_feedback: '',
    },
  });

  // Populate form with existing report data when editing
  // Normalize mood and engagement values from database format to match UI Select options
  React.useEffect(() => {
    if (mode === 'edit' && existingReport && open) {
      form.reset({
        client_id: existingReport.client_id,
        booking_id: existingReport.booking_id || '',
        tasks_completed: existingReport.tasks_completed || [],
        client_mood: normalizeMood(existingReport.client_mood) || '',
        client_engagement: normalizeEngagement(existingReport.client_engagement) || '',
        activities_undertaken: existingReport.activities_undertaken || '',
        next_visit_preparations: existingReport.next_visit_preparations || '',
        carer_observations: existingReport.carer_observations || '',
        client_feedback: existingReport.client_feedback || '',
      });
    }
  }, [mode, existingReport, open, form]);

  // Fallback: Create visit record if missing when dialog opens in edit mode
  useEffect(() => {
    const ensureVisitRecordExists = async () => {
      if (mode !== 'edit' || !open || !preSelectedClient?.id) return;
      if (actualVisitRecordId) {
        setLocalVisitRecordId(null);
        return;
      }
      
      // If we're in edit mode but have no visit record, create one
      if (existingReport?.booking_id && !existingReport?.visit_record_id) {
        console.log('[CreateServiceReportDialog] Creating fallback visit record for booking:', existingReport.booking_id);
        
        try {
          // First check if one exists
          const { data: existingVR } = await supabase
            .from('visit_records')
            .select('id')
            .eq('booking_id', existingReport.booking_id)
            .maybeSingle();
          
          if (existingVR) {
            console.log('[CreateServiceReportDialog] Found existing visit record:', existingVR.id);
            setLocalVisitRecordId(existingVR.id);
            
            // Update service report
            await supabase
              .from('client_service_reports')
              .update({ visit_record_id: existingVR.id })
              .eq('id', existingReport.id);
            return;
          }
          
          // Create new visit record
          const { data: newVR, error } = await supabase
            .from('visit_records')
            .insert({
              booking_id: existingReport.booking_id,
              client_id: existingReport.client_id,
              staff_id: existingReport.staff_id,
              branch_id: existingReport.branch_id,
              status: 'completed',
            })
            .select('id')
            .single();
          
          if (error) {
            console.error('[CreateServiceReportDialog] Error creating visit record:', error);
            return;
          }
          
          if (newVR) {
            console.log('[CreateServiceReportDialog] Created fallback visit record:', newVR.id);
            setLocalVisitRecordId(newVR.id);
            
            await supabase
              .from('client_service_reports')
              .update({ visit_record_id: newVR.id })
              .eq('id', existingReport.id);
          }
        } catch (error) {
          console.error('[CreateServiceReportDialog] Error in fallback visit record creation:', error);
        }
      }
    };
    
    ensureVisitRecordExists();
  }, [mode, open, actualVisitRecordId, existingReport, preSelectedClient?.id]);

  // Auto-load care plan medications when dialog opens with no existing medications
  // Skip auto-load in edit mode with existing report - use fallback instead
  useEffect(() => {
    const loadCarePlanMedications = async () => {
      // Skip auto-load in edit mode - medications come from visit_medications or carePlanJsonData fallback
      if (mode === 'edit' && existingReport) {
        console.log('[CreateServiceReportDialog] Edit mode with existing report - skipping auto-load, using fallback');
        return;
      }
      
      if (!effectiveVisitRecordId || !preSelectedClient?.id) return;
      if (visitMedications && visitMedications.length > 0) return;
      
      console.log('[CreateServiceReportDialog] Loading care plan medications for visit:', effectiveVisitRecordId);
      
      try {
        // Determine time of day from booking start time
        const bookingStartTime = preSelectedBooking?.start_time || existingReport?.booking?.start_time;
        const visitTimeOfDay = bookingStartTime 
          ? getTimeOfDayFromTimestamp(bookingStartTime) 
          : getTimeOfDayFromTimestamp(new Date());
        
        console.log('[CreateServiceReportDialog] Visit time of day:', visitTimeOfDay);

        // Fetch medications from care plan including time_of_day
        const { data: clientMedications } = await supabase
          .from('client_medications')
          .select(`
            id, name, dosage, frequency, time_of_day,
            client_care_plans!inner (client_id, status)
          `)
          .eq('client_care_plans.client_id', preSelectedClient.id)
          .in('client_care_plans.status', ['draft', 'pending_approval', 'pending_client_approval', 'active', 'approved', 'confirmed'])
          .eq('status', 'active');
        
        console.log('[CreateServiceReportDialog] Found care plan medications:', clientMedications?.length || 0);
        
        if (clientMedications && clientMedications.length > 0) {
          // Filter medications by time of day
          const filteredMedications = clientMedications.filter(med => 
            doesMedicationMatchTimeOfDay(med.time_of_day as string[] | null, visitTimeOfDay)
          );
          
          console.log(`[CreateServiceReportDialog] Filtered to ${filteredMedications.length} medications for ${visitTimeOfDay}`);
          
          if (filteredMedications.length > 0) {
            const visitMeds = filteredMedications.map(med => ({
              visit_record_id: effectiveVisitRecordId,
              medication_id: med.id,
              medication_name: med.name,
              dosage: med.dosage,
              prescribed_time: '08:00',
              administration_method: 'oral',
              is_administered: false,
            }));
            
            await supabase.from('visit_medications').insert(visitMeds);
            queryClient.invalidateQueries({ queryKey: ['visit-medications', effectiveVisitRecordId] });
          }
        }
      } catch (error) {
        console.error('Error loading care plan medications:', error);
      }
    };
    
    if (open && effectiveVisitRecordId) {
      loadCarePlanMedications();
    }
  }, [open, effectiveVisitRecordId, visitMedications?.length, preSelectedClient?.id, queryClient, preSelectedBooking?.start_time, existingReport?.booking?.start_time]);

  // Helper function to normalize task names for deduplication
  const normalizeTaskName = (name: string): string => {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  };

  // Auto-load care plan tasks when dialog opens with no existing tasks
  // Uses relational tables as primary source, JSON as fallback only
  useEffect(() => {
    const loadCarePlanTasks = async () => {
      if (!effectiveVisitRecordId || !preSelectedClient?.id) return;
      if (visitTasks && visitTasks.length > 0) return;
      
      console.log('[CreateServiceReportDialog] Loading care plan tasks for visit:', effectiveVisitRecordId);
      
      const ACTIVE_STATUSES = ['draft', 'pending_approval', 'pending_client_approval', 'active', 'approved', 'confirmed'];
      
      try {
        // Fetch care plan with auto_save_data
        const { data: carePlan } = await supabase
          .from('client_care_plans')
          .select('id, auto_save_data')
          .eq('client_id', preSelectedClient.id)
          .in('status', ACTIVE_STATUSES)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        console.log('[CreateServiceReportDialog] Found care plan:', carePlan?.id);
        
        if (carePlan) {
          const autoSave = carePlan.auto_save_data as any;
          const tasks: Array<{ task_category: string; task_name: string }> = [];
          // Use a Set with composite key: "category:normalizedName" for deduplication
          const seenTaskKeys = new Set<string>();
          
          const addTask = (category: string, name: string) => {
            const normalizedName = normalizeTaskName(name);
            const key = `${category}:${normalizedName}`;
            if (normalizedName && !seenTaskKeys.has(key)) {
              tasks.push({ task_category: category, task_name: name.trim() });
              seenTaskKeys.add(key);
            }
          };
          
          // Extract tasks from dedicated tasks array (primary source for explicit tasks)
          if (autoSave?.tasks && Array.isArray(autoSave.tasks)) {
            autoSave.tasks.forEach((task: any) => {
              if (task.name) {
                addTask(task.category || 'General', task.name);
              }
            });
          }
          
          // Extract tasks from personal_care section (JSON fallback source)
          if (autoSave?.personal_care?.items) {
            autoSave.personal_care.items.forEach((item: any) => {
              const taskName = item.description || item.name;
              if (taskName) {
                addTask('Personal Care', taskName);
              }
            });
          }
          
          // ACTIVITIES: Use relational table as PRIMARY source
          const { data: relationalActivities } = await supabase
            .from('client_activities')
            .select('name, description')
            .eq('care_plan_id', carePlan.id)
            .eq('status', 'active');
          
          const hasRelationalActivities = relationalActivities && relationalActivities.length > 0;
          
          if (hasRelationalActivities) {
            // Use ONLY relational activities (don't also add JSON activities)
            relationalActivities.forEach(act => {
              const taskName = act.name || act.description || '';
              if (taskName) {
                addTask('Activity', taskName);
              }
            });
          } else if (autoSave?.activities) {
            // Fallback: use JSON activities only if no relational activities exist
            autoSave.activities.forEach((act: any) => {
              const taskName = act.name || act.description;
              if (taskName) {
                addTask('Activity', taskName);
              }
            });
          }
          
          // GOALS: Use relational table as PRIMARY source
          const { data: relationalGoals } = await supabase
            .from('client_care_plan_goals')
            .select('description')
            .eq('care_plan_id', carePlan.id);
          
          const hasRelationalGoals = relationalGoals && relationalGoals.length > 0;
          
          if (hasRelationalGoals) {
            relationalGoals.forEach(goal => {
              if (goal.description) {
                addTask('Goal', goal.description);
              }
            });
          } else if (autoSave?.goals) {
            // Fallback: use JSON goals only if no relational goals exist
            autoSave.goals.forEach((goal: any) => {
              const goalDesc = goal.description || goal.goal || '';
              if (goalDesc) {
                addTask('Goal', goalDesc);
              }
            });
          }
          
          console.log('[CreateServiceReportDialog] Found unique tasks to load:', tasks.length);
          
          if (tasks.length > 0) {
            // Check for existing tasks in DB to prevent duplicates on re-open
            const { data: existingTasks } = await supabase
              .from('visit_tasks')
              .select('task_category, task_name')
              .eq('visit_record_id', effectiveVisitRecordId);
            
            const existingKeys = new Set(
              (existingTasks || []).map(t => `${t.task_category}:${normalizeTaskName(t.task_name)}`)
            );
            
            const newTasks = tasks.filter(t => 
              !existingKeys.has(`${t.task_category}:${normalizeTaskName(t.task_name)}`)
            );
            
            if (newTasks.length > 0) {
              const visitTasksToInsert = newTasks.map(t => ({
                visit_record_id: effectiveVisitRecordId,
                task_category: t.task_category,
                task_name: t.task_name,
                is_completed: false,
                priority: 'medium' as const,
              }));
              
              await supabase.from('visit_tasks').insert(visitTasksToInsert);
              queryClient.invalidateQueries({ queryKey: ['visit-tasks', effectiveVisitRecordId] });
            }
          }
        }
      } catch (error) {
        console.error('Error loading care plan tasks:', error);
      }
    };
    
    if (open && effectiveVisitRecordId) {
      loadCarePlanTasks();
    }
  }, [open, effectiveVisitRecordId, visitTasks?.length, preSelectedClient?.id, queryClient, clientCarePlan?.id]);

  // Create visit record when dialog opens in create mode to enable data loading
  useEffect(() => {
    const initializeVisitRecordForCreate = async () => {
      // Only run in create mode when we have booking but no visit record yet
      if (mode !== 'create' || !open || !bookingId || !preSelectedClient?.id) return;
      if (actualVisitRecordId || localVisitRecordId) return; // Already have a visit record
      
      console.log('[CreateServiceReportDialog] Initializing visit record for create mode, booking:', bookingId);
      
      try {
        // Check if one already exists for this booking
        const { data: existingVR } = await supabase
          .from('visit_records')
          .select('id')
          .eq('booking_id', bookingId)
          .maybeSingle();
        
        if (existingVR) {
          console.log('[CreateServiceReportDialog] Found existing visit record for create mode:', existingVR.id);
          setLocalVisitRecordId(existingVR.id);
          return;
        }
        
        // Create new visit record
        if (!carerContext?.staffProfile?.id || !carerContext?.staffProfile?.branch_id) {
          console.log('[CreateServiceReportDialog] No carer context, skipping visit record creation');
          return;
        }
        
        const { data: newVR, error } = await supabase
          .from('visit_records')
          .insert({
            booking_id: bookingId,
            client_id: preSelectedClient.id,
            staff_id: carerContext.staffProfile.id,
            branch_id: carerContext.staffProfile.branch_id,
            status: 'in-progress',
            visit_start_time: preSelectedBooking?.start_time || new Date().toISOString(),
          })
          .select('id')
          .single();
        
        if (error) {
          console.error('[CreateServiceReportDialog] Error creating visit record for create mode:', error);
          return;
        }
        
        if (newVR) {
          console.log('[CreateServiceReportDialog] Created visit record for create mode:', newVR.id);
          setLocalVisitRecordId(newVR.id);
        }
      } catch (error) {
        console.error('[CreateServiceReportDialog] Error initializing visit record:', error);
      }
    };
    
    initializeVisitRecordForCreate();
  }, [mode, open, bookingId, preSelectedClient?.id, actualVisitRecordId, localVisitRecordId, carerContext, preSelectedBooking]);

  const onSubmit = async (data: FormData) => {
    // For admin edit mode, don't require carer context - use existing report data
    const isAdminEdit = mode === 'edit' && adminMode && existingReport;
    
    if (!isAdminEdit && (!carerContext?.staffProfile?.id || !carerContext?.staffProfile?.branch_id)) {
      console.warn('[CreateServiceReportDialog] No carer context available for non-admin mode');
      return;
    }
    
    if (!data.client_id) {
      console.warn('[CreateServiceReportDialog] No client ID');
      return;
    }

    // Helper function to get existing or create visit record for past appointments
    const getOrCreateVisitRecord = async (): Promise<string | null> => {
      if (visitRecordId) return visitRecordId;
      if (!bookingId || !preSelectedClient?.id) return null;

      try {
        // FIRST: Check if a visit_record already exists for this booking
        const { data: existingRecord, error: fetchError } = await supabase
          .from('visit_records')
          .select('id')
          .eq('booking_id', bookingId)
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;
        
        // If found, return existing record ID
        if (existingRecord?.id) {
          console.log('Found existing visit_record:', existingRecord.id);
          return existingRecord.id;
        }

        // Only create new if none exists
        const { data: newRecord, error } = await supabase
          .from('visit_records')
          .insert({
            booking_id: bookingId,
            client_id: preSelectedClient.id,
            staff_id: carerContext.staffProfile.id,
            branch_id: carerContext.staffProfile.branch_id,
            status: 'completed',
            visit_start_time: preSelectedBooking?.start_time || new Date().toISOString(),
            visit_end_time: preSelectedBooking?.end_time || new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) throw error;
        console.log('Created new visit_record:', newRecord?.id);
        return newRecord?.id || null;
      } catch (error) {
        console.error('Error getting/creating visit record:', error);
        return null;
      }
    };

    // Get or create visit record ID
    // In edit mode, prioritize existing report's visit_record_id
    let effectiveVisitRecordId = visitRecordId;
    
    if (mode === 'edit' && existingReport?.visit_record_id) {
      effectiveVisitRecordId = existingReport.visit_record_id;
    } else if (!effectiveVisitRecordId && bookingId) {
      effectiveVisitRecordId = await getOrCreateVisitRecord();
    }

    // Save NEW tasks (both create and edit modes)
    if (effectiveVisitRecordId) {
      for (const task of newTasks) {
        await supabase.from('visit_tasks').insert({
          visit_record_id: effectiveVisitRecordId,
          task_category: task.task_category,
          task_name: task.task_name,
          is_completed: task.is_completed,
          completion_notes: task.completion_notes || null,
          priority: 'medium',
        });
      }

      // Save NEW medications
      for (const med of newMedications) {
        await supabase.from('visit_medications').insert({
          visit_record_id: effectiveVisitRecordId,
          medication_name: med.medication_name,
          dosage: med.dosage || null,
          is_administered: med.is_administered,
          administration_time: med.administration_time ? new Date(`1970-01-01T${med.administration_time}`).toISOString() : null,
          administration_notes: med.administration_notes || null,
          missed_reason: med.not_administered_reason || null,
        });
      }

      // Save NEW vitals
      if (pendingVitalChanges) {
        await supabase.from('visit_vitals').insert({
          visit_record_id: effectiveVisitRecordId,
          client_id: preSelectedClient?.id,
          vital_type: 'news2',
          respiratory_rate: pendingVitalChanges.respiratory_rate,
          oxygen_saturation: pendingVitalChanges.oxygen_saturation,
          supplemental_oxygen: pendingVitalChanges.supplemental_oxygen,
          systolic_bp: pendingVitalChanges.systolic_bp,
          diastolic_bp: pendingVitalChanges.diastolic_bp,
          pulse_rate: pendingVitalChanges.pulse_rate,
          consciousness_level: pendingVitalChanges.consciousness_level,
          temperature: pendingVitalChanges.temperature,
        } as any);
      }

      // Save NEW events
      for (const event of newEvents) {
        await supabase.from('visit_events').insert({
          visit_record_id: effectiveVisitRecordId,
          event_type: event.event_type,
          event_title: event.event_title,
          event_description: event.event_description,
          severity: event.severity,
          follow_up_required: event.follow_up_required,
          follow_up_notes: event.follow_up_notes || null,
        });
      }
    }

    // In edit mode, save all pending changes to existing items
    if (mode === 'edit') {
      try {
        // Save task changes
        for (const [taskId, changes] of pendingTaskChanges) {
          if (!taskId.startsWith('manual-')) {
            await updateTask.mutateAsync({
              taskId,
              isCompleted: changes.is_completed,
              notes: changes.completion_notes,
            });
          }
        }

        // Save medication changes
        for (const [medId, changes] of pendingMedicationChanges) {
          if (!medId.startsWith('manual-')) {
            await supabase
              .from('visit_medications')
              .update({
                is_administered: changes.is_administered,
                administration_time: changes.administration_time ? new Date(`1970-01-01T${changes.administration_time}`).toISOString() : null,
                administration_notes: changes.administration_notes || null,
                missed_reason: changes.not_administered_reason || null,
              })
              .eq('id', medId);
          }
        }

        // Save vital changes (if editing existing)
        if (pendingVitalChanges && latestNEWS2) {
          await updateVital.mutateAsync({
            vitalId: latestNEWS2.id,
            updates: pendingVitalChanges,
          });
        }

        // Save event changes
        for (const [eventId, changes] of pendingEventChanges) {
          if (!eventId.startsWith('manual-')) {
            await updateEvent.mutateAsync({
              eventId,
              updates: {
                event_title: changes.event_title,
                event_description: changes.event_description,
                severity: changes.severity as 'low' | 'medium' | 'high' | 'critical',
                follow_up_required: changes.follow_up_required,
                follow_up_notes: changes.follow_up_notes,
              },
            });
          }
        }

        // Save visit notes (user-entered)
        if (pendingVisitNotes !== null && effectiveVisitRecordId) {
          await supabase
            .from('visit_records')
            .update({ visit_notes: pendingVisitNotes })
            .eq('id', effectiveVisitRecordId);
        }

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['visit-tasks'] });
        queryClient.invalidateQueries({ queryKey: ['visit-medications'] });
        queryClient.invalidateQueries({ queryKey: ['visit-vitals'] });
        queryClient.invalidateQueries({ queryKey: ['visit-events'] });
        queryClient.invalidateQueries({ queryKey: ['visit-record-details'] });
        queryClient.invalidateQueries({ queryKey: ['care-plan-goals'] });
        queryClient.invalidateQueries({ queryKey: ['client-activities'] });
      } catch (error) {
        console.error('Error saving changes:', error);
        toast.error('Failed to save some changes');
      }
    }

    // In edit mode with adminMode, preserve original staff attribution
    // Admin edits should NOT change who created/owns the report
    const staffId = isAdminEdit && existingReport?.staff_id 
      ? existingReport.staff_id 
      : carerContext?.staffProfile?.id;
    
    const branchId = isAdminEdit && existingReport?.branch_id 
      ? existingReport.branch_id 
      : (adminBranchId || carerContext?.staffProfile?.branch_id);
    
    const createdBy = isAdminEdit && existingReport?.created_by 
      ? existingReport.created_by 
      : carerContext?.staffProfile?.id;

    const reportData = {
      client_id: data.client_id,
      booking_id: bookingId || data.booking_id || null,
      service_date: preSelectedBooking 
        ? format(new Date(preSelectedBooking.start_time), 'yyyy-MM-dd')
        : (existingReport?.service_date || format(new Date(), 'yyyy-MM-dd')),
      service_duration_minutes: preSelectedBooking 
        ? Math.round((new Date(preSelectedBooking.end_time).getTime() - new Date(preSelectedBooking.start_time).getTime()) / 60000)
        : (existingReport?.service_duration_minutes || 60),
      tasks_completed: data.tasks_completed,
      client_mood: data.client_mood,
      client_engagement: data.client_engagement,
      activities_undertaken: data.activities_undertaken,
      medication_administered: existingReport?.medication_administered || false,
      medication_notes: existingReport?.medication_notes || null,
      incident_occurred: existingReport?.incident_occurred || false,
      incident_details: existingReport?.incident_details || null,
      next_visit_preparations: data.next_visit_preparations,
      carer_observations: data.carer_observations,
      client_feedback: data.client_feedback,
      staff_id: staffId,
      branch_id: branchId,
      visit_record_id: effectiveVisitRecordId,
      created_by: createdBy,
    };

    if (mode === 'edit' && existingReport) {
      updateServiceReport.mutate({
        id: existingReport.id,
        updates: {
          ...reportData,
          status: 'pending',
          visible_to_client: false,
          submitted_at: new Date().toISOString(),
        }
      }, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          toast.success('Service report updated and submitted for review');
        },
      });
    } else {
      createServiceReport.mutate({
        ...reportData,
        status: 'pending',
        visible_to_client: false,
        submitted_at: new Date().toISOString(),
      }, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          toast.success('Service report submitted for admin review');
        },
      });
    }
  };

  // Get client and carer names
  const clientName = existingReport?.clients 
    ? `${existingReport.clients.first_name} ${existingReport.clients.last_name}`
    : preSelectedClient?.name || 'Client';
  
  const carerName = existingReport?.staff 
    ? `${existingReport.staff.first_name} ${existingReport.staff.last_name}`
    : carerContext?.staffProfile 
      ? `${carerContext.staffProfile.first_name} ${carerContext.staffProfile.last_name}`
      : 'Carer';

  const clientInitials = clientName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Get service date and duration
  const serviceDate = existingReport?.service_date || (preSelectedBooking ? format(new Date(preSelectedBooking.start_time), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const serviceDuration = existingReport?.service_duration_minutes || (preSelectedBooking 
    ? Math.round((new Date(preSelectedBooking.end_time).getTime() - new Date(preSelectedBooking.start_time).getTime()) / 60000)
    : 60);

  const isDataLoading = isLoadingTasks || isLoadingVitals;

  // Calculate scheduled times from preSelectedBooking or fetched booking data (for Edit mode)
  const bookingStartTime = preSelectedBooking?.start_time || bookingDataForEdit?.start_time;
  const bookingEndTime = preSelectedBooking?.end_time || bookingDataForEdit?.end_time;
  const scheduledStartTime = bookingStartTime ? new Date(bookingStartTime) : null;
  const scheduledEndTime = bookingEndTime ? new Date(bookingEndTime) : null;
  const scheduledDurationMins = scheduledStartTime && scheduledEndTime 
    ? differenceInMinutes(scheduledEndTime, scheduledStartTime)
    : null;

  // Calculate actual times from visitRecord
  const actualStartTime = visitRecord?.visit_start_time ? new Date(visitRecord.visit_start_time) : null;
  const actualEndTime = visitRecord?.visit_end_time ? new Date(visitRecord.visit_end_time) : null;
  const actualDurationMins = actualStartTime && actualEndTime 
    ? differenceInMinutes(actualEndTime, actualStartTime)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={existingReport?.clients?.avatar_url} />
              <AvatarFallback>{clientInitials}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">
                {mode === 'edit' ? 'Edit Service Report' : 'Create Service Report'}: {clientName}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Carer: {carerName}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  PENDING REVIEW
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <ScrollArea className="flex-1 max-h-[calc(90vh-200px)] overflow-y-auto px-6">
          <Form {...form}>
            <form id="service-report-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
              
              {/* Loading State */}
              {isDataLoading && visitRecordId && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading visit details...</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Visit Timing Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Visit Timing Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Scheduled Time Column */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Scheduled Time
                      </h4>
                      <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Start</p>
                          <p className="font-medium">
                            {scheduledStartTime ? format(scheduledStartTime, 'h:mm a') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">End</p>
                          <p className="font-medium">
                            {scheduledEndTime ? format(scheduledEndTime, 'h:mm a') : 'N/A'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="font-medium text-primary">
                            {scheduledDurationMins !== null ? formatDurationHoursMinutes(scheduledDurationMins) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actual Time Column */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Actual Time
                      </h4>
                      <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Start</p>
                          <p className="font-medium">
                            {actualStartTime ? format(actualStartTime, 'h:mm a') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">End</p>
                          <p className="font-medium">
                            {actualEndTime ? format(actualEndTime, 'h:mm a') : 'N/A'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="font-medium text-primary">
                            {actualDurationMins !== null ? formatDurationHoursMinutes(actualDurationMins) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Service Date */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Service Date</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatSafeDate(serviceDate, 'PPP')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Visit Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Visit Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mode === 'edit' ? (
                    <EditableVisitSummary
                      visitNotes={visitRecord?.visit_notes}
                      systemSummary={visitRecord?.visit_summary}
                      servicesProvided={existingReport?.services_provided}
                      serviceName={preSelectedBooking?.service_name}
                      onNotesChange={setPendingVisitNotes}
                    />
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Services Provided</p>
                        <div className="flex flex-wrap gap-2">
                          {existingReport?.services_provided?.length > 0 ? (
                            existingReport.services_provided.map((service: string, index: number) => (
                              <Badge key={index} variant="secondary">
                                {service}
                              </Badge>
                            ))
                          ) : preSelectedBooking?.service_name ? (
                            <Badge variant="secondary">{preSelectedBooking.service_name}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">No services recorded</span>
                          )}
                        </div>
                      </div>
                      {visitRecord?.visit_notes && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Carer Visit Notes</p>
                            <p className="text-sm bg-muted/50 p-3 rounded-md">
                              {visitRecord.visit_notes}
                            </p>
                          </div>
                        </>
                      )}
                      {visitRecord?.visit_summary && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">System Summary</p>
                            <p className="text-sm bg-muted/30 p-3 rounded-md text-muted-foreground italic">
                              {visitRecord.visit_summary}
                            </p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Task Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Task Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableTasksTable 
                    tasks={taskDetailsTasks || []} 
                    onTasksChange={setPendingTaskChanges}
                    onAddTask={(task) => setNewTasks(prev => [...prev, task])}
                    allowManualAdd={true}
                  />
                </CardContent>
              </Card>

              {/* Activity Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableActivitiesSection
                    carePlanId={clientCarePlan?.id}
                    onActivitiesChange={setPendingActivityChanges}
                    allowManualAdd={true}
                  />
                </CardContent>
              </Card>

              {/* Goal Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Goal Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableGoalsSection
                    carePlanId={clientCarePlan?.id}
                    onGoalsChange={setPendingGoalChanges}
                    allowManualAdd={true}
                  />
                </CardContent>
              </Card>

              {/* Medication Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Medication Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableMedicationsTable 
                    medications={visitMedications || []} 
                    onMedicationsChange={setPendingMedicationChanges}
                    onAddMedication={(med) => setNewMedications(prev => [...prev, med])}
                    allowManualAdd={true}
                  />
                </CardContent>
              </Card>

              {/* NEWS2 & Vital Signs Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    NEWS2 & Vital Signs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableNEWS2Form 
                    latestNEWS2={latestNEWS2} 
                    onVitalChange={setPendingVitalChanges}
                    allowCreate={true}
                  />
                </CardContent>
              </Card>

              {/* Events & Incidents Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Events & Incidents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableEventsList 
                    incidents={incidents || []}
                    accidents={accidents || []}
                    observations={observations || []}
                    onEventsChange={setPendingEventChanges}
                    onAddEvent={(event) => setNewEvents(prev => [...prev, event])}
                    allowManualAdd={true}
                  />
                </CardContent>
              </Card>

              {/* Client Mood & Engagement Card - Editable */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smile className="h-5 w-5" />
                    Client Mood & Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="client_mood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Mood <span className="text-destructive">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select mood" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {moodOptions.map((mood) => (
                                <SelectItem key={mood.value} value={mood.value}>
                                  {mood.emoji} {mood.value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="client_engagement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Engagement <span className="text-destructive">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select engagement level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {engagementOptions.map((engagement) => (
                                <SelectItem key={engagement} value={engagement}>
                                  {engagement}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                </CardContent>
              </Card>

              {/* Visit Notes Card - Editable */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Visit Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="activities_undertaken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activities Undertaken</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe any activities, exercises, or social interactions..."
                            {...field}
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="carer_observations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carer Observations <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Your professional observations about the client's condition, progress, concerns..."
                            {...field}
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="client_feedback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Feedback</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any feedback or comments from the client..."
                            {...field}
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="next_visit_preparations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Next Visit Preparations</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any special preparations, supplies needed, or items to follow up on..."
                            {...field}
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Signatures Card - Read Only */}
              {(fullVisitRecord?.staff_signature_data || fullVisitRecord?.client_signature_data) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PenTool className="h-5 w-5" />
                      Signatures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SignatureDisplay
                      carerSignature={fullVisitRecord?.staff_signature_data}
                      carerName={carerName}
                      clientSignature={fullVisitRecord?.client_signature_data}
                      clientName={clientName}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Report Metadata Card */}
              {mode === 'edit' && existingReport && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Report Created</p>
                        <p className="font-medium">
                          {formatSafeDate(existingReport.created_at, 'PPp')}
                        </p>
                      </div>
                      {existingReport.updated_at && formatSafeDate(existingReport.updated_at, 'PPp') !== 'N/A' && (
                        <div>
                          <p className="text-muted-foreground">Last Updated</p>
                          <p className="font-medium">
                            {formatSafeDate(existingReport.updated_at, 'PPp')}
                          </p>
                        </div>
                      )}
                      {existingReport.reviewed_at && formatSafeDate(existingReport.reviewed_at, 'PPp') !== 'N/A' && (
                        <div>
                          <p className="text-muted-foreground">Reviewed At</p>
                          <p className="font-medium">
                            {formatSafeDate(existingReport.reviewed_at, 'PPp')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            </form>
          </Form>
        </ScrollArea>

        {/* Fixed Footer with Action Buttons */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="service-report-form"
            disabled={createServiceReport.isPending || updateServiceReport.isPending}
          >
            {mode === 'edit' 
              ? (updateServiceReport.isPending ? 'Updating...' : 'Update Report')
              : (createServiceReport.isPending ? 'Saving...' : 'Save Report')
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
