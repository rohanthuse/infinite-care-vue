import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Search, Filter, Eye, Clock, AlertTriangle, Pencil, Ban } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useLeaveRequests, useUpdateLeaveRequest, type LeaveRequest } from "@/hooks/useLeaveManagement";
import { useLeaveBookingConflicts, type AffectedBooking } from "@/hooks/useLeaveBookingConflicts";
import { AffectedBookingsSection } from "@/components/leave/AffectedBookingsSection";
import { ReassignBookingDialog } from "@/components/leave/ReassignBookingDialog";
import { CancelBookingDialog } from "@/components/leave/CancelBookingDialog";
import { EditLeaveDialog } from "@/components/leave/EditLeaveDialog";
import { CancelLeaveDialog } from "@/components/leave/CancelLeaveDialog";

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
  
  // Conflict resolution state
  const [resolvedBookingIds, setResolvedBookingIds] = useState<Set<string>>(new Set());
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AffectedBooking | null>(null);
  
  // Edit/Cancel leave state
  const [editLeaveDialogOpen, setEditLeaveDialogOpen] = useState(false);
  const [cancelLeaveDialogOpen, setCancelLeaveDialogOpen] = useState(false);
  const [selectedLeaveForAction, setSelectedLeaveForAction] = useState<LeaveRequest | null>(null);

  const { data: leaveRequests = [], isLoading } = useLeaveRequests(branchId);
  const updateLeaveRequest = useUpdateLeaveRequest();
  
  // Fetch booking conflicts for the selected leave request (only when approving)
  const { 
    affectedBookings, 
    totalConflicts, 
    isLoading: conflictsLoading 
  } = useLeaveBookingConflicts(
    selectedRequest?.staff_id,
    selectedRequest?.start_date,
    selectedRequest?.end_date,
    isReviewDialogOpen && pendingAction === 'approved'
  );

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
    setResolvedBookingIds(new Set()); // Reset resolved bookings
    setIsReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedRequest || !pendingAction) return;
    
    // For approval, check if there are unresolved conflicts
    if (pendingAction === 'approved') {
      const unresolvedCount = affectedBookings.filter(b => !resolvedBookingIds.has(b.id)).length;
      if (unresolvedCount > 0) {
        toast.error(`Please resolve ${unresolvedCount} booking conflict${unresolvedCount !== 1 ? 's' : ''} before approving`);
        return;
      }
    }
    
    // Build review notes with conflict resolution info
    let finalNotes = reviewNotes.trim();
    if (pendingAction === 'approved' && resolvedBookingIds.size > 0) {
      const resolutionNote = `[${resolvedBookingIds.size} booking(s) were reassigned/cancelled due to this leave]`;
      finalNotes = finalNotes ? `${finalNotes}\n\n${resolutionNote}` : resolutionNote;
    }

    updateLeaveRequest.mutate({
      id: selectedRequest.id,
      status: pendingAction,
      review_notes: finalNotes || undefined
    }, {
      onSuccess: () => {
        setIsReviewDialogOpen(false);
        setSelectedRequest(null);
        setPendingAction(null);
        setReviewNotes("");
        setResolvedBookingIds(new Set());
      }
    });
  };

  const handleReassignBooking = (booking: AffectedBooking) => {
    setSelectedBooking(booking);
    setReassignDialogOpen(true);
  };

  const handleCancelBooking = (booking: AffectedBooking) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleBookingResolved = (bookingId: string) => {
    setResolvedBookingIds(prev => new Set([...prev, bookingId]));
  };
  
  const handleEditLeave = (request: LeaveRequest) => {
    setSelectedLeaveForAction(request);
    setEditLeaveDialogOpen(true);
  };

  const handleCancelLeave = (request: LeaveRequest) => {
    setSelectedLeaveForAction(request);
    setCancelLeaveDialogOpen(true);
  };
  
  // Calculate if approval should be blocked
  const unresolvedConflictsCount = affectedBookings.filter(b => !resolvedBookingIds.has(b.id)).length;
  const canApprove = pendingAction !== 'approved' || unresolvedConflictsCount === 0;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="custom" className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="custom" className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      case "pending":
        return <Badge variant="custom" className="bg-orange-100 text-orange-800 border-orange-200">Pending</Badge>;
      case "cancelled":
        return <Badge variant="custom" className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
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
      <Badge variant="custom" className={colors[type] || "bg-gray-100 text-gray-800 border-gray-200"}>
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
                    <TableHead>Actions</TableHead>
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
                      <TableCell>
                        {request.status === 'approved' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditLeave(request)}
                              className="h-8 px-2"
                              title="Edit Leave"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelLeave(request)}
                              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Cancel Leave"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Review Dialog with Conflict Detection */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className={pendingAction === 'approved' ? "sm:max-w-[700px]" : ""}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingAction === 'approved' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Approve Leave Request
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Reject Leave Request
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === 'approved' 
                ? 'Review booking conflicts and approve the leave request'
                : 'Provide a reason for rejecting this leave request'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <ScrollArea className={pendingAction === 'approved' && totalConflicts > 0 ? "max-h-[60vh]" : ""}>
              <div className="space-y-4 pr-4">
                {/* Leave Request Details */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm text-muted-foreground mb-3">Leave Request Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Staff:</span>
                      <span className="ml-2 font-medium">{selectedRequest.staff_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Leave Type:</span>
                      <span className="ml-2 font-medium capitalize">{selectedRequest.leave_type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-2 font-medium">{selectedRequest.total_days} days</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dates:</span>
                      <span className="ml-2 font-medium">
                        {format(new Date(selectedRequest.start_date), 'MMM dd')} - {format(new Date(selectedRequest.end_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  
                  {selectedRequest.reason && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-muted-foreground text-sm">Reason:</span>
                      <p className="text-sm mt-1">{selectedRequest.reason}</p>
                    </div>
                  )}
                </div>
                
                {/* Affected Bookings Section - Only show for approval */}
                {pendingAction === 'approved' && (
                  <AffectedBookingsSection
                    affectedBookings={affectedBookings}
                    resolvedBookingIds={resolvedBookingIds}
                    isLoading={conflictsLoading}
                    onReassign={handleReassignBooking}
                    onCancel={handleCancelBooking}
                  />
                )}
                
                {/* Review Notes */}
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
            </ScrollArea>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {/* Approval Guardrail Warning */}
            {pendingAction === 'approved' && !canApprove && (
              <div className="flex items-center gap-2 text-sm text-red-600 mr-auto">
                <AlertTriangle className="h-4 w-4" />
                <span>Resolve all conflicts to approve</span>
              </div>
            )}
            
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={updateLeaveRequest.isPending || (pendingAction === 'approved' && !canApprove)}
              className={pendingAction === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={pendingAction === 'rejected' ? 'destructive' : 'default'}
            >
              {updateLeaveRequest.isPending ? 'Processing...' : 
               pendingAction === 'approved' ? 'Approve Request' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Booking Dialog */}
      <ReassignBookingDialog
        open={reassignDialogOpen}
        onOpenChange={setReassignDialogOpen}
        booking={selectedBooking}
        branchId={branchId}
        excludeStaffId={selectedRequest?.staff_id || ''}
        onSuccess={handleBookingResolved}
      />

      {/* Cancel Booking Dialog */}
      <CancelBookingDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        booking={selectedBooking}
        carerName={selectedRequest?.staff_name || ''}
        onSuccess={handleBookingResolved}
      />

      {/* Edit Leave Dialog */}
      <EditLeaveDialog
        open={editLeaveDialogOpen}
        onOpenChange={setEditLeaveDialogOpen}
        leaveRequest={selectedLeaveForAction}
        branchId={branchId}
      />

      {/* Cancel Leave Dialog */}
      <CancelLeaveDialog
        open={cancelLeaveDialogOpen}
        onOpenChange={setCancelLeaveDialogOpen}
        leaveRequest={selectedLeaveForAction}
      />
    </div>
  );
}