
import React from "react";
import { format } from "date-fns";
import { MessageCircle, Clock, Activity, FileText, FileBarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface CarerCarePlanSidebarProps {
  carePlan: {
    id: string;
    clientName: string;
    dateCreated: Date;
    lastUpdated: Date;
    status: string;
    type: string;
    alerts: number;
    tasks: Array<{
      id: string;
      name: string;
      completed: boolean;
    }>;
  };
  onAddNote?: () => void;
  onScheduleFollowUp?: () => void;
  onRecordActivity?: () => void;
  onAddEvent?: () => void;
}

export const CarerCarePlanSidebar: React.FC<CarerCarePlanSidebarProps> = ({ 
  carePlan,
  onAddNote,
  onScheduleFollowUp,
  onRecordActivity,
  onAddEvent
}) => {
  const getStatusBadgeClass = (status: string) => {
    switch(status.toLowerCase()) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "on hold":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "completed":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Calculate task completion percentage
  const completedTasks = carePlan.tasks.filter(task => task.completed).length;
  const totalTasks = carePlan.tasks.length;
  const taskCompletionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Care Plan Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <Badge variant="outline" className={getStatusBadgeClass(carePlan.status)}>
              {carePlan.status}
            </Badge>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Plan Type</p>
            <p className="text-sm">{carePlan.type}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Created On</p>
            <p className="text-sm">{format(carePlan.dateCreated, 'MMM dd, yyyy')}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Last Updated</p>
            <p className="text-sm">{format(carePlan.lastUpdated, 'MMM dd, yyyy')}</p>
          </div>
          
          <Separator />
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium text-gray-500">Today's Tasks</p>
              <span className="text-sm font-medium">{completedTasks}/{totalTasks}</span>
            </div>
            <Progress value={taskCompletionPercent} className="h-2" />
            <div className="mt-3 space-y-2">
              {carePlan.tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-md p-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-4 w-4 rounded-full border ${task.completed ? "bg-green-500 border-green-600" : "border-gray-300"}`} />
                    <span className={`text-sm ${task.completed ? "line-through text-gray-500" : ""}`}>{task.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">Quick Actions</p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={onAddNote}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                <span>Add Note</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={onScheduleFollowUp}
              >
                <Clock className="h-4 w-4 mr-2" />
                <span>Schedule Follow-up</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={onRecordActivity}
              >
                <Activity className="h-4 w-4 mr-2" />
                <span>Record Activity</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={onAddEvent}
              >
                <FileBarChart2 className="h-4 w-4 mr-2" />
                <span>Record Event</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
