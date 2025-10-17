import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, User } from 'lucide-react';

interface AboutMeSectionProps {
  aboutMe: any;
}

export function AboutMeSection({ aboutMe }: AboutMeSectionProps) {
  if (!aboutMe || Object.keys(aboutMe).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            About Me
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No personal information provided yet.</p>
        </CardContent>
      </Card>
    );
  }

  const renderField = (label: string, value: any) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        {Array.isArray(value) ? (
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
        {(aboutMe.life_history || aboutMe.personality_traits || aboutMe.what_is_most_important_to_me || aboutMe.my_wellness) && (
          <div>
            <h3 className="font-semibold text-base mb-3">My Life & Personality</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderField('Life History', aboutMe.life_history)}
              {renderField('Personality Traits', aboutMe.personality_traits)}
              {renderField('What is Most Important to Me', aboutMe.what_is_most_important_to_me)}
              {renderField('My Wellness', aboutMe.my_wellness)}
            </div>
          </div>
        )}

        {/* Communication & Support */}
        {(aboutMe.communication_style || aboutMe.how_to_communicate_with_me || aboutMe.how_and_when_to_support_me) && (
          <div>
            <h3 className="font-semibold text-base mb-3">Communication & Support</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderField('Communication Style', aboutMe.communication_style)}
              {renderField('How to Communicate with Me', aboutMe.how_to_communicate_with_me)}
              {renderField('How and When to Support Me', aboutMe.how_and_when_to_support_me)}
            </div>
          </div>
        )}

        {/* Preferences & Activities */}
        {(aboutMe.meaningful_activities || aboutMe.please_do || aboutMe.please_dont) && (
          <div>
            <h3 className="font-semibold text-base mb-3">Preferences & Activities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderField('Meaningful Activities', aboutMe.meaningful_activities)}
              {renderField('Please Do', aboutMe.please_do)}
              {renderField('Please Don\'t', aboutMe.please_dont)}
            </div>
          </div>
        )}

        {/* Important People & Additional Info */}
        {(aboutMe.important_people || aboutMe.also_worth_knowing_about_me || aboutMe.supported_to_write_this_by) && (
          <div>
            <h3 className="font-semibold text-base mb-3">Important People & Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderField('Important People', aboutMe.important_people)}
              {renderField('Also Worth Knowing About Me', aboutMe.also_worth_knowing_about_me)}
              {renderField('Supported to Write This By', aboutMe.supported_to_write_this_by)}
            </div>
          </div>
        )}

        {/* Legacy field mappings for backward compatibility */}
        {(aboutMe.background || aboutMe.likes || aboutMe.dislikes || aboutMe.communication_preferences || aboutMe.cultural_religious_needs || aboutMe.daily_routine || aboutMe.hobbies) && (
          <div>
            <h3 className="font-semibold text-base mb-3">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderField('Background & History', aboutMe.background)}
              {renderField('Likes & Interests', aboutMe.likes)}
              {renderField('Dislikes', aboutMe.dislikes)}
              {renderField('Communication Preferences', aboutMe.communication_preferences)}
              {renderField('Cultural/Religious Needs', aboutMe.cultural_religious_needs)}
              {renderField('Daily Routine Preferences', aboutMe.daily_routine)}
              {renderField('Hobbies & Activities', aboutMe.hobbies)}
            </div>
          </div>
        )}

        {/* Document Information */}
        {(aboutMe.date || aboutMe.time) && (
          <div className="bg-muted/50 rounded p-3">
            <label className="text-sm font-medium">Document Information</label>
            <div className="mt-2 flex gap-4 text-sm">
              {aboutMe.date && <span>Date: {aboutMe.date}</span>}
              {aboutMe.time && <span>Time: {aboutMe.time}</span>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
