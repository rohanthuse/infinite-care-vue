
import React from "react";
import { format } from "date-fns";
import { Activity, Plus, Clock, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientActivities } from "@/hooks/useClientActivities";

interface ActivitiesTabProps {
  carePlanId: string;
  onAddActivity?: () => void;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ carePlanId, onAddActivity }) => {
  const { data: activities = [], isLoading } = useClientActivities(carePlanId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Care Activities</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={onAddActivity}>
              <Plus className="h-4 w-4" />
              <span>Add Activity</span>
            </Button>
          </div>
          <CardDescription>Scheduled care activities and tasks</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No activities scheduled</p>
              {onAddActivity && (
                <Button variant="outline" className="mt-3" onClick={onAddActivity}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Activity
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border rounded-lg p-4 hover:shadow-md transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{activity.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(activity.status)}>
                            {activity.status}
                          </Badge>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {activity.frequency}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {activity.description && (
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created {format(new Date(activity.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Updated {format(new Date(activity.updated_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
