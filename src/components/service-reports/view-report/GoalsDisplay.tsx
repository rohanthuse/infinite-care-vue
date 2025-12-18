import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Loader2 } from 'lucide-react';
import { useCarePlanGoals } from '@/hooks/useCarePlanGoals';

interface GoalsDisplayProps {
  carePlanId?: string;
}

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
    'not-started': { variant: 'secondary', label: 'Not Started' },
    'in-progress': { variant: 'default', label: 'In Progress' },
    'on-track': { variant: 'default', label: 'On Track' },
    'at-risk': { variant: 'destructive', label: 'At Risk' },
    'completed': { variant: 'default', label: 'Completed' },
  };
  const config = statusConfig[status] || statusConfig['not-started'];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export function GoalsDisplay({ carePlanId }: GoalsDisplayProps) {
  const { data: goals = [], isLoading } = useCarePlanGoals(carePlanId || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span>Loading goals...</span>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Target className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No care plan goals found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {goals.map(goal => (
        <Card key={goal.id}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-sm">{goal.description}</p>
                {goal.measurable_outcome && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Measurable outcome: {goal.measurable_outcome}
                  </p>
                )}
              </div>
              {getStatusBadge(goal.status || 'not-started')}
            </div>

            {goal.progress !== undefined && goal.progress > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </div>
            )}

            {goal.notes && (
              <div className="text-sm bg-muted/50 p-2 rounded-md">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p>{goal.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
