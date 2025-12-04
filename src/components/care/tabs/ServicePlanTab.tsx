
import React from "react";
import { format } from "date-fns";
import { FileBarChart2, Plus, Calendar, User, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientServiceAction } from "@/hooks/useClientServiceActions";

interface ServicePlanTabProps {
  serviceActions: ClientServiceAction[];
  onAddServicePlan?: () => void;
}

export const ServicePlanTab: React.FC<ServicePlanTabProps> = ({ 
  serviceActions, 
  onAddServicePlan 
}) => {
  // Group service actions by category for service plan view
  const groupedServices = serviceActions.reduce((acc, action) => {
    const category = action.service_category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(action);
    return acc;
  }, {} as Record<string, ClientServiceAction[]>);

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
        <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileBarChart2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Service Plan</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={onAddServicePlan}>
              <Plus className="h-4 w-4" />
              <span>Add Service Plan</span>
            </Button>
          </div>
          <CardDescription>Comprehensive service plan overview</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {Object.keys(groupedServices).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileBarChart2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No service plan available</p>
              {onAddServicePlan && (
                <Button variant="outline" className="mt-3" onClick={onAddServicePlan}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Service Plan
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedServices).map(([category, actions]) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    {category}
                  </h3>
                  <div className="space-y-3">
                    {actions.map((action) => (
                      <div key={action.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{action.service_name}</h4>
                              <p className="text-sm text-gray-600">Provider: {action.provider_name}</p>
                            </div>
                            <Badge variant="custom" className={getStatusColor(action.progress_status)}>
                              {action.progress_status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Frequency:</span> {action.frequency}
                            </div>
                            <div>
                              <span className="font-medium">Duration:</span> {action.duration}
                            </div>
                            <div>
                              <span className="font-medium">Start:</span> {format(new Date(action.start_date), 'MMM dd, yyyy')}
                            </div>
                          </div>
                          
                          {action.goals && action.goals.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                Objectives:
                              </h5>
                              <ul className="text-sm text-gray-600 list-disc list-inside pl-5">
                                {action.goals.map((goal, index) => (
                                  <li key={index}>{goal}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {action.schedule_details && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Schedule:
                              </h5>
                              <p className="text-sm text-gray-600 pl-5">{action.schedule_details}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
