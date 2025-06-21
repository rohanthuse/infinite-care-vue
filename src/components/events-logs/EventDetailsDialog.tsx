
import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Calendar, Clock, MapPin, User } from 'lucide-react';
import { EventLog } from '@/data/hooks/useEventsLogs';
import { BodyMapViewer } from './BodyMapViewer';

interface EventDetailsDialogProps {
  event: EventLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (event: EventLog) => void;
}

export function EventDetailsDialog({ event, open, onOpenChange, onEdit }: EventDetailsDialogProps) {
  if (!event) return null;

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

          {/* Body Map Points */}
          {event.body_map_points && Array.isArray(event.body_map_points) && event.body_map_points.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Body Map</h4>
                <BodyMapViewer bodyMapPoints={event.body_map_points} />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
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
