import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import { useCarerAssignedCarePlansOptimized } from '@/hooks/useCarePlanData';
import { useCarerContext } from '@/hooks/useCarerContext';
import { useCarePlansNeedingReviewCount } from '@/hooks/useCarePlansNeedingReview';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export const CarePlanStatusWidget: React.FC = () => {
  const navigate = useNavigate();
  const { data: carerContext } = useCarerContext();
  const staffId = carerContext?.staffId || '';
  const branchId = carerContext?.branchInfo?.id || '';
  const { data: carePlans, isLoading } = useCarerAssignedCarePlansOptimized(staffId, branchId);
  const { total: needsReviewCount, overdue: overdueCount } = useCarePlansNeedingReviewCount(staffId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Care Plan Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading care plans...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!carePlans || carePlans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Care Plan Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No care plans assigned</p>
            <p className="text-sm text-gray-400">Care plans will appear here when assigned</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Categorize care plans by status (removed pending_approval)
  const activePlans = carePlans.filter(plan => plan.status === 'active');
  const pendingClientApproval = carePlans.filter(plan => plan.status === 'pending_client_approval');
  const recentlyApproved = carePlans.filter(plan => 
    plan.status === 'active' && 
    plan.client_acknowledged_at && 
    new Date(plan.client_acknowledged_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending_client_approval':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'pending_approval':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'pending_client_approval':
        return 'Client Review';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default' as const;
      case 'pending_client_approval':
        return 'secondary' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Care Plan Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">Active</span>
            </div>
            <div className="text-xl font-bold text-green-800 dark:text-green-200">{activePlans.length}</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Pending</span>
            </div>
            <div className="text-xl font-bold text-orange-800 dark:text-orange-200">{pendingClientApproval.length}</div>
          </div>
          <div 
            className={`p-3 rounded-lg cursor-pointer transition-shadow hover:shadow-md ${
              overdueCount > 0 
                ? 'bg-red-50 dark:bg-red-950/30' 
                : needsReviewCount > 0 
                  ? 'bg-amber-50 dark:bg-amber-950/30'
                  : 'bg-gray-50 dark:bg-gray-800/50'
            }`}
            onClick={() => needsReviewCount > 0 && navigate('/carer-dashboard/careplans?filter=needs-review')}
          >
            <div className="flex items-center gap-1.5">
              <RefreshCw className={`h-4 w-4 ${
                overdueCount > 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : needsReviewCount > 0 
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-500 dark:text-gray-400'
              }`} />
              <span className={`text-xs font-medium ${
                overdueCount > 0 
                  ? 'text-red-700 dark:text-red-300' 
                  : needsReviewCount > 0 
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-gray-600 dark:text-gray-400'
              }`}>Review</span>
            </div>
            <div className={`text-xl font-bold ${
              overdueCount > 0 
                ? 'text-red-800 dark:text-red-200' 
                : needsReviewCount > 0 
                  ? 'text-amber-800 dark:text-amber-200'
                  : 'text-gray-700 dark:text-gray-300'
            }`}>{needsReviewCount}</div>
          </div>
        </div>

        {/* Recently Approved Highlight */}
        {recentlyApproved.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Recently Approved</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {recentlyApproved.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {recentlyApproved.slice(0, 2).map((plan) => (
                <div key={plan.id} className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">
                    {plan.client?.first_name} {plan.client?.last_name}
                  </span>
                  <span className="text-blue-600">
                    {plan.client_acknowledged_at && 
                      format(new Date(plan.client_acknowledged_at), 'HH:mm')}
                  </span>
                </div>
              ))}
              {recentlyApproved.length > 2 && (
                <p className="text-xs text-blue-600">
                  +{recentlyApproved.length - 2} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recent Care Plans */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Recent Care Plans</h4>
          {carePlans.slice(0, 3).map((plan) => (
            <div key={plan.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-2">
                {getStatusIcon(plan.status)}
                <div>
                  <p className="text-sm font-medium">
                    {plan.client?.first_name} {plan.client?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{plan.care_plan_type || 'Standard Care'}</p>
                </div>
              </div>
              <Badge variant={getStatusVariant(plan.status)} className="text-xs">
                {getStatusLabel(plan.status)}
              </Badge>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/carer-dashboard/careplans')}
        >
          View All Care Plans ({carePlans.length})
        </Button>
      </CardContent>
    </Card>
  );
};