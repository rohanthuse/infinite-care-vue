
import React from "react";
import { ClipboardCheck, CheckSquare, Clock, Users, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ServiceAction {
  service: string;
  provider: string;
  frequency: string;
  duration: string;
  schedule: string;
  goals: string[];
  progress: string;
}

interface ServiceActionsTabProps {
  serviceActions: ServiceAction[];
}

export const ServiceActionsTab: React.FC<ServiceActionsTabProps> = ({ serviceActions }) => {
  const getProgressBadgeClass = (progress: string) => {
    switch (progress) {
      case "Meeting needs":
      case "Stable":
        return "bg-green-50 text-green-700 border-green-200";
      case "Improving":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Needs review":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Concern":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-blue-600" />
          <span>Service Actions</span>
        </CardTitle>
        <CardDescription>Scheduled interventions and progress</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {serviceActions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No service actions available</p>
            </div>
          ) : (
            serviceActions.map((action, index) => (
              <div key={index} className="border rounded-lg overflow-hidden hover:shadow-md transition-all">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-3 p-2 rounded-full bg-blue-100">
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{action.service}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500 flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1" />
                            {action.provider}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getProgressBadgeClass(action.progress)}
                    >
                      {action.progress}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Frequency</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm">{action.frequency}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Duration</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm">{action.duration}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Schedule</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm">{action.schedule}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-sm font-medium text-gray-500 mb-2">Goals</p>
                    <ul className="space-y-1.5">
                      {action.goals.map((goal, goalIdx) => (
                        <li key={goalIdx} className="flex items-start">
                          <CheckSquare className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
