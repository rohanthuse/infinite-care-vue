import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCarePlanGoals } from '@/hooks/useCarePlanGoals';
import { useUpdateGoal } from '@/hooks/useCarePlanGoalsMutations';
import { useVisitRecord } from '@/hooks/useVisitRecord';
import { FileBarChart2, Target, TrendingUp, Clock, MessageCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface VisitCarePlanUpdateProps {
  clientId: string;
  visitRecordId?: string;
}

const VisitCarePlanUpdate: React.FC<VisitCarePlanUpdateProps> = ({ 
  clientId, 
  visitRecordId 
}) => {
  const [visitNotes, setVisitNotes] = useState('');
  const [goalUpdates, setGoalUpdates] = useState<Record<string, { progress: number; notes: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  // Get visit record hooks for saving
  const { visitRecord, updateVisitRecord } = useVisitRecord(visitRecordId);

  // Fetch active care plan for the client
  const { data: carePlan, isLoading: carePlanLoading } = useQuery({
    queryKey: ['client-care-plan', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_care_plans')
        .select('*')
        .eq('client_id', clientId)
        .in('status', ['draft', 'pending_approval', 'pending_client_approval', 'active', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  // Fetch care plan goals
  const { data: goals, isLoading: goalsLoading } = useCarePlanGoals(carePlan?.id);
  const updateGoal = useUpdateGoal();

  // Load existing visit summary when component mounts
  useEffect(() => {
    if (visitRecord?.visit_summary) {
      setVisitNotes(visitRecord.visit_summary);
    }
  }, [visitRecord?.visit_summary]);

  // Auto-save visit notes with debouncing
  useEffect(() => {
    if (!visitRecordId || !visitNotes || visitNotes === visitRecord?.visit_summary) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateVisitRecord.mutateAsync({
          id: visitRecordId,
          updates: {
            visit_summary: visitNotes
          }
        });
        setLastSavedAt(new Date());
        console.log('[VisitCarePlanUpdate] Auto-saved visit notes');
      } catch (error) {
        console.error('[VisitCarePlanUpdate] Error auto-saving visit notes:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1500); // Auto-save after 1.5 seconds of no typing

    return () => clearTimeout(timeoutId);
  }, [visitNotes, visitRecordId, visitRecord?.visit_summary, updateVisitRecord]);

  // Auto-save goal updates with debouncing
  useEffect(() => {
    const pendingUpdates = Object.entries(goalUpdates);
    if (pendingUpdates.length === 0 || !goals) return;

    const timeoutId = setTimeout(() => {
      pendingUpdates.forEach(([goalId, update]) => {
        const goal = goals.find(g => g.id === goalId);
        if (goal && (update.progress !== undefined || update.notes)) {
          handleGoalUpdate(
            goalId, 
            update.progress ?? goal.progress ?? 0,
            update.notes ?? ''
          );
        }
      });
      // Clear pending updates after save
      setGoalUpdates({});
    }, 2000); // 2-second debounce for goal updates

    return () => clearTimeout(timeoutId);
  }, [goalUpdates, goals]);

  const handleGoalUpdate = async (goalId: string, progress: number, notes: string) => {
    try {
      await updateGoal.mutateAsync({
        goalId,
        updates: {
          progress,
          notes,
          status: progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started'
        }
      });
      
      toast.success('Goal updated successfully');
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    }
  };

  const handleProgressChange = (goalId: string, progress: number) => {
    setGoalUpdates(prev => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        progress
      }
    }));
  };

  const handleNotesChange = (goalId: string, notes: string) => {
    setGoalUpdates(prev => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        notes
      }
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-600 text-white border-blue-700';
      case 'not-started':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (carePlanLoading || goalsLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!carePlan) {
    return (
      <div className="text-center py-8">
        <FileBarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No active care plan found for this client</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Care Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart2 className="w-5 h-5" />
            Care Plan Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Plan Type</p>
              <p className="font-medium">{carePlan.care_plan_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant="custom" className={getStatusColor(carePlan.status)}>
                {carePlan.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-medium">{format(new Date(carePlan.created_at), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="font-medium">{format(new Date(carePlan.updated_at), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Progress */}
      {goals && goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Care Plan Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{goal.description}</h4>
                          <Badge variant="custom" className={getStatusColor(goal.status)}>
                            {goal.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Progress:</span>
                            <span className="text-sm font-medium">{goal.progress || 0}%</span>
                          </div>
                          <Progress value={goal.progress || 0} className="h-2" />
                        </div>

                        {goal.notes && (
                          <p className="text-sm text-gray-600 mt-2">{goal.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 pt-3 border-t">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Update Progress (%)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={goalUpdates[goal.id]?.progress ?? goal.progress ?? 0}
                          onChange={(e) => handleProgressChange(goal.id, Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-center text-sm text-gray-500 mt-1">
                          {goalUpdates[goal.id]?.progress ?? goal.progress ?? 0}%
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Visit Notes
                        </label>
                        <Textarea
                          placeholder="Add notes about progress on this goal during the visit..."
                          value={goalUpdates[goal.id]?.notes ?? ''}
                          onChange={(e) => handleNotesChange(goal.id, e.target.value)}
                          rows={2}
                        />
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleGoalUpdate(
                          goal.id,
                          goalUpdates[goal.id]?.progress ?? goal.progress ?? 0,
                          goalUpdates[goal.id]?.notes ?? ''
                        )}
                        disabled={updateGoal.isPending}
                        className="w-full"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Update Goal
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Visit Summary Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Care Plan Visit Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Care Plan Updates & Observations
              </label>
              <Textarea
                placeholder="Describe any changes in the client's needs, new observations, or updates to the care plan requirements..."
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-500">
                <Clock className="w-4 h-4 inline mr-1" />
                These notes will be added to the care plan record
              </div>
              {isSaving && (
                <div className="text-blue-600 flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  Saving...
                </div>
              )}
              {lastSavedAt && !isSaving && (
                <div className="text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Saved at {format(lastSavedAt, 'HH:mm:ss')}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitCarePlanUpdate;