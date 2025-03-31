
import React from "react";
import { Bath, Calendar, User, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  return (
    <Card>
      <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-white">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bath className="h-5 w-5 text-purple-600" />
          <span>Personal Care</span>
        </CardTitle>
        <CardDescription>Daily care routines and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-purple-600" />
              Care Routines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {personalCare.routines.map((routine, index) => (
                <div key={index} className="border rounded-md p-3 bg-purple-50/30">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{routine.activity}</span>
                    <Badge variant="outline" className="bg-white">
                      {routine.frequency}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-3 flex items-center">
              <User className="h-4 w-4 mr-2 text-purple-600" />
              Personal Preferences
            </h3>
            <ul className="space-y-2">
              {personalCare.preferences.map((preference, index) => (
                <li key={index} className="text-sm flex items-start">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>{preference}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-purple-600" />
              Mobility Assessment
            </h3>
            <div className="bg-gray-50 rounded-md p-4 border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-sm">{personalCare.mobility.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Transfer Ability</p>
                  <p className="text-sm">{personalCare.mobility.transferAbility}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Walking Distance</p>
                  <p className="text-sm">{personalCare.mobility.walkingDistance}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Stairs</p>
                  <p className="text-sm">{personalCare.mobility.stairs}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm font-medium text-gray-500">Notes</p>
                <p className="text-sm">{personalCare.mobility.notes}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
