
import React from "react";
import { format } from "date-fns";
import { Activity, Calendar, User, Clock, CheckCircle2, AlertCircle, MoreHorizontal, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useClientActivities } from "@/hooks/useClientActivities";

interface ActivityItem {
  date?: Date;
  action?: string;
  performer?: string;
  status: string;
  name?: string;
  frequency?: string;
  description?: string;
  created_at?: string;
}

interface ActivitiesTabProps {
  activities?: ActivityItem[];
  onAddActivity?: () => void;
  carePlanId?: string;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ activities: propActivities, onAddActivity, carePlanId }) => {
  // Fetch activities from database if carePlanId is provided
  const { data: dbActivities = [], isLoading } = useClientActivities(carePlanId || '');
  
  // Transform database activities to match expected format
  const transformedDbActivities = dbActivities.map(activity => ({
    date: new Date(activity.created_at),
    action: activity.name,
    performer: "Carer", // Default performer
    status: activity.status,
    name: activity.name,
    frequency: activity.frequency,
    description: activity.description,
  }));

  // Use database activities if available and carePlanId exists, otherwise use prop activities
  const activitiesToDisplay = carePlanId && transformedDbActivities.length >= 0 ? transformedDbActivities : (propActivities || []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": 
      case "Completed": 
        return "bg-green-50 text-green-700 border-green-200";
      case "active":
      case "In Progress": 
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "paused":
      case "Pending": 
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Cancelled": 
        return "bg-red-50 text-red-700 border-red-200";
      default: 
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (isLoading && carePlanId) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-lg">Activities</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={onAddActivity}>
              <Plus className="h-4 w-4" />
              <span>Add Activity</span>
            </Button>
          </div>
          <CardDescription>Recent patient activities and interventions</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {activitiesToDisplay.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No activities recorded</p>
              {onAddActivity && (
                <Button variant="outline" className="mt-3" onClick={onAddActivity}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Activity
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {activitiesToDisplay.map((activity, index) => (
                <div key={index} className="flex items-start rounded-lg p-4 hover:bg-gray-50 transition-all border">
                  <div className="mr-4 p-2 bg-indigo-100 rounded-full text-indigo-600">
                    {activity.status === "completed" || activity.status === "Completed" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{activity.action || activity.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                          {activity.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(activity.date, 'MMM dd, yyyy')}
                            </span>
                          )}
                          {activity.performer && (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {activity.performer}
                            </span>
                          )}
                          {activity.frequency && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {activity.frequency}
                            </span>
                          )}
                        </div>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mt-2">{activity.description}</p>
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getStatusBadge(activity.status)}
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
