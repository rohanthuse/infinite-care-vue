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
import { AlertTriangle, AlertCircle, Eye, Clock, Plus, X } from 'lucide-react';
import { formatSafeDate } from '@/lib/dateUtils';
import { VisitEvent } from '@/hooks/useVisitEvents';

interface EventChange {
  event_title: string;
  event_description: string;
  severity: string;
  follow_up_required: boolean;
  follow_up_notes: string;
}

interface NewEvent {
  event_type: 'incident' | 'accident' | 'observation';
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
  onAddEvent?: (event: NewEvent) => void;
  allowManualAdd?: boolean;
}

export function EditableEventsList({ 
  incidents, 
  accidents, 
  observations, 
  onEventsChange,
  onAddEvent,
  allowManualAdd = true 
}: EditableEventsListProps) {
  const [eventChanges, setEventChanges] = useState<Map<string, EventChange>>(new Map());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEvent>({
    event_type: 'observation',
    event_title: '',
    event_description: '',
    severity: 'low',
    follow_up_required: false,
    follow_up_notes: '',
  });
  const [manualEvents, setManualEvents] = useState<(NewEvent & { tempId: string; event_time: string })[]>([]);
  
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

  const handleAddEvent = () => {
    if (!newEvent.event_title || !newEvent.event_description) return;
    
    const tempId = `manual-event-${Date.now()}`;
    const eventToAdd = { 
      ...newEvent, 
      tempId, 
      event_time: new Date().toISOString() 
    };
    setManualEvents([...manualEvents, eventToAdd]);
    
    // Add to changes map
    const newChanges = new Map(eventChanges);
    newChanges.set(tempId, {
      event_title: newEvent.event_title,
      event_description: newEvent.event_description,
      severity: newEvent.severity,
      follow_up_required: newEvent.follow_up_required,
      follow_up_notes: newEvent.follow_up_notes,
    });
    setEventChanges(newChanges);
    onEventsChange(newChanges);
    
    if (onAddEvent) {
      onAddEvent(newEvent);
    }
    
    // Reset form
    setNewEvent({
      event_type: 'observation',
      event_title: '',
      event_description: '',
      severity: 'low',
      follow_up_required: false,
      follow_up_notes: '',
    });
    setShowAddForm(false);
  };

  const handleRemoveManualEvent = (tempId: string) => {
    setManualEvents(manualEvents.filter(e => e.tempId !== tempId));
    const newChanges = new Map(eventChanges);
    newChanges.delete(tempId);
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

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'incident': return <AlertCircle className="h-4 w-4" />;
      case 'accident': return <AlertTriangle className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const EditableEventCard = ({ event, isManual = false, tempId }: { event: VisitEvent | any; isManual?: boolean; tempId?: string }) => {
    const id = isManual ? tempId! : event.id;
    const change = eventChanges.get(id);
    const currentTitle = change?.event_title ?? event.event_title;
    const currentDescription = change?.event_description ?? event.event_description;
    const currentSeverity = change?.severity ?? event.severity;
    const currentFollowUpRequired = change?.follow_up_required ?? event.follow_up_required;
    const currentFollowUpNotes = change?.follow_up_notes ?? event.follow_up_notes ?? '';

    return (
      <Alert className={`${currentSeverity === 'high' || currentSeverity === 'critical' ? 'border-red-500' : ''} relative`}>
        {isManual && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveManualEvent(tempId!)}
            className="absolute top-2 right-2 h-6 w-6 p-0 text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {getEventTypeIcon(event.event_type)}
        <AlertTitle className="flex items-center justify-between mb-3 pr-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatSafeDate(event.event_time, 'PPp')}
            {isManual && <Badge variant="secondary" className="text-xs">New</Badge>}
          </div>
          {getSeverityBadge(currentSeverity)}
        </AlertTitle>
        <AlertDescription className="space-y-4">
          <div className="space-y-2">
            <Label>Event Title</Label>
            <Input
              value={currentTitle}
              onChange={(e) => handleEventChange(id, 'event_title', e.target.value)}
              placeholder="Event title..."
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={currentDescription}
              onChange={(e) => handleEventChange(id, 'event_description', e.target.value)}
              placeholder="Describe the event..."
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={currentSeverity}
                onValueChange={(value) => handleEventChange(id, 'severity', value)}
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
                  onCheckedChange={(checked) => handleEventChange(id, 'follow_up_required', checked)}
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
                onChange={(e) => handleEventChange(id, 'follow_up_notes', e.target.value)}
                placeholder="Add follow-up notes..."
                className="min-h-[60px]"
              />
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  const allEventsWithManual = [
    ...allEvents,
    ...manualEvents.map(e => ({ ...e, id: e.tempId, isManual: true }))
  ];

  if (allEventsWithManual.length === 0 && !showAddForm) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="mb-4">No events recorded for this visit</p>
        {allowManualAdd && (
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Event Button */}
      {allowManualAdd && !showAddForm && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      )}

      {/* Add Event Form */}
      {showAddForm && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Add New Event</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={newEvent.event_type}
              onValueChange={(value: 'incident' | 'accident' | 'observation') => 
                setNewEvent({ ...newEvent, event_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="observation">Observation</SelectItem>
                <SelectItem value="incident">Incident</SelectItem>
                <SelectItem value="accident">Accident</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={newEvent.severity}
              onValueChange={(value) => setNewEvent({ ...newEvent, severity: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            value={newEvent.event_title}
            onChange={(e) => setNewEvent({ ...newEvent, event_title: e.target.value })}
            placeholder="Event title *"
          />
          <Textarea
            value={newEvent.event_description}
            onChange={(e) => setNewEvent({ ...newEvent, event_description: e.target.value })}
            placeholder="Description *"
            className="min-h-[80px]"
          />
          <div className="flex items-center gap-3">
            <Switch
              checked={newEvent.follow_up_required}
              onCheckedChange={(checked) => setNewEvent({ ...newEvent, follow_up_required: checked })}
            />
            <span className="text-sm">Follow-up required</span>
          </div>
          {newEvent.follow_up_required && (
            <Textarea
              value={newEvent.follow_up_notes}
              onChange={(e) => setNewEvent({ ...newEvent, follow_up_notes: e.target.value })}
              placeholder="Follow-up notes"
              className="min-h-[60px]"
            />
          )}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleAddEvent} 
              disabled={!newEvent.event_title || !newEvent.event_description}
            >
              Add Event
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {allEventsWithManual.length > 0 && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All ({allEventsWithManual.length})
            </TabsTrigger>
            <TabsTrigger value="incidents">
              Incidents ({incidents.length + manualEvents.filter(e => e.event_type === 'incident').length})
            </TabsTrigger>
            <TabsTrigger value="accidents">
              Accidents ({accidents.length + manualEvents.filter(e => e.event_type === 'accident').length})
            </TabsTrigger>
            <TabsTrigger value="observations">
              Observations ({observations.length + manualEvents.filter(e => e.event_type === 'observation').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {allEvents.map((event) => (
              <EditableEventCard key={event.id} event={event} />
            ))}
            {manualEvents.map((event) => (
              <EditableEventCard key={event.tempId} event={event} isManual tempId={event.tempId} />
            ))}
          </TabsContent>

          <TabsContent value="incidents" className="space-y-3 mt-4">
            {incidents.length > 0 || manualEvents.some(e => e.event_type === 'incident') ? (
              <>
                {incidents.map((event) => <EditableEventCard key={event.id} event={event} />)}
                {manualEvents.filter(e => e.event_type === 'incident').map((event) => (
                  <EditableEventCard key={event.tempId} event={event} isManual tempId={event.tempId} />
                ))}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No incidents recorded</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="accidents" className="space-y-3 mt-4">
            {accidents.length > 0 || manualEvents.some(e => e.event_type === 'accident') ? (
              <>
                {accidents.map((event) => <EditableEventCard key={event.id} event={event} />)}
                {manualEvents.filter(e => e.event_type === 'accident').map((event) => (
                  <EditableEventCard key={event.tempId} event={event} isManual tempId={event.tempId} />
                ))}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No accidents recorded</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="observations" className="space-y-3 mt-4">
            {observations.length > 0 || manualEvents.some(e => e.event_type === 'observation') ? (
              <>
                {observations.map((event) => <EditableEventCard key={event.id} event={event} />)}
                {manualEvents.filter(e => e.event_type === 'observation').map((event) => (
                  <EditableEventCard key={event.tempId} event={event} isManual tempId={event.tempId} />
                ))}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No observations recorded</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
