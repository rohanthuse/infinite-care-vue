
import React from "react";
import { Heart, Globe, MessageSquare, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AboutMeTabProps {
  personalInfo: {
    cultural_preferences?: string;
    language_preferences?: string;
    religion?: string;
    marital_status?: string;
  };
  personalCare: {
    id: string;
    client_id: string;
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
    created_at: string;
    updated_at: string;
  };
  onEditAboutMe?: () => void;
}

export const AboutMeTab: React.FC<AboutMeTabProps> = ({ 
  personalInfo, 
  personalCare,
  onEditAboutMe 
}) => {
  return (
    <div className="space-y-6">
      {/* Cultural & Personal Preferences */}
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Cultural & Personal Preferences</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={onEditAboutMe}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
          <CardDescription>Cultural background and personal preferences</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Cultural Preferences</h3>
                <p className="text-base">{personalInfo.cultural_preferences || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Language Preferences</h3>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <p className="text-base">{personalInfo.language_preferences || 'Not specified'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Religion</h3>
                <p className="text-base">{personalInfo.religion || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Marital Status</h3>
                <p className="text-base">{personalInfo.marital_status || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Care Preferences */}
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Care Preferences</CardTitle>
          </div>
          <CardDescription>Personal care needs and preferences</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {personalCare.personal_hygiene_needs && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Personal Hygiene Needs</h3>
                <p className="text-base">{personalCare.personal_hygiene_needs}</p>
              </div>
            )}
            
            {personalCare.bathing_preferences && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Bathing Preferences</h3>
                <p className="text-base">{personalCare.bathing_preferences}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {personalCare.dressing_assistance_level && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Dressing Assistance</h3>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {personalCare.dressing_assistance_level}
                  </Badge>
                </div>
              )}
              
              {personalCare.toileting_assistance_level && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Toileting Assistance</h3>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {personalCare.toileting_assistance_level}
                  </Badge>
                </div>
              )}
            </div>
            
            {personalCare.sleep_patterns && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Sleep Patterns</h3>
                <p className="text-base">{personalCare.sleep_patterns}</p>
              </div>
            )}
            
            {personalCare.comfort_measures && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Comfort Measures</h3>
                <p className="text-base">{personalCare.comfort_measures}</p>
              </div>
            )}
            
            {personalCare.behavioral_notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Behavioral Notes</h3>
                <p className="text-base">{personalCare.behavioral_notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
