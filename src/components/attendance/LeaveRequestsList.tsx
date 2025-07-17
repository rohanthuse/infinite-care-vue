import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Search, Filter, Eye, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useLeaveRequests, useUpdateLeaveRequest, type LeaveRequest } from "@/hooks/useLeaveManagement";

interface LeaveRequestsListProps {
  branchId: string;
}

export function LeaveRequestsList({ branchId }: LeaveRequestsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approved' | 'rejected' | null>(null);

  const { data: leaveRequests = [], isLoading } = useLeaveRequests(branchId);
  const updateLeaveRequest = useUpdateLeaveRequest();

  // Filter requests
  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = request.staff_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.leave_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesType = leaveTypeFilter === "all" || request.leave_type === leaveTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleReviewClick = (request: LeaveRequest, action: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setPendingAction(action);
    setReviewNotes("");
    setIsReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedRequest || !pendingAction) return;

    updateLeaveRequest.mutate({
      id: selectedRequest.id,
      status: pendingAction,
      review_notes: reviewNotes.trim() || undefined
    }, {
      onSuccess: () => {
        setIsReviewDialogOpen(false);
        setSelectedRequest(null);
        setPendingAction(null);
        setReviewNotes("");
      }
    });
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderLeaveTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      annual: "bg-blue-100 text-blue-800 border-blue-200",
      sick: "bg-red-100 text-red-800 border-red-200",
      personal: "bg-purple-100 text-purple-800 border-purple-200",
      maternity: "bg-pink-100 text-pink-800 border-pink-200",
      paternity: "bg-indigo-100 text-indigo-800 border-indigo-200",
      emergency: "bg-yellow-100 text-yellow-800 border-yellow-200"
    };

    return (
      <Badge className={colors[type] || "bg-gray-100 text-gray-800 border-gray-200"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const pendingRequests = filteredRequests.filter(r => r.status === 'pending');
  const recentRequests = filteredRequests.filter(r => r.status !== 'pending');

  if (isLoading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading leave requests...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold">Filter Requests</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by staff name or leave type..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leave Types</SelectItem>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal Leave</SelectItem>
                  <SelectItem value="maternity">Maternity Leave</SelectItem>
                  <SelectItem value="paternity">Paternity Leave</SelectItem>
                  <SelectItem value="emergency">Emergency Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests - Priority Section */}
      {pendingRequests.length > 0 && (
        <Card className="border-orange-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-800">Pending Approval ({pendingRequests.length})</h3>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.staff_name}</TableCell>
                      <TableCell>{renderLeaveTypeBadge(request.leave_type)}</TableCell>
                      <TableCell>{format(new Date(request.start_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(request.end_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{request.total_days} days</TableCell>
                      <TableCell>{format(new Date(request.requested_at), 'MMM dd')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReviewClick(request, 'approved')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReviewClick(request, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Requests */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">All Leave Requests ({filteredRequests.length})</h3>
          </div>
          
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No leave requests found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Reviewer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.staff_name}</TableCell>
                      <TableCell>{renderLeaveTypeBadge(request.leave_type)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}</div>
                          {request.reason && (
                            <div className="text-gray-500 mt-1 text-xs">
                              Reason: {request.reason}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{request.total_days} days</TableCell>
                      <TableCell>{renderStatusBadge(request.status)}</TableCell>
                      <TableCell>{format(new Date(request.requested_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {request.reviewer_name && (
                            <div>{request.reviewer_name}</div>
                          )}
                          {request.reviewed_at && (
                            <div className="text-gray-500 text-xs">
                              {format(new Date(request.reviewed_at), 'MMM dd, yyyy')}
                            </div>
                          )}
                          {request.review_notes && (
                            <div className="text-gray-500 text-xs mt-1">
                              Notes: {request.review_notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === 'approved' ? 'Approve' : 'Reject'} Leave Request
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Staff:</strong> {selectedRequest.staff_name}
                </div>
                <div>
                  <strong>Leave Type:</strong> {selectedRequest.leave_type}
                </div>
                <div>
                  <strong>Duration:</strong> {selectedRequest.total_days} days
                </div>
                <div>
                  <strong>Dates:</strong> {format(new Date(selectedRequest.start_date), 'MMM dd')} - {format(new Date(selectedRequest.end_date), 'MMM dd')}
                </div>
              </div>
              
              {selectedRequest.reason && (
                <div>
                  <strong>Reason:</strong>
                  <p className="text-sm text-gray-600 mt-1">{selectedRequest.reason}</p>
                </div>
              )}
              
              <div>
                <Label htmlFor="review-notes">Review Notes (Optional)</Label>
                <Textarea
                  id="review-notes"
                  placeholder={`Add notes about this ${pendingAction === 'approved' ? 'approval' : 'rejection'}...`}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={updateLeaveRequest.isPending}
              className={pendingAction === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={pendingAction === 'rejected' ? 'destructive' : 'default'}
            >
              {updateLeaveRequest.isPending ? 'Processing...' : 
               pendingAction === 'approved' ? 'Approve Request' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}