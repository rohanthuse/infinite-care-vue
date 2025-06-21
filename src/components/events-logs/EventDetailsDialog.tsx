
import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, User, FileText, AlertTriangle, Activity } from 'lucide-react';
import { EventLog } from '@/data/hooks/useEventsLogs';

interface EventDetailsDialogProps {
  event: EventLog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailsDialog({ event, open, onOpenChange }: EventDetailsDialogProps) {
  const getCategoryBadge = (category: string) => {
    const styles = {
      accident: "bg-amber-50 text-amber-700 border-amber-200",
      incident: "bg-orange-50 text-orange-700 border-orange-200",
      near_miss: "bg-yellow-50 text-yellow-700 border-yellow-200",
      medication_error: "bg-red-50 text-red-700 border-red-200",
      safeguarding: "bg-purple-50 text-purple-700 border-purple-200",
      complaint: "bg-blue-50 text-blue-700 border-blue-200",
      compliment: "bg-green-50 text-green-700 border-green-200",
      other: "bg-gray-50 text-gray-700 border-gray-200",
    };
    
    return (
      <Badge variant="outline" className={styles[category as keyof typeof styles] || styles.other}>
        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: "bg-blue-50 text-blue-600 border-blue-200",
      "in-progress": "bg-amber-50 text-amber-600 border-amber-200",
      resolved: "bg-green-50 text-green-600 border-green-200",
      closed: "bg-gray-50 text-gray-600 border-gray-200",
    };
    
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles] || styles.open}>
        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const styles = {
      low: "bg-green-50 text-green-600 border-green-200",
      medium: "bg-yellow-50 text-yellow-600 border-yellow-200",
      high: "bg-orange-50 text-orange-600 border-orange-200",
      critical: "bg-red-50 text-red-600 border-red-200",
    };
    
    return (
      <Badge variant="outline" className={styles[severity as keyof typeof styles] || styles.low}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const renderBodyMap = () => {
    if (!event.body_map_points || !Array.isArray(event.body_map_points) || event.body_map_points.length === 0) {
      return null;
    }

    const frontPoints = event.body_map_points.filter((p: any) => p.side === 'front');
    const backPoints = event.body_map_points.filter((p: any) => p.side === 'back');

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Body Map
          </CardTitle>
          <CardDescription>Areas of injury or concern marked on the body diagram</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Front View */}
            <div className="space-y-2">
              <h4 className="font-medium text-center">Front View</h4>
              <div className="relative mx-auto w-32 h-64 border-2 border-gray-200 rounded-lg bg-gray-50">
                {/* Simplified body outline for front */}
                <svg viewBox="0 0 200 400" className="absolute inset-0 w-full h-full">
                  <g fill="none" stroke="#9CA3AF" strokeWidth="2">
                    <circle cx="100" cy="40" r="25" />
                    <line x1="100" y1="65" x2="100" y2="80" />
                    <rect x="75" y="80" width="50" height="120" rx="10" />
                    <rect x="45" y="90" width="25" height="80" rx="12" />
                    <rect x="130" y="90" width="25" height="80" rx="12" />
                    <rect x="85" y="200" width="15" height="120" rx="7" />
                    <rect x="100" y="200" width="15" height="120" rx="7" />
                  </g>
                </svg>
                {frontPoints.map((point: any, index: number) => (
                  <div
                    key={index}
                    className="absolute w-3 h-3 rounded-full border-2 border-white shadow-lg"
                    style={{
                      left: `${point.x}%`,
                      top: `${point.y}%`,
                      backgroundColor: point.color,
                      transform: 'translate(-50%, -50%)',
                    }}
                    title={`${point.type} (${point.severity})`}
                  />
                ))}
              </div>
            </div>

            {/* Back View */}
            <div className="space-y-2">
              <h4 className="font-medium text-center">Back View</h4>
              <div className="relative mx-auto w-32 h-64 border-2 border-gray-200 rounded-lg bg-gray-50">
                {/* Simplified body outline for back */}
                <svg viewBox="0 0 200 400" className="absolute inset-0 w-full h-full">
                  <g fill="none" stroke="#9CA3AF" strokeWidth="2">
                    <circle cx="100" cy="40" r="25" />
                    <line x1="100" y1="65" x2="100" y2="80" />
                    <rect x="75" y="80" width="50" height="120" rx="10" />
                    <rect x="45" y="90" width="25" height="80" rx="12" />
                    <rect x="130" y="90" width="25" height="80" rx="12" />
                    <rect x="85" y="200" width="15" height="120" rx="7" />
                    <rect x="100" y="200" width="15" height="120" rx="7" />
                    <line x1="100" y1="80" x2="100" y2="200" strokeDasharray="3,3" />
                  </g>
                </svg>
                {backPoints.map((point: any, index: number) => (
                  <div
                    key={index}
                    className="absolute w-3 h-3 rounded-full border-2 border-white shadow-lg"
                    style={{
                      left: `${point.x}%`,
                      top: `${point.y}%`,
                      backgroundColor: point.color,
                      transform: 'translate(-50%, -50%)',
                    }}
                    title={`${point.type} (${point.severity})`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Points Legend */}
          <div className="mt-4 space-y-2">
            <h5 className="font-medium text-sm">Marked Points:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {event.body_map_points.map((point: any, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: point.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{point.type} ({point.side})</div>
                    <div className="text-xs text-gray-500">
                      {point.severity} severity
                      {point.description && ` - ${point.description}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl">{event.title}</DialogTitle>
              <DialogDescription>
                Event ID: {event.id.slice(0, 8)} • Created on {format(new Date(event.created_at), 'MMMM dd, yyyy')}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getCategoryBadge(event.category)}
              {getSeverityBadge(event.severity)}
              {getStatusBadge(event.status)}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Event Type</div>
                    <div className="font-medium">{event.event_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Reporter</div>
                    <div className="font-medium">{event.reporter}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Location</div>
                    <div className="font-medium">{event.location || 'Not specified'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Date & Time</div>
                    <div className="font-medium">
                      {format(new Date(event.created_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              </div>

              {event.description && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Description</span>
                    </div>
                    <p className="text-sm leading-relaxed">{event.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Body Map (if available) */}
          {renderBodyMap()}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm text-gray-500">Created: </span>
                  <span className="text-sm font-medium">
                    {format(new Date(event.created_at), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm text-gray-500">Last Updated: </span>
                  <span className="text-sm font-medium">
                    {format(new Date(event.updated_at), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
