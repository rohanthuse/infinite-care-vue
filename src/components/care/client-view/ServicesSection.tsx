import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Calendar, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ServicesSectionProps {
  servicePlans: any[];
  serviceActions: any[];
}

export function ServicesSection({ servicePlans, serviceActions }: ServicesSectionProps) {
  const hasPlans = servicePlans && servicePlans.length > 0;
  const hasActions = serviceActions && serviceActions.length > 0;

  if (!hasPlans && !hasActions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No service plans or actions recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {hasPlans && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Service Plans ({servicePlans.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {servicePlans.map((plan, idx) => (
              <Card key={idx} className="border-l-4 border-l-cyan-500">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">{plan.service_name || plan.name}</h4>
                        {plan.description && (
                          <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                        )}
                      </div>
                      {plan.status && (
                        <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                          {plan.status}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {plan.frequency && (
                        <div>
                          <label className="text-muted-foreground">Frequency</label>
                          <p className="font-medium">{plan.frequency}</p>
                        </div>
                      )}
                      {plan.start_date && (
                        <div>
                          <label className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Start Date
                          </label>
                          <p className="font-medium">{new Date(plan.start_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {plan.end_date && (
                        <div>
                          <label className="text-muted-foreground">End Date</label>
                          <p className="font-medium">{new Date(plan.end_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {plan.provider && (
                        <div>
                          <label className="text-muted-foreground">Provider</label>
                          <p className="font-medium">{plan.provider}</p>
                        </div>
                      )}
                    </div>

                    {plan.notes && (
                      <div className="bg-muted/50 rounded p-3">
                        <label className="text-sm font-medium">Notes</label>
                        <p className="text-sm mt-1">{plan.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {hasActions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              Service Actions ({serviceActions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {serviceActions.map((action, idx) => (
              <Card key={idx} className="border-l-4 border-l-teal-500">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">{action.action || action.name}</h4>
                        {action.description && (
                          <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                        )}
                      </div>
                      {action.status && (
                        <Badge variant={action.status === 'completed' ? 'default' : 'secondary'}>
                          {action.status}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {action.responsible_person && (
                        <div>
                          <label className="text-muted-foreground">Responsible Person</label>
                          <p className="font-medium">{action.responsible_person}</p>
                        </div>
                      )}
                      {action.start_date && (
                        <div>
                          <label className="text-muted-foreground">Start Date</label>
                          <p className="font-medium">{new Date(action.start_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {action.end_date && (
                        <div>
                          <label className="text-muted-foreground">End Date</label>
                          <p className="font-medium">{new Date(action.end_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {action.priority && (
                        <div>
                          <label className="text-muted-foreground">Priority</label>
                          <p className="font-medium capitalize">{action.priority}</p>
                        </div>
                      )}
                    </div>

                    {action.notes && (
                      <div className="bg-muted/50 rounded p-3">
                        <label className="text-sm font-medium">Notes</label>
                        <p className="text-sm mt-1">{action.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
