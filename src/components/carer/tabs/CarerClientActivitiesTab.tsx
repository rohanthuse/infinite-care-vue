
import React from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Plus, Activity, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Activity {
  id: string;
  date: Date;
  activity: string;
  details: string;
  status: string;
  performer: string;
}

interface CarerClientActivitiesTabProps {
  clientId: string;
  onAddActivity: () => void;
}

export const CarerClientActivitiesTab: React.FC<CarerClientActivitiesTabProps> = ({
  clientId,
  onAddActivity
}) => {
  // Mock activities - in a real app these would be fetched based on clientId
  const activities: Activity[] = [
    {
      id: "act1",
      date: new Date("2023-11-10T09:30:00"),
      activity: "Medication Administration",
      details: "Morning medications given as prescribed",
      status: "completed",
      performer: "Sarah Johnson"
    },
    {
      id: "act2",
      date: new Date("2023-11-09T11:00:00"),
      activity: "Personal Care",
      details: "Assisted with bathing and dressing",
      status: "completed",
      performer: "Sarah Johnson"
    },
    {
      id: "act3",
      date: new Date("2023-11-08T14:15:00"),
      activity: "Mobility Assistance",
      details: "Completed walking exercise in the garden, managed 100 meters",
      status: "completed",
      performer: "Michael Brown"
    }
  ];
  
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'partially_completed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'not_completed':
      default:
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <span>Client Activities</span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button onClick={onAddActivity} size="sm" className="h-8">
            <Plus className="h-4 w-4 mr-1" />
            Log Activity
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input className="pl-8 h-9" placeholder="Search activities..." />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>
        
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="border rounded-md p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{activity.activity}</h3>
                    <Badge 
                      variant="outline" 
                      className={getStatusBadgeStyle(activity.status)}
                    >
                      {activity.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(activity.date, "MMM d, yyyy")}</span>
                    <Clock className="h-3.5 w-3.5 ml-2" />
                    <span>{format(activity.date, "h:mm a")}</span>
                  </div>
                </div>
                <p className="text-gray-700 text-sm mb-2">{activity.details}</p>
                <p className="text-sm text-gray-500">Performed by: {activity.performer}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium mb-1">No activities recorded</h3>
              <p className="text-gray-500">
                Start logging activities for this client.
              </p>
              <Button onClick={onAddActivity} className="mt-4">
                Log First Activity
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
