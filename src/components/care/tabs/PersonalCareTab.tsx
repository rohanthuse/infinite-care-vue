
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
    // Washing, Showering, Bathing section
    washing_showering_bathing_assistance_level?: string;
    washing_showering_bathing_notes?: string;
    wash_hands_face_independently?: boolean;
    wash_body_independently?: boolean;
    get_in_out_bath_shower_independently?: boolean;
    dry_self_independently?: boolean;
    prefer_bath_or_shower?: string;
    bathing_frequency?: string;
    specific_washing_requirements?: string;
    skin_condition_considerations?: string;
    mobility_aids_for_bathing?: string;
    bathroom_safety_concerns?: string;
    // Oral Care section
    oral_care_assist_cleaning_teeth?: boolean;
    oral_care_assist_cleaning_dentures?: boolean;
    oral_care_summary?: string;
    // Podiatry section
    has_podiatrist?: boolean;
    // Personal care related Risks section
    personal_care_risks_explanation?: string;
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
          <CardHeader className="pb-2 bg-gradient-to-r from-pink-50 to-white dark:from-pink-950/30 dark:to-background">
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
              <p className="text-muted-foreground">No personal care information available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-pink-50 to-white dark:from-pink-950/30 dark:to-background">
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
              <h3 className="text-lg font-medium text-foreground mb-4">Daily Care Activities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Bath className="h-4 w-4 text-blue-500" />
                    Bathing Preferences
                  </h4>
                  <p className="text-base">{personalCare?.bathing_preferences || 'Not specified'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-green-500" />
                    Dressing Assistance
                  </h4>
                  {personalCare?.dressing_assistance_level ? (
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                      {personalCare.dressing_assistance_level}
                    </Badge>
                  ) : (
                    <p className="text-muted-foreground text-sm">Not specified</p>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    Toileting Assistance
                  </h4>
                  {personalCare?.toileting_assistance_level ? (
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                      {personalCare.toileting_assistance_level}
                    </Badge>
                  ) : (
                    <p className="text-muted-foreground text-sm">Not specified</p>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Continence Status</h4>
                  {personalCare?.continence_status ? (
                    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                      {personalCare.continence_status}
                    </Badge>
                  ) : (
                    <p className="text-muted-foreground text-sm">Not specified</p>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Hygiene */}
            {personalCare?.personal_hygiene_needs && (
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Personal Hygiene Needs</h3>
                <p className="text-base bg-muted p-3 rounded">{personalCare.personal_hygiene_needs}</p>
              </div>
            )}

            {/* Sleep and Comfort */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Sleep & Comfort</h3>
              <div className="space-y-4">
                {personalCare?.sleep_patterns && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Moon className="h-4 w-4 text-indigo-500" />
                      Sleep Patterns
                    </h4>
                    <p className="text-base">{personalCare.sleep_patterns}</p>
                  </div>
                )}
                
                {personalCare?.comfort_measures && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Comfort Measures</h4>
                    <p className="text-base">{personalCare.comfort_measures}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Health Management */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Health Management</h3>
              <div className="space-y-4">
                {personalCare?.pain_management && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Pain Management</h4>
                    <p className="text-base bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded border border-yellow-200 dark:border-yellow-700">{personalCare.pain_management}</p>
                  </div>
                )}
                
                {personalCare?.skin_care_needs && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Skin Care Needs</h4>
                    <p className="text-base">{personalCare.skin_care_needs}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Incontinence Section */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Incontinence</h3>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Incontinence Products Required</h4>
                {personalCare?.incontinence_products_required !== undefined ? (
                  <Badge 
                    variant="outline" 
                    className={personalCare.incontinence_products_required 
                      ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700" 
                      : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                    }
                  >
                    {personalCare.incontinence_products_required ? 'Yes' : 'No'}
                  </Badge>
                ) : (
                  <p className="text-muted-foreground text-sm">Not specified</p>
                )}
              </div>
            </div>

            {/* Washing, Showering, Bathing Section */}
            {(personalCare?.washing_showering_bathing_assistance_level || 
              personalCare?.washing_showering_bathing_notes ||
              personalCare?.wash_hands_face_independently ||
              personalCare?.wash_body_independently ||
              personalCare?.get_in_out_bath_shower_independently ||
              personalCare?.dry_self_independently ||
              personalCare?.prefer_bath_or_shower ||
              personalCare?.bathing_frequency ||
              personalCare?.specific_washing_requirements ||
              personalCare?.skin_condition_considerations ||
              personalCare?.mobility_aids_for_bathing ||
              personalCare?.bathroom_safety_concerns) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Washing, Showering, Bathing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {personalCare.washing_showering_bathing_assistance_level && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Assistance Level</p>
                        <Badge variant="outline" className="capitalize">
                          {personalCare.washing_showering_bathing_assistance_level.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}
                    
                    {personalCare.prefer_bath_or_shower && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Bath/Shower Preference</p>
                        <Badge variant="outline" className="capitalize">
                          {personalCare.prefer_bath_or_shower.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}

                    {personalCare.bathing_frequency && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Bathing Frequency</p>
                        <Badge variant="outline" className="capitalize">
                          {personalCare.bathing_frequency.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Independence Levels</p>
                    {personalCare?.wash_hands_face_independently !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Wash hands and face</span>
                        <Badge variant={personalCare.wash_hands_face_independently ? "default" : "secondary"}>
                          {personalCare.wash_hands_face_independently ? "Independent" : "Needs assistance"}
                        </Badge>
                      </div>
                    )}
                    {personalCare?.wash_body_independently !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Wash body</span>
                        <Badge variant={personalCare.wash_body_independently ? "default" : "secondary"}>
                          {personalCare.wash_body_independently ? "Independent" : "Needs assistance"}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {personalCare.specific_washing_requirements && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Specific Requirements</p>
                      <p className="text-sm text-foreground">{personalCare.specific_washing_requirements}</p>
                    </div>
                  )}

                  {personalCare.washing_showering_bathing_notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Additional Notes</p>
                      <p className="text-sm text-foreground">{personalCare.washing_showering_bathing_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sleep Details Section */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Sleep Details</h3>
              <div className="space-y-4">
                {/* Sleep Times */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Bedtime</h4>
                    <p className="text-base">{personalCare?.sleep_go_to_bed_time || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Wake Up Time</h4>
                    <p className="text-base">{personalCare?.sleep_wake_up_time || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Get Out of Bed Time</h4>
                    <p className="text-base">{personalCare?.sleep_get_out_of_bed_time || 'Not specified'}</p>
                  </div>
                </div>

                {personalCare?.sleep_prepare_duration && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Preparation Duration</h4>
                    <p className="text-base">{personalCare.sleep_prepare_duration}</p>
                  </div>
                )}

                {/* Sleep Assistance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Assist Going to Bed</h4>
                    {personalCare?.assist_going_to_bed !== undefined ? (
                      <Badge 
                        variant="outline" 
                        className={personalCare.assist_going_to_bed 
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700" 
                          : "bg-muted text-muted-foreground border-border"
                        }
                      >
                        {personalCare.assist_going_to_bed ? 'Yes' : 'No'}
                      </Badge>
                    ) : (
                      <p className="text-muted-foreground text-sm">Not specified</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Assist Getting Out of Bed</h4>
                    {personalCare?.assist_getting_out_of_bed !== undefined ? (
                      <Badge 
                        variant="outline" 
                        className={personalCare.assist_getting_out_of_bed 
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700" 
                          : "bg-muted text-muted-foreground border-border"
                        }
                      >
                        {personalCare.assist_getting_out_of_bed ? 'Yes' : 'No'}
                      </Badge>
                    ) : (
                      <p className="text-muted-foreground text-sm">Not specified</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Panic Button in Bed</h4>
                    {personalCare?.panic_button_in_bed !== undefined ? (
                      <Badge 
                        variant="outline" 
                        className={personalCare.panic_button_in_bed 
                          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700" 
                          : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                        }
                      >
                        {personalCare.panic_button_in_bed ? 'Yes' : 'No'}
                      </Badge>
                    ) : (
                      <p className="text-muted-foreground text-sm">Not specified</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Assist Turning in Sleep</h4>
                    {personalCare?.assist_turn_to_sleep_position !== undefined ? (
                      <Badge 
                        variant="outline" 
                        className={personalCare.assist_turn_to_sleep_position 
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700" 
                          : "bg-muted text-muted-foreground border-border"
                        }
                      >
                        {personalCare.assist_turn_to_sleep_position ? 'Yes' : 'No'}
                      </Badge>
                    ) : (
                      <p className="text-muted-foreground text-sm">Not specified</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Oral Care Section */}
            {(personalCare?.oral_care_assist_cleaning_teeth !== undefined || 
              personalCare?.oral_care_assist_cleaning_dentures !== undefined ||
              personalCare?.oral_care_summary) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Oral Care</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {personalCare?.oral_care_assist_cleaning_teeth !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Assistance with cleaning teeth</span>
                      <Badge variant={personalCare.oral_care_assist_cleaning_teeth ? "destructive" : "default"}>
                        {personalCare.oral_care_assist_cleaning_teeth ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  )}
                  
                  {personalCare?.oral_care_assist_cleaning_dentures !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Assistance with cleaning dentures/retainers</span>
                      <Badge variant={personalCare.oral_care_assist_cleaning_dentures ? "destructive" : "default"}>
                        {personalCare.oral_care_assist_cleaning_dentures ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  )}

                  {personalCare?.oral_care_summary && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Summary</p>
                      <p className="text-sm text-foreground">{personalCare.oral_care_summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Podiatry Section */}
            {personalCare?.has_podiatrist !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Podiatry</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Has a Podiatrist</span>
                    <Badge variant={personalCare.has_podiatrist ? "default" : "secondary"}>
                      {personalCare.has_podiatrist ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Personal care related Risks Section */}
            {personalCare?.personal_care_risks_explanation && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Personal care related Risks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Explanation</p>
                    <p className="text-sm text-foreground">{personalCare.personal_care_risks_explanation}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Behavioral Notes */}
            {personalCare?.behavioral_notes && (
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Behavioral Notes</h3>
                <p className="text-base bg-blue-50 dark:bg-blue-900/30 p-3 rounded border border-blue-200 dark:border-blue-700">{personalCare.behavioral_notes}</p>
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
             personalCare?.assist_turn_to_sleep_position === undefined &&
             !personalCare?.washing_showering_bathing_assistance_level &&
             !personalCare?.washing_showering_bathing_notes &&
             personalCare?.wash_hands_face_independently === undefined &&
             personalCare?.wash_body_independently === undefined &&
             personalCare?.get_in_out_bath_shower_independently === undefined &&
             personalCare?.dry_self_independently === undefined &&
             !personalCare?.prefer_bath_or_shower &&
             !personalCare?.bathing_frequency &&
             !personalCare?.specific_washing_requirements &&
             !personalCare?.skin_condition_considerations &&
             !personalCare?.mobility_aids_for_bathing &&
              !personalCare?.bathroom_safety_concerns &&
              personalCare?.oral_care_assist_cleaning_teeth === undefined &&
              personalCare?.oral_care_assist_cleaning_dentures === undefined &&
              !personalCare?.oral_care_summary &&
              personalCare?.has_podiatrist === undefined &&
              !personalCare?.personal_care_risks_explanation && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No personal care information available</p>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
