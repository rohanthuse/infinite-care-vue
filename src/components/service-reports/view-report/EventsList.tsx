import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { VisitEvent } from '@/hooks/useVisitEvents';

interface EventsListProps {
  incidents: VisitEvent[];
  accidents: VisitEvent[];
  observations: VisitEvent[];
}

export function EventsList({ incidents, accidents, observations }: EventsListProps) {
  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      low: { variant: 'default', className: 'bg-blue-600' },
      medium: { variant: 'secondary', className: 'bg-amber-600' },
      high: { variant: 'destructive', className: 'bg-red-600' },
      critical: { variant: 'destructive', className: 'bg-red-800' },
    };

    const config = variants[severity.toLowerCase()] || variants.low;

    return (
      <Badge variant={config.variant} className={config.className}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const EventCard = ({ event }: { event: VisitEvent }) => (
    <Alert className={event.severity === 'high' || event.severity === 'critical' ? 'border-red-500' : ''}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{event.event_title}</span>
        <div className="flex items-center gap-2">
          {getSeverityBadge(event.severity)}
          {event.follow_up_required && (
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              Follow-up Required
            </Badge>
          )}
        </div>
      </AlertTitle>
      <AlertDescription className="space-y-2 mt-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          {format(new Date(event.event_time), 'PPp')}
        </div>
        <p className="text-sm">{event.event_description}</p>
        {event.follow_up_notes && (
          <div className="mt-2 p-2 bg-muted/50 rounded-md">
            <p className="text-sm font-medium mb-1">Follow-up Notes:</p>
            <p className="text-sm text-muted-foreground">{event.follow_up_notes}</p>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );

  const allEvents = [...incidents, ...accidents, ...observations];

  if (allEvents.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No events recorded for this visit</p>
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
          <EventCard key={event.id} event={event} />
        ))}
      </TabsContent>

      <TabsContent value="incidents" className="space-y-3 mt-4">
        {incidents.length > 0 ? (
          incidents.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No incidents recorded</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="accidents" className="space-y-3 mt-4">
        {accidents.length > 0 ? (
          accidents.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No accidents recorded</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="observations" className="space-y-3 mt-4">
        {observations.length > 0 ? (
          observations.map((event) => <EventCard key={event.id} event={event} />)
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
