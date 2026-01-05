import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Loader2 } from 'lucide-react';
import { useClientActivities } from '@/hooks/useClientActivities';
import { useCarePlanJsonData } from '@/hooks/useCarePlanJsonData';

interface ActivitiesDisplayProps {
  carePlanId?: string;
}

export function ActivitiesDisplay({ carePlanId }: ActivitiesDisplayProps) {
  const { data: tableActivities = [], isLoading: isLoadingTable } = useClientActivities(carePlanId || '');
  const { data: jsonData, isLoading: isLoadingJson } = useCarePlanJsonData(carePlanId || '');

  // Use table activities if available, otherwise fall back to JSON data
  const activities = tableActivities.length > 0 
    ? tableActivities 
    : (jsonData?.activities || []);
  const isLoading = isLoadingTable || (tableActivities.length === 0 && isLoadingJson);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span>Loading activities...</span>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No activities found in care plan</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map(activity => (
        <Card key={activity.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-sm">{activity.name}</p>
                {activity.description && (
                  <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {activity.frequency}
                </Badge>
                <Badge 
                  variant={activity.status === 'active' ? 'default' : 'secondary'} 
                  className="text-xs"
                >
                  {activity.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
