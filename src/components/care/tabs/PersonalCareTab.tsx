
import React from "react";
import { Heart, Edit, Moon, Droplets, Shirt, Bath } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PersonalCareTabProps {
  personalCare: {
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
  };
  onEditPersonalCare?: () => void;
}

export const PersonalCareTab: React.FC<PersonalCareTabProps> = ({ 
  personalCare, 
  onEditPersonalCare 
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-pink-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-600" />
              <CardTitle className="text-lg">Personal Care</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={onEditPersonalCare}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
          <CardDescription>Personal care needs and assistance levels</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-6">
            {/* Daily Care Activities */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Daily Care Activities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <Bath className="h-4 w-4 text-blue-500" />
                    Bathing Preferences
                  </h4>
                  <p className="text-base">{personalCare.bathing_preferences || 'Not specified'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-green-500" />
                    Dressing Assistance
                  </h4>
                  {personalCare.dressing_assistance_level ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {personalCare.dressing_assistance_level}
                    </Badge>
                  ) : (
                    <p className="text-gray-500 text-sm">Not specified</p>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    Toileting Assistance
                  </h4>
                  {personalCare.toileting_assistance_level ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {personalCare.toileting_assistance_level}
                    </Badge>
                  ) : (
                    <p className="text-gray-500 text-sm">Not specified</p>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Continence Status</h4>
                  {personalCare.continence_status ? (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {personalCare.continence_status}
                    </Badge>
                  ) : (
                    <p className="text-gray-500 text-sm">Not specified</p>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Hygiene */}
            {personalCare.personal_hygiene_needs && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Personal Hygiene Needs</h3>
                <p className="text-base bg-gray-50 p-3 rounded">{personalCare.personal_hygiene_needs}</p>
              </div>
            )}

            {/* Sleep and Comfort */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Sleep & Comfort</h3>
              <div className="space-y-4">
                {personalCare.sleep_patterns && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                      <Moon className="h-4 w-4 text-indigo-500" />
                      Sleep Patterns
                    </h4>
                    <p className="text-base">{personalCare.sleep_patterns}</p>
                  </div>
                )}
                
                {personalCare.comfort_measures && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Comfort Measures</h4>
                    <p className="text-base">{personalCare.comfort_measures}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Health Management */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Health Management</h3>
              <div className="space-y-4">
                {personalCare.pain_management && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Pain Management</h4>
                    <p className="text-base bg-yellow-50 p-3 rounded border border-yellow-200">{personalCare.pain_management}</p>
                  </div>
                )}
                
                {personalCare.skin_care_needs && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Skin Care Needs</h4>
                    <p className="text-base">{personalCare.skin_care_needs}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Behavioral Notes */}
            {personalCare.behavioral_notes && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Behavioral Notes</h3>
                <p className="text-base bg-blue-50 p-3 rounded border border-blue-200">{personalCare.behavioral_notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
