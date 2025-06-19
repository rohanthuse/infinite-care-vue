
import React from "react";
import { format } from "date-fns";
import { Settings, Plus, Calendar, User, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientServiceAction } from "@/hooks/useClientServiceActions";

interface ServiceActionsTabProps {
  serviceActions: ClientServiceAction[];
  onAddServiceAction?: () => void;
}

export const ServiceActionsTab: React.FC<ServiceActionsTabProps> = ({ 
  serviceActions, 
  onAddServiceAction 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Service Actions</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={onAddServiceAction}>
              <Plus className="h-4 w-4" />
              <span>Add Service Action</span>
            </Button>
          </div>
          <CardDescription>Individual service actions and interventions</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {serviceActions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No service actions available</p>
              {onAddServiceAction && (
                <Button variant="outline" className="mt-3" onClick={onAddServiceAction}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Service Action
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {serviceActions.map((action) => (
                <div key={action.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{action.service_name}</h3>
                        <p className="text-sm text-gray-600">{action.service_category}</p>
                      </div>
                      <Badge className={getStatusColor(action.progress_status)}>
                        {action.progress_status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Provider:</span> {action.provider_name}
                      </div>
                      <div>
                        <span className="font-medium">Frequency:</span> {action.frequency}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {action.duration}
                      </div>
                      <div>
                        <span className="font-medium">Start Date:</span> {format(new Date(action.start_date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    
                    {action.goals && action.goals.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          Goals:
                        </h4>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {action.goals.map((goal, index) => (
                            <li key={index}>{goal}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {action.schedule_details && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Schedule:</h4>
                        <p className="text-sm text-gray-600">{action.schedule_details}</p>
                      </div>
                    )}
                    
                    {action.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Notes:</h4>
                        <p className="text-sm text-gray-600">{action.notes}</p>
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
