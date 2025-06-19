
import React from "react";
import { Clipboard, CalendarCheck, CheckCircle2, BarChart, Plus, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientServiceAction } from "@/hooks/useClientServiceActions";
import { format } from "date-fns";

interface ServicePlanTabProps {
  serviceActions: ClientServiceAction[];
  onAddServicePlan?: () => void;
  onEditServicePlan?: (serviceAction: ClientServiceAction) => void;
}

export const ServicePlanTab: React.FC<ServicePlanTabProps> = ({ 
  serviceActions,
  onAddServicePlan,
  onEditServicePlan 
}) => {
  const getProgressBadgeClass = (progress: string) => {
    switch (progress.toLowerCase()) {
      case "active":
      case "stable":
        return "bg-green-50 text-green-700 border-green-200";
      case "improving":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "needs-review":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "completed":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "paused":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 bg-gradient-to-r from-cyan-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clipboard className="h-5 w-5 text-cyan-600" />
              <span>Service Plan</span>
            </CardTitle>
            <CardDescription>Overview of care services and goals</CardDescription>
          </div>
          {onAddServicePlan && (
            <Button variant="outline" size="sm" onClick={onAddServicePlan}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service Plan
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-6">
          {serviceActions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clipboard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm mb-4">No service plans available</p>
              {onAddServicePlan && (
                <Button variant="outline" onClick={onAddServicePlan}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service Plan
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Service Plan Overview */}
              <div className="p-4 bg-cyan-50/30 rounded-lg border border-cyan-100">
                <h3 className="font-medium mb-2 flex items-center">
                  <CalendarCheck className="h-4 w-4 mr-2 text-cyan-600" />
                  Service Plan Overview
                </h3>
                <p className="text-sm text-gray-700">
                  This care plan outlines the comprehensive services provided to support the patient's health and wellbeing. 
                  Services are reviewed regularly to ensure they meet the patient's changing needs and preferences.
                </p>
                <div className="mt-3 flex items-center text-sm text-cyan-700">
                  <BarChart className="h-4 w-4 mr-1" />
                  <span>Total Active Services: {serviceActions.filter(s => s.progress_status === 'active').length}</span>
                </div>
              </div>
              
              {/* Service Schedule */}
              <div>
                <h3 className="text-md font-medium mb-3 flex items-center">
                  <BarChart className="h-4 w-4 mr-2 text-cyan-600" />
                  Service Schedule
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {serviceActions.map((service) => (
                    <div key={service.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-all">
                      <div className="p-4 bg-gradient-to-r from-cyan-50 to-white border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="mr-3 p-2 rounded-full bg-cyan-100">
                              <CheckCircle2 className="h-5 w-5 text-cyan-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-lg">{service.service_name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-500">Provider: {service.provider_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {service.service_category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={getProgressBadgeClass(service.progress_status)}
                            >
                              {service.progress_status}
                            </Badge>
                            {onEditServicePlan && (
                              <Button variant="outline" size="sm" onClick={() => onEditServicePlan(service)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-4">
                          <div className="bg-gray-50 p-2 rounded border">
                            <p className="font-medium text-gray-600">Frequency</p>
                            <p>{service.frequency}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded border">
                            <p className="font-medium text-gray-600">Duration</p>
                            <p>{service.duration}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded border">
                            <p className="font-medium text-gray-600">Start Date</p>
                            <p>{format(new Date(service.start_date), 'MMM dd, yyyy')}</p>
                          </div>
                        </div>

                        {service.schedule_details && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-500">Schedule Details</p>
                            <p className="text-sm text-gray-700 mt-1">{service.schedule_details}</p>
                          </div>
                        )}

                        {/* Dates Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {service.last_completed_date && (
                            <div className="bg-green-50 p-3 rounded-md">
                              <p className="text-sm font-medium text-green-800">Last Completed</p>
                              <p className="text-sm text-green-700">
                                {format(new Date(service.last_completed_date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          )}
                          {service.next_scheduled_date && (
                            <div className="bg-blue-50 p-3 rounded-md">
                              <p className="text-sm font-medium text-blue-800">Next Scheduled</p>
                              <p className="text-sm text-blue-700">
                                {format(new Date(service.next_scheduled_date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Goals */}
                        {service.goals && service.goals.length > 0 && (
                          <div className="pt-3 border-t">
                            <p className="text-sm font-medium text-gray-500 mb-2">Goals</p>
                            <ul className="space-y-1.5">
                              {service.goals.map((goal, goalIdx) => (
                                <li key={goalIdx} className="flex items-start">
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-cyan-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-sm">{goal}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {service.notes && (
                          <div className="pt-3 border-t mt-4">
                            <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
                            <p className="text-sm text-gray-700">{service.notes}</p>
                          </div>
                        )}

                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" size="sm">Record Activity</Button>
                          <Button size="sm">Schedule Service</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
