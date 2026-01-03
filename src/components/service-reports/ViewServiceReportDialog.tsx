import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVisitTasks } from '@/hooks/useVisitTasks';
import { useVisitMedications } from '@/hooks/useVisitMedications';
import { useVisitVitals } from '@/hooks/useVisitVitals';
import { useVisitEvents } from '@/hooks/useVisitEvents';
import { useUpdateServiceReport } from '@/hooks/useServiceReports';
import { useCarePlanJsonData } from '@/hooks/useCarePlanJsonData';
import type { Database } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  User, 
  Pill,
  Heart,
  AlertTriangle,
  ClipboardList,
  FileText,
  CheckCircle,
  XCircle,
  Circle,
  Smile,
  Users,
  PenTool,
  Send,
  ClipboardCheck,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Download
} from 'lucide-react';
import { TasksTable } from './view-report/TasksTable';
import { MedicationsTable } from './view-report/MedicationsTable';
import { NEWS2Display } from './view-report/NEWS2Display';
import { EventsList } from './view-report/EventsList';
import { SignatureDisplay } from './view-report/SignatureDisplay';

import { formatSafeDate } from '@/lib/dateUtils';
import { exportSingleServiceReportPDF } from '@/utils/serviceReportPdfExporter';

interface ViewServiceReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: any;
  adminMode?: boolean;
}

