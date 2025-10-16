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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderField('Background & History', aboutMe.background)}
          {renderField('Likes & Interests', aboutMe.likes)}
          {renderField('Dislikes', aboutMe.dislikes)}
          {renderField('Important People', aboutMe.important_people)}
          {renderField('Communication Preferences', aboutMe.communication_preferences)}
          {renderField('Cultural/Religious Needs', aboutMe.cultural_religious_needs)}
          {renderField('Daily Routine Preferences', aboutMe.daily_routine)}
          {renderField('Hobbies & Activities', aboutMe.hobbies)}
        </div>
      </CardContent>
    </Card>
  );
}
