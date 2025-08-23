import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText, Send } from "lucide-react";
import { LeaveRequestForm } from "@/components/attendance/LeaveRequestForm";
import { useLeaveRequests } from "@/hooks/useLeaveManagement";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";

export default function CarerLeave() {
  const { data: userRole, isLoading: isLoadingRole } = useUserRole();
  const { data: leaveRequests, isLoading } = useLeaveRequests(userRole?.branchId);

  // Filter leave requests for the current carer
  const myLeaveRequests = leaveRequests?.filter(
    (request) => request.staff_id === userRole?.staffId
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLeaveTypeDisplay = (type: string) => {
    switch (type) {
      case 'annual':
        return 'Annual Leave';
      case 'sick':
        return 'Sick Leave';
      case 'personal':
        return 'Personal Leave';
      case 'maternity':
        return 'Maternity Leave';
      case 'paternity':
        return 'Paternity Leave';
      case 'emergency':
        return 'Emergency Leave';
      default:
        return type;
    }
  };

  if (isLoadingRole) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading leave management...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userRole?.branchId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Unable to load leave management. Please contact your administrator.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          Leave Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Request time off and manage your leave requests
        </p>
      </div>

      <Tabs defaultValue="request" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="request" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Request Leave
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            My Requests ({myLeaveRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="request">
          <LeaveRequestForm branchId={userRole.branchId} />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                My Leave Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-muted-foreground">Loading your leave requests...</span>
                </div>
              ) : myLeaveRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests</h3>
                  <p className="text-gray-500">You haven't submitted any leave requests yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myLeaveRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-gray-900">
                              {getLeaveTypeDisplay(request.leave_type)}
                            </h4>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(new Date(request.start_date), 'MMM dd, yyyy')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Submitted {format(new Date(request.requested_at), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>

                          {request.reason && (
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Reason: </span>
                              <span className="text-gray-600">{request.reason}</span>
                            </div>
                          )}

                          {request.review_notes && (
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Review Notes: </span>
                              <span className="text-gray-600">{request.review_notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}