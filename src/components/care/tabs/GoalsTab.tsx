
import React from "react";
import { format } from "date-fns";
import { Target, Plus, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCarePlanGoals } from "@/hooks/useCarePlanGoals";

interface GoalsTabProps {
  carePlanId: string;
  onAddGoal?: () => void;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({ carePlanId, onAddGoal }) => {
  const { data: goals = [], isLoading } = useCarePlanGoals(carePlanId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'not-started': return 'bg-gray-100 text-gray-800';
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
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Care Plan Goals</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={onAddGoal}>
              <Plus className="h-4 w-4" />
              <span>Add Goal</span>
            </Button>
          </div>
          <CardDescription>Track progress toward care objectives</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {goals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No goals set for this care plan</p>
              {onAddGoal && (
                <Button variant="outline" className="mt-3" onClick={onAddGoal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Goal
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="border rounded-lg p-4 hover:shadow-md transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{goal.description}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(goal.status)}>
                            {goal.status}
                          </Badge>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Updated {format(new Date(goal.updated_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {goal.progress !== null && goal.progress !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                    )}
                    
                    {goal.notes && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        <strong>Notes:</strong> {goal.notes}
                      </div>
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
