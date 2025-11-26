import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Calendar, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ServicePlansSectionProps {
  servicePlans: any[];
}

const categoryLabels: Record<string, string> = {
  personal_care: 'Personal Care',
  medical_care: 'Medical Care',
  therapy: 'Therapy',
  social_support: 'Social Support',
  domestic_support: 'Domestic Support',
  other: 'Other'
};

const frequencyLabels: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  'bi-weekly': 'Bi-weekly',
  monthly: 'Monthly',
  as_needed: 'As Needed'
};

export function ServicePlansSection({ servicePlans }: ServicePlansSectionProps) {
  const plans = servicePlans || [];

  const renderField = (label: string, value: any) => {
    const displayValue = value !== undefined && value !== null && value !== '' ? value : null;
    
    return (
      <div>
        <label className="text-sm text-muted-foreground">{label}</label>
        {displayValue ? (
          <p className="font-medium">{displayValue}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No data provided</p>
        )}
      </div>
    );
  };

  const renderDate = (label: string, value: any) => {
    return (
      <div>
        <label className="text-sm text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {label}
        </label>
        {value ? (
          <p className="font-medium">{new Date(value).toLocaleDateString()}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No data provided</p>
        )}
      </div>
    );
  };

  const renderGoals = (goals: any[]) => {
    const validGoals = (goals || []).filter(g => g && g.trim && g.trim() !== '');
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <Target className="h-3 w-3" />
          Service Goals
        </label>
        {validGoals.length > 0 ? (
          <ul className="list-disc list-inside mt-1 space-y-1">
            {validGoals.map((goal, idx) => (
              <li key={idx} className="text-sm">{goal}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic mt-1">No goals specified</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
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
                  <div className="space-y-4">
                    {/* Header with name and status */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">
                          {plan.service_name || plan.name || <span className="text-muted-foreground italic">No service name provided</span>}
                        </h4>
                      </div>
                      <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                        {plan.status || 'Unknown'}
                      </Badge>
                    </div>

                    {/* Service Category */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {renderField('Service Category', plan.service_category ? (categoryLabels[plan.service_category] || plan.service_category) : null)}
                      {renderField('Provider Name', plan.provider_name || plan.provider)}
                      {renderField('Frequency', plan.frequency ? (frequencyLabels[plan.frequency] || plan.frequency) : null)}
                      {renderField('Duration', plan.duration)}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                      {renderDate('Start Date', plan.start_date)}
                      {renderDate('End Date', plan.end_date)}
                    </div>

                    {/* Goals */}
                    {renderGoals(plan.goals)}

                    {/* Notes */}
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
    </div>
  );
}
