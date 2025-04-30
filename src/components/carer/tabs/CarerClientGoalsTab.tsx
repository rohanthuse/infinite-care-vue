
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, BarChart2, Trophy } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  status: string;
  target: string;
  notes: string;
  progress: number;
}

interface CarerClientGoalsTabProps {
  clientId: string;
  onUpdateProgress: () => void;
}

export const CarerClientGoalsTab: React.FC<CarerClientGoalsTabProps> = ({
  clientId,
  onUpdateProgress
}) => {
  // Mock goals - in a real app these would be fetched based on clientId
  const goals: Goal[] = [
    { 
      id: "g1",
      title: "Improve mobility", 
      status: "In Progress", 
      target: "Walk unassisted for 15 minutes", 
      notes: "Currently at 8 minutes with walking frame",
      progress: 53
    },
    { 
      id: "g2",
      title: "Medication adherence", 
      status: "Active", 
      target: "100% medication compliance", 
      notes: "Using pill organizer effectively",
      progress: 80
    },
    { 
      id: "g3",
      title: "Blood glucose management", 
      status: "Active", 
      target: "Maintain levels between 80-130 mg/dL", 
      notes: "Morning readings occasionally high",
      progress: 65
    },
  ];
  
  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'Active':
        return "bg-blue-50 text-blue-700 border-blue-200";
      case 'In Progress':
        return "bg-amber-50 text-amber-700 border-amber-200";
      case 'Completed':
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };
  
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-600";
    if (progress >= 50) return "bg-blue-600";
    return "bg-amber-500";
  };
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Active':
        return <Activity className="h-5 w-5 text-blue-600" />;
      case 'In Progress':
        return <BarChart2 className="h-5 w-5 text-amber-600" />;
      case 'Completed':
        return <Trophy className="h-5 w-5 text-green-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <span>Client Goals</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {goals.map((goal) => (
            <div key={goal.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 p-2 rounded-full bg-gray-100">
                      {getStatusIcon(goal.status)}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{goal.title}</h3>
                      <div className="flex items-center mt-1">
                        <Badge variant="outline" className={getStatusBadgeClass(goal.status)}>
                          {goal.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-700">Target</p>
                    <p className="text-sm text-gray-500">{goal.progress}% Complete</p>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${getProgressColor(goal.progress)}`}
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  
                  <p className="mt-2 text-sm font-medium">
                    {goal.target}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                  <p className="text-sm bg-gray-50 p-2 rounded-md border border-gray-100">
                    {goal.notes}
                  </p>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button size="sm" onClick={onUpdateProgress}>Update Progress</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
