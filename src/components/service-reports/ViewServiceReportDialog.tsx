import React, { useState } from 'react';
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
  Activity,
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
  AlertCircle
} from 'lucide-react';
import { TasksTable } from './view-report/TasksTable';
import { MedicationsTable } from './view-report/MedicationsTable';
import { NEWS2Display } from './view-report/NEWS2Display';
import { EventsList } from './view-report/EventsList';
import { SignatureDisplay } from './view-report/SignatureDisplay';
import { formatSafeDate } from '@/lib/dateUtils';

interface ViewServiceReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: any;
  adminMode?: boolean;
  onAdminReview?: (status: 'approved' | 'rejected' | 'requires_revision', notes: string, visibleToClient: boolean) => Promise<void>;
}

export function ViewServiceReportDialog({
  open,
  onOpenChange,
  report,
  adminMode = false,
  onAdminReview,
}: ViewServiceReportDialogProps) {
  // Create safeReport with fallbacks BEFORE any hooks
  const safeReport = report ? {
    ...report,
    clients: report.clients || { first_name: '', last_name: '', email: '' },
    staff: report.staff || { first_name: '', last_name: '', email: '' },
    services_provided: report.services_provided || [],
    client_mood: report.client_mood || '',
    client_engagement: report.client_engagement || '',
    carer_observations: report.carer_observations || '',
    client_feedback: report.client_feedback || '',
    activities_undertaken: report.activities_undertaken || '',
    medication_notes: report.medication_notes || '',
    incident_details: report.incident_details || '',
    next_visit_preparations: report.next_visit_preparations || '',
    review_notes: report.review_notes || '',
    medication_administered: report.medication_administered ?? false,
    incident_occurred: report.incident_occurred ?? false,
  } : null;

  // Form state for editable fields
  const [formData, setFormData] = useState({
    client_mood: safeReport?.client_mood || '',
    client_engagement: safeReport?.client_engagement || '',
    carer_observations: safeReport?.carer_observations || '',
    client_feedback: safeReport?.client_feedback || '',
  });

  // Admin review state
  const [adminReviewNotes, setAdminReviewNotes] = useState('');
  const [adminVisibleToClient, setAdminVisibleToClient] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Mutation hook for updating the report
  const updateServiceReport = useUpdateServiceReport();

  // Determine if report is editable (only for carer, not admin)
  const isEditable = !adminMode && safeReport && (
    safeReport.status === 'pending' ||
    safeReport.status === 'requires_revision' ||
    !safeReport.client_mood ||
    !safeReport.client_engagement ||
    !safeReport.carer_observations
  );

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

  const isDataLoading = visitRecordLoading || tasksLoading || medsLoading || vitalsLoading || eventsLoading;

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

  // Handle admin review actions
  const handleAdminReview = async (status: 'approved' | 'rejected' | 'requires_revision') => {
    if (isSubmittingReview) return;
    
    setIsSubmittingReview(true);
    try {
      if (onAdminReview) {
        await onAdminReview(status, adminReviewNotes, adminVisibleToClient);
      }
      setAdminReviewNotes('');
      setAdminVisibleToClient(true);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting admin review:', error);
      toast({
        title: 'Review Failed',
        description: 'Failed to submit the review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={safeReport.clients.avatar_url} />
                <AvatarFallback>
                  {safeReport.clients.first_name?.[0] || 'C'}{safeReport.clients.last_name?.[0] || 'L'}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl">
                  Service Report: {safeReport.clients.first_name} {safeReport.clients.last_name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Carer: {safeReport.staff.first_name} {safeReport.staff.last_name}
                  </Badge>
                  {getStatusBadge(safeReport.status)}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] px-6 pb-6">
          <div className="space-y-6 mt-6">
            {/* Edit Mode Indicator */}
            {isEditable && (
              <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="text-sm font-medium">
                      This report is incomplete - Please complete the required fields and submit for approval
                    </p>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Service Date</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatSafeDate(safeReport.service_date, 'PPP')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {safeReport.service_duration_minutes || 0} minutes
                    </p>
                  </div>
                  {visitRecord?.visit_start_time && formatSafeDate(visitRecord.visit_start_time, 'p') !== 'N/A' && (
                    <div>
                      <p className="text-sm text-muted-foreground">Start Time</p>
                      <p className="font-medium">
                        {formatSafeDate(visitRecord.visit_start_time, 'p')}
                      </p>
                    </div>
                  )}
                  {visitRecord?.visit_end_time && formatSafeDate(visitRecord.visit_end_time, 'p') !== 'N/A' && (
                    <div>
                      <p className="text-sm text-muted-foreground">End Time</p>
                      <p className="font-medium">
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

                {/* Visit Summary Text */}
                {visitRecord?.visit_summary && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Visit Summary</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">
                      {visitRecord.visit_summary}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Details Section */}
            {tasks && tasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Task Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TasksTable tasks={tasks} />
                </CardContent>
              </Card>
            )}

            {/* Medication Details Section */}
            {medications && medications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Medication Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MedicationsTable medications={medications} />
                </CardContent>
              </Card>
            )}

            {/* NEWS2 & Vital Signs Section */}
            {(news2Readings.length > 0 || vitals.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    NEWS2 & Vital Signs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NEWS2Display 
                    news2Readings={news2Readings} 
                    latestNEWS2={latestNEWS2}
                    otherVitals={vitals.filter(v => v.vital_type !== 'news2')}
                  />
                </CardContent>
              </Card>
            )}

            {/* Events & Incidents Section */}
            {events && events.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Events & Incidents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EventsList 
                    incidents={incidents}
                    accidents={accidents}
                    observations={observations}
                  />
                </CardContent>
              </Card>
            )}

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

                    {safeReport.activities_undertaken && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Activities Undertaken</p>
                        <p className="text-sm bg-muted/50 p-3 rounded-md">
                          {safeReport.activities_undertaken}
                        </p>
                      </div>
                    )}
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

            {/* Admin Review Section - Only visible in admin mode */}
            {adminMode && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <ClipboardCheck className="h-5 w-5" />
                    Admin Review & Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Review Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="admin_review_notes">Review Notes</Label>
                    <Textarea
                      id="admin_review_notes"
                      placeholder="Enter review notes or feedback (optional)..."
                      value={adminReviewNotes}
                      onChange={(e) => setAdminReviewNotes(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Visible to Client Checkbox - Only for approval */}
                  {safeReport.status === 'pending' && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="visible_to_client"
                        checked={adminVisibleToClient}
                        onCheckedChange={(checked) => setAdminVisibleToClient(checked as boolean)}
                      />
                      <Label htmlFor="visible_to_client" className="text-sm font-normal">
                        Make this report visible to the client after approval
                      </Label>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => handleAdminReview('approved')}
                      disabled={isSubmittingReview}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      {isSubmittingReview ? 'Processing...' : 'Approve Report'}
                    </Button>
                    <Button
                      onClick={() => handleAdminReview('requires_revision')}
                      disabled={isSubmittingReview}
                      variant="outline"
                      className="flex-1"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Request Revision
                    </Button>
                    <Button
                      onClick={() => handleAdminReview('rejected')}
                      disabled={isSubmittingReview}
                      variant="destructive"
                      className="flex-1"
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Reject Report
                    </Button>
                  </div>
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
