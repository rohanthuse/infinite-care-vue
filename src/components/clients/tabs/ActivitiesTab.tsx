import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, Heart, Users, Calendar, Trophy, Plus, Eye, Edit, Trash } from "lucide-react";
import { useClientEvents } from "@/hooks/useClientEvents";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { ClientActivityDialog } from "../dialogs/ClientActivityDialog";
import { 
  useCreateClientActivity, 
  useUpdateClientActivity, 
  useDeleteClientActivity,
  ClientActivity 
} from "@/hooks/useClientActivities";
import { toast } from "sonner";

interface ActivitiesTabProps {
  clientId: string;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ clientId }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedActivity, setSelectedActivity] = useState<ClientActivity | undefined>();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedCarePlanId, setSelectedCarePlanId] = useState<string>('');

  const createMutation = useCreateClientActivity();
  const updateMutation = useUpdateClientActivity();
  const deleteMutation = useDeleteClientActivity();

  // Fetch active care plan for this client
  const { data: carePlans = [] } = useQuery({
    queryKey: ['client-care-plans', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_care_plans')
        .select('id, status')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  const activePlan = carePlans.find(cp => cp.status === 'active') || carePlans[0];

  // Fetch client activities from care plans
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['client-activities', clientId],
    queryFn: async () => {
      console.log('[ActivitiesTab] Fetching activities for client:', clientId);
      
      // Get activities through client care plans
      const { data, error } = await supabase
        .from('client_care_plans')
        .select(`
          activities:client_activities(
            id,
            care_plan_id,
            name,
            description,
            frequency,
            status,
            created_at,
            updated_at
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ActivitiesTab] Error fetching activities:', error);
        return [];
      }

      // Flatten activities from all care plans
    const allActivities = data?.flatMap(cp => cp.activities || []) || [];
    
    // Sort activities by created_at descending (newest first)
    const sortedActivities = allActivities.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Descending order (newest first)
    });

    console.log('[ActivitiesTab] Sorted activities:', sortedActivities.length, 'activities (newest first)');
    if (sortedActivities.length > 0) {
      console.log('[ActivitiesTab] First activity:', sortedActivities[0]?.name, sortedActivities[0]?.created_at);
      console.log('[ActivitiesTab] Last activity:', sortedActivities[sortedActivities.length - 1]?.name, sortedActivities[sortedActivities.length - 1]?.created_at);
    }

    return sortedActivities as ClientActivity[];
    },
    enabled: !!clientId,
  });

  // Fetch client events for social/wellbeing activities
  const { data: clientEvents = [], isLoading: eventsLoading } = useClientEvents(clientId);

  const handleAddActivity = () => {
    if (!activePlan) {
      toast.error('No active care plan found. Please create a care plan first.');
      return;
    }
    setSelectedCarePlanId(activePlan.id);
    setDialogMode('add');
    setSelectedActivity(undefined);
    setDialogOpen(true);
  };

  const handleViewActivity = (activity: ClientActivity) => {
    setDialogMode('view');
    setSelectedActivity(activity);
    setDialogOpen(true);
  };

  const handleEditActivity = (activity: ClientActivity) => {
    setDialogMode('edit');
    setSelectedActivity(activity);
    setDialogOpen(true);
  };

  const handleDeleteActivity = (activityId: string) => {
    setDeleteConfirmId(activityId);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    
    const activity = activities.find(a => a.id === deleteConfirmId);
    if (!activity) return;

    deleteMutation.mutate(
      { id: deleteConfirmId, carePlanId: activity.care_plan_id },
      {
        onSuccess: () => {
          setDeleteConfirmId(null);
        },
      }
    );
  };

  const handleSaveActivity = (formData: any) => {
    if (dialogMode === 'add') {
      createMutation.mutate(
        { ...formData, care_plan_id: selectedCarePlanId },
        {
          onSuccess: () => {
            setDialogOpen(false);
          },
        }
      );
    } else if (dialogMode === 'edit' && selectedActivity) {
      updateMutation.mutate(
        { id: selectedActivity.id, updates: formData },
        {
          onSuccess: () => {
            setDialogOpen(false);
          },
        }
      );
    }
  };

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
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any, color: string }> = {
      'active': { variant: 'default', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
      'completed': { variant: 'secondary', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      'paused': { variant: 'outline', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
      'cancelled': { variant: 'secondary', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    };
    
    const statusConfig = config[status?.toLowerCase()] || config.active;
    
    return (
      <Badge variant={statusConfig.variant} className={statusConfig.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const currentWeek = {
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date())
  };

  const thisWeekActivities = activities.filter(activity => 
    isWithinInterval(parseISO(activity.created_at), currentWeek)
  );

  const activityStatuses = [...new Set(activities.map(a => a.status))];
  const activeActivities = activities.filter(a => a.status === 'active').length;

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
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Activities</p>
                <p className="text-2xl font-bold text-primary">{activities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">This Week</p>
                <p className="text-2xl font-bold text-green-600">{thisWeekActivities.length}</p>
                <p className="text-xs text-muted-foreground">activities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeActivities}</p>
                <p className="text-xs text-muted-foreground">ongoing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Activity Types</p>
                <p className="text-2xl font-bold text-purple-600">{activityStatuses.length}</p>
                <p className="text-xs text-muted-foreground">different types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Status Overview</CardTitle>
          <CardDescription>
            Breakdown of activities by status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activityStatuses.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activities recorded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activityStatuses.map(status => {
                const statusActivities = activities.filter(a => a.status === status);
                
                return (
                  <Card key={status}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getActivityTypeIcon(status)}
                          <span className="font-medium capitalize">{status}</span>
                        </div>
                        <Badge variant="outline">{statusActivities.length}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{statusActivities.length} activities</p>
                        <p>Various frequencies</p>
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
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Recent Activities</CardTitle>
            </div>
            <Button size="sm" onClick={handleAddActivity}>
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </div>
          <CardDescription>Detailed activity participation records</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm">No activities recorded</p>
              <p className="text-xs text-muted-foreground mt-1">
                Activity records will appear when engagement activities are logged
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {activities.slice(0, 10).map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {activity.description || 'No description'}
                  </TableCell>
                  <TableCell>{activity.frequency}</TableCell>
                  <TableCell>
                    {getStatusBadge(activity.status)}
                  </TableCell>
                  <TableCell>{format(parseISO(activity.created_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewActivity(activity)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View details</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditActivity(activity)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit activity</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteActivity(activity.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete activity</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
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

      {/* Activity Dialog */}
      <ClientActivityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveActivity}
        mode={dialogMode}
        activity={selectedActivity}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this activity. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};