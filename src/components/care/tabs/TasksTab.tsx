import React from "react";
import { useCarePlanJsonData } from "@/hooks/useCarePlanJsonData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, Plus, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TasksTabProps {
  carePlanId: string;
  onAddTask?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  personal_care: "bg-purple-100 text-purple-800",
  medication: "bg-red-100 text-red-800",
  hygiene: "bg-blue-100 text-blue-800",
  meals: "bg-green-100 text-green-800",
  mobility: "bg-orange-100 text-orange-800",
  housekeeping: "bg-yellow-100 text-yellow-800",
  activity: "bg-pink-100 text-pink-800",
  health_monitoring: "bg-cyan-100 text-cyan-800",
  communication: "bg-indigo-100 text-indigo-800",
  other: "bg-gray-100 text-gray-800",
  "Personal Care": "bg-purple-100 text-purple-800",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const formatCategory = (category: string) => {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatTimeOfDay = (timeOfDay?: string[]) => {
  if (!timeOfDay || timeOfDay.length === 0) return null;
  return timeOfDay.map((t) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())).join(", ");
};

export function TasksTab({ carePlanId, onAddTask }: TasksTabProps) {
  const { data, isLoading } = useCarePlanJsonData(carePlanId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const tasks = data?.tasks || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Care Tasks
        </CardTitle>
        {onAddTask && (
          <Button onClick={onAddTask} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No tasks defined in the care plan.</p>
            <p className="text-sm mt-1">Tasks can be added when editing the care plan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task: any, index: number) => {
              const categoryColor = CATEGORY_COLORS[task.task_category] || CATEGORY_COLORS.other;
              const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
              const timeOfDay = formatTimeOfDay(task.time_of_day);

              return (
                <div
                  key={task.id || index}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{task.task_name}</span>
                      <Badge className={categoryColor} variant="secondary">
                        {formatCategory(task.task_category)}
                      </Badge>
                      {task.priority && (
                        <Badge className={priorityColor} variant="secondary">
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </Badge>
                      )}
                    </div>
                    {task.task_description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.task_description}</p>
                    )}
                    {timeOfDay && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{timeOfDay}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
