import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, 
  FileText, 
  User, 
  Calendar, 
  Smile, 
  AlertCircle,
  Pin,
  Clock,
  Phone,
  MapPin
} from "lucide-react";
import { useHandoverData } from "@/hooks/useHandoverData";
import { useClientPersonalInfo } from "@/hooks/useClientPersonalInfo";
import { format, formatDistanceToNow } from "date-fns";

interface HandoverSummaryTabProps {
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  clientAddress?: string;
}

export const HandoverSummaryTab: React.FC<HandoverSummaryTabProps> = ({ 
  clientId, 
  clientName,
  clientPhone,
  clientAddress
}) => {
  const { 
    recentVisits, 
    moodReports, 
    clientNotes, 
    openEvents, 
    isLoading,
    isError
  } = useHandoverData(clientId);
  
  const { data: personalInfo, isLoading: isLoadingPersonal } = useClientPersonalInfo(clientId);

  // Debug logging
  useEffect(() => {
    console.log('[HandoverSummaryTab] Mounted for client:', clientId);
    console.log('[HandoverSummaryTab] Data state:', { 
      recentVisits: recentVisits.length, 
      moodReports: moodReports.length,
      clientNotes: clientNotes.length,
      openEvents: openEvents.length,
      personalInfo: !!personalInfo,
      isLoading,
      isLoadingPersonal,
      isError
    });
  }, [clientId, recentVisits, moodReports, clientNotes, openEvents, personalInfo, isLoading, isLoadingPersonal, isError]);

  if (isLoading || isLoadingPersonal) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-medium text-destructive">Error Loading Data</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Failed to load handover information. Please try refreshing.
        </p>
      </div>
    );
  }

  const warnings = personalInfo?.warnings || [];
  const instructions = personalInfo?.instructions || [];
  const hasAlerts = openEvents.length > 0 || warnings.length > 0;

  // Calculate mood summary
  const moodSummary = moodReports.reduce((acc, report) => {
    if (report.client_mood) {
      acc[report.client_mood] = (acc[report.client_mood] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <ScrollArea className="h-[calc(100vh-350px)]">
      <div className="space-y-6 pr-4">
        {/* Client Basic Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              Client Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{clientName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone
                </p>
                <p className="text-sm">{clientPhone || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Address
                </p>
                <p className="text-sm">{clientAddress || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Update Timestamp */}
        {recentVisits.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>Last updated: {format(new Date(recentVisits[0].visit_start_time), 'dd MMM yyyy, HH:mm')}</span>
            <span className="text-xs">({formatDistanceToNow(new Date(recentVisits[0].visit_start_time), { addSuffix: true })})</span>
          </div>
        )}
      {/* Priority Alerts Section */}
      {hasAlerts && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Priority Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Open Events/Incidents */}
            {openEvents.map((event) => (
              <div 
                key={event.id} 
                className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{event.event_type}</span>
                    {event.severity && (
                      <Badge 
                        variant={event.severity === 'critical' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {event.severity}
                      </Badge>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(event.event_date), 'dd MMM yyyy')}
                    {event.reporter && ` • Reported by ${event.reporter}`}
                  </p>
                </div>
              </div>
            ))}

            {/* Standing Warnings */}
            {warnings.map((warning, index) => (
              <div 
                key={`warning-${index}`} 
                className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20"
              >
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{warning}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Standing Instructions */}
      {instructions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Pin className="h-4 w-4 text-primary" />
              Standing Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {instructions.map((instruction, index) => (
              <div 
                key={`instruction-${index}`} 
                className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10"
              >
                <span className="text-sm">{instruction}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Last Visit & Carer Info */}
      {recentVisits.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Last Visit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <User className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">
                  {recentVisits[0].staff 
                    ? `${recentVisits[0].staff.first_name} ${recentVisits[0].staff.last_name}`
                    : 'Unknown Carer'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(recentVisits[0].visit_start_time), { addSuffix: true })}
                  {' • '}
                  {format(new Date(recentVisits[0].visit_start_time), 'dd MMM yyyy, HH:mm')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Visit Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" />
            Recent Visit Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent visit records found
            </p>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-4">
                {recentVisits.map((visit) => (
                  <div 
                    key={visit.id} 
                    className="p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {visit.staff 
                            ? `${visit.staff.first_name} ${visit.staff.last_name}`
                            : 'Unknown Carer'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(visit.visit_start_time), 'dd MMM yyyy, HH:mm')}
                      </span>
                    </div>
                    
                    {visit.visit_notes && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Visit Notes:</p>
                        <p className="text-sm whitespace-pre-wrap">{visit.visit_notes}</p>
                      </div>
                    )}
                    
                    {visit.visit_summary && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Care Plan Updates:</p>
                        <p className="text-sm whitespace-pre-wrap">{visit.visit_summary}</p>
                      </div>
                    )}
                    
                    {!visit.visit_notes && !visit.visit_summary && (
                      <p className="text-sm text-muted-foreground italic">No notes recorded</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Mood & Engagement Trends */}
      {moodReports.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Smile className="h-4 w-4 text-primary" />
              Mood & Engagement Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(moodSummary).map(([mood, count]) => (
                <Badge key={mood} variant="secondary" className="text-sm">
                  {mood}: {count} visit{count > 1 ? 's' : ''}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Based on last {moodReports.length} service report{moodReports.length > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Client Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Recent Client Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No client notes found
            </p>
          ) : (
            <div className="space-y-3">
              {clientNotes.map((note) => (
                <div 
                  key={note.id} 
                  className="p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{note.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {note.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {note.content}
                    </p>
                  )}
                  {note.author && (
                    <p className="text-xs text-muted-foreground mt-1">
                      By {note.author}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

        {/* Empty State */}
        {!hasAlerts && 
         instructions.length === 0 && 
         recentVisits.length === 0 && 
         clientNotes.length === 0 && 
         moodReports.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                No Handover Information Available
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Visit records, notes, and alerts will appear here as care is provided.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};
