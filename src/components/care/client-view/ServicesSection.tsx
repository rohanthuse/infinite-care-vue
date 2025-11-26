import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Calendar, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ServicesSectionProps {
  servicePlans: any[];
  serviceActions: any[];
}

export function ServicesSection({ servicePlans, serviceActions }: ServicesSectionProps) {
  const plans = servicePlans || [];
  const actions = serviceActions || [];

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
    <div className="space-y-6">
      {/* Service Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Service Plans ({plans.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No service plans have been recorded yet.</p>
              <p className="text-sm">Service plans can be added during care plan creation.</p>
            </div>
          ) : (
            plans.map((plan, idx) => (
              <Card key={idx} className="border-l-4 border-l-cyan-500">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">{plan.service_name || plan.name || 'Unnamed Service Plan'}</h4>
                        {plan.description ? (
                          <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic mt-1">No description provided</p>
                        )}
                      </div>
                      <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                        {plan.status || 'Unknown'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {renderField('Frequency', plan.frequency)}
                      <div>
                        <label className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Start Date
                        </label>
                        {plan.start_date ? (
                          <p className="font-medium">{new Date(plan.start_date).toLocaleDateString()}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Not specified</p>
                        )}
                      </div>
                      <div>
                        <label className="text-muted-foreground">End Date</label>
                        {plan.end_date ? (
                          <p className="font-medium">{new Date(plan.end_date).toLocaleDateString()}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Not specified</p>
                        )}
                      </div>
                      {renderField('Provider', plan.provider)}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Notes</label>
                      {plan.notes ? (
                        <div className="bg-muted/50 rounded p-3 mt-2">
                          <p className="text-sm">{plan.notes}</p>
                        </div>
                      ) : (
                        <p className="text-sm mt-1 text-muted-foreground italic">No notes provided</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Service Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Service Actions ({actions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
              <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No service actions have been recorded yet.</p>
              <p className="text-sm">Service actions can be added during care plan creation.</p>
            </div>
          ) : (
            actions.map((action, idx) => (
              <Card key={idx} className="border-l-4 border-l-teal-500">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">{action.action || action.name || 'Unnamed Action'}</h4>
                        {action.description ? (
                          <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic mt-1">No description provided</p>
                        )}
                      </div>
                      <Badge variant={action.status === 'completed' ? 'default' : 'secondary'}>
                        {action.status || 'Unknown'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {renderField('Responsible Person', action.responsible_person)}
                      <div>
                        <label className="text-muted-foreground">Start Date</label>
                        {action.start_date ? (
                          <p className="font-medium">{new Date(action.start_date).toLocaleDateString()}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Not specified</p>
                        )}
                      </div>
                      <div>
                        <label className="text-muted-foreground">End Date</label>
                        {action.end_date ? (
                          <p className="font-medium">{new Date(action.end_date).toLocaleDateString()}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Not specified</p>
                        )}
                      </div>
                      {renderField('Priority', action.priority)}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Notes</label>
                      {action.notes ? (
                        <div className="bg-muted/50 rounded p-3 mt-2">
                          <p className="text-sm">{action.notes}</p>
                        </div>
                      ) : (
                        <p className="text-sm mt-1 text-muted-foreground italic">No notes provided</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
