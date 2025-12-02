import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, Brain, Heart } from 'lucide-react';
import { useClientBehaviorSupport } from '@/hooks/useClientBehaviorSupport';

interface BehaviorSupportSectionProps {
  clientId: string;
}

export function BehaviorSupportSection({ clientId }: BehaviorSupportSectionProps) {
  const { data: behaviorSupport, isLoading } = useClientBehaviorSupport(clientId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const latestRecord = behaviorSupport?.[0];

  if (!latestRecord) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Behavior Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No behavior support information has been recorded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Behavior Support Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Challenging Behaviors */}
          {latestRecord.challenging_behaviors && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Challenging Behaviors
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                {latestRecord.challenging_behaviors}
              </p>
            </div>
          )}

          {/* Behavior Triggers */}
          {latestRecord.behavior_triggers && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Behavior Triggers
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                {latestRecord.behavior_triggers}
              </p>
            </div>
          )}

          {/* Early Warning Signs */}
          {latestRecord.early_warning_signs && (
            <div className="space-y-2">
              <h4 className="font-medium">Early Warning Signs</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                {latestRecord.early_warning_signs}
              </p>
            </div>
          )}

          {/* Preventative Strategies */}
          {latestRecord.preventative_strategies && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2 text-green-700">
                <Heart className="h-4 w-4" />
                Preventative Strategies
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                {latestRecord.preventative_strategies}
              </p>
            </div>
          )}

          {/* Crisis Management Plan */}
          {latestRecord.crisis_management_plan && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-700">Crisis Management Plan</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-red-50 border border-red-200 p-3 rounded-md">
                {latestRecord.crisis_management_plan}
              </p>
            </div>
          )}

          {/* Post-Incident Protocol */}
          {latestRecord.post_incident_protocol && (
            <div className="space-y-2">
              <h4 className="font-medium">Post-Incident Protocol</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                {latestRecord.post_incident_protocol}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
