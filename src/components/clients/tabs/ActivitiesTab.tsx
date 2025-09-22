import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Heart, Users, Calendar, Trophy, Clock } from "lucide-react";
import { useClientEvents } from "@/hooks/useClientEvents";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

interface ActivitiesTabProps {
  clientId: string;
}

interface ClientActivity {
  id: string;
  client_id: string;
  activity_name: string;
  activity_type: string;
  duration_minutes?: number;
  participation_level: string;
  notes?: string;
  activity_date: string;
  created_at: string;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ clientId }) => {
  // Fetch client activities
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['client-activities', clientId],
    queryFn: async () => {
      console.log('[ActivitiesTab] Fetching activities for client:', clientId);
      
      const { data, error } = await supabase
        .from('client_activities')
        .select('*')
        .eq('client_id', clientId)
        .order('activity_date', { ascending: false });

      if (error) {
        console.error('[ActivitiesTab] Error fetching activities:', error);
        return []; // Return empty array if table doesn't exist yet
      }

      return data as ClientActivity[];
    },
    enabled: !!clientId,
  });

  // Fetch client events for social/wellbeing activities
  const { data: clientEvents = [], isLoading: eventsLoading } = useClientEvents(clientId);

  const getActivityTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'physical':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'social':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'cognitive':
        return <Trophy className="h-4 w-4 text-purple-600" />;
      case 'recreational':
        return <Heart className="h-4 w-4 text-pink-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getParticipationBadge = (level: string) => {
    const config: Record<string, { variant: any, color: string }> = {
      'full': { variant: 'default', color: 'bg-green-100 text-green-800' },
      'partial': { variant: 'secondary', color: 'bg-orange-100 text-orange-800' },
      'minimal': { variant: 'outline', color: 'bg-red-100 text-red-800' },
      'assisted': { variant: 'secondary', color: 'bg-blue-100 text-blue-800' },
    };
    
    const levelConfig = config[level?.toLowerCase()] || config.partial;
    
    return (
      <Badge variant={levelConfig.variant} className={levelConfig.color}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  const currentWeek = {
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date())
  };

  const thisWeekActivities = activities.filter(activity => 
    isWithinInterval(parseISO(activity.activity_date), currentWeek)
  );

  const activityTypes = [...new Set(activities.map(a => a.activity_type))];
  const totalDuration = activities.reduce((total, activity) => 
    total + (activity.duration_minutes || 0), 0
  );

  // Engagement events from client_events_logs
  const engagementEvents = clientEvents.filter(event => 
    event.event_type === 'engagement' || event.event_type === 'wellbeing'
  );

  if (activitiesLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading activities...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <span>Total Activities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{activities.length}</div>
            <p className="text-xs text-muted-foreground">recorded activities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <span>This Week</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{thisWeekActivities.length}</div>
            <p className="text-xs text-muted-foreground">activities this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Total Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{Math.floor(totalDuration / 60)}h</div>
            <p className="text-xs text-muted-foreground">{totalDuration % 60}m engaged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-purple-600" />
              <span>Activity Types</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{activityTypes.length}</div>
            <p className="text-xs text-muted-foreground">different types</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Types Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Types Participation</CardTitle>
          <CardDescription>
            Breakdown of activities by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activityTypes.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activities recorded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activityTypes.map(type => {
                const typeActivities = activities.filter(a => a.activity_type === type);
                const avgParticipation = typeActivities.length > 0 
                  ? typeActivities.filter(a => a.participation_level === 'full').length / typeActivities.length * 100
                  : 0;
                
                return (
                  <Card key={type}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getActivityTypeIcon(type)}
                          <span className="font-medium capitalize">{type}</span>
                        </div>
                        <Badge variant="outline">{typeActivities.length}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{avgParticipation.toFixed(0)}% full participation</p>
                        <p>{typeActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)}min total</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>Recent Activities</span>
          </CardTitle>
          <CardDescription>
            Detailed activity participation records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activities recorded</p>
              <p className="text-sm text-muted-foreground mt-1">
                Activity records will appear when engagement activities are logged
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Participation</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.slice(0, 10).map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.activity_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getActivityTypeIcon(activity.activity_type)}
                        <span className="capitalize">{activity.activity_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{format(parseISO(activity.activity_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {activity.duration_minutes ? `${activity.duration_minutes}min` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getParticipationBadge(activity.participation_level)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {activity.notes || 'No notes'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Engagement Events */}
      {engagementEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Engagement Events</span>
            </CardTitle>
            <CardDescription>
              Social and wellbeing engagement records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {engagementEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-medium">{event.title}</span>
                      <Badge variant="outline">{event.event_type}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(parseISO(event.event_date || event.created_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded p-2">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Reported by: {event.reporter}</span>
                    <Badge variant="outline" className={`
                      ${event.severity === 'high' ? 'bg-green-100 text-green-800' : ''}
                      ${event.severity === 'medium' ? 'bg-blue-100 text-blue-800' : ''}
                      ${event.severity === 'low' ? 'bg-gray-100 text-gray-800' : ''}
                    `}>
                      {event.severity} engagement
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};