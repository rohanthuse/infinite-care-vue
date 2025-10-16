import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface GoalsSectionProps {
  goals: any[];
}

export function GoalsSection({ goals }: GoalsSectionProps) {
  if (!goals || goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Care Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No goals set yet.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'default';
      case 'in-progress': case 'in_progress': return 'secondary';
      case 'not-started': case 'not_started': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-600';
      case 'in-progress': case 'in_progress': return 'text-blue-600';
      case 'not-started': case 'not_started': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Care Goals ({goals.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal, idx) => (
          <Card key={idx} className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-base">{goal.goal || goal.name || goal.title}</h4>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                    )}
                  </div>
                  <Badge variant={getStatusVariant(goal.status)}>
                    {goal.status?.replace('_', ' ') || 'Not Started'}
                  </Badge>
                </div>

                {goal.progress !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className={getStatusColor(goal.status)}>{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {goal.target_date && (
                    <div>
                      <label className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Target Date
                      </label>
                      <p className="font-medium">{new Date(goal.target_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {goal.category && (
                    <div>
                      <label className="text-muted-foreground">Category</label>
                      <p className="font-medium capitalize">{goal.category}</p>
                    </div>
                  )}
                  {goal.priority && (
                    <div>
                      <label className="text-muted-foreground">Priority</label>
                      <p className="font-medium capitalize">{goal.priority}</p>
                    </div>
                  )}
                </div>

                {goal.interventions && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Interventions</label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{goal.interventions}</p>
                  </div>
                )}

                {goal.review_notes && (
                  <div className="bg-muted/50 rounded p-3">
                    <label className="text-sm font-medium">Latest Review Notes</label>
                    <p className="text-sm mt-1">{goal.review_notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
