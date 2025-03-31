
import React from "react";
import { Bath, Calendar, User, CheckCircle2, Clock, Heart, Thermometer, Activity, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

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
      return <Bath className="h-5 w-5 text-med-500" />;
    } else if (activity.toLowerCase().includes("medication")) {
      return <Thermometer className="h-5 w-5 text-med-500" />;
    } else if (activity.toLowerCase().includes("exercise")) {
      return <Activity className="h-5 w-5 text-med-500" />;
    } else {
      return <Heart className="h-5 w-5 text-med-500" />;
    }
  };

  return (
    <Card className="overflow-hidden border-med-100 shadow-sm">
      <CardHeader className="pb-3 bg-gradient-to-r from-med-50 to-white border-b border-med-100">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bath className="h-5 w-5 text-med-600" />
          <span className="bg-gradient-to-r from-med-700 to-med-500 bg-clip-text text-transparent">Personal Care</span>
        </CardTitle>
        <CardDescription>Daily care routines and preferences</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-8">
          {/* Care Routines Section */}
          <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
              <Clock className="h-5 w-5 mr-2 text-med-600" />
              Care Routines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalCare.routines.map((routine, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-4 bg-gradient-to-br from-white to-med-50 hover:shadow-md transition-all duration-200 hover:-translate-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-med-100 group-hover:bg-med-200 transition-colors">
                        {getRoutineIcon(routine.activity)}
                      </div>
                      <span className="ml-3 font-medium text-gray-800">{routine.activity}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "bg-white border-med-200 text-med-700 transition-all group-hover:bg-med-100", 
                        routine.frequency.toLowerCase().includes("daily") && "border-med-300 bg-med-50 group-hover:bg-med-100"
                      )}
                    >
                      {routine.frequency}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Personal Preferences Section */}
          <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
              <User className="h-5 w-5 mr-2 text-med-600" />
              Personal Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalCare.preferences.map((preference, index) => (
                <div 
                  key={index} 
                  className="flex items-start p-4 rounded-lg bg-white border border-med-100 hover:border-med-200 transition-all hover:shadow-sm"
                >
                  <div className="p-1.5 rounded-full bg-med-100 mr-3 flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-med-600" />
                  </div>
                  <span className="text-gray-700">{preference}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Mobility Assessment Section */}
          <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
              <Calendar className="h-5 w-5 mr-2 text-med-600" />
              Mobility Assessment
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {/* Mobility Status Card */}
              <div className="bg-med-50/50 rounded-lg p-6 border border-med-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <MobilityCard 
                    title="Status" 
                    value={personalCare.mobility.status}
                    description="General mobility level assessment indicating the patient's independence and movement capabilities."
                  />
                  
                  <MobilityCard 
                    title="Transfer Ability" 
                    value={personalCare.mobility.transferAbility}
                    description="Assessment of how well the patient can transfer between positions (e.g., bed to chair)."
                  />
                  
                  <MobilityCard 
                    title="Walking Distance" 
                    value={personalCare.mobility.walkingDistance}
                    description="Maximum distance the patient can walk independently or with assistance."
                  />
                  
                  <MobilityCard 
                    title="Stairs" 
                    value={personalCare.mobility.stairs}
                    description="Assessment of patient's ability to navigate stairs with or without assistance."
                  />
                </div>
                
                <div className="mt-5 pt-4 border-t border-med-100">
                  <h4 className="text-sm font-medium text-med-700 mb-3 flex items-center">
                    <HelpCircle className="h-4 w-4 mr-1.5 text-med-600" />
                    Additional Notes
                  </h4>
                  <div className="p-4 rounded-lg bg-white border border-med-100 shadow-sm">
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

interface MobilityCardProps {
  title: string;
  value: string;
  description: string;
}

const MobilityCard: React.FC<MobilityCardProps> = ({ title, value, description }) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="p-4 rounded-lg bg-white border border-med-100 cursor-help hover:border-med-300 hover:shadow-sm transition-all">
          <h4 className="text-sm font-medium text-med-700 mb-1.5">{title}</h4>
          <p className="text-gray-700 font-medium">{value}</p>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 bg-white">
        <div className="flex justify-between space-x-4">
          <div>
            <h4 className="text-sm font-semibold">{title}</h4>
            <p className="text-sm text-gray-700">
              {description}
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
