
import React from "react";
import { format } from "date-fns";
import { AlertCircle, Calendar, User, Plus, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientEvents } from "@/hooks/useClientEvents";

interface EventsLogsTabProps {
  carePlanId: string;
  patientName: string;
  onAddEvent?: () => void;
}

export const EventsLogsTab: React.FC<EventsLogsTabProps> = ({ 
  carePlanId, 
  patientName, 
  onAddEvent 
}) => {
  // Extract client ID from care plan - in real implementation this would be passed or derived
  const clientId = "76394b1f-d2e3-43f2-b0ae-4605dcb75551";
  const { data: events, isLoading, error } = useClientEvents(clientId);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "low":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "open":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-white">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span>Events & Logs</span>
          </CardTitle>
          <CardDescription>Patient care events and incident reports</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading events...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-white">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span>Events & Logs</span>
          </CardTitle>
          <CardDescription>Patient care events and incident reports</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-center py-8 text-red-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Failed to load events</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">Events & Logs</CardTitle>
          </div>
          <Button size="sm" className="gap-1" onClick={onAddEvent}>
            <Plus className="h-4 w-4" />
            <span>Add Event</span>
          </Button>
        </div>
        <CardDescription>Patient care events and incident reports for {patientName}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {(!events || events.length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No events or logs recorded</p>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getStatusIcon(event.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge 
                          variant="outline" 
                          className={getSeverityBadge(event.severity)}
                        >
                          {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={event.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}
                        >
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(event.created_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {event.reporter}
                      </span>
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {event.event_type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
