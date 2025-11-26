import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';

interface AboutMeSectionProps {
  aboutMe: any;
}

export function AboutMeSection({ aboutMe }: AboutMeSectionProps) {
  const data = aboutMe || {};

  const renderField = (label: string, value: any) => {
    const hasValue = value && (Array.isArray(value) ? value.length > 0 : true);
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        {hasValue ? (
          Array.isArray(value) ? (
            <ul className="mt-1 space-y-1">
              {value.map((item, idx) => (
                <li key={idx} className="text-base flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base mt-1 whitespace-pre-wrap">{value}</p>
          )
        ) : (
          <p className="text-sm mt-1 text-muted-foreground italic">No data provided</p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          About Me
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Life & Personality */}
        <div>
          <h3 className="font-semibold text-base mb-3">My Life & Personality</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('Life History', data.life_history)}
            {renderField('Personality Traits', data.personality_traits)}
            {renderField('What is Most Important to Me', data.what_is_most_important_to_me)}
            {renderField('My Wellness', data.my_wellness)}
          </div>
        </div>

        {/* Communication & Support */}
        <div>
          <h3 className="font-semibold text-base mb-3">Communication & Support</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('Communication Style', data.communication_style)}
            {renderField('How to Communicate with Me', data.how_to_communicate_with_me)}
            {renderField('How and When to Support Me', data.how_and_when_to_support_me)}
          </div>
        </div>

        {/* Preferences & Activities */}
        <div>
          <h3 className="font-semibold text-base mb-3">Preferences & Activities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('Meaningful Activities', data.meaningful_activities)}
            {renderField('Please Do', data.please_do)}
            {renderField('Please Don\'t', data.please_dont)}
          </div>
        </div>

        {/* Important People & Additional Info */}
        <div>
          <h3 className="font-semibold text-base mb-3">Important People & Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('Important People', data.important_people)}
            {renderField('Also Worth Knowing About Me', data.also_worth_knowing_about_me)}
            {renderField('Supported to Write This By', data.supported_to_write_this_by)}
          </div>
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
  );
}
