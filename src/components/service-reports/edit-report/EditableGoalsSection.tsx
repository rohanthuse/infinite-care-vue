import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Plus, X, Loader2 } from 'lucide-react';
import { useCarePlanGoals } from '@/hooks/useCarePlanGoals';
import { useCarePlanJsonData } from '@/hooks/useCarePlanJsonData';
interface GoalChange {
  status: string;
  progress: number;
  notes: string;
}

interface NewGoal {
  description: string;
  status: string;
  progress: number;
  notes: string;
}

interface EditableGoalsSectionProps {
  carePlanId?: string;
  onGoalsChange: (changes: Map<string, GoalChange>) => void;
  onAddGoal?: (goal: NewGoal) => void;
  allowManualAdd?: boolean;
}

const goalStatuses = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'on-track', label: 'On Track' },
  { value: 'at-risk', label: 'At Risk' },
  { value: 'completed', label: 'Completed' },
];

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
    'not-started': { variant: 'secondary', label: 'Not Started' },
    'in-progress': { variant: 'default', label: 'In Progress' },
    'on-track': { variant: 'default', label: 'On Track' },
    'at-risk': { variant: 'destructive', label: 'At Risk' },
    'completed': { variant: 'default', label: 'Completed' },
  };
  const config = statusConfig[status] || statusConfig['not-started'];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export function EditableGoalsSection({ 
  carePlanId, 
  onGoalsChange, 
  onAddGoal,
  allowManualAdd = true 
}: EditableGoalsSectionProps) {
  // Fetch from dedicated table first
  const { data: tableGoals = [], isLoading: isLoadingTable } = useCarePlanGoals(carePlanId || '');
  // Fallback: fetch from auto_save_data JSON
  const { data: jsonData, isLoading: isLoadingJson } = useCarePlanJsonData(carePlanId || '');
  
  // Use table goals if available, otherwise use JSON goals
  const goals = tableGoals.length > 0 ? tableGoals : (jsonData?.goals || []);
  const isLoading = isLoadingTable || (tableGoals.length === 0 && isLoadingJson);

  const [goalChanges, setGoalChanges] = useState<Map<string, GoalChange>>(new Map());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState<NewGoal>({
    description: '',
    status: 'not-started',
    progress: 0,
    notes: '',
  });
  const [manualGoals, setManualGoals] = useState<(NewGoal & { tempId: string })[]>([]);

  // Initialize with current goal values when goals load
  React.useEffect(() => {
    if (goals.length > 0) {
      const initialChanges = new Map<string, GoalChange>();
      goals.forEach(goal => {
        initialChanges.set(goal.id, {
          status: goal.status || 'not-started',
          progress: goal.progress || 0,
          notes: goal.notes || '',
        });
      });
      setGoalChanges(initialChanges);
    }
  }, [goals]);

  const handleGoalChange = (goalId: string, field: keyof GoalChange, value: string | number) => {
    const newChanges = new Map(goalChanges);
    const current = newChanges.get(goalId) || { status: 'not-started', progress: 0, notes: '' };
    newChanges.set(goalId, { ...current, [field]: value });
    setGoalChanges(newChanges);
    onGoalsChange(newChanges);
  };

  const handleAddGoal = () => {
    if (!newGoal.description) return;
    
    const tempId = `manual-goal-${Date.now()}`;
    const goalToAdd = { ...newGoal, tempId };
    setManualGoals([...manualGoals, goalToAdd]);
    
    // Add to changes map
    const newChanges = new Map(goalChanges);
    newChanges.set(tempId, {
      status: newGoal.status,
      progress: newGoal.progress,
      notes: newGoal.notes,
    });
    setGoalChanges(newChanges);
    onGoalsChange(newChanges);
    
    if (onAddGoal) {
      onAddGoal(newGoal);
    }
    
    // Reset form
    setNewGoal({
      description: '',
      status: 'not-started',
      progress: 0,
      notes: '',
    });
    setShowAddForm(false);
  };

  const handleRemoveManualGoal = (tempId: string) => {
    setManualGoals(manualGoals.filter(g => g.tempId !== tempId));
    const newChanges = new Map(goalChanges);
    newChanges.delete(tempId);
    setGoalChanges(newChanges);
    onGoalsChange(newChanges);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span>Loading goals...</span>
      </div>
    );
  }

  const allGoals = [...goals, ...manualGoals.map(g => ({
    id: g.tempId,
    description: g.description,
    status: g.status,
    progress: g.progress,
    notes: g.notes,
    isManual: true,
  }))];

  if (allGoals.length === 0 && !showAddForm) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Target className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm mb-4">No care plan goals found</p>
        {allowManualAdd && (
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Goal Button */}
      {allowManualAdd && !showAddForm && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>
      )}

      {/* Add Goal Form */}
      {showAddForm && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Add New Goal</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            value={newGoal.description}
            onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
            placeholder="Goal description *"
            className="min-h-[80px]"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={newGoal.status}
                onValueChange={(value) => setNewGoal({ ...newGoal, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {goalStatuses.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Progress: {newGoal.progress}%</Label>
              <Slider
                value={[newGoal.progress]}
                onValueChange={([value]) => setNewGoal({ ...newGoal, progress: value })}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
          </div>
          <Input
            value={newGoal.notes}
            onChange={(e) => setNewGoal({ ...newGoal, notes: e.target.value })}
            placeholder="Notes (optional)"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddGoal} disabled={!newGoal.description}>
              Add Goal
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-3">
        {goals.map(goal => {
          const change = goalChanges.get(goal.id);
          const currentStatus = change?.status ?? goal.status ?? 'not-started';
          const currentProgress = change?.progress ?? goal.progress ?? 0;
          const currentNotes = change?.notes ?? goal.notes ?? '';

          return (
            <Card key={goal.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{goal.description}</p>
                    {goal.measurable_outcome && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Measurable outcome: {goal.measurable_outcome}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(currentStatus)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={currentStatus}
                      onValueChange={(value) => handleGoalChange(goal.id, 'status', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {goalStatuses.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Progress: {currentProgress}%</Label>
                    <Slider
                      value={[currentProgress]}
                      onValueChange={([value]) => handleGoalChange(goal.id, 'progress', value)}
                      max={100}
                      step={5}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Visit Notes</Label>
                  <Input
                    value={currentNotes}
                    onChange={(e) => handleGoalChange(goal.id, 'notes', e.target.value)}
                    placeholder="Add notes about progress during this visit..."
                    className="h-8 text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Manual Goals */}
        {manualGoals.map(goal => {
          const change = goalChanges.get(goal.tempId);
          const currentStatus = change?.status ?? goal.status;
          const currentProgress = change?.progress ?? goal.progress;
          const currentNotes = change?.notes ?? goal.notes;

          return (
            <Card key={goal.tempId} className="bg-primary/5">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {goal.description}
                      <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(currentStatus)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveManualGoal(goal.tempId)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={currentStatus}
                      onValueChange={(value) => handleGoalChange(goal.tempId, 'status', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {goalStatuses.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Progress: {currentProgress}%</Label>
                    <Slider
                      value={[currentProgress]}
                      onValueChange={([value]) => handleGoalChange(goal.tempId, 'progress', value)}
                      max={100}
                      step={5}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Visit Notes</Label>
                  <Input
                    value={currentNotes}
                    onChange={(e) => handleGoalChange(goal.tempId, 'notes', e.target.value)}
                    placeholder="Add notes about progress during this visit..."
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
