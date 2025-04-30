
import React from "react";
import { format } from "date-fns";
import { CheckCircle, AlertCircle, Plus, Book } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Goal {
  title: string;
  status: string;
  target: string;
  notes: string;
}

interface CarePlan {
  id: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  goals: Goal[];
  progress: number;
}

interface CarePlansTabProps {
  clientId: string;
  carePlans?: CarePlan[];
}

export const CarePlansTab: React.FC<CarePlansTabProps> = ({ clientId, carePlans = [] }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-600';
    if (progress >= 50) return 'bg-blue-600';
    if (progress >= 25) return 'bg-amber-600';
    return 'bg-gray-600';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Client Care Plans</CardTitle>
            </div>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              <span>Create Care Plan</span>
            </Button>
          </div>
          <CardDescription>Care plans and goals for client {clientId}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {carePlans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Book className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No care plans have been created for this client</p>
            </div>
          ) : (
            <div className="space-y-6">
              {carePlans.map((plan, index) => (
                <Card key={index} className="border-2 border-blue-100 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{plan.title}</CardTitle>
                        <CardDescription>
                          {format(plan.startDate, 'MMM d, yyyy')} 
                          {plan.endDate && ` - ${format(plan.endDate, 'MMM d, yyyy')}`}
                        </CardDescription>
                      </div>
                      <div>
                        <Badge>ID: {plan.id}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm font-medium">{plan.progress}%</span>
                      </div>
                      <Progress value={plan.progress} className={getProgressColor(plan.progress)} />
                    </div>
                    
                    <h4 className="font-medium mb-2">Goals</h4>
                    <div className="space-y-3">
                      {plan.goals.map((goal, gIndex) => (
                        <div key={gIndex} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
                          {goal.status.toLowerCase() === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                          )}
                          <div>
                            <div className="flex items-center space-x-2">
                              <h5 className="font-medium">{goal.title}</h5>
                              <Badge className={getStatusColor(goal.status)}>{goal.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Target: {goal.target}</p>
                            {goal.notes && <p className="text-sm text-gray-500 mt-1">{goal.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
