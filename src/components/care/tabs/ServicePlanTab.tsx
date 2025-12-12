
import React from "react";
import { format } from "date-fns";
import { FileBarChart2, Plus, Calendar, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DAYS_OF_WEEK, FREQUENCY_OPTIONS } from "@/types/servicePlan";

interface ServicePlanTabProps {
  servicePlans?: any[];
  serviceActions?: any[]; // backward compatibility
  onAddServicePlan?: () => void;
}

const getDayLabel = (dayKey: string): string => {
  const day = DAYS_OF_WEEK.find(d => d.key === dayKey);
  return day ? day.label : dayKey;
};

const getFrequencyLabel = (frequency: string): string => {
  const option = FREQUENCY_OPTIONS.find(f => f.value === frequency);
  return option ? option.label : frequency;
};

export const ServicePlanTab: React.FC<ServicePlanTabProps> = ({ 
  servicePlans,
  serviceActions,
  onAddServicePlan 
}) => {
  // Support both prop names for backward compatibility
  const plans = servicePlans || serviceActions || [];

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
          <p className="text-sm text-muted-foreground italic">Not provided</p>
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
          <p className="font-medium">{format(new Date(value), 'MMM dd, yyyy')}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Not provided</p>
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
          <p className="text-sm text-muted-foreground italic">Not provided</p>
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
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileBarChart2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Service Plans ({plans.length})</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={onAddServicePlan}>
              <Plus className="h-4 w-4" />
              <span>Add Service Plan</span>
            </Button>
          </div>
          <CardDescription>Comprehensive service plan overview</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileBarChart2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No service plan available</p>
              {onAddServicePlan && (
                <Button variant="outline" className="mt-3" onClick={onAddServicePlan}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Service Plan
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {plans.map((plan, idx) => (
                <Card key={idx} className="border-l-4 border-l-green-500">
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
                              <p className="text-sm text-muted-foreground italic">Not set</p>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
