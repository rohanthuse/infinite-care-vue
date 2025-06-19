
import React from "react";
import { ClipboardCheck, CheckSquare, Clock, Users, Calendar, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientServiceAction } from "@/hooks/useClientServiceActions";
import { format } from "date-fns";

interface ServiceActionsTabProps {
  serviceActions: ClientServiceAction[];
}

export const ServiceActionsTab: React.FC<ServiceActionsTabProps> = ({ serviceActions }) => {
  const getProgressBadgeClass = (progress: string) => {
    switch (progress.toLowerCase()) {
      case "active":
      case "meeting needs":
      case "stable":
        return "bg-green-50 text-green-700 border-green-200";
      case "improving":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "needs review":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "concern":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              <span>Service Actions</span>
            </CardTitle>
            <CardDescription>Scheduled interventions and progress</CardDescription>
          </div>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            <span>Add Service</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {serviceActions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No service actions available</p>
            </div>
          ) : (
            serviceActions.map((action) => (
              <div key={action.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-all">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-3 p-2 rounded-full bg-blue-100">
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{action.service_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500 flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1" />
                            {action.provider_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {action.service_category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getProgressBadgeClass(action.progress_status)}
                    >
                      {action.progress_status}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                      <p className="text-sm font-medium text-gray-500">Start Date</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm">{format(new Date(action.start_date), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  {action.schedule_details && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-500">Schedule Details</p>
                      <p className="text-sm text-gray-700 mt-1">{action.schedule_details}</p>
                    </div>
                  )}

                  {/* Dates Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {action.last_completed_date && (
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-green-800">Last Completed</p>
                        <p className="text-sm text-green-700">
                          {format(new Date(action.last_completed_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                    {action.next_scheduled_date && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-blue-800">Next Scheduled</p>
                        <p className="text-sm text-blue-700">
                          {format(new Date(action.next_scheduled_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Goals */}
                  {action.goals && action.goals.length > 0 && (
                    <div className="pt-3 border-t">
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
                  )}

                  {action.notes && (
                    <div className="pt-3 border-t mt-4">
                      <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{action.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm">Edit Service</Button>
                    <Button size="sm">Record Activity</Button>
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
