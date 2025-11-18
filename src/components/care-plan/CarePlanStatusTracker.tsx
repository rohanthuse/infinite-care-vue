import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  UserCheck, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { CarePlanWithDetails } from '@/hooks/useCarePlanData';
import { format } from 'date-fns';

interface CarePlanStatusTrackerProps {
  carePlan: CarePlanWithDetails;
  viewerType: 'staff' | 'client';
}

export function CarePlanStatusTracker({ carePlan, viewerType }: CarePlanStatusTrackerProps) {
  const getStatusSteps = () => {
    const steps = [
      {
        id: 'draft',
        title: 'Care Plan Created',
        description: 'Initial care plan drafted by staff',
        icon: FileText,
        status: 'completed'
      },
      {
        id: 'pending_client_approval',
        title: 'Client Review',
        description: 'Awaiting client review and approval',
        icon: CheckCircle,
        status: carePlan.status === 'draft' ? 'pending' : 
               carePlan.status === 'pending_client_approval' ? 'current' : 'completed'
      },
      {
        id: 'active',
        title: 'Active Care Plan',
        description: 'Care plan approved and active',
        icon: CheckCircle,
        status: carePlan.status === 'active' ? 'completed' : 'pending'
      }
    ];

    // Handle rejected status
    if (carePlan.status === 'rejected') {
      const rejectedStep = {
        id: 'rejected',
        title: 'Changes Requested',
        description: (carePlan as any).rejection_reason || 'Care plan needs revision',
        icon: AlertTriangle,
        status: 'current' as const
      };
      
      // Insert rejected step after the appropriate stage
      if ((carePlan as any).approved_at) {
        // Rejected during client review process
        steps.splice(1, 0, rejectedStep);
      }
    }

    return steps;
  };

  const getProgressPercentage = () => {
    switch (carePlan.status) {
      case 'draft': return 33;
      case 'pending_client_approval': return 66;
      case 'active': return 100;
      case 'rejected': return 50; // Rejected during review
      default: return 0;
    }
  };

  const getStatusVariant = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed': return 'default';
      case 'current': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (stepStatus: string, IconComponent: any) => {
    switch (stepStatus) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'current':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'pending':
        return <IconComponent className="h-4 w-4 text-gray-400" />;
      default:
        return <IconComponent className="h-4 w-4 text-gray-400" />;
    }
  };

  const steps = getStatusSteps();
  const progressPercentage = getProgressPercentage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Care Plan Status</span>
          <Badge variant={carePlan.status === 'active' ? 'default' : 'secondary'}>
            {carePlan.status === 'pending_client_approval' ? 'Pending Your Approval' : 
             carePlan.status === 'active' ? 'Active' : 
             carePlan.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Status Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;
            
            return (
              <div key={step.id} className="flex items-start space-x-3">
                <div className="flex flex-col items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
                    ${step.status === 'completed' ? 'bg-green-50 border-green-200' :
                      step.status === 'current' ? 'bg-orange-50 border-orange-200' :
                      'bg-gray-50 border-gray-200'}
                  `}>
                    {getStatusIcon(step.status, Icon)}
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 h-8 mt-1 ${
                      step.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-medium ${
                      step.status === 'completed' ? 'text-green-700' :
                      step.status === 'current' ? 'text-orange-700' :
                      'text-gray-500'
                    }`}>
                      {step.title}
                    </h4>
                    <Badge variant={getStatusVariant(step.status)} className="text-xs">
                      {step.status === 'completed' ? 'Done' :
                       step.status === 'current' ? 'In Progress' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                  
                  {/* Show timestamps for completed steps */}
                  {step.status === 'completed' && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {step.id === 'draft' && carePlan.created_at && (
                        <>Created: {format(new Date(carePlan.created_at), 'MMM dd, yyyy HH:mm')}</>
                      )}
                      {step.id === 'pending_approval' && (carePlan as any).approved_at && (
                        <>Approved: {format(new Date((carePlan as any).approved_at), 'MMM dd, yyyy HH:mm')}</>
                      )}
                      {step.id === 'active' && (carePlan as any).client_approved_at && (
                        <>Activated: {format(new Date((carePlan as any).client_approved_at), 'MMM dd, yyyy HH:mm')}</>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Steps */}
        {carePlan.status !== 'active' && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 text-sm">Next Steps</h4>
                <p className="text-sm text-blue-800 mt-1">
                  {carePlan.status === 'draft' && 'Finalizing care plan to send to client for review.'}
                  {carePlan.status === 'pending_client_approval' && 
                    (viewerType === 'client' ? 
                      'Please review and approve your care plan to activate it.' :
                      'Waiting for client to review and approve the care plan.'
                    )
                  }
                  {carePlan.status === 'rejected' && 'The care plan needs to be revised based on feedback.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}