import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, FileText, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useCarerProfileById } from "@/hooks/useCarerProfile";
import { useLeaveRequests, useUpdateLeaveRequest, type LeaveRequest } from "@/hooks/useLeaveManagement";
import { useUserRole } from "@/hooks/useUserRole";

interface CarerLeaveManagementTabProps {
  carerId: string;
}

export const CarerLeaveManagementTab: React.FC<CarerLeaveManagementTabProps> = ({ carerId }) => {
  const { data: carerProfile, isLoading: isProfileLoading } = useCarerProfileById(carerId);
  const { data: allLeaveRequests, isLoading: isLeaveLoading } = useLeaveRequests(carerProfile?.branch_id);
  const { data: userRole } = useUserRole();
  const updateLeaveRequest = useUpdateLeaveRequest();
  
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const isLoading = isProfileLoading || isLeaveLoading;
  const isAdmin = userRole?.role === 'super_admin' || userRole?.role === 'branch_admin';

  // Filter leave requests for this specific carer
  const carerLeaveRequests = allLeaveRequests?.filter(req => req.staff_id === carerId) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'annual':
        return 'bg-blue-100 text-blue-700';
      case 'sick':
        return 'bg-red-100 text-red-700';
      case 'personal':
        return 'bg-purple-100 text-purple-700';
      case 'maternity':
      case 'paternity':
        return 'bg-pink-100 text-pink-700';
      case 'emergency':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleApprove = async (request: LeaveRequest) => {
    await updateLeaveRequest.mutateAsync({
      id: request.id,
      status: 'approved',
      review_notes: reviewNotes
    });
    setSelectedRequest(null);
    setReviewNotes('');
  };

  const handleReject = async (request: LeaveRequest) => {
    await updateLeaveRequest.mutateAsync({
      id: request.id,
      status: 'rejected',
      review_notes: reviewNotes
    });
    setSelectedRequest(null);
    setReviewNotes('');
  };

  if (isLoading || !carerProfile?.branch_id) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Leave Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        {carerLeaveRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No leave requests found</p>
            <p className="text-sm mt-2">This staff member has not submitted any leave requests yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {carerLeaveRequests
              .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime())
              .map((request) => (
                <div
                  key={request.id}
                  className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getLeaveTypeColor(request.leave_type)}>
                          {request.leave_type.charAt(0).toUpperCase() + request.leave_type.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{request.total_days} business days</span>
                        </div>
                      </div>

                      {request.reason && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                          <FileText className="h-4 w-4 mt-0.5" />
                          <span>{request.reason}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Requested: {format(new Date(request.requested_at), 'MMM dd, yyyy HH:mm')}</span>
                        {request.reviewed_at && (
                          <span>• Reviewed: {format(new Date(request.reviewed_at), 'MMM dd, yyyy')}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>

                      {isAdmin && request.status === 'pending' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setReviewNotes('');
                              }}
                            >
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Review Leave Request</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-medium mb-2">{carerProfile?.first_name} {carerProfile?.last_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {request.leave_type.charAt(0).toUpperCase() + request.leave_type.slice(1)} leave from{' '}
                                  {format(new Date(request.start_date), 'MMM dd')} to{' '}
                                  {format(new Date(request.end_date), 'MMM dd, yyyy')} ({request.total_days} business days)
                                </p>
                                {request.reason && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    <strong>Reason:</strong> {request.reason}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Review Notes (Optional)
                                </label>
                                <Textarea
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  placeholder="Add any notes about this decision..."
                                  rows={3}
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleApprove(request)}
                                  disabled={updateLeaveRequest.isPending}
                                  className="flex-1"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReject(request)}
                                  disabled={updateLeaveRequest.isPending}
                                  className="flex-1"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>

                  {request.review_notes && (
                    <div className="mt-3 p-3 bg-muted rounded text-sm">
                      <strong>Review Notes:</strong> {request.review_notes}
                      {request.reviewer_name && (
                        <span className="text-muted-foreground"> - {request.reviewer_name}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
