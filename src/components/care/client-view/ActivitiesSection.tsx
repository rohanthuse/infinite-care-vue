import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock, Sun, Sunrise, Sunset, Moon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ActivitiesSectionProps {
  activities: any[];
}

// Helper to get time of day icon
const getTimeOfDayIcon = (time: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    morning: <Sunrise className="h-3 w-3" />,
    afternoon: <Sun className="h-3 w-3" />,
    evening: <Sunset className="h-3 w-3" />,
    night: <Moon className="h-3 w-3" />,
  };
  return iconMap[time.toLowerCase()] || null;
};

export function ActivitiesSection({ activities }: ActivitiesSectionProps) {
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Daily Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No activities recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Daily Activities ({activities.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, idx) => (
          <Card key={idx} className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-base">{activity.name || activity.activity}</h4>
                    {activity.description && (
                      <div className="mt-1 max-h-[100px] overflow-y-auto rounded-md border border-border bg-muted/30 p-2">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activity.description}</p>
                      </div>
                    )}
                  </div>
                  {activity.status && (
                    <Badge variant={activity.status === 'active' ? 'default' : 'secondary'}>
                      {activity.status}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {activity.frequency && (
                    <div>
                      <label className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Frequency
                      </label>
                      <p className="font-medium capitalize">{activity.frequency}</p>
                    </div>
                  )}
                  
                  {/* Time of Day - supports multi-select array or single value */}
                  {activity.time_of_day && (
                    <div>
                      <label className="text-muted-foreground">Time of Day</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.isArray(activity.time_of_day) ? (
                          activity.time_of_day.map((time: string, tidx: number) => (
                            <Badge key={tidx} variant="outline" className="capitalize flex items-center gap-1">
                              {getTimeOfDayIcon(time)}
                              {time}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="capitalize flex items-center gap-1">
                            {getTimeOfDayIcon(activity.time_of_day)}
                            {activity.time_of_day}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {activity.time && !activity.time_of_day && (
                    <div>
                      <label className="text-muted-foreground">Time</label>
                      <p className="font-medium">{activity.time}</p>
                    </div>
                  )}
                  {activity.duration && (
                    <div>
                      <label className="text-muted-foreground">Duration</label>
                      <p className="font-medium">{activity.duration}</p>
                    </div>
                  )}
                  {activity.location && (
                    <div>
                      <label className="text-muted-foreground">Location</label>
                      <p className="font-medium">{activity.location}</p>
                    </div>
                  )}
                  {activity.category && (
                    <div>
                      <label className="text-muted-foreground">Category</label>
                      <p className="font-medium capitalize">{activity.category}</p>
                    </div>
                  )}
                </div>

                {activity.support_needed && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Support Needed</label>
                    <div className="mt-1 max-h-[100px] overflow-y-auto rounded-md border border-border bg-muted/30 p-2">
                      <p className="text-sm whitespace-pre-wrap">{activity.support_needed}</p>
                    </div>
                  </div>
                )}

                {activity.notes && (
                  <div className="bg-muted/50 rounded p-3">
                    <label className="text-sm font-medium">Additional Notes</label>
                    <div className="mt-1 max-h-[100px] overflow-y-auto">
                      <p className="text-sm whitespace-pre-wrap">{activity.notes}</p>
                    </div>
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
