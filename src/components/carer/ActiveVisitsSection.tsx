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
          <p className="text-muted-foreground">Loading active visits...</p>
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
              <div key={visit.id} className="flex flex-col gap-3 p-4 border border-border rounded-lg bg-blue-50/30 dark:bg-blue-950/20 border-l-4 border-l-blue-500">
                  {/* Header: Icon + Name + Badge */}
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-foreground truncate flex-1">{visit.client_name}</span>
                    <Badge variant="custom" className="bg-blue-100 text-blue-700 dark:bg-blue-500 dark:text-white text-xs flex-shrink-0">
                      In Progress
                    </Badge>
                  </div>
                  
                  {/* Details: Time + Service */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{durationMinutes}m elapsed</span>
                    </div>
                    <span className="truncate">{visit.service_name}</span>
                  </div>
                  
                  {/* Action: Continue Button */}
                  <Button 
                    onClick={() => handleContinueVisit(visit.booking_id)} 
                    size="sm"
                    className="w-full"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Play className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No active visits</p>
            <p className="text-sm text-muted-foreground/70">Active visits will appear here when you start them</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};