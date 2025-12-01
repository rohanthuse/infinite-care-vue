import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileBarChart2, Plus, Clock, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCarerContext } from '@/hooks/useCarerContext';
import { useCarerNavigation } from '@/hooks/useCarerNavigation';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export const ServiceReportsDashboardWidget: React.FC = () => {
  const navigate = useNavigate();
  const { createCarerPath } = useCarerNavigation();
  const { data: carerContext } = useCarerContext();
  const staffId = carerContext?.staffId;

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['carer-service-reports-summary', staffId],
    queryFn: async () => {
      if (!staffId) return null;

      const { data, error } = await supabase
        .from('client_service_reports')
        .select(`
          id,
          status,
          service_date,
          clients (
            first_name,
            last_name
          )
        `)
        .eq('staff_id', staffId)
        .order('service_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!staffId
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart2 className="h-5 w-5" />
            Service Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingReports = reportsData?.filter(report => report.status === 'pending') || [];
  const approvedReports = reportsData?.filter(report => report.status === 'approved') || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileBarChart2 className="h-5 w-5" />
          Service Reports
        </CardTitle>
        <CardDescription>Your recent service reports</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-orange-500" />
                {pendingReports.length} Pending
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {approvedReports.length} Approved
              </span>
            </div>
          </div>

          {/* Recent Reports */}
          {reportsData && reportsData.length > 0 ? (
            <div className="space-y-2">
              {reportsData.slice(0, 3).map((report) => (
                <div key={report.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="text-sm">
                      <div className="font-medium">
                        {report.clients?.first_name} {report.clients?.last_name}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(report.service_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant={report.status === 'approved' ? 'default' : 'secondary'}>
                    {report.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <FileBarChart2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No service reports yet</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1 flex items-center gap-1"
              onClick={() => navigate(createCarerPath('/service-reports'))}
            >
              <FileBarChart2 className="h-3 w-3" />
              View All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};