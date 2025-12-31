import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientCarePlanSummary } from '@/hooks/useClientCarePlanSummary';
import { 
  CheckSquare, 
  Pill, 
  Target, 
  Activity,
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface CarePlanDetailsDialogProps {
  clientId: string;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CarePlanDetailsDialog: React.FC<CarePlanDetailsDialogProps> = ({
  clientId,
  clientName,
  open,
  onOpenChange,
}) => {
  const { 
    carePlan, 
    goals, 
    activities, 
    medications, 
    tasks, 
    isLoading, 
    hasCarePlan 
  } = useClientCarePlanSummary(clientId);

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      case 'active':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
      case 'todo':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Care Plan Details - {clientName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !hasCarePlan ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Care Plan</h3>
            <p className="text-muted-foreground">
              This client does not have an active care plan.
            </p>
          </div>
        ) : (
          <>
            {/* Care Plan Info */}
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{carePlan?.title}</p>
                  <p className="text-sm text-muted-foreground">ID: {carePlan?.display_id}</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700">{carePlan?.status}</Badge>
              </div>
            </div>

            <Accordion type="multiple" defaultValue={['tasks', 'medications', 'goals', 'activities']} className="space-y-2">
              {/* Tasks Section */}
              <AccordionItem value="tasks" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Tasks</span>
                    <Badge variant="secondary" className="ml-2">
                      {tasks.pending} pending
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {tasks.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No pending tasks.</p>
                  ) : (
                    <div className="space-y-3 pb-2">
                      {tasks.items.map((task) => (
                        <div key={task.id} className="bg-background border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            <Badge className={getPriorityColor(task.priority)} variant="secondary">
                              {task.priority}
                            </Badge>
                          </div>
                          {task.category && (
                            <p className="text-xs text-muted-foreground mb-1">
                              <span className="font-medium">Category:</span> {task.category}
                            </p>
                          )}
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                              <Calendar className="h-3 w-3" />
                              <span>Due: {formatDate(task.due_date)}</span>
                            </div>
                          )}
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-2">{task.description}</p>
                          )}
                          {task.notes && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs font-medium text-muted-foreground">Notes:</p>
                              <p className="text-sm">{task.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Medications Section */}
              <AccordionItem value="medications" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Medications</span>
                    <Badge variant="secondary" className="ml-2">
                      {medications.active} active
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {medications.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No active medications.</p>
                  ) : (
                    <div className="space-y-3 pb-2">
                      {medications.items.map((med) => (
                        <div key={med.id} className="bg-background border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <Pill className="h-4 w-4 text-purple-500" />
                              {med.name}
                            </h4>
                            <Badge className={getStatusColor(med.status)} variant="secondary">
                              {med.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                            <div>
                              <span className="text-muted-foreground">Dosage:</span>{' '}
                              <span className="font-medium">{med.dosage}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Frequency:</span>{' '}
                              <span className="font-medium">{med.frequency}</span>
                            </div>
                          </div>
                          {med.time_of_day && med.time_of_day.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                              <Clock className="h-3 w-3" />
                              <span className="capitalize">Scheduled: {med.time_of_day.join(', ')}</span>
                            </div>
                          )}
                          {(med.start_date || med.end_date) && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatDate(med.start_date) || 'N/A'} - {formatDate(med.end_date) || 'Ongoing'}
                              </span>
                            </div>
                          )}
                          {med.notes && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs font-medium text-muted-foreground">Instructions:</p>
                              <p className="text-sm">{med.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Goals Section */}
              <AccordionItem value="goals" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Goals</span>
                    <Badge variant="secondary" className="ml-2">
                      {goals.completed}/{goals.total} completed
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {goals.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No goals defined.</p>
                  ) : (
                    <div className="space-y-3 pb-2">
                      {goals.items.map((goal) => (
                        <div key={goal.id} className="bg-background border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <Target className="h-4 w-4 text-green-500" />
                              {goal.description}
                            </h4>
                            <Badge className={getStatusColor(goal.status)} variant="secondary">
                              {goal.status}
                            </Badge>
                          </div>
                          {goal.time_of_day && goal.time_of_day.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                              <Clock className="h-3 w-3" />
                              <span className="capitalize">Scheduled: {goal.time_of_day.join(', ')}</span>
                            </div>
                          )}
                          {goal.progress !== null && (
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{goal.progress}%</span>
                              </div>
                              <Progress value={goal.progress} className="h-2" />
                            </div>
                          )}
                          {goal.notes && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs font-medium text-muted-foreground">Notes:</p>
                              <p className="text-sm">{goal.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Activities Section */}
              <AccordionItem value="activities" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Activities</span>
                    <Badge variant="secondary" className="ml-2">
                      {activities.active} active
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {activities.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No activities scheduled.</p>
                  ) : (
                    <div className="space-y-3 pb-2">
                      {activities.items.map((activity) => (
                        <div key={activity.id} className="bg-background border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <Activity className="h-4 w-4 text-orange-500" />
                              {activity.name}
                            </h4>
                            <Badge className={getStatusColor(activity.status)} variant="secondary">
                              {activity.status}
                            </Badge>
                          </div>
                          <div className="text-sm mb-1">
                            <span className="text-muted-foreground">Frequency:</span>{' '}
                            <span className="font-medium">{activity.frequency}</span>
                          </div>
                          {activity.time_of_day && activity.time_of_day.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                              <Clock className="h-3 w-3" />
                              <span className="capitalize">Scheduled: {activity.time_of_day.join(', ')}</span>
                            </div>
                          )}
                          {activity.description && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs font-medium text-muted-foreground">Description:</p>
                              <p className="text-sm">{activity.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
