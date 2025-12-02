import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen, Users, Target } from 'lucide-react';
import { useClientChildInfo } from '@/hooks/useClientChildInfo';

interface EducationDevelopmentSectionProps {
  clientId: string;
}

const communicationLabels: Record<string, string> = {
  verbal: 'Verbal',
  pecs: 'PECS (Picture Exchange Communication System)',
  makaton: 'Makaton',
  aac: 'AAC (Augmentative and Alternative Communication)',
  other: 'Other'
};

const independenceLevelLabels: Record<string, string> = {
  independent: 'Independent',
  with_prompts: 'With Prompts',
  needs_full_support: 'Needs Full Support'
};

export function EducationDevelopmentSection({ clientId }: EducationDevelopmentSectionProps) {
  const { data: childInfo, isLoading } = useClientChildInfo(clientId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!childInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Education & Development
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No education and development information has been recorded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Communication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            Communication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {childInfo.primary_communication && (
            <div>
              <span className="text-sm font-medium">Primary Communication Method:</span>
              <p className="text-sm text-muted-foreground mt-1">
                {communicationLabels[childInfo.primary_communication] || childInfo.primary_communication}
                {childInfo.primary_communication === 'other' && childInfo.primary_communication_other && 
                  ` - ${childInfo.primary_communication_other}`}
              </p>
            </div>
          )}
          
          {childInfo.key_words_phrases && (
            <div>
              <span className="text-sm font-medium">Key Words/Phrases:</span>
              <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded-md">
                {childInfo.key_words_phrases}
              </p>
            </div>
          )}
          
          {childInfo.preferred_communication_approach && (
            <div>
              <span className="text-sm font-medium">Preferred Communication Approach:</span>
              <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded-md">
                {childInfo.preferred_communication_approach}
              </p>
            </div>
          )}
          
          {childInfo.communication_triggers && (
            <div>
              <span className="text-sm font-medium">Communication Triggers:</span>
              <p className="text-sm text-muted-foreground mt-1 bg-amber-50 border border-amber-200 p-2 rounded-md">
                {childInfo.communication_triggers}
              </p>
            </div>
          )}
          
          {childInfo.calming_techniques && (
            <div>
              <span className="text-sm font-medium">Calming Techniques:</span>
              <p className="text-sm text-muted-foreground mt-1 bg-green-50 border border-green-200 p-2 rounded-md">
                {childInfo.calming_techniques}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-5 w-5 text-primary" />
            Education
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {childInfo.education_placement && (
            <div>
              <span className="text-sm font-medium">Education Placement:</span>
              <p className="text-sm text-muted-foreground mt-1">{childInfo.education_placement}</p>
            </div>
          )}
          
          <div>
            <span className="text-sm font-medium">EHCP Targets Linked:</span>
            <p className="text-sm text-muted-foreground mt-1">
              {childInfo.ehcp_targets_linked ? 'Yes' : 'No'}
            </p>
          </div>
          
          {childInfo.daily_learning_goals && (
            <div>
              <span className="text-sm font-medium">Daily Learning Goals:</span>
              <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded-md">
                {childInfo.daily_learning_goals}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Development & Independence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" />
            Development & Independence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {childInfo.independence_level && (
            <div>
              <span className="text-sm font-medium">Independence Level:</span>
              <p className="text-sm text-muted-foreground mt-1">
                {independenceLevelLabels[childInfo.independence_level] || childInfo.independence_level}
              </p>
            </div>
          )}
          
          {childInfo.independence_skills && (
            <div>
              <span className="text-sm font-medium">Independence Skills Being Developed:</span>
              <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded-md">
                {childInfo.independence_skills}
              </p>
            </div>
          )}
          
          {childInfo.social_skills_development && (
            <div>
              <span className="text-sm font-medium">Social Skills Development:</span>
              <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded-md">
                {childInfo.social_skills_development}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
