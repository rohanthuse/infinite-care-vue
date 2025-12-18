import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, AlertCircle, Eye, Clock, Plus } from 'lucide-react';
import { formatSafeDate } from '@/lib/dateUtils';
import { VisitEvent } from '@/hooks/useVisitEvents';

interface EventChange {
  event_title: string;
  event_description: string;
  severity: string;
  follow_up_required: boolean;
  follow_up_notes: string;
}

interface EditableEventsListProps {
  incidents: VisitEvent[];
  accidents: VisitEvent[];
  observations: VisitEvent[];
  onEventsChange: (changes: Map<string, EventChange>) => void;
  onAddEvent?: (eventType: string) => void;
}

export function EditableEventsList({ 
  incidents, 
  accidents, 
  observations, 
  onEventsChange,
  onAddEvent 
}: EditableEventsListProps) {
  const [eventChanges, setEventChanges] = useState<Map<string, EventChange>>(new Map());
  const allEvents = [...incidents, ...accidents, ...observations];

  // Initialize with current event values
  useEffect(() => {
    const initialChanges = new Map<string, EventChange>();
    allEvents.forEach(event => {
      initialChanges.set(event.id, {
        event_title: event.event_title,
        event_description: event.event_description,
        severity: event.severity,
        follow_up_required: event.follow_up_required,
        follow_up_notes: event.follow_up_notes || '',
      });
    });
    setEventChanges(initialChanges);
  }, [incidents, accidents, observations]);

  const handleEventChange = (eventId: string, field: keyof EventChange, value: string | boolean) => {
    const newChanges = new Map(eventChanges);
    const current = newChanges.get(eventId) || {
      event_title: '',
      event_description: '',
      severity: 'low',
      follow_up_required: false,
      follow_up_notes: '',
    };
    newChanges.set(eventId, { ...current, [field]: value });
    setEventChanges(newChanges);
    onEventsChange(newChanges);
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-600',
      medium: 'bg-amber-600',
      high: 'bg-red-600',
      critical: 'bg-red-800',
    };

    return (
      <Badge className={colors[severity.toLowerCase()] || colors.low}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const EditableEventCard = ({ event }: { event: VisitEvent }) => {
    const change = eventChanges.get(event.id);
    const currentTitle = change?.event_title ?? event.event_title;
    const currentDescription = change?.event_description ?? event.event_description;
    const currentSeverity = change?.severity ?? event.severity;
    const currentFollowUpRequired = change?.follow_up_required ?? event.follow_up_required;
    const currentFollowUpNotes = change?.follow_up_notes ?? event.follow_up_notes ?? '';

    return (
      <Alert className={currentSeverity === 'high' || currentSeverity === 'critical' ? 'border-red-500' : ''}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatSafeDate(event.event_time, 'PPp')}
          </div>
          {getSeverityBadge(currentSeverity)}
        </AlertTitle>
        <AlertDescription className="space-y-4">
          <div className="space-y-2">
            <Label>Event Title</Label>
            <Input
              value={currentTitle}
              onChange={(e) => handleEventChange(event.id, 'event_title', e.target.value)}
              placeholder="Event title..."
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={currentDescription}
              onChange={(e) => handleEventChange(event.id, 'event_description', e.target.value)}
              placeholder="Describe the event..."
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={currentSeverity}
                onValueChange={(value) => handleEventChange(event.id, 'severity', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Follow-up Required</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={currentFollowUpRequired}
                  onCheckedChange={(checked) => handleEventChange(event.id, 'follow_up_required', checked)}
                />
                <span className="text-sm">{currentFollowUpRequired ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          {currentFollowUpRequired && (
            <div className="space-y-2">
              <Label>Follow-up Notes</Label>
              <Textarea
                value={currentFollowUpNotes}
                onChange={(e) => handleEventChange(event.id, 'follow_up_notes', e.target.value)}
                placeholder="Add follow-up notes..."
                className="min-h-[60px]"
              />
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  if (allEvents.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No events recorded for this visit</p>
        {onAddEvent && (
          <Button variant="outline" size="sm" className="mt-4" onClick={() => onAddEvent('incident')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        )}
      </div>
    );
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="all">
          All ({allEvents.length})
        </TabsTrigger>
        <TabsTrigger value="incidents">
          Incidents ({incidents.length})
        </TabsTrigger>
        <TabsTrigger value="accidents">
          Accidents ({accidents.length})
        </TabsTrigger>
        <TabsTrigger value="observations">
          Observations ({observations.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-3 mt-4">
        {allEvents.map((event) => (
          <EditableEventCard key={event.id} event={event} />
        ))}
      </TabsContent>

      <TabsContent value="incidents" className="space-y-3 mt-4">
        {incidents.length > 0 ? (
          incidents.map((event) => <EditableEventCard key={event.id} event={event} />)
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No incidents recorded</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="accidents" className="space-y-3 mt-4">
        {accidents.length > 0 ? (
          accidents.map((event) => <EditableEventCard key={event.id} event={event} />)
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No accidents recorded</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="observations" className="space-y-3 mt-4">
        {observations.length > 0 ? (
          observations.map((event) => <EditableEventCard key={event.id} event={event} />)
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No observations recorded</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
