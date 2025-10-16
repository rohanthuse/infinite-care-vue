import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ActivitiesSectionProps {
  activities: any[];
}

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
                      <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
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
                  {activity.time && (
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
                    <p className="text-sm mt-1 whitespace-pre-wrap">{activity.support_needed}</p>
                  </div>
                )}

                {activity.notes && (
                  <div className="bg-muted/50 rounded p-3">
                    <label className="text-sm font-medium">Additional Notes</label>
                    <p className="text-sm mt-1">{activity.notes}</p>
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
