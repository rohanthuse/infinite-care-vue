import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Plus, X, Loader2, Clock } from 'lucide-react';
import { useClientActivities } from '@/hooks/useClientActivities';

interface ActivityChange {
  performed: boolean;
  duration_minutes: number;
  notes: string;
}

interface NewActivity {
  name: string;
  duration_minutes: number;
  notes: string;
}

interface EditableActivitiesSectionProps {
  carePlanId?: string;
  onActivitiesChange: (changes: Map<string, ActivityChange>) => void;
  onAddActivity?: (activity: NewActivity) => void;
  allowManualAdd?: boolean;
}

export function EditableActivitiesSection({ 
  carePlanId, 
  onActivitiesChange, 
  onAddActivity,
  allowManualAdd = true 
}: EditableActivitiesSectionProps) {
  const { data: activities = [], isLoading } = useClientActivities(carePlanId || '');
  const [activityChanges, setActivityChanges] = useState<Map<string, ActivityChange>>(new Map());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivity, setNewActivity] = useState<NewActivity>({
    name: '',
    duration_minutes: 0,
    notes: '',
  });
  const [manualActivities, setManualActivities] = useState<(NewActivity & { tempId: string; performed: boolean })[]>([]);

  // Initialize with default values when activities load
  React.useEffect(() => {
    if (activities.length > 0) {
      const initialChanges = new Map<string, ActivityChange>();
      activities.forEach(activity => {
        initialChanges.set(activity.id, {
          performed: false,
          duration_minutes: 0,
          notes: '',
        });
      });
      setActivityChanges(initialChanges);
    }
  }, [activities]);

  const handleActivityChange = (activityId: string, field: keyof ActivityChange, value: boolean | number | string) => {
    const newChanges = new Map(activityChanges);
    const current = newChanges.get(activityId) || { performed: false, duration_minutes: 0, notes: '' };
    newChanges.set(activityId, { ...current, [field]: value });
    setActivityChanges(newChanges);
    onActivitiesChange(newChanges);
  };

  const handleAddActivity = () => {
    if (!newActivity.name) return;
    
    const tempId = `manual-activity-${Date.now()}`;
    const activityToAdd = { ...newActivity, tempId, performed: true };
    setManualActivities([...manualActivities, activityToAdd]);
    
    // Add to changes map
    const newChanges = new Map(activityChanges);
    newChanges.set(tempId, {
      performed: true,
      duration_minutes: newActivity.duration_minutes,
      notes: newActivity.notes,
    });
    setActivityChanges(newChanges);
    onActivitiesChange(newChanges);
    
    if (onAddActivity) {
      onAddActivity(newActivity);
    }
    
    // Reset form
    setNewActivity({
      name: '',
      duration_minutes: 0,
      notes: '',
    });
    setShowAddForm(false);
  };

  const handleRemoveManualActivity = (tempId: string) => {
    setManualActivities(manualActivities.filter(a => a.tempId !== tempId));
    const newChanges = new Map(activityChanges);
    newChanges.delete(tempId);
    setActivityChanges(newChanges);
    onActivitiesChange(newChanges);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span>Loading activities...</span>
      </div>
    );
  }

  const allActivities = [
    ...activities.map(a => ({ ...a, isManual: false })),
    ...manualActivities.map(a => ({
      id: a.tempId,
      name: a.name,
      description: null,
      frequency: 'as-needed',
      status: 'active',
      isManual: true,
    }))
  ];

  const performedCount = Array.from(activityChanges.values()).filter(c => c.performed).length;

  if (allActivities.length === 0 && !showAddForm) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm mb-4">No activities found in care plan</p>
        {allowManualAdd && (
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Activity Button */}
      {allowManualAdd && !showAddForm && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>
      )}

      {/* Add Activity Form */}
      {showAddForm && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Add Performed Activity</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Input
            value={newActivity.name}
            onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
            placeholder="Activity name *"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Duration (minutes)</Label>
              <Input
                type="number"
                value={newActivity.duration_minutes || ''}
                onChange={(e) => setNewActivity({ ...newActivity, duration_minutes: parseInt(e.target.value) || 0 })}
                placeholder="Duration in minutes"
                min={0}
              />
            </div>
          </div>
          <Textarea
            value={newActivity.notes}
            onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })}
            placeholder="Notes (optional)"
            className="min-h-[60px]"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddActivity} disabled={!newActivity.name}>
              Add Activity
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Summary */}
      {allActivities.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {performedCount} of {allActivities.length} activities performed
            </span>
          </div>
          <Badge variant={performedCount === allActivities.length ? 'default' : 'secondary'}>
            {allActivities.length > 0 ? Math.round((performedCount / allActivities.length) * 100) : 0}%
          </Badge>
        </div>
      )}

      {/* Activities List */}
      <div className="space-y-3">
        {activities.map(activity => {
          const change = activityChanges.get(activity.id);
          const isPerformed = change?.performed ?? false;
          const duration = change?.duration_minutes ?? 0;
          const notes = change?.notes ?? '';

          return (
            <Card key={activity.id} className={isPerformed ? 'border-green-200 dark:border-green-800' : ''}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isPerformed}
                    onCheckedChange={(checked) => handleActivityChange(activity.id, 'performed', !!checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.name}</p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    )}
                    <Badge variant="outline" className="mt-1 text-xs">
                      {activity.frequency}
                    </Badge>
                  </div>
                </div>

                {isPerformed && (
                  <div className="ml-7 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-xs">Duration:</Label>
                      </div>
                      <Input
                        type="number"
                        value={duration || ''}
                        onChange={(e) => handleActivityChange(activity.id, 'duration_minutes', parseInt(e.target.value) || 0)}
                        placeholder="mins"
                        className="w-24 h-8 text-sm"
                        min={0}
                      />
                      <span className="text-xs text-muted-foreground">minutes</span>
                    </div>
                    <Input
                      value={notes}
                      onChange={(e) => handleActivityChange(activity.id, 'notes', e.target.value)}
                      placeholder="Notes about this activity..."
                      className="h-8 text-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Manual Activities */}
        {manualActivities.map(activity => {
          const change = activityChanges.get(activity.tempId);
          const duration = change?.duration_minutes ?? activity.duration_minutes;
          const notes = change?.notes ?? activity.notes;

          return (
            <Card key={activity.tempId} className="bg-primary/5 border-green-200 dark:border-green-800">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox checked disabled className="mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {activity.name}
                      <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveManualActivity(activity.tempId)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="ml-7 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-xs">Duration:</Label>
                    </div>
                    <Input
                      type="number"
                      value={duration || ''}
                      onChange={(e) => handleActivityChange(activity.tempId, 'duration_minutes', parseInt(e.target.value) || 0)}
                      placeholder="mins"
                      className="w-24 h-8 text-sm"
                      min={0}
                    />
                    <span className="text-xs text-muted-foreground">minutes</span>
                  </div>
                  <Input
                    value={notes}
                    onChange={(e) => handleActivityChange(activity.tempId, 'notes', e.target.value)}
                    placeholder="Notes about this activity..."
                    className="h-8 text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
