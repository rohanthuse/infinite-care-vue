import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Crown, Calendar, Users, AlertCircle } from 'lucide-react';
import { useOrganizationSubscription } from '@/hooks/useOrganizationSubscription';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SubscriptionDetailsCardProps {
  organizationId: string;
}

export const SubscriptionDetailsCard = ({ organizationId }: SubscriptionDetailsCardProps) => {
  const {
    planFormatted,
    currentClientCount,
    planLimit,
    remainingSlots,
    usagePercentage,
    isAtLimit,
    shouldUpgrade,
    subscriptionStatus,
    isTrial,
    trialEndsAt,
    expiresAt,
    subscriptionStartDate,
    isLoading,
  } = useOrganizationSubscription(organizationId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
          <CardDescription>Loading subscription information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusVariant = (status: string) => {
    if (status === 'active') return 'default';
    if (status === 'trial') return 'secondary';
    return 'destructive';
  };

  const getProgressColor = () => {
    if (usagePercentage >= 90) return 'bg-destructive';
    if (usagePercentage >= 70) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Subscription Details
        </CardTitle>
        <CardDescription>Plan usage and subscription information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan and Status Badges */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-base px-3 py-1">
            {planFormatted}
          </Badge>
          <Badge variant={getStatusVariant(subscriptionStatus)}>
            {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
            {isTrial && ' (Trial)'}
          </Badge>
        </div>

        {/* Alert for limit warnings */}
        {isAtLimit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Client Limit Reached</AlertTitle>
            <AlertDescription>
              You've reached your plan limit of {planLimit} clients. Upgrade your plan to add more clients.
            </AlertDescription>
          </Alert>
        )}

        {!isAtLimit && remainingSlots <= 3 && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Running Low on Capacity</AlertTitle>
            <AlertDescription>
              Only {remainingSlots} client slot{remainingSlots !== 1 ? 's' : ''} remaining. Consider upgrading soon.
            </AlertDescription>
          </Alert>
        )}

        {/* Usage Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              Clients Used
            </span>
            <span className="font-semibold">
              {currentClientCount} / {planLimit}
            </span>
          </div>
          
          <Progress 
            value={usagePercentage} 
            className={`h-3 [&>div]:${getProgressColor()}`}
          />
          
          <p className="text-xs text-muted-foreground">
            {remainingSlots} client slot{remainingSlots !== 1 ? 's' : ''} remaining 
            ({Math.round(usagePercentage)}% used)
          </p>
        </div>

        {/* Important Dates */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">Important Dates</span>
          </div>
          
          {isTrial && trialEndsAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trial Ends:</span>
              <span className="font-medium text-yellow-600 dark:text-yellow-500">
                {format(trialEndsAt, 'PPP')}
              </span>
            </div>
          )}
          
          {expiresAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subscription Expires:</span>
              <span className="font-medium">
                {format(expiresAt, 'PPP')}
              </span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Active Since:</span>
            <span className="font-medium">
              {format(subscriptionStartDate, 'PPP')}
            </span>
          </div>
        </div>

        {/* Upgrade Button */}
        {shouldUpgrade && (
          <Button className="w-full" variant={isAtLimit ? "default" : "outline"}>
            <Crown className="mr-2 h-4 w-4" />
            {isAtLimit ? 'Upgrade Plan Now' : 'Upgrade Plan'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
