import { useTenant } from '@/contexts/TenantContext';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, Users, TrendingUp, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { formatSubscriptionPlan } from '@/lib/subscriptionLimits';
import { toast } from '@/hooks/use-toast';

export function SubscriptionDetails() {
  const { organization } = useTenant();
  const { 
    currentClientCount, 
    maxClients, 
    remainingSlots, 
    subscriptionPlan,
    subscriptionExpiresAt,
    usagePercentage,
    isLoading 
  } = useSubscriptionLimits();

  const handleUpgrade = () => {
    toast({
      title: "Contact Support",
      description: "Please contact support to upgrade your subscription plan.",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">Loading subscription details...</div>
      </div>
    );
  }

  // Determine progress bar color based on usage
  const getProgressColor = () => {
    if (usagePercentage >= 90) return 'bg-red-500';
    if (usagePercentage >= 70) return 'bg-yellow-500';
    return 'bg-primary';
  };

  // Calculate days remaining
  const daysRemaining = subscriptionExpiresAt 
    ? differenceInDays(new Date(subscriptionExpiresAt), new Date())
    : null;

  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 30;
  const isExpired = daysRemaining !== null && daysRemaining < 0;

  return (
    <div className="p-6 space-y-6">
      {/* Plan Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Subscription Plan Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Name */}
          <div>
            <div className="text-sm text-muted-foreground mb-1">Current Plan</div>
            <div className="text-2xl font-semibold">
              {formatSubscriptionPlan(subscriptionPlan)}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Client Usage</span>
              </div>
              <span className="text-sm font-semibold">
                {currentClientCount} / {maxClients}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress 
                value={usagePercentage} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(usagePercentage)}% used</span>
                <span className={remainingSlots === 0 ? 'text-red-500 font-semibold' : ''}>
                  {remainingSlots} slots remaining
                </span>
              </div>
            </div>

            {/* Warning Messages */}
            {usagePercentage >= 90 && (
              <div className="text-sm text-red-500 font-medium">
                ⚠️ You're approaching your subscription limit. Consider upgrading your plan.
              </div>
            )}
            {usagePercentage >= 70 && usagePercentage < 90 && (
              <div className="text-sm text-yellow-600 font-medium">
                ⚠️ You've used over 70% of your client limit.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Period Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Subscription Period
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Start Date */}
          {organization?.created_at && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Started</span>
              <span className="text-sm font-medium">
                {format(new Date(organization.created_at), 'dd MMM yyyy')}
              </span>
            </div>
          )}

          {/* End Date */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Expires</span>
            <span className="text-sm font-medium">
              {subscriptionExpiresAt 
                ? format(new Date(subscriptionExpiresAt), 'dd MMM yyyy')
                : 'No expiry date'}
            </span>
          </div>

          {/* Days Remaining */}
          {daysRemaining !== null && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Remaining
              </span>
              <span className={`text-sm font-medium ${
                isExpired ? 'text-red-500' : 
                isExpiringSoon ? 'text-yellow-600' : 
                'text-foreground'
              }`}>
                {isExpired 
                  ? 'Expired' 
                  : `${Math.abs(daysRemaining)} days`}
              </span>
            </div>
          )}

          {/* Expiry Warning */}
          {isExpiringSoon && !isExpired && (
            <div className="text-sm text-yellow-600 font-medium border border-yellow-200 bg-yellow-50 p-3 rounded-md">
              ⚠️ Your subscription expires in {daysRemaining} days. Please renew to continue service.
            </div>
          )}

          {isExpired && (
            <div className="text-sm text-red-500 font-medium border border-red-200 bg-red-50 p-3 rounded-md">
              ⚠️ Your subscription has expired. Please contact support to renew.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleUpgrade}
          size="lg"
          className="w-full sm:w-auto"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Upgrade Plan
        </Button>
      </div>
    </div>
  );
}
