import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { useCarerAssignedCarePlans } from '@/hooks/useCarePlanData';
import { useCarerAuth } from '@/hooks/useCarerAuth';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export const CarePlanStatusWidget: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useCarerAuth();
  const { data: carePlans, isLoading } = useCarerAssignedCarePlans(user?.id || '');

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

  // Categorize care plans by status
  const activePlans = carePlans.filter(plan => plan.status === 'active');
  const pendingClientApproval = carePlans.filter(plan => plan.status === 'pending_client_approval');
  const pendingApproval = carePlans.filter(plan => plan.status === 'pending_approval');
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
      case 'pending_approval':
        return 'Staff Review';
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
      case 'pending_approval':
        return 'outline' as const;
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
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Active</span>
            </div>
            <div className="text-xl font-bold text-green-800">{activePlans.length}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Pending</span>
            </div>
            <div className="text-xl font-bold text-orange-800">{pendingClientApproval.length}</div>
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