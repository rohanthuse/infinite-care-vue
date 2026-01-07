import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Home, Accessibility, FileText, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AboutMeSectionProps {
  aboutMe: any;
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

export function AboutMeSection({ aboutMe }: AboutMeSectionProps) {
  const data = aboutMe || {};

  const renderField = (label: string, value: any) => {
    const hasValue = value && (Array.isArray(value) ? value.length > 0 : true);
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        {hasValue ? (
          Array.isArray(value) ? (
            <ul className="mt-1 space-y-1 max-h-[150px] overflow-y-auto">
              {value.map((item, idx) => (
                <li key={idx} className="text-base flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-1 max-h-[150px] overflow-y-auto rounded-md border border-border bg-muted/30 p-3">
              <p className="text-base whitespace-pre-wrap">{value}</p>
            </div>
          )
        ) : (
          <p className="text-sm mt-1 text-muted-foreground italic">No data provided</p>
        )}
      </div>
    );
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

  return (
    <div className="space-y-6">
      {/* My Home Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            My Home
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              {renderYesNo('Key Safe', data.has_key_safe)}
              {data.has_key_safe && data.key_safe_code && (
                <div className="pl-4 border-l-2 border-primary/30">
                  {renderField('Key Safe Code/Location', data.key_safe_code)}
                </div>
              )}
              {renderYesNo('Requires Heating Help', data.requires_heating_help)}
            </div>
            <div className="space-y-4">
              {renderField('Home Type', data.home_type ? HOME_TYPE_LABELS[data.home_type] || data.home_type : null)}
              {renderField('Living Status', data.living_status)}
              {renderField('Pets', data.pets)}
              {renderField('Home Accessibility', data.home_accessibility)}
              {renderField('Parking Availability', data.parking_availability)}
              {renderField('Emergency Access', data.emergency_access)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Accessibility and Communication Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5 text-primary" />
            My Accessibility and Communication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              {renderYesNo('Blind or Partially Sighted', data.is_visually_impaired)}
              {data.is_visually_impaired && data.vision_description && (
                <div className="pl-4 border-l-2 border-primary/30">
                  {renderField('Vision Description', data.vision_description)}
                </div>
              )}
              {renderYesNo('Deaf or Hard of Hearing', data.is_hearing_impaired)}
              {data.is_hearing_impaired && data.hearing_description && (
                <div className="pl-4 border-l-2 border-primary/30">
                  {renderField('Hearing Description', data.hearing_description)}
                </div>
              )}
              {renderYesNo('Requires Interpreter', data.requires_interpreter === 'yes' || data.requires_interpreter === true)}
              {renderYesNo('Speech Difficulties', data.speech_difficulties === 'yes' || data.speech_difficulties === true)}
              {renderYesNo('Cognitive Impairment', data.cognitive_impairment === 'yes' || data.cognitive_impairment === true)}
            </div>
            <div className="space-y-4">
              {renderField('Mobility', data.mobility)}
              {renderField('Communication Needs', data.communication_needs)}
              {renderField('How I Communicate', data.how_i_communicate)}
              {renderField('Sensory Impairment', data.sensory_impairment)}
              {renderField('Communication Aids', data.communication_aids)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background & Identity Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Background & Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {renderField('Ethnicity', data.ethnicity)}
              {renderField('Living Arrangement', data.living_arrangement ? LIVING_ARRANGEMENT_LABELS[data.living_arrangement] || data.living_arrangement : null)}
              {renderField('Religion', data.religion)}
              {renderField('Sexual Orientation', data.sexual_orientation)}
              {renderField('Gender Identity', data.gender_identity)}
              {renderField('Nationality', data.nationality)}
              {renderField('Primary Language', data.primary_language)}
              {renderField('Preferred Interpreter Language', data.preferred_interpreter_language)}
            </div>
            <div className="space-y-2">
              {renderYesNo('DNR in Place', data.has_dnr)}
              {renderYesNo('ReSPECT in Place', data.has_respect)}
              {renderYesNo('DoLS in Place', data.has_dols)}
              {renderYesNo('LPA in Place', data.has_lpa)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Life & Personality Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            My Life & Personality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('Life History', data.life_history)}
            {renderField('Personality Traits', data.personality_traits)}
            {renderField('What is Most Important to Me', data.what_is_most_important_to_me)}
            {renderField('My Wellness', data.my_wellness)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('Communication Style', data.communication_style)}
            {renderField('How to Communicate with Me', data.how_to_communicate_with_me)}
            {renderField('How and When to Support Me', data.how_and_when_to_support_me)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('Meaningful Activities', data.meaningful_activities)}
            {renderField('Please Do', data.please_do)}
            {renderField("Please Don't", data.please_dont)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('Important People', data.important_people)}
            {renderField('Also Worth Knowing About Me', data.also_worth_knowing_about_me)}
            {renderField('Supported to Write This By', data.supported_to_write_this_by)}
          </div>

          {/* Legacy field mappings for backward compatibility */}
          {(data.background || data.likes || data.dislikes || data.communication_preferences || data.cultural_religious_needs || data.daily_routine || data.hobbies) && (
            <div>
              <h3 className="font-semibold text-base mb-3">Additional Information (Legacy)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.background && renderField('Background & History', data.background)}
                {data.likes && renderField('Likes & Interests', data.likes)}
                {data.dislikes && renderField('Dislikes', data.dislikes)}
                {data.communication_preferences && renderField('Communication Preferences', data.communication_preferences)}
                {data.cultural_religious_needs && renderField('Cultural/Religious Needs', data.cultural_religious_needs)}
                {data.daily_routine && renderField('Daily Routine Preferences', data.daily_routine)}
                {data.hobbies && renderField('Hobbies & Activities', data.hobbies)}
              </div>
            </div>
          )}

          {/* Document Information */}
          <div className="bg-muted/50 rounded p-3">
            <label className="text-sm font-medium">Document Information</label>
            <div className="mt-2 flex gap-4 text-sm">
              <span>Date: {data.date || <span className="text-muted-foreground italic">Not specified</span>}</span>
              <span>Time: {data.time || <span className="text-muted-foreground italic">Not specified</span>}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
