
import React from "react";
import { Heart, Edit, Moon, Droplets, Shirt, Bath } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    // Incontinence section
    incontinence_products_required?: boolean;
    // Sleep section
    sleep_go_to_bed_time?: string;
    sleep_wake_up_time?: string;
    sleep_get_out_of_bed_time?: string;
    sleep_prepare_duration?: string;
    assist_going_to_bed?: boolean;
    assist_getting_out_of_bed?: boolean;
    panic_button_in_bed?: boolean;
    assist_turn_to_sleep_position?: boolean;
  } | null;
  onEditPersonalCare?: () => void;
}

export const PersonalCareTab: React.FC<PersonalCareTabProps> = ({ 
  personalCare, 
  onEditPersonalCare 
}) => {
  // Handle loading state if data is not available
  if (!personalCare) {
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
            <div className="text-center py-8">
              <p className="text-gray-500">No personal care information available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  <p className="text-base">{personalCare?.bathing_preferences || 'Not specified'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-green-500" />
                    Dressing Assistance
                  </h4>
                  {personalCare?.dressing_assistance_level ? (
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
                  {personalCare?.toileting_assistance_level ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {personalCare.toileting_assistance_level}
                    </Badge>
                  ) : (
                    <p className="text-gray-500 text-sm">Not specified</p>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Continence Status</h4>
                  {personalCare?.continence_status ? (
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
            {personalCare?.personal_hygiene_needs && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Personal Hygiene Needs</h3>
                <p className="text-base bg-gray-50 p-3 rounded">{personalCare.personal_hygiene_needs}</p>
              </div>
            )}

            {/* Sleep and Comfort */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Sleep & Comfort</h3>
              <div className="space-y-4">
                {personalCare?.sleep_patterns && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                      <Moon className="h-4 w-4 text-indigo-500" />
                      Sleep Patterns
                    </h4>
                    <p className="text-base">{personalCare.sleep_patterns}</p>
                  </div>
                )}
                
                {personalCare?.comfort_measures && (
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
                {personalCare?.pain_management && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Pain Management</h4>
                    <p className="text-base bg-yellow-50 p-3 rounded border border-yellow-200">{personalCare.pain_management}</p>
                  </div>
                )}
                
                {personalCare?.skin_care_needs && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Skin Care Needs</h4>
                    <p className="text-base">{personalCare.skin_care_needs}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Incontinence Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Incontinence</h3>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Incontinence Products Required</h4>
                {personalCare?.incontinence_products_required !== undefined ? (
                  <Badge 
                    variant="outline" 
                    className={personalCare.incontinence_products_required 
                      ? "bg-red-50 text-red-700 border-red-200" 
                      : "bg-green-50 text-green-700 border-green-200"
                    }
                  >
                    {personalCare.incontinence_products_required ? 'Yes' : 'No'}
                  </Badge>
                ) : (
                  <p className="text-gray-500 text-sm">Not specified</p>
                )}
              </div>
            </div>

            {/* Sleep Details Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Sleep Details</h3>
              <div className="space-y-4">
                {/* Sleep Times */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Bedtime</h4>
                    <p className="text-base">{personalCare?.sleep_go_to_bed_time || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Wake Up Time</h4>
                    <p className="text-base">{personalCare?.sleep_wake_up_time || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Get Out of Bed Time</h4>
                    <p className="text-base">{personalCare?.sleep_get_out_of_bed_time || 'Not specified'}</p>
                  </div>
                </div>

                {personalCare?.sleep_prepare_duration && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Preparation Duration</h4>
                    <p className="text-base">{personalCare.sleep_prepare_duration}</p>
                  </div>
                )}

                {/* Sleep Assistance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Assist Going to Bed</h4>
                    {personalCare?.assist_going_to_bed !== undefined ? (
                      <Badge 
                        variant="outline" 
                        className={personalCare.assist_going_to_bed 
                          ? "bg-blue-50 text-blue-700 border-blue-200" 
                          : "bg-gray-50 text-gray-700 border-gray-200"
                        }
                      >
                        {personalCare.assist_going_to_bed ? 'Yes' : 'No'}
                      </Badge>
                    ) : (
                      <p className="text-gray-500 text-sm">Not specified</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Assist Getting Out of Bed</h4>
                    {personalCare?.assist_getting_out_of_bed !== undefined ? (
                      <Badge 
                        variant="outline" 
                        className={personalCare.assist_getting_out_of_bed 
                          ? "bg-blue-50 text-blue-700 border-blue-200" 
                          : "bg-gray-50 text-gray-700 border-gray-200"
                        }
                      >
                        {personalCare.assist_getting_out_of_bed ? 'Yes' : 'No'}
                      </Badge>
                    ) : (
                      <p className="text-gray-500 text-sm">Not specified</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Panic Button in Bed</h4>
                    {personalCare?.panic_button_in_bed !== undefined ? (
                      <Badge 
                        variant="outline" 
                        className={personalCare.panic_button_in_bed 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {personalCare.panic_button_in_bed ? 'Yes' : 'No'}
                      </Badge>
                    ) : (
                      <p className="text-gray-500 text-sm">Not specified</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Assist Turning in Sleep</h4>
                    {personalCare?.assist_turn_to_sleep_position !== undefined ? (
                      <Badge 
                        variant="outline" 
                        className={personalCare.assist_turn_to_sleep_position 
                          ? "bg-blue-50 text-blue-700 border-blue-200" 
                          : "bg-gray-50 text-gray-700 border-gray-200"
                        }
                      >
                        {personalCare.assist_turn_to_sleep_position ? 'Yes' : 'No'}
                      </Badge>
                    ) : (
                      <p className="text-gray-500 text-sm">Not specified</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Behavioral Notes */}
            {personalCare?.behavioral_notes && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Behavioral Notes</h3>
                <p className="text-base bg-blue-50 p-3 rounded border border-blue-200">{personalCare.behavioral_notes}</p>
              </div>
            )}

            {/* Show message if no data at all */}
            {!personalCare?.bathing_preferences && 
             !personalCare?.dressing_assistance_level && 
             !personalCare?.toileting_assistance_level && 
             !personalCare?.continence_status &&
             !personalCare?.personal_hygiene_needs &&
             !personalCare?.sleep_patterns &&
             !personalCare?.comfort_measures &&
             !personalCare?.pain_management &&
             !personalCare?.skin_care_needs &&
             !personalCare?.behavioral_notes &&
             personalCare?.incontinence_products_required === undefined &&
             !personalCare?.sleep_go_to_bed_time &&
             !personalCare?.sleep_wake_up_time &&
             !personalCare?.sleep_get_out_of_bed_time &&
             !personalCare?.sleep_prepare_duration &&
             personalCare?.assist_going_to_bed === undefined &&
             personalCare?.assist_getting_out_of_bed === undefined &&
             personalCare?.panic_button_in_bed === undefined &&
             personalCare?.assist_turn_to_sleep_position === undefined && (
               <div className="text-center py-8">
                 <p className="text-gray-500">No personal care information available</p>
               </div>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