export function ViewServiceReportDialog({
  open,
  onOpenChange,
  report,
  adminMode = false,
}: ViewServiceReportDialogProps) {
  // Fetch fresh report data from database when dialog opens
  const { data: fetchedReport, isLoading: isFetchingReport } = useQuery({
    queryKey: ['service-report-detail', report?.id],
    queryFn: async () => {
      if (!report?.id) return null;
      const { data, error } = await supabase
        .from('client_service_reports')
        .select(`
          *,
          clients:client_id (id, first_name, last_name, email, avatar_url),
          staff:staff_id (id, first_name, last_name, email)
        `)
        .eq('id', report.id)
        .maybeSingle();
      
      if (error) {
        console.error('[ViewServiceReportDialog] Error fetching report:', error);
        throw error;
      }
      console.log('[ViewServiceReportDialog] Fetched fresh report:', data?.id, {
        client_mood: data?.client_mood,
        client_engagement: data?.client_engagement,
        carer_observations: data?.carer_observations?.substring(0, 50),
      });
      return data;
    },
    enabled: open && !!report?.id,
    staleTime: 0, // Always fetch fresh data when dialog opens
  });

  // Use fetched report if available, otherwise fall back to prop (for initial render)
  const resolvedReport = fetchedReport || report;

  // Create safeReport with fallbacks BEFORE any hooks
  const safeReport = resolvedReport ? {
    ...resolvedReport,
    clients: resolvedReport.clients || { first_name: '', last_name: '', email: '' },
    staff: resolvedReport.staff || { first_name: '', last_name: '', email: '' },
    services_provided: resolvedReport.services_provided || [],
    client_mood: resolvedReport.client_mood || '',
    client_engagement: resolvedReport.client_engagement || '',
    carer_observations: resolvedReport.carer_observations || '',
    client_feedback: resolvedReport.client_feedback || '',
    activities_undertaken: resolvedReport.activities_undertaken || '',
    medication_notes: resolvedReport.medication_notes || '',
    incident_details: resolvedReport.incident_details || '',
    next_visit_preparations: resolvedReport.next_visit_preparations || '',
    review_notes: resolvedReport.review_notes || '',
    medication_administered: resolvedReport.medication_administered ?? false,
    incident_occurred: resolvedReport.incident_occurred ?? false,
  } : null;

  // Form state for editable fields
  const [formData, setFormData] = useState({
    client_mood: safeReport?.client_mood || '',
    client_engagement: safeReport?.client_engagement || '',
    carer_observations: safeReport?.carer_observations || '',
    client_feedback: safeReport?.client_feedback || '',
    next_visit_preparations: safeReport?.next_visit_preparations || '',
  });

  // Sync form data when dialog opens or fetched report changes
  React.useEffect(() => {
    if (open && safeReport) {
      setFormData({
        client_mood: safeReport.client_mood || '',
        client_engagement: safeReport.client_engagement || '',
        carer_observations: safeReport.carer_observations || '',
        client_feedback: safeReport.client_feedback || '',
        next_visit_preparations: safeReport.next_visit_preparations || '',
      });
    }
  }, [open, fetchedReport?.id, fetchedReport?.updated_at]);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Mutation hook for updating the report
  const updateServiceReport = useUpdateServiceReport();

  // Determine if report has missing required fields (truly incomplete)
  const hasMissingFields = !safeReport?.client_mood || 
                           !safeReport?.client_engagement || 
                           !safeReport?.carer_observations?.trim();

  // Report is editable for carers regardless of status (not in admin mode)
  const isEditable = !adminMode && safeReport;

  // Determine if report is submitted and awaiting approval
  const isAwaitingApproval = safeReport?.status === 'pending' && !hasMissingFields;

  // ALL HOOKS MUST BE CALLED HERE - before any early returns
  // Fetch visit record data
  const { data: visitRecord, isLoading: visitRecordLoading } = useQuery({
    queryKey: ['visit-record', safeReport?.visit_record_id],
    queryFn: async () => {
      if (!safeReport?.visit_record_id) return null;
      
      const { data, error } = await supabase
        .from('visit_records')
        .select('*')
        .eq('id', safeReport.visit_record_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!safeReport?.visit_record_id && open && !!report,
  });

  // Fetch all related data using hooks - only if visit_record_id exists
  const { tasks = [], isLoading: tasksLoading } = useVisitTasks(safeReport?.visit_record_id);
  const { medications = [], isLoading: medsLoading } = useVisitMedications(safeReport?.visit_record_id);
  const { vitals = [], news2Readings = [], latestNEWS2, isLoading: vitalsLoading } = useVisitVitals(safeReport?.visit_record_id);
  const { events = [], incidents = [], accidents = [], observations = [], isLoading: eventsLoading } = useVisitEvents(safeReport?.visit_record_id);

  // Fetch client's care plan for goals and activities display
  // Use consistent ACTIVE_CARE_PLAN_STATUSES for filtering
  const { data: clientCarePlan } = useQuery({
    queryKey: ['client-care-plan-for-view', safeReport?.client_id],
    queryFn: async () => {
      if (!safeReport?.client_id) return null;
      const ACTIVE_STATUSES = ['draft', 'pending_approval', 'pending_client_approval', 'active', 'approved', 'confirmed'];
      const { data, error } = await supabase
        .from('client_care_plans')
        .select('id')
        .eq('client_id', safeReport.client_id)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!safeReport?.client_id && open,
  });

  // Fetch care plan JSON data for fallback tasks and medications
  const { data: carePlanJsonData } = useCarePlanJsonData(clientCarePlan?.id || '');

  // Transform care plan tasks for fallback when visit_tasks is empty
  const carePlanTasksFallback = useMemo(() => {
    if (!carePlanJsonData?.tasks || carePlanJsonData.tasks.length === 0) return [];
    return carePlanJsonData.tasks.map(task => ({
      id: task.id,
      task_category: task.task_category,
      task_name: task.task_name,
      is_completed: false,
      completed_at: undefined,
      notes: undefined,
      priority: 'medium',
    }));
  }, [carePlanJsonData?.tasks]);

  // Transform care plan medications for fallback when visit_medications is empty
  const carePlanMedicationsFallback = useMemo(() => {
    if (!carePlanJsonData?.medications || carePlanJsonData.medications.length === 0) return [];
    return carePlanJsonData.medications.map(med => ({
      id: med.id,
      medication_name: med.name,
      dosage: med.dosage,
      route: undefined,
      prescribed_time: undefined,
      is_administered: false,
      administration_time: undefined,
      administration_notes: undefined,
      missed_reason: undefined,
    }));
  }, [carePlanJsonData?.medications]);

  // Use visit data if available, otherwise fallback to care plan data
  const effectiveTasksRaw = tasks.length > 0 ? tasks : carePlanTasksFallback;
  const effectiveMedicationsRaw = medications.length > 0 ? medications : carePlanMedicationsFallback;

  // Deduplicate tasks by category + normalized name to handle legacy duplicates
  const effectiveTasks = React.useMemo(() => {
    const seen = new Set<string>();
    return effectiveTasksRaw.filter(task => {
      const key = `${task.task_category}:${(task.task_name || '').toLowerCase().trim().replace(/\s+/g, ' ')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [effectiveTasksRaw]);

  // Deduplicate medications by normalized name + dosage to handle legacy duplicates
  const effectiveMedications = React.useMemo(() => {
    const seen = new Set<string>();
    return effectiveMedicationsRaw.filter(med => {
      const key = `${(med.medication_name || '').toLowerCase().trim()}:${(med.dosage || '').toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [effectiveMedicationsRaw]);

  const isDataLoading = isFetchingReport || visitRecordLoading || tasksLoading || medsLoading || vitalsLoading || eventsLoading;

  // NOW we can do the early return - AFTER all hooks are called
  if (!report || !safeReport) return null;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle },
      requires_revision: { variant: 'outline', icon: AlertTriangle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getMoodIcon = (mood: string) => {
    const moodIcons: Record<string, string> = {
      Happy: '😊',
      Content: '😌',
      Neutral: '😐',
      Anxious: '😰',
      Sad: '😢',
      Confused: '😕',
      Agitated: '😠',
      Calm: '😇',
    };
    return moodIcons[mood] || '😐';
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.client_mood || !formData.client_engagement || !formData.carer_observations.trim()) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please complete Client Mood, Client Engagement, and Carer Observations.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateServiceReport.mutateAsync({
        id: safeReport.id,
        updates: {
          client_mood: formData.client_mood,
          client_engagement: formData.client_engagement,
          carer_observations: formData.carer_observations,
          client_feedback: formData.client_feedback,
          next_visit_preparations: formData.next_visit_preparations,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        },
      });

      toast({
        title: 'Report Submitted',
        description: 'Your report has been submitted for admin approval.',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit the report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Use the shared PDF generation utility
      const { generatePDFForServiceReport } = await import('@/utils/serviceReportPdfExporter');
      await generatePDFForServiceReport(safeReport, safeReport.branch_id);
      toast({
        title: "Success",
        description: "Service report downloaded successfully",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                <AvatarImage src={safeReport.clients.avatar_url} />
                <AvatarFallback>
                  {safeReport.clients.first_name?.[0] || 'C'}{safeReport.clients.last_name?.[0] || 'L'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <DialogTitle className="text-lg sm:text-2xl">
                  <span className="hidden sm:inline">Service Report: </span>
                  {safeReport.clients.first_name} {safeReport.clients.last_name}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <User className="h-3 w-3" />
                    <span className="hidden sm:inline">Carer:</span> {safeReport.staff.first_name}
                  </Badge>
                  {getStatusBadge(safeReport.status)}
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="gap-2 w-full sm:w-auto"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span> PDF
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-140px)] overflow-y-auto px-4 sm:px-6 pb-6">
          <div className="space-y-6 mt-6">
            {/* Status Message Card */}
            {(isEditable || isAwaitingApproval || safeReport.status === 'approved' || safeReport.status === 'rejected') && (
              <Card className={`border ${
                safeReport.status === 'approved' ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800' :
                safeReport.status === 'rejected' ? 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800' :
                isAwaitingApproval ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800' :
                'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800'
              }`}>
                <CardContent className="py-4">
                  <div className={`flex items-center gap-2 ${
                    safeReport.status === 'approved' ? 'text-green-800 dark:text-green-200' :
                    safeReport.status === 'rejected' ? 'text-red-800 dark:text-red-200' :
                    isAwaitingApproval ? 'text-blue-800 dark:text-blue-200' :
                    'text-amber-800 dark:text-amber-200'
                  }`}>
                    {safeReport.status === 'approved' ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <p className="text-sm font-medium">This report has been approved by admin</p>
                      </>
                    ) : safeReport.status === 'rejected' ? (
                      <>
                        <XCircle className="h-5 w-5" />
                        <p className="text-sm font-medium">
                          This report was rejected. {safeReport.review_notes && `Reason: ${safeReport.review_notes}`}
                        </p>
                      </>
                    ) : isAwaitingApproval ? (
                      <>
                        <Clock className="h-5 w-5" />
                        <p className="text-sm font-medium">This report is submitted and awaiting admin approval</p>
                      </>
                    ) : safeReport.status === 'requires_revision' ? (
                      <>
                        <AlertTriangle className="h-5 w-5" />
                        <p className="text-sm font-medium">
                          This report requires revision - Please update the required fields and resubmit
                          {safeReport.review_notes && `. Admin notes: ${safeReport.review_notes}`}
                        </p>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5" />
                        <p className="text-sm font-medium">
                          This report is incomplete - Please complete the required fields and submit for approval
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {isDataLoading && safeReport.visit_record_id && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Loading visit details...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visit Summary Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Visit Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Service Date</p>
                    <p className="font-medium flex items-center gap-1 text-sm sm:text-base">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">{formatSafeDate(safeReport.service_date, 'PP')}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium flex items-center gap-1 text-sm sm:text-base">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      {safeReport.service_duration_minutes || 0} min
                    </p>
                  </div>
                  {visitRecord?.visit_start_time && formatSafeDate(visitRecord.visit_start_time, 'p') !== 'N/A' && (
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Start Time</p>
                      <p className="font-medium text-sm sm:text-base">
                        {formatSafeDate(visitRecord.visit_start_time, 'p')}
                      </p>
                    </div>
                  )}
                  {visitRecord?.visit_end_time && formatSafeDate(visitRecord.visit_end_time, 'p') !== 'N/A' && (
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">End Time</p>
                      <p className="font-medium text-sm sm:text-base">
                        {formatSafeDate(visitRecord.visit_end_time, 'p')}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Services Provided */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Services Provided</p>
                  <div className="flex flex-wrap gap-2">
                    {safeReport.services_provided.length > 0 ? (
                      safeReport.services_provided.map((service: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {service}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No services recorded</span>
                    )}
                  </div>
                </div>

                {/* Carer Visit Notes (Primary - what carer actually wrote) */}
                {visitRecord?.visit_notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Carer Visit Notes</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                      {visitRecord.visit_notes}
                    </p>
                  </div>
                )}

                {/* System Summary (Secondary - auto-generated) */}
                {visitRecord?.visit_summary && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">System Summary</p>
                    <p className="text-sm bg-muted/30 p-3 rounded-md text-muted-foreground italic">
                      {visitRecord.visit_summary}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Details Section - Always Show */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Task Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {effectiveTasks && effectiveTasks.length > 0 ? (
                  <TasksTable tasks={effectiveTasks} />
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No tasks recorded for this visit</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medication Details Section - Always Show */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medication Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {effectiveMedications && effectiveMedications.length > 0 ? (
                  <MedicationsTable medications={effectiveMedications} />
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Pill className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No medications recorded for this visit</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* NEWS2 & Vital Signs Section - Always Show */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  NEWS2 & Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(news2Readings.length > 0 || vitals.length > 0) ? (
                  <NEWS2Display 
                    news2Readings={news2Readings} 
                    latestNEWS2={latestNEWS2}
                    otherVitals={vitals.filter(v => v.vital_type !== 'news2')}
                  />
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Heart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No vital signs recorded for this visit</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Events & Incidents Section - Always Show */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Events & Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {events && events.length > 0 ? (
                  <EventsList 
                    incidents={incidents}
                    accidents={accidents}
                    observations={observations}
                  />
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No events recorded for this visit</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Carer Visit Details - Editable Section */}
            {isEditable ? (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smile className="h-5 w-5" />
                    Carer Visit Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Client Mood */}
                    <div className="space-y-2">
                      <Label htmlFor="client_mood">
                        Client Mood <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.client_mood}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, client_mood: value }))}
                      >
                        <SelectTrigger id="client_mood">
                          <SelectValue placeholder="Select mood" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Happy">😊 Happy</SelectItem>
                          <SelectItem value="Content">😌 Content</SelectItem>
                          <SelectItem value="Neutral">😐 Neutral</SelectItem>
                          <SelectItem value="Anxious">😰 Anxious</SelectItem>
                          <SelectItem value="Sad">😢 Sad</SelectItem>
                          <SelectItem value="Confused">😕 Confused</SelectItem>
                          <SelectItem value="Agitated">😠 Agitated</SelectItem>
                          <SelectItem value="Calm">😇 Calm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Client Engagement */}
                    <div className="space-y-2">
                      <Label htmlFor="client_engagement">
                        Client Engagement <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.client_engagement}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, client_engagement: value }))}
                      >
                        <SelectTrigger id="client_engagement">
                          <SelectValue placeholder="Select engagement level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Very Engaged">Very Engaged</SelectItem>
                          <SelectItem value="Engaged">Engaged</SelectItem>
                          <SelectItem value="Somewhat Engaged">Somewhat Engaged</SelectItem>
                          <SelectItem value="Limited Engagement">Limited Engagement</SelectItem>
                          <SelectItem value="Not Engaged">Not Engaged</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Carer Observations */}
                  <div className="space-y-2">
                    <Label htmlFor="carer_observations">
                      Carer Observation <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="carer_observations"
                      placeholder="Enter your observations about the client during this visit..."
                      value={formData.carer_observations}
                      onChange={(e) => setFormData(prev => ({ ...prev, carer_observations: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Next Visit Preparations */}
                  <div className="space-y-2">
                    <Label htmlFor="next_visit_preparations">
                      Next Visit Preparations
                    </Label>
                    <Textarea
                      id="next_visit_preparations"
                      placeholder="Enter any preparations or notes for the next visit (optional)..."
                      value={formData.next_visit_preparations}
                      onChange={(e) => setFormData(prev => ({ ...prev, next_visit_preparations: e.target.value }))}
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* Client Feedback */}
                  <div className="space-y-2">
                    <Label htmlFor="client_feedback">Client Feedback</Label>
                    <Textarea
                      id="client_feedback"
                      placeholder="Enter any feedback from the client (optional)..."
                      value={formData.client_feedback}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_feedback: e.target.value }))}
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSubmit}
                      disabled={updateServiceReport.isPending}
                      className="gap-2"
                    >
                      {updateServiceReport.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Report
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Client Mood & Engagement - Read Only */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smile className="h-5 w-5" />
                      Client Mood & Engagement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Client Mood</p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getMoodIcon(safeReport.client_mood)}</span>
                          <Badge variant="outline">{safeReport.client_mood || 'Not recorded'}</Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Engagement Level</p>
                        <Badge variant="secondary">{safeReport.client_engagement || 'Not recorded'}</Badge>
                      </div>
                    </div>

                  </CardContent>
                </Card>

                {/* Visit Notes Section - Read Only */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Visit Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Activities Undertaken - to match Edit mode order */}
                    {safeReport.activities_undertaken && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Activities Undertaken
                        </p>
                        <p className="text-sm bg-muted/50 p-3 rounded-md">
                          {safeReport.activities_undertaken}
                        </p>
                      </div>
                    )}

                    {/* Carer Observations */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Carer Observations
                      </p>
                      <p className="text-sm bg-muted/50 p-3 rounded-md">
                        {safeReport.carer_observations || 'No observations recorded'}
                      </p>
                    </div>

                    {/* Client Feedback */}
                    {safeReport.client_feedback && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Client Feedback
                        </p>
                        <p className="text-sm bg-muted/50 p-3 rounded-md">
                          {safeReport.client_feedback}
                        </p>
                      </div>
                    )}

                    {/* Next Visit Preparations */}
                    {safeReport.next_visit_preparations && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Next Visit Preparations
                        </p>
                        <p className="text-sm bg-muted/50 p-3 rounded-md">
                          {safeReport.next_visit_preparations}
                        </p>
                      </div>
                    )}

                    {/* Carer Visit Notes (from visit_records - system notes) */}
                    {visitRecord?.visit_notes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Carer Visit Notes
                        </p>
                        <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                          {visitRecord.visit_notes}
                        </p>
                      </div>
                    )}

                    {/* Medication Notes */}
                    {safeReport.medication_administered && safeReport.medication_notes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Medication Notes
                        </p>
                        <p className="text-sm bg-muted/50 p-3 rounded-md">
                          {safeReport.medication_notes}
                        </p>
                      </div>
                    )}

                    {/* Incident Details */}
                    {safeReport.incident_occurred && safeReport.incident_details && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Incident Details
                        </p>
                        <p className="text-sm bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
                          {safeReport.incident_details}
                        </p>
                      </div>
                    )}

                    {/* Review Notes (if any) */}
                    {safeReport.review_notes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Review Notes (Admin)
                        </p>
                        <p className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                          {safeReport.review_notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Signatures Section */}
            {(visitRecord?.staff_signature_data || visitRecord?.client_signature_data) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PenTool className="h-5 w-5" />
                    Signatures
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SignatureDisplay
                    carerSignature={visitRecord?.staff_signature_data}
                    carerName={`${safeReport.staff?.first_name} ${safeReport.staff?.last_name}`}
                    clientSignature={visitRecord?.client_signature_data}
                    clientName={`${safeReport.clients?.first_name} ${safeReport.clients?.last_name}`}
                  />
                </CardContent>
              </Card>
            )}


            {/* Report Metadata */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Report Created</p>
                    <p className="font-medium">
                      {formatSafeDate(report.created_at, 'PPp')}
                    </p>
                  </div>
                  {formatSafeDate(report.updated_at, 'PPp') !== 'N/A' && (
                    <div>
                      <p className="text-muted-foreground">Last Updated</p>
                      <p className="font-medium">
                        {formatSafeDate(report.updated_at, 'PPp')}
                      </p>
                    </div>
                  )}
                  {formatSafeDate(report.reviewed_at, 'PPp') !== 'N/A' && (
                    <div>
                      <p className="text-muted-foreground">Reviewed At</p>
                      <p className="font-medium">
                        {formatSafeDate(report.reviewed_at, 'PPp')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
