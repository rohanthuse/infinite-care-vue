import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Calendar, Target, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ServiceActionsSectionProps {
  serviceActions: any[];
}

const categoryLabels: Record<string, string> = {
  personal_care: 'Personal Care',
  medical_care: 'Medical Care',
  therapy: 'Therapy',
  social_support: 'Social Support',
  domestic_support: 'Domestic Support',
  monitoring: 'Monitoring',
  emergency: 'Emergency Response',
  other: 'Other'
};

const frequencyLabels: Record<string, string> = {
  daily: 'Daily',
  twice_daily: 'Twice Daily',
  three_times_daily: 'Three Times Daily',
  weekly: 'Weekly',
  'bi-weekly': 'Bi-weekly',
  monthly: 'Monthly',
  as_needed: 'As Needed'
};

export function ServiceActionsSection({ serviceActions }: ServiceActionsSectionProps) {
  const actions = serviceActions || [];

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
          Action Goals
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
                  <div className="space-y-4">
                    {/* Header with name and status */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">
                          {action.service_name || action.action || action.name || <span className="text-muted-foreground italic">No service name provided</span>}
                        </h4>
                      </div>
                      <Badge variant={action.status === 'completed' ? 'default' : 'secondary'}>
                        {action.status || 'Unknown'}
                      </Badge>
                    </div>

                    {/* Service Category and Provider */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {renderField('Service Category', action.service_category ? (categoryLabels[action.service_category] || action.service_category) : null)}
                      {renderField('Provider Name', action.provider_name || action.responsible_person)}
                      {renderField('Frequency', action.frequency ? (frequencyLabels[action.frequency] || action.frequency) : null)}
                      {renderField('Duration', action.duration)}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                      {renderDate('Start Date', action.start_date)}
                      {renderDate('End Date', action.end_date)}
                    </div>

                    {/* Schedule Details - Unique to Service Actions */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Schedule Details
                      </label>
                      {action.schedule_details ? (
                        <div className="bg-muted/50 rounded p-3 mt-2">
                          <p className="text-sm">{action.schedule_details}</p>
                        </div>
                      ) : (
                        <p className="text-sm mt-1 text-muted-foreground italic">No schedule details provided</p>
                      )}
                    </div>

                    {/* Goals */}
                    {renderGoals(action.goals)}

                    {/* Notes */}
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
