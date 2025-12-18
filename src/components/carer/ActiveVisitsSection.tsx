import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Play, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useActiveVisits } from '@/hooks/useActiveVisits';
import { useCarerNavigation } from '@/hooks/useCarerNavigation';
import { differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';

export const ActiveVisitsSection: React.FC = () => {
  const navigate = useNavigate();
  const { createCarerPath } = useCarerNavigation();
  const { data: activeVisits = [], isLoading } = useActiveVisits();

  const handleContinueVisit = (bookingId: string) => {
    if (!bookingId) {
      console.error('[ActiveVisitsSection] Missing booking_id');
      toast.error('Unable to continue visit - booking ID missing');
      return;
    }
    console.log('[ActiveVisitsSection] Navigating to visit:', bookingId);
    navigate(createCarerPath(`/visit/${bookingId}`));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Active Visits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading active visits...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Active Visits
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeVisits.length > 0 ? (
          <div className="space-y-3">
            {activeVisits.map((visit) => {
              const startTime = new Date(visit.visit_start_time);
              const durationMinutes = differenceInMinutes(new Date(), startTime);
              
              return (
                <div key={visit.id} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50/30">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      In Progress
                    </Badge>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{visit.client_name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{durationMinutes}m elapsed</span>
                        </div>
                        <span>{visit.service_name}</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleContinueVisit(visit.booking_id)} 
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Play className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No active visits</p>
            <p className="text-sm text-gray-400">Active visits will appear here when you start them</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};