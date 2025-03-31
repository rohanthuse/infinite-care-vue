
import React from "react";
import { Bath, Calendar, User, CheckCircle2, Clock, Heart, Thermometer, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface PersonalCareTabProps {
  personalCare: {
    routines: Array<{
      activity: string;
      frequency: string;
    }>;
    preferences: string[];
    mobility: {
      status: string;
      transferAbility: string;
      walkingDistance: string;
      stairs: string;
      notes: string;
    };
  };
}

export const PersonalCareTab: React.FC<PersonalCareTabProps> = ({ personalCare }) => {
  // Helper function to get icon for routine
  const getRoutineIcon = (activity: string) => {
    if (activity.toLowerCase().includes("bath") || activity.toLowerCase().includes("shower")) {
      return <Bath className="h-4 w-4 text-purple-600" />;
    } else if (activity.toLowerCase().includes("medication")) {
      return <Thermometer className="h-4 w-4 text-purple-600" />;
    } else if (activity.toLowerCase().includes("exercise")) {
      return <Activity className="h-4 w-4 text-purple-600" />;
    } else {
      return <Heart className="h-4 w-4 text-purple-600" />;
    }
  };

  return (
    <Card className="overflow-hidden border-purple-100">
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bath className="h-5 w-5 text-purple-600" />
          <span className="bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent">Personal Care</span>
        </CardTitle>
        <CardDescription>Daily care routines and preferences</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-8">
          {/* Care Routines Section */}
          <div className="bg-white rounded-lg p-5 border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-md font-medium mb-4 flex items-center text-purple-700">
              <Clock className="h-5 w-5 mr-2 text-purple-600" />
              Care Routines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalCare.routines.map((routine, index) => (
                <div 
                  key={index} 
                  className="border rounded-md p-4 bg-gradient-to-br from-purple-50 to-white hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getRoutineIcon(routine.activity)}
                      <span className="ml-2 font-medium text-gray-800">{routine.activity}</span>
                    </div>
                    <Badge variant="outline" className="bg-white border-purple-200 text-purple-700">
                      {routine.frequency}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Personal Preferences Section */}
          <div className="bg-white rounded-lg p-5 border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-md font-medium mb-4 flex items-center text-purple-700">
              <User className="h-5 w-5 mr-2 text-purple-600" />
              Personal Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalCare.preferences.map((preference, index) => (
                <div key={index} className="flex items-start p-3 rounded-md bg-purple-50/50 border border-purple-100">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{preference}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Mobility Assessment Section */}
          <div className="bg-white rounded-lg p-5 border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-md font-medium mb-4 flex items-center text-purple-700">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              Mobility Assessment
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {/* Mobility Status Card */}
              <div className="bg-purple-50/50 rounded-lg p-4 border border-purple-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="p-4 rounded-md bg-white border border-purple-100 cursor-help">
                        <h4 className="text-sm font-medium text-purple-700 mb-1">Status</h4>
                        <p className="text-gray-700">{personalCare.mobility.status}</p>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 bg-white">
                      <div className="flex justify-between space-x-4">
                        <div>
                          <h4 className="text-sm font-semibold">Mobility Status</h4>
                          <p className="text-sm text-gray-700">
                            General mobility level assessment indicating the patient's independence and movement capabilities.
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="p-4 rounded-md bg-white border border-purple-100 cursor-help">
                        <h4 className="text-sm font-medium text-purple-700 mb-1">Transfer Ability</h4>
                        <p className="text-gray-700">{personalCare.mobility.transferAbility}</p>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 bg-white">
                      <div className="flex justify-between space-x-4">
                        <div>
                          <h4 className="text-sm font-semibold">Transfer Ability</h4>
                          <p className="text-sm text-gray-700">
                            Assessment of how well the patient can transfer between positions (e.g., bed to chair).
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="p-4 rounded-md bg-white border border-purple-100 cursor-help">
                        <h4 className="text-sm font-medium text-purple-700 mb-1">Walking Distance</h4>
                        <p className="text-gray-700">{personalCare.mobility.walkingDistance}</p>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 bg-white">
                      <div className="flex justify-between space-x-4">
                        <div>
                          <h4 className="text-sm font-semibold">Walking Distance</h4>
                          <p className="text-sm text-gray-700">
                            Maximum distance the patient can walk independently or with assistance.
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="p-4 rounded-md bg-white border border-purple-100 cursor-help">
                        <h4 className="text-sm font-medium text-purple-700 mb-1">Stairs</h4>
                        <p className="text-gray-700">{personalCare.mobility.stairs}</p>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 bg-white">
                      <div className="flex justify-between space-x-4">
                        <div>
                          <h4 className="text-sm font-semibold">Stairs Capability</h4>
                          <p className="text-sm text-gray-700">
                            Assessment of patient's ability to navigate stairs with or without assistance.
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                
                <div className="mt-5 pt-4 border-t border-purple-100">
                  <h4 className="text-sm font-medium text-purple-700 mb-2">Additional Notes</h4>
                  <div className="p-4 rounded-md bg-white border border-purple-100">
                    <p className="text-gray-700 text-sm italic">"{personalCare.mobility.notes}"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
