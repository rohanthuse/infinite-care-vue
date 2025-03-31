
import React from "react";
import { Clipboard, CalendarCheck, CheckCircle2, BarChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// This is a placeholder component since service plan data isn't specifically defined in mockPatientData
// We'll use the service actions data as an example to structure this component
interface ServicePlanTabProps {
  serviceActions: Array<{
    service: string;
    provider: string;
    frequency: string;
    duration: string;
    schedule: string;
    goals: string[];
    progress: string;
  }>;
}

export const ServicePlanTab: React.FC<ServicePlanTabProps> = ({ serviceActions }) => {
  return (
    <Card>
      <CardHeader className="pb-2 bg-gradient-to-r from-cyan-50 to-white">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clipboard className="h-5 w-5 text-cyan-600" />
          <span>Service Plan</span>
        </CardTitle>
        <CardDescription>Overview of care services and goals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* This would typically contain an overview of the service plan */}
          <div className="p-4 bg-cyan-50/30 rounded-lg border border-cyan-100">
            <h3 className="font-medium mb-2 flex items-center">
              <CalendarCheck className="h-4 w-4 mr-2 text-cyan-600" />
              Service Plan Overview
            </h3>
            <p className="text-sm text-gray-700">
              This care plan outlines the comprehensive services provided to support the patient's health and wellbeing. 
              Services are reviewed regularly to ensure they meet the patient's changing needs and preferences.
            </p>
          </div>
          
          {/* Display service actions as part of the plan */}
          <div>
            <h3 className="text-md font-medium mb-3 flex items-center">
              <BarChart className="h-4 w-4 mr-2 text-cyan-600" />
              Service Schedule
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {serviceActions.map((service, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-sm transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                    <div>
                      <h4 className="font-medium">{service.service}</h4>
                      <p className="text-sm text-gray-500">Provider: {service.provider}</p>
                    </div>
                    <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200">
                      {service.progress}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-gray-50 p-2 rounded border">
                      <p className="font-medium text-gray-600">Frequency</p>
                      <p>{service.frequency}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border">
                      <p className="font-medium text-gray-600">Duration</p>
                      <p>{service.duration}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border">
                      <p className="font-medium text-gray-600">Schedule</p>
                      <p>{service.schedule}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <p className="font-medium text-sm text-gray-600 mb-2">Goals:</p>
                    <ul className="space-y-1">
                      {service.goals.map((goal, idx) => (
                        <li key={idx} className="text-sm flex items-start">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
