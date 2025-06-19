
import React from "react";
import { Bath, Calendar, User, CheckCircle2, Clock, Heart, Thermometer, Activity, HelpCircle, FileText, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PersonalCareTabProps {
  personalCare?: {
    personal_hygiene_needs?: string;
    bathing_preferences?: string;
    dressing_assistance_level?: string;
    toileting_assistance_level?: string;
    continence_status?: string;
    sleep_patterns?: string;
    behavioral_notes?: string;
    comfort_measures?: string;
    pain_management?: string;
    skin_care_needs?: string;
  } | null;
  onEditPersonalCare?: () => void;
}

export const PersonalCareTab: React.FC<PersonalCareTabProps> = ({ personalCare, onEditPersonalCare }) => {
  if (!personalCare) {
    return (
      <Card className="overflow-hidden border-gray-100 shadow-sm">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bath className="h-5 w-5 text-blue-600" />
                <span>Personal Care</span>
              </CardTitle>
              <CardDescription>Daily care routines and preferences</CardDescription>
            </div>
            {onEditPersonalCare && (
              <Button variant="outline" size="sm" onClick={onEditPersonalCare}>
                <Plus className="h-4 w-4 mr-2" />
                Add Personal Care Plan
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Bath className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">No personal care information recorded</p>
            {onEditPersonalCare && (
              <Button variant="outline" onClick={onEditPersonalCare}>
                <Plus className="h-4 w-4 mr-2" />
                Add Personal Care Plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const careItems = [
    {
      title: "Personal Hygiene",
      value: personalCare.personal_hygiene_needs,
      icon: <Bath className="h-5 w-5 text-blue-500" />
    },
    {
      title: "Bathing Preferences",
      value: personalCare.bathing_preferences,
      icon: <Bath className="h-5 w-5 text-blue-500" />
    },
    {
      title: "Dressing Assistance",
      value: personalCare.dressing_assistance_level,
      icon: <User className="h-5 w-5 text-green-500" />
    },
    {
      title: "Toileting Assistance",
      value: personalCare.toileting_assistance_level,
      icon: <User className="h-5 w-5 text-green-500" />
    }
  ].filter(item => item.value);

  return (
    <Card className="overflow-hidden border-gray-100 shadow-sm">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bath className="h-5 w-5 text-blue-600" />
              <span>Personal Care</span>
            </CardTitle>
            <CardDescription>Daily care routines and preferences</CardDescription>
          </div>
          {onEditPersonalCare && (
            <Button variant="outline" size="sm" onClick={onEditPersonalCare}>
              <FileText className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Care Routines Section */}
          {careItems.length > 0 && (
            <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-md font-medium mb-4 flex items-center text-gray-700">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Care Routines
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {careItems.map((item, index) => (
                  <div 
                    key={index} 
                    className="border rounded-lg p-4 bg-gradient-to-br from-white to-blue-50 hover:shadow-md transition-all duration-200 hover:-translate-y-1 group"
                  >
                    <div className="flex items-start">
                      <div className="p-2 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors mr-3">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health & Comfort Section */}
          {(personalCare.continence_status || personalCare.pain_management || personalCare.skin_care_needs) && (
            <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-md font-medium mb-4 flex items-center text-gray-700">
                <Heart className="h-5 w-5 mr-2 text-red-600" />
                Health & Comfort
              </h3>
              <div className="space-y-4">
                {personalCare.continence_status && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <h4 className="font-medium text-red-800 mb-1">Continence Status</h4>
                    <p className="text-sm text-red-700">{personalCare.continence_status}</p>
                  </div>
                )}
                {personalCare.pain_management && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <h4 className="font-medium text-purple-800 mb-1">Pain Management</h4>
                    <p className="text-sm text-purple-700">{personalCare.pain_management}</p>
                  </div>
                )}
                {personalCare.skin_care_needs && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <h4 className="font-medium text-green-800 mb-1">Skin Care Needs</h4>
                    <p className="text-sm text-green-700">{personalCare.skin_care_needs}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sleep & Behavior Section */}
          {(personalCare.sleep_patterns || personalCare.behavioral_notes || personalCare.comfort_measures) && (
            <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-md font-medium mb-4 flex items-center text-gray-700">
                <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                Sleep & Behavioral Care
              </h3>
              <div className="space-y-4">
                {personalCare.sleep_patterns && (
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <h4 className="font-medium text-indigo-800 mb-1">Sleep Patterns</h4>
                    <p className="text-sm text-indigo-700">{personalCare.sleep_patterns}</p>
                  </div>
                )}
                {personalCare.behavioral_notes && (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <h4 className="font-medium text-amber-800 mb-1">Behavioral Notes</h4>
                    <p className="text-sm text-amber-700">{personalCare.behavioral_notes}</p>
                  </div>
                )}
                {personalCare.comfort_measures && (
                  <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                    <h4 className="font-medium text-teal-800 mb-1">Comfort Measures</h4>
                    <p className="text-sm text-teal-700">{personalCare.comfort_measures}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
