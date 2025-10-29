
import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Calendar, Clock, MapPin, User, FileText } from 'lucide-react';
import { EventLog } from '@/data/hooks/useEventsLogs';
import { BodyMapViewer } from './BodyMapViewer';
import { EventStaffDetailsView } from './EventStaffDetailsView';
import { EventFollowUpView } from './EventFollowUpView';
import { EventActionsView } from './EventActionsView';
import { EventRiskAssessmentView } from './EventRiskAssessmentView';
import { EventComplianceView } from './EventComplianceView';
import { EventAttachmentsView } from './EventAttachmentsView';
import { exportEventToPDF } from '@/lib/exportEvents';
import { useBranchStaff } from '@/hooks/useBranchStaff';
import { toast } from 'sonner';

interface EventDetailsDialogProps {
  event: EventLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (event: EventLog) => void;
}

export function EventDetailsDialog({ event, open, onOpenChange, onEdit }: EventDetailsDialogProps) {
  if (!event) return null;

  // Fetch staff data for the event's branch
  const { data: branchStaff = [] } = useBranchStaff(event.branch_id || '');
  
  // Create a mapping of staff IDs to names
  const staffNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    branchStaff.forEach(staff => {
      const fullName = `${staff.first_name} ${staff.last_name}`.trim();
      map.set(staff.id, fullName);
    });
    return map;
  }, [branchStaff]);

  // Helper function to resolve staff IDs to names
  const resolveStaffName = (staffId: string): string => {
    return staffNamesMap.get(staffId) || staffId;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Event Details
          </DialogTitle>
          <DialogDescription>
            View complete details for this event log entry
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{event.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge className={getSeverityColor(event.severity)}>
                  {event.severity}
                </Badge>
                <Badge className={getStatusColor(event.status)}>
                  {event.status}
                </Badge>
                <Badge variant="outline">
                  {event.event_type}
                </Badge>
                <Badge variant="outline">
                  {event.category}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Client Information */}
          {event.client_name && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Client Information</h4>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Client:</span>
                <span className="text-blue-800">{event.client_name}</span>
              </div>
            </div>
          )}

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Reporter:</span>
                <span>{event.reporter}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Created:</span>
                <span>{format(new Date(event.created_at), 'PPP')}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Time:</span>
                <span>{format(new Date(event.created_at), 'p')}</span>
              </div>
            </div>

            <div className="space-y-3">
              {event.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Location:</span>
                  <span>{event.location}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Last Updated:</span>
                <span>{format(new Date(event.updated_at), 'PPp')}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Description</h4>
                <div className="bg-gray-50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                  {event.description}
                </div>
              </div>
            </>
          )}

          {/* Enhanced Details in Tabs */}
          <Separator />
          
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="risk">Risk</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="attachments">Files</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Body Map Points */}
              {event.body_map_points && Array.isArray(event.body_map_points) && event.body_map_points.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Body Map</h4>
                  <BodyMapViewer 
                    bodyMapPoints={event.body_map_points}
                    frontImageUrl={event.body_map_front_image_url}
                    backImageUrl={event.body_map_back_image_url}
                  />
                </div>
              )}

              {/* Follow-up Requirements */}
              <EventFollowUpView
                actionRequired={event.action_required}
                followUpDate={event.follow_up_date}
                followUpAssignedTo={event.follow_up_assigned_to ? resolveStaffName(event.follow_up_assigned_to) : undefined}
                followUpNotes={event.follow_up_notes}
              />
            </TabsContent>
            
            <TabsContent value="staff" className="mt-4">
              <EventStaffDetailsView
                staffPresent={event.staff_present?.map(resolveStaffName)}
                staffAware={event.staff_aware?.map(resolveStaffName)}
                otherPeoplePresent={event.other_people_present}
              />
            </TabsContent>
            
            <TabsContent value="actions" className="mt-4">
              <EventActionsView
                immediateActionsTaken={event.immediate_actions_taken}
                investigationRequired={event.investigation_required}
                investigationAssignedTo={event.investigation_assigned_to ? resolveStaffName(event.investigation_assigned_to) : undefined}
                expectedResolutionDate={event.expected_resolution_date}
                lessonsLearned={event.lessons_learned}
              />
            </TabsContent>
            
            <TabsContent value="risk" className="mt-4">
              <EventRiskAssessmentView
                riskLevel={event.risk_level}
                contributingFactors={event.contributing_factors}
                environmentalFactors={event.environmental_factors}
                preventable={event.preventable}
                similarIncidents={event.similar_incidents}
              />
            </TabsContent>
            
            <TabsContent value="compliance" className="mt-4">
              <EventComplianceView
                familyNotified={event.family_notified}
                familyNotificationDate={event.family_notification_date}
                familyNotificationMethod={event.family_notification_method}
                gpNotified={event.gp_notified}
                gpNotificationDate={event.gp_notification_date}
                insuranceNotified={event.insurance_notified}
                insuranceNotificationDate={event.insurance_notification_date}
                externalReportingRequired={event.external_reporting_required}
                externalReportingDetails={event.external_reporting_details}
              />
            </TabsContent>
            
            <TabsContent value="attachments" className="mt-4">
              <EventAttachmentsView attachments={event.attachments} />
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await exportEventToPDF(event);
                } catch (error) {
                  console.error('Error exporting PDF:', error);
                  toast.error('Failed to export PDF');
                }
              }}
            >
              <FileText className="h-4 w-4 mr-1" />
              Export PDF
            </Button>
          </div>
          {onEdit && (
            <Button onClick={() => onEdit(event)}>
              Edit Event
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
