import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAdminUnavailabilityRequests, useReviewUnavailability } from '@/hooks/useAdminUnavailabilityRequests';
import { Skeleton } from '@/components/ui/skeleton';

interface UnavailabilityRequestsCardProps {
  branchId?: string;
  onReassignClick: (bookingId: string, requestId: string) => void;
}

export const UnavailabilityRequestsCard: React.FC<UnavailabilityRequestsCardProps> = ({
  branchId,
  onReassignClick
}) => {
  const { data: requests = [], isLoading } = useAdminUnavailabilityRequests(branchId);
  const reviewMutation = useReviewUnavailability();

  const handleApprove = (requestId: string, bookingId: string) => {
    reviewMutation.mutate(
      { requestId, status: 'approved' },
      {
        onSuccess: () => {
          // Open reassignment dialog
          onReassignClick(bookingId, requestId);
        }
      }
    );
  };

  const handleReject = (requestId: string) => {
    reviewMutation.mutate({ requestId, status: 'rejected' });
  };

  const getReasonLabel = (reason: string) => {
    const reasons: Record<string, string> = {
      illness: 'Personal Illness',
      emergency: 'Personal/Family Emergency',
      scheduling_conflict: 'Scheduling Conflict',
      transport_issue: 'Transportation Issue',
      other: 'Other Reason'
    };
    return reasons[reason] || reason;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unavailability Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Unavailability Requests
          </CardTitle>
          <CardDescription>
            Manage carer unavailability requests and reassign bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-muted-foreground">No pending unavailability requests</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Unavailability Requests
          <Badge variant="destructive" className="ml-auto">
            {requests.length} Pending
          </Badge>
        </CardTitle>
        <CardDescription>
          Review and reassign bookings when carers are unavailable
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request: any) => (
          <Card key={request.id} className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold">
                      {request.staff?.first_name} {request.staff?.last_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Requested {format(new Date(request.requested_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                    {getReasonLabel(request.reason)}
                  </Badge>
                </div>

                {/* Booking Details */}
                <div className="bg-muted rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {request.bookings?.clients?.first_name} {request.bookings?.clients?.last_name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(request.bookings?.start_time), "EEEE, MMMM d, yyyy")}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(request.bookings?.start_time), 'HH:mm')} - 
                      {format(new Date(request.bookings?.end_time), 'HH:mm')}
                    </span>
                  </div>

                  {request.bookings?.services?.title && (
                    <div className="text-sm">
                      <span className="font-medium">Service:</span> {request.bookings.services.title}
                    </div>
                  )}
                </div>

                {/* Notes */}
                {request.notes && (
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm">
                      <strong>Notes:</strong> {request.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(request.id, request.booking_id)}
                    disabled={reviewMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Reassign
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(request.id)}
                    disabled={reviewMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};
