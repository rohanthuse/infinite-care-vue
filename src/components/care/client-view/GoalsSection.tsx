import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface GoalsSectionProps {
  goals: any[];
}

export function GoalsSection({ goals }: GoalsSectionProps) {
  const data = goals || [];

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

  const renderField = (label: string, value: any) => {
    const hasValue = value !== undefined && value !== null && value !== '';
    
    return (
      <div>
        <label className="text-muted-foreground">{label}</label>
        {hasValue ? (
          <p className="font-medium">{value}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Not specified</p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Care Goals ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No goals have been set yet.</p>
            <p className="text-sm">Goals can be added during care plan creation.</p>
          </div>
        ) : (
          data.map((goal, idx) => (
            <Card key={idx} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base">{goal.goal || goal.name || goal.title || goal.description || 'Untitled Goal'}</h4>
                      {goal.description && goal.description !== (goal.goal || goal.name || goal.title) && (
                        <div className="mt-1 max-h-[100px] overflow-y-auto rounded-md border border-border bg-muted/30 p-2">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{goal.description}</p>
                        </div>
                      )}
                    </div>
                    <Badge variant={getStatusVariant(goal.status)}>
                      {goal.status?.replace('_', ' ') || 'Not Started'}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className={getStatusColor(goal.status)}>{goal.progress ?? 0}%</span>
                    </div>
                    <Progress value={goal.progress ?? 0} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <label className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Target Date
                      </label>
                      {goal.target_date ? (
                        <p className="font-medium">{new Date(goal.target_date).toLocaleDateString()}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Not specified</p>
                      )}
                    </div>
                    {renderField('Category', goal.category)}
                    {renderField('Priority', goal.priority)}
                  </div>

                  {/* Measurable Outcome */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Measurable Outcome</label>
                    {goal.measurable_outcome ? (
                      <div className="mt-1 max-h-[100px] overflow-y-auto rounded-md border border-border bg-muted/30 p-2">
                        <p className="text-sm whitespace-pre-wrap">{goal.measurable_outcome}</p>
                      </div>
                    ) : (
                      <p className="text-sm mt-1 text-muted-foreground italic">No measurable outcome defined</p>
                    )}
                  </div>

                  {/* Interventions */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Interventions</label>
                    {goal.interventions ? (
                      <div className="mt-1 max-h-[100px] overflow-y-auto rounded-md border border-border bg-muted/30 p-2">
                        <p className="text-sm whitespace-pre-wrap">{goal.interventions}</p>
                      </div>
                    ) : (
                      <p className="text-sm mt-1 text-muted-foreground italic">No interventions specified</p>
                    )}
                  </div>

                  {/* Review Notes */}
                  <div className="bg-muted/50 rounded p-3">
                    <label className="text-sm font-medium">Latest Review Notes</label>
                    {goal.review_notes ? (
                      <div className="mt-1 max-h-[100px] overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">{goal.review_notes}</p>
                      </div>
                    ) : (
                      <p className="text-sm mt-1 text-muted-foreground italic">No review notes available</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}
