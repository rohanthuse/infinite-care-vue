import React from "react";
import { Heart, Globe, MessageSquare, Edit, Home, Accessibility, FileText, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AboutMeTabProps {
  personalInfo?: {
    cultural_preferences?: string;
    language_preferences?: string;
    religion?: string;
    marital_status?: string;
  } | null;
  personalCare?: {
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
  } | null;
  aboutMeData?: {
    has_key_safe?: boolean;
    key_safe_code?: string;
    requires_heating_help?: boolean;
    home_type?: string;
    living_status?: string;
    is_visually_impaired?: boolean;
    vision_description?: string;
    is_hearing_impaired?: boolean;
    hearing_description?: string;
    mobility?: string;
    communication_needs?: string;
    how_i_communicate?: string;
    ethnicity?: string;
    living_arrangement?: string;
    has_dnr?: boolean;
    has_respect?: boolean;
    has_dols?: boolean;
    has_lpa?: boolean;
    // New fields - My Home
    pets?: string;
    home_accessibility?: string;
    parking_availability?: string;
    emergency_access?: string;
    // New fields - Accessibility
    requires_interpreter?: string | boolean;
    sensory_impairment?: string;
    speech_difficulties?: string | boolean;
    cognitive_impairment?: string | boolean;
    communication_aids?: string;
    // New fields - Background & Identity
    religion?: string;
    sexual_orientation?: string;
    gender_identity?: string;
    nationality?: string;
    primary_language?: string;
    preferred_interpreter_language?: string;
    // New fields - Do's & Don'ts
    likes?: string;
    dislikes?: string;
    dos?: string;
    donts?: string;
  } | null;
  isLoadingPersonalInfo?: boolean;
  isLoadingPersonalCare?: boolean;
  onEditAboutMe?: () => void;
}

const HOME_TYPE_LABELS: Record<string, string> = {
  house: 'House',
  flat: 'Flat',
  bungalow: 'Bungalow',
  care_home: 'Care Home',
  sheltered_housing: 'Sheltered Housing',
  other: 'Other',
};

const LIVING_ARRANGEMENT_LABELS: Record<string, string> = {
  lives_alone: 'Lives Alone',
  with_spouse: 'With Spouse/Partner',
  with_family: 'With Family',
  with_carer: 'With Carer',
  shared_accommodation: 'Shared Accommodation',
  other: 'Other',
};

const renderYesNo = (label: string, value: boolean | undefined) => (
  <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
    <span className="text-sm font-medium">{label}</span>
    {value === true ? (
      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <Check className="h-3 w-3 mr-1" /> Yes
      </Badge>
    ) : value === false ? (
      <Badge variant="secondary" className="bg-muted text-muted-foreground">
        <X className="h-3 w-3 mr-1" /> No
      </Badge>
    ) : (
      <span className="text-sm text-muted-foreground italic">Not specified</span>
    )}
  </div>
);

export const AboutMeTab: React.FC<AboutMeTabProps> = ({ 
  personalInfo, 
  personalCare,
  aboutMeData,
  isLoadingPersonalInfo = false,
  isLoadingPersonalCare = false,
  onEditAboutMe 
}) => {
  // Show loading state only when actually loading
  if (isLoadingPersonalInfo || isLoadingPersonalCare) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading information...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* My Home Section */}
      {aboutMeData && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">My Home</CardTitle>
              </div>
              <Button size="sm" variant="outline" onClick={onEditAboutMe}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
            <CardDescription>Home environment and living situation</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                {renderYesNo('Key Safe', aboutMeData.has_key_safe)}
                {aboutMeData.has_key_safe && aboutMeData.key_safe_code && (
                  <div className="pl-4 border-l-2 border-primary/30 mt-2">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Key Safe Code/Location</h3>
                    <p className="text-base font-mono bg-muted/50 px-2 py-1 rounded">{aboutMeData.key_safe_code}</p>
                  </div>
                )}
                {renderYesNo('Requires Heating Help', aboutMeData.requires_heating_help)}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Home Type</h3>
                  <p className="text-base">
                    {aboutMeData.home_type 
                      ? HOME_TYPE_LABELS[aboutMeData.home_type] || aboutMeData.home_type 
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Living Status</h3>
                  <p className="text-base">{aboutMeData.living_status || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Pets</h3>
                  <p className="text-base">{aboutMeData.pets || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Home Accessibility</h3>
                  <p className="text-base">{aboutMeData.home_accessibility || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Parking Availability</h3>
                  <p className="text-base">{aboutMeData.parking_availability || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Emergency Access</h3>
                  <p className="text-base">{aboutMeData.emergency_access || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Accessibility and Communication Section */}
      {aboutMeData && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Accessibility className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">My Accessibility and Communication</CardTitle>
            </div>
            <CardDescription>Accessibility needs and communication preferences</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                {renderYesNo('Blind or Partially Sighted', aboutMeData.is_visually_impaired)}
                {aboutMeData.is_visually_impaired && aboutMeData.vision_description && (
                  <div className="pl-4 border-l-2 border-primary/30 mt-2">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Vision Description</h3>
                    <p className="text-base">{aboutMeData.vision_description}</p>
                  </div>
                )}
                {renderYesNo('Deaf or Hard of Hearing', aboutMeData.is_hearing_impaired)}
                {aboutMeData.is_hearing_impaired && aboutMeData.hearing_description && (
                  <div className="pl-4 border-l-2 border-primary/30 mt-2">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Hearing Description</h3>
                    <p className="text-base">{aboutMeData.hearing_description}</p>
                  </div>
                )}
                {renderYesNo('Requires Interpreter', aboutMeData.requires_interpreter === 'yes' || aboutMeData.requires_interpreter === true)}
                {renderYesNo('Speech Difficulties', aboutMeData.speech_difficulties === 'yes' || aboutMeData.speech_difficulties === true)}
                {renderYesNo('Cognitive Impairment', aboutMeData.cognitive_impairment === 'yes' || aboutMeData.cognitive_impairment === true)}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Mobility</h3>
                  <p className="text-base">{aboutMeData.mobility || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Communication Needs</h3>
                  <p className="text-base">{aboutMeData.communication_needs || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">How I Communicate</h3>
                  <p className="text-base">{aboutMeData.how_i_communicate || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Sensory Impairment</h3>
                  <p className="text-base">{aboutMeData.sensory_impairment || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Communication Aids</h3>
                  <p className="text-base">{aboutMeData.communication_aids || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Background & Identity Section */}
      {aboutMeData && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Background & Identity</CardTitle>
            </div>
            <CardDescription>Background information and legal directives</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Ethnicity</h3>
                  <p className="text-base">{aboutMeData.ethnicity || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Living Arrangement</h3>
                  <p className="text-base">
                    {aboutMeData.living_arrangement 
                      ? LIVING_ARRANGEMENT_LABELS[aboutMeData.living_arrangement] || aboutMeData.living_arrangement 
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Religion</h3>
                  <p className="text-base">{aboutMeData.religion || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Sexual Orientation</h3>
                  <p className="text-base">{aboutMeData.sexual_orientation || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Gender Identity</h3>
                  <p className="text-base">{aboutMeData.gender_identity || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Nationality</h3>
                  <p className="text-base">{aboutMeData.nationality || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Primary Language</h3>
                  <p className="text-base">{aboutMeData.primary_language || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Preferred Interpreter Language</h3>
                  <p className="text-base">{aboutMeData.preferred_interpreter_language || 'Not specified'}</p>
                </div>
              </div>
              <div className="space-y-2">
                {renderYesNo('DNR in Place', aboutMeData.has_dnr)}
                {renderYesNo('ReSPECT in Place', aboutMeData.has_respect)}
                {renderYesNo('DoLS in Place', aboutMeData.has_dols)}
                {renderYesNo('LPA in Place', aboutMeData.has_lpa)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cultural & Personal Preferences */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Cultural & Personal Preferences</CardTitle>
            </div>
            {!aboutMeData && (
              <Button size="sm" variant="outline" onClick={onEditAboutMe}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          <CardDescription>Cultural background and personal preferences</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Cultural Preferences</h3>
                <p className="text-base">{personalInfo?.cultural_preferences || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Language Preferences</h3>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">{personalInfo?.language_preferences || 'Not specified'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Religion</h3>
                <p className="text-base">{personalInfo?.religion || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Marital Status</h3>
                <p className="text-base">{personalInfo?.marital_status || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Do's & Don'ts */}
      {aboutMeData && (aboutMeData.likes || aboutMeData.dislikes || aboutMeData.dos || aboutMeData.donts) && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Do's & Don'ts</CardTitle>
            </div>
            <CardDescription>Preferences and things to remember</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aboutMeData.likes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Likes/Preferences</h3>
                  <p className="text-base">{aboutMeData.likes}</p>
                </div>
              )}
              {aboutMeData.dislikes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Dislikes/Restrictions</h3>
                  <p className="text-base">{aboutMeData.dislikes}</p>
                </div>
              )}
              {aboutMeData.dos && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Do's</h3>
                  <p className="text-base">{aboutMeData.dos}</p>
                </div>
              )}
              {aboutMeData.donts && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Don'ts</h3>
                  <p className="text-base">{aboutMeData.donts}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Care Preferences */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Care Preferences</CardTitle>
          </div>
          <CardDescription>Personal care needs and preferences</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {personalCare ? (
            <div className="space-y-4">
              {personalCare.personal_hygiene_needs && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Personal Hygiene Needs</h3>
                  <p className="text-base">{personalCare.personal_hygiene_needs}</p>
                </div>
              )}
              
              {personalCare.bathing_preferences && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Bathing Preferences</h3>
                  <p className="text-base">{personalCare.bathing_preferences}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {personalCare.dressing_assistance_level && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Dressing Assistance</h3>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {personalCare.dressing_assistance_level}
                    </Badge>
                  </div>
                )}
                
                {personalCare.toileting_assistance_level && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Toileting Assistance</h3>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {personalCare.toileting_assistance_level}
                    </Badge>
                  </div>
                )}
              </div>
              
              {personalCare.sleep_patterns && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Sleep Patterns</h3>
                  <p className="text-base">{personalCare.sleep_patterns}</p>
                </div>
              )}
              
              {personalCare.comfort_measures && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Comfort Measures</h3>
                  <p className="text-base">{personalCare.comfort_measures}</p>
                </div>
              )}
              
              {personalCare.behavioral_notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Behavioral Notes</h3>
                  <p className="text-base">{personalCare.behavioral_notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No personal care information available</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={onEditAboutMe}
              >
                <Edit className="h-4 w-4 mr-2" />
                Add Care Information
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
