import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface News2SectionProps {
  enabled?: boolean;
  frequency?: string;
  notes?: string;
  customSchedule?: {
    times?: string[];
    days?: string[];
  };
}

export function News2Section({ enabled, frequency, notes, customSchedule }: News2SectionProps) {
  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      every_4_hours: 'Every 4 Hours',
      every_6_hours: 'Every 6 Hours',
      every_8_hours: 'Every 8 Hours',
      every_12_hours: 'Every 12 Hours',
      daily: 'Once Daily',
      twice_daily: 'Twice Daily',
      weekly: 'Weekly',
      as_needed: 'As Needed',
      custom: 'Custom Schedule',
    };
    return labels[freq] || freq?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          NEWS2 Health Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monitoring Status */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            {enabled ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">NEWS2 Monitoring</p>
              <p className="text-sm text-muted-foreground">
                {enabled ? 'Active monitoring enabled' : 'Monitoring is not enabled'}
              </p>
            </div>
          </div>
          <Badge variant={enabled ? 'default' : 'secondary'}>
            {enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        {enabled && (
          <>
            {/* Monitoring Frequency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Monitoring Frequency
                </label>
                <p className="text-base mt-1 font-medium">{getFrequencyLabel(frequency || '')}</p>
              </div>

              {frequency === 'custom' && customSchedule && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Custom Schedule</label>
                  <div className="mt-1 space-y-1">
                    {customSchedule.times && customSchedule.times.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {customSchedule.times.map((time, idx) => (
                          <Badge key={idx} variant="outline">{time}</Badge>
                        ))}
                      </div>
                    )}
                    {customSchedule.days && customSchedule.days.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {customSchedule.days.map((day, idx) => (
                          <Badge key={idx} variant="secondary" className="capitalize">{day}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Monitoring Notes */}
            {notes && (
              <div className="bg-muted/50 rounded-lg p-4">
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  Monitoring Notes
                </label>
                <p className="text-sm whitespace-pre-wrap">{notes}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                About NEWS2 Monitoring
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                The National Early Warning Score 2 (NEWS2) is used to monitor patients at risk of clinical deterioration. 
                Regular observations include respiratory rate, oxygen saturation, blood pressure, heart rate, 
                level of consciousness, and temperature.
              </p>
            </div>
          </>
        )}

        {!enabled && (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>NEWS2 health monitoring is not currently enabled for this care plan.</p>
            <p className="text-sm mt-1">Contact your care coordinator to enable monitoring if needed.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
