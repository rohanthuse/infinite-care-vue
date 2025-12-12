import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Calendar, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DAYS_OF_WEEK, FREQUENCY_OPTIONS } from '@/types/servicePlan';

interface ServicePlansSectionProps {
  servicePlans: any[];
}

const getDayLabel = (dayKey: string): string => {
  const day = DAYS_OF_WEEK.find(d => d.key === dayKey);
  return day ? day.label : dayKey;
};

const getFrequencyLabel = (frequency: string): string => {
  const option = FREQUENCY_OPTIONS.find(f => f.value === frequency);
  return option ? option.label : frequency;
};

export function ServicePlansSection({ servicePlans }: ServicePlansSectionProps) {
  const plans = servicePlans || [];

  const renderField = (label: string, value: any, icon?: React.ReactNode) => {
    const displayValue = value !== undefined && value !== null && value !== '' ? value : null;
    
    return (
      <div>
        <label className="text-sm text-muted-foreground flex items-center gap-1">
          {icon}
          {label}
        </label>
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

  const renderTime = (label: string, value: any) => {
    return (
      <div>
        <label className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {label}
        </label>
        {value ? (
          <p className="font-medium">{value}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No data provided</p>
        )}
      </div>
    );
  };

  const renderDays = (days: string[] | undefined) => {
    const validDays = (days || []).filter(d => d && d.trim && d.trim() !== '');
    
    return (
      <div>
        <label className="text-sm text-muted-foreground">Days</label>
        {validDays.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {validDays.map((day, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {getDayLabel(day)}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic mt-1">No days selected</p>
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
                  <div className="space-y-5">
                    {/* Section 1: General */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                        General
                      </h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {renderField('Caption', plan.caption || plan.service_name || plan.name)}
                        {renderDate('Start Date', plan.start_date)}
                        {renderDate('End Date', plan.end_date)}
                      </div>
                    </div>

                    {/* Section 2: Service Details */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                        Service Details
                      </h5>

                      {/* Days */}
                      {renderDays(plan.selected_days)}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                        {renderField('Service Name', plan.service_name || plan.name)}
                        <div>
                          <label className="text-sm text-muted-foreground">Authority</label>
                          {plan.authority || plan.authority_category ? (
                            <Badge variant="secondary" className="mt-1 capitalize">
                              {plan.authority || plan.authority_category}
                            </Badge>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No authority set</p>
                          )}
                        </div>
                        {renderTime('Start Time', plan.start_time)}
                        {renderTime('End Time', plan.end_time)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                        {renderField('Frequency', plan.frequency ? getFrequencyLabel(plan.frequency) : null)}
                        {renderField('Location', plan.location, <MapPin className="h-3 w-3" />)}
                      </div>

                      {/* Note */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Note</label>
                        {plan.note || plan.notes ? (
                          <div className="bg-muted/50 rounded p-3 mt-2">
                            <p className="text-sm">{plan.note || plan.notes}</p>
                          </div>
                        ) : (
                          <p className="text-sm mt-1 text-muted-foreground italic">No notes provided</p>
                        )}
                      </div>
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
