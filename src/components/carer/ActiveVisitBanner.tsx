import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useActiveVisits } from '@/hooks/useActiveVisits';
import { useCarerNavigation } from '@/hooks/useCarerNavigation';
import { differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';

export const ActiveVisitBanner: React.FC = () => {
  const navigate = useNavigate();
  const { createCarerPath } = useCarerNavigation();
  const { data: activeVisits = [], isLoading } = useActiveVisits();

  if (isLoading || activeVisits.length === 0) {
    return null;
  }

  const activeVisit = activeVisits[0]; // Show the first active visit
  const startTime = new Date(activeVisit.visit_start_time);
  const durationMinutes = differenceInMinutes(new Date(), startTime);

  const handleContinueVisit = () => {
    if (!activeVisit.booking_id) {
      console.error('[ActiveVisitBanner] Missing booking_id for visit:', activeVisit);
      toast.error('Unable to continue visit - booking ID missing');
      return;
    }
    console.log('[ActiveVisitBanner] Navigating to visit:', activeVisit.booking_id);
    navigate(createCarerPath(`/visit/${activeVisit.booking_id}`));
  };

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/30">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Badge variant="secondary" className="bg-blue-600 text-white border-0">
                Visit in Progress
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{activeVisit.client_name}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{durationMinutes}m elapsed</span>
              </div>
              
              <span className="text-muted-foreground">{activeVisit.service_name}</span>
            </div>
          </div>

          <Button onClick={handleContinueVisit} size="sm" className="flex items-center justify-center space-x-2 w-full sm:w-auto">
            <span>Continue Visit</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {activeVisits.length > 1 && (
          <div className="mt-2 text-xs text-muted-foreground">
            +{activeVisits.length - 1} more active visit{activeVisits.length > 2 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
};