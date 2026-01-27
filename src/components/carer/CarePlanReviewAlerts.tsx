import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Clock, ChevronRight, RefreshCw } from 'lucide-react';
import { useCarePlansNeedingReview } from '@/hooks/useCarePlansNeedingReview';
import { useCarerContext } from '@/hooks/useCarerContext';
import { useNavigate } from 'react-router-dom';
import { useCarerNavigation } from '@/hooks/useCarerNavigation';
import { format } from 'date-fns';

export const CarePlanReviewAlerts: React.FC = () => {
  const navigate = useNavigate();
  const { createCarerPath } = useCarerNavigation();
  const { data: carerContext } = useCarerContext();
  const staffId = carerContext?.staffId || '';
  const { data: carePlans, isLoading, refetch } = useCarePlansNeedingReview(staffId);

  // Don't show if loading or no alerts
  if (isLoading || !carePlans || carePlans.length === 0) {
    return null;
  }

  const overdueCount = carePlans.filter(p => p.isOverdue).length;
  const upcomingCount = carePlans.filter(p => !p.isOverdue).length;

  const handleViewCarePlan = (carePlanId: string) => {
    navigate(createCarerPath(`/careplans/${carePlanId}`));
  };

  const getPriorityStyles = (daysUntilReview: number) => {
    if (daysUntilReview < 0) {
      return {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-700 dark:text-red-400',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
      };
    }
    if (daysUntilReview <= 3) {
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/30',
        border: 'border-orange-200 dark:border-orange-800',
        text: 'text-orange-700 dark:text-orange-400',
        badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
      };
    }
    return {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
    };
  };

  const getReviewLabel = (daysUntilReview: number) => {
    if (daysUntilReview < 0) {
      return `${Math.abs(daysUntilReview)} day${Math.abs(daysUntilReview) !== 1 ? 's' : ''} overdue`;
    }
    if (daysUntilReview === 0) {
      return 'Due today';
    }
    return `Due in ${daysUntilReview} day${daysUntilReview !== 1 ? 's' : ''}`;
  };

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Care Plans Needing Review
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              {carePlans.length} total
            </Badge>
          </div>
        </div>
        {overdueCount > 0 && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {overdueCount} care plan{overdueCount !== 1 ? 's' : ''} overdue for review
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {carePlans.slice(0, 5).map((plan) => {
          const styles = getPriorityStyles(plan.daysUntilReview);
          return (
            <div
              key={plan.id}
              className={`${styles.bg} ${styles.border} border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => handleViewCarePlan(plan.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground truncate">
                      {plan.client?.first_name} {plan.client?.last_name}
                    </span>
                    <Badge className={`${styles.badge} text-xs flex-shrink-0`}>
                      {plan.isOverdue ? 'OVERDUE' : 'Due Soon'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground truncate">
                      {plan.care_plan_type || 'Standard Care'}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className={styles.text}>
                      {plan.display_id}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${styles.text}`}>
                      {getReviewLabel(plan.daysUntilReview)}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(plan.review_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          );
        })}

        {carePlans.length > 5 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(createCarerPath('/careplans?filter=needs-review'))}
          >
            View All {carePlans.length} Care Plans Needing Review
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
