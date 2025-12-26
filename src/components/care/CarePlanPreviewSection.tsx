import React from 'react';
import { ClipboardList, Pill, Target, Activity, ChevronDown, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useClientCarePlanSummary } from '@/hooks/useClientCarePlanSummary';
import { cn } from '@/lib/utils';

interface CarePlanPreviewSectionProps {
  clientId: string;
  compact?: boolean;
  showHeader?: boolean;
  className?: string;
}

export const CarePlanPreviewSection: React.FC<CarePlanPreviewSectionProps> = ({
  clientId,
  compact = false,
  showHeader = true,
  className,
}) => {
  const { carePlan, goals, activities, medications, tasks, isLoading, hasCarePlan } = useClientCarePlanSummary(clientId);

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  if (!hasCarePlan) {
    return (
      <div className={cn("text-center py-4 text-muted-foreground", className)}>
        <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No active care plan</p>
      </div>
    );
  }

  // Compact mode - shows summary cards
  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        {showHeader && (
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ClipboardList className="h-4 w-4" />
            <span>Care Plan: {carePlan?.title}</span>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          {/* Tasks Card */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Tasks</span>
            </div>
            <p className="text-lg font-bold text-foreground">{tasks.pending}</p>
            <p className="text-xs text-muted-foreground">pending</p>
            {tasks.items.length > 0 && (
              <div className="mt-2 pt-2 border-t border-primary/10 space-y-1">
                {tasks.items.slice(0, 3).map((task) => (
                  <p key={task.id} className="text-xs text-foreground truncate flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-primary rounded-full flex-shrink-0" />
                    {task.title}
                  </p>
                ))}
                {tasks.items.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{tasks.items.length - 3} more</p>
                )}
              </div>
            )}
          </div>
          
          {/* Medications Card */}
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Pill className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-medium text-muted-foreground">Medications</span>
            </div>
            <p className="text-lg font-bold text-foreground">{medications.active}</p>
            <p className="text-xs text-muted-foreground">active</p>
            {medications.items.length > 0 && (
              <div className="mt-2 pt-2 border-t border-orange-200/50 dark:border-orange-700/50 space-y-1">
                {medications.items.slice(0, 3).map((med) => (
                  <p key={med.id} className="text-xs text-foreground truncate flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-orange-500 dark:bg-orange-400 rounded-full flex-shrink-0" />
                    {med.name}
                  </p>
                ))}
                {medications.items.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{medications.items.length - 3} more</p>
                )}
              </div>
            )}
          </div>
          
          {/* Goals Card */}
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-muted-foreground">Goals</span>
            </div>
            <p className="text-lg font-bold text-foreground">{goals.completed}/{goals.total}</p>
            <p className="text-xs text-muted-foreground">completed</p>
            {goals.items.length > 0 && (
              <div className="mt-2 pt-2 border-t border-green-200/50 dark:border-green-700/50 space-y-1">
                {goals.items.slice(0, 3).map((goal) => (
                  <p key={goal.id} className="text-xs text-foreground truncate flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-green-500 dark:bg-green-400 rounded-full flex-shrink-0" />
                    {goal.description}
                  </p>
                ))}
                {goals.items.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{goals.items.length - 3} more</p>
                )}
              </div>
            )}
          </div>
          
          {/* Activities Card */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-muted-foreground">Activities</span>
            </div>
            <p className="text-lg font-bold text-foreground">{activities.active}</p>
            <p className="text-xs text-muted-foreground">scheduled</p>
            {activities.items.length > 0 && (
              <div className="mt-2 pt-2 border-t border-blue-200/50 dark:border-blue-700/50 space-y-1">
                {activities.items.slice(0, 3).map((activity) => (
                  <p key={activity.id} className="text-xs text-foreground truncate flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full flex-shrink-0" />
                    {activity.name}
                  </p>
                ))}
                {activities.items.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{activities.items.length - 3} more</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full mode - shows tabbed details
  return (
    <div className={cn("space-y-4", className)}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Care Plan Details</h3>
          </div>
          <Badge variant="outline">{carePlan?.display_id}</Badge>
        </div>
      )}

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="tasks" className="text-xs">
            Tasks ({tasks.pending})
          </TabsTrigger>
          <TabsTrigger value="medications" className="text-xs">
            Meds ({medications.active})
          </TabsTrigger>
          <TabsTrigger value="goals" className="text-xs">
            Goals ({goals.total})
          </TabsTrigger>
          <TabsTrigger value="activities" className="text-xs">
            Activities ({activities.active})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-3 space-y-2">
          {tasks.items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No pending tasks</p>
          ) : (
            tasks.items.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{task.title}</span>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {task.priority}
                </Badge>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="medications" className="mt-3 space-y-2">
          {medications.items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No active medications</p>
          ) : (
            medications.items.slice(0, 5).map((med) => (
              <div key={med.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{med.name}</p>
                  <p className="text-xs text-muted-foreground">{med.dosage} - {med.frequency}</p>
                </div>
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                  Active
                </Badge>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="goals" className="mt-3 space-y-2">
          {goals.items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No goals defined</p>
          ) : (
            goals.items.slice(0, 5).map((goal) => (
              <div key={goal.id} className="p-2 bg-muted/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{goal.description}</span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs capitalize",
                      goal.status === 'completed' && "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700"
                    )}
                  >
                    {goal.status}
                  </Badge>
                </div>
                {goal.progress !== null && (
                  <Progress value={goal.progress} className="h-1.5" />
                )}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="activities" className="mt-3 space-y-2">
          {activities.items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No activities scheduled</p>
          ) : (
            activities.items.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{activity.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.frequency}
                </Badge>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Collapsible version for appointment cards
export const CarePlanPreviewCollapsible: React.FC<CarePlanPreviewSectionProps & { defaultOpen?: boolean }> = ({
  clientId,
  compact = true,
  defaultOpen = false,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const { hasCarePlan, isLoading } = useClientCarePlanSummary(clientId);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (!hasCarePlan) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ClipboardList className="h-4 w-4 text-primary" />
          <span>View Care Plan Summary</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <CarePlanPreviewSection clientId={clientId} compact={compact} showHeader={false} />
      </CollapsibleContent>
    </Collapsible>
  );
};
