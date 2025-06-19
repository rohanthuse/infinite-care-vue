
import React, { useState } from "react";
import { Target, Plus, Edit2, CheckCircle, Clock, XCircle, Pause } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCarePlanGoals } from "@/hooks/useCarePlanGoals";

interface Goal {
  id?: string;
  title?: string;
  description?: string;
  status: string;
  progress?: number;
  target?: string;
  notes?: string;
}

interface GoalsTabProps {
  goals?: Goal[];
  onAddGoal?: () => void;
  onEditGoal?: (goal: Goal) => void;
  carePlanId?: string;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({ goals: propGoals, onAddGoal, onEditGoal, carePlanId }) => {
  // Fetch goals from database if carePlanId is provided
  const { data: dbGoals = [], isLoading } = useCarePlanGoals(carePlanId || '');
  
  // Transform database goals to match expected format
  const transformedDbGoals = dbGoals.map(goal => ({
    id: goal.id,
    title: goal.description,
    description: goal.description,
    status: goal.status,
    progress: goal.progress || 0,
    notes: goal.notes || "",
  }));

  // Use database goals if available and carePlanId exists, otherwise use prop goals
  const goalsToDisplay = carePlanId && transformedDbGoals.length >= 0 ? transformedDbGoals : (propGoals || []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "on-hold":
        return <Pause className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "in-progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "on-hold":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
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
        <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Care Plan Goals</CardTitle>
            </div>
            {onAddGoal && (
              <Button size="sm" className="gap-1" onClick={onAddGoal}>
                <Plus className="h-4 w-4" />
                <span>Add Goal</span>
              </Button>
            )}
          </div>
          <CardDescription>Track progress towards care objectives</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {goalsToDisplay.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No goals set yet</p>
              {onAddGoal && (
                <Button variant="outline" className="mt-3" onClick={onAddGoal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Goal
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {goalsToDisplay.map((goal, index) => (
                <div
                  key={goal.id || index}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(goal.status)}
                        <h3 className="font-medium">{goal.title || goal.description}</h3>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(goal.status)}
                        >
                          {goal.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      {goal.description && goal.description !== goal.title && (
                        <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                      )}
                      
                      {goal.progress !== undefined && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">Progress</span>
                            <span className="text-sm font-medium">{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>
                      )}
                      
                      {goal.target && (
                        <p className="text-sm text-gray-500 mb-2">
                          <strong>Target:</strong> {goal.target}
                        </p>
                      )}
                      
                      {goal.notes && (
                        <p className="text-sm text-gray-600">
                          <strong>Notes:</strong> {goal.notes}
                        </p>
                      )}
                    </div>
                    
                    {onEditGoal && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditGoal(goal)}
                        className="ml-2"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
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
