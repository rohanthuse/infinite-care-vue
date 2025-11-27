
import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Trash2, Eye, Clock, AlertTriangle, Search, Copy } from "lucide-react";
import { useThirdPartyAccess, ThirdPartyAccessRequest } from "@/hooks/useThirdPartyAccess";
import { toast } from "@/hooks/use-toast";

interface ThirdPartyAccessRequestsListProps {
  branchId: string;
}

export const ThirdPartyAccessRequestsList: React.FC<ThirdPartyAccessRequestsListProps> = ({
  branchId,
}) => {
  const { requests, isLoading, approveRequest, rejectRequest, revokeAccess, deleteRequest, isDeleting } = useThirdPartyAccess(branchId);
  const [selectedRequest, setSelectedRequest] = useState<ThirdPartyAccessRequest | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<ThirdPartyAccessRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter requests based on search query
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    
    const query = searchQuery.toLowerCase().trim();
    return requests.filter((request) => {
      const fullName = `${request.first_name} ${request.surname}`.toLowerCase();
      const email = request.email.toLowerCase();
      const accessType = request.request_for.toLowerCase();
      const status = request.status.toLowerCase();
      
      return (
        fullName.includes(query) ||
        email.includes(query) ||
        accessType.includes(query) ||
        status.includes(query)
      );
    });
  }, [requests, searchQuery]);

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
      revoked: "bg-orange-100 text-orange-800",
    };

    const icons = {
      pending: <Clock className="h-3 w-3" />,
      approved: <Check className="h-3 w-3" />,
      rejected: <X className="h-3 w-3" />,
      expired: <AlertTriangle className="h-3 w-3" />,
      revoked: <Trash2 className="h-3 w-3" />,
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {icons[status as keyof typeof icons]}
        <span className="ml-1">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </Badge>
    );
  };

  const handleApprove = (request: ThirdPartyAccessRequest) => {
    approveRequest(request.id);
  };

  const handleReject = (request: ThirdPartyAccessRequest) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (selectedRequest && rejectionReason.trim()) {
      rejectRequest({
        requestId: selectedRequest.id,
        reason: rejectionReason,
      });
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason("");
    } else {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
    }
  };

  const handleRevoke = (request: ThirdPartyAccessRequest) => {
    if (confirm("Are you sure you want to revoke this access? This action cannot be undone.")) {
      revokeAccess(request.id);
    }
  };

  const handleDelete = (request: ThirdPartyAccessRequest) => {
    setRequestToDelete(request);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (requestToDelete) {
      deleteRequest(requestToDelete.id);
      setShowDeleteDialog(false);
      setRequestToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading access requests...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-2">No access requests found</div>
        <div className="text-sm text-muted-foreground/70">Create your first access request to get started</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, type, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredRequests.length} of {requests.length} requests
        </div>
      )}

      {/* Request Cards */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">No matching requests found</div>
          <div className="text-sm text-muted-foreground/70 mt-1">Try adjusting your search terms</div>
        </div>
      ) : (
        filteredRequests.map((request) => (
          <Card key={request.id} className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-lg">
                      {request.first_name} {request.surname}
                    </h3>
                    {getStatusBadge(request.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Email:</span> {request.email}
                    </div>
                    <div>
                      <span className="font-medium">Access For:</span>{" "}
                      <Badge variant="outline">{request.request_for}</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Organisation:</span> {request.organisation || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Access From:</span>{" "}
                      {format(new Date(request.access_from), "PPP")}
                    </div>
                    <div>
                      <span className="font-medium">Access Until:</span>{" "}
                      {request.access_until 
                        ? format(new Date(request.access_until), "PPP")
                        : "Indefinite"}
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="font-medium text-sm">Reason:</span>
                    <p className="text-sm text-muted-foreground mt-1">{request.reason_for_access}</p>
                  </div>

                  {request.rejection_reason && (
                    <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded">
                      <span className="font-medium text-sm text-destructive">Rejection Reason:</span>
                      <p className="text-sm text-destructive/80 mt-1">{request.rejection_reason}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {request.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(request)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}

                  {request.status === 'approved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevoke(request)}
                      className="border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Revoke
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>

                  {/* Delete Button - always visible */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(request)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Access Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Reason for Rejection</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a reason for rejecting this request..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Access Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this access request?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">This action cannot be undone.</p>
                  <p className="text-muted-foreground mt-1">
                    This will permanently remove the access request for{" "}
                    <span className="font-medium">
                      {requestToDelete?.first_name} {requestToDelete?.surname}
                    </span>{" "}
                    and any associated login credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog 
        open={!!selectedRequest && !showRejectDialog} 
        onOpenChange={() => setSelectedRequest(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Access Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <p className="text-sm">{selectedRequest.first_name} {selectedRequest.surname}</p>
                </div>
                <div>
                  <Label>Organisation</Label>
                  <p className="text-sm">{selectedRequest.organisation || "N/A"}</p>
                </div>
              </div>

              {/* Email and Password Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p className="text-sm font-mono bg-muted px-2 py-1.5 rounded mt-1">
                    {selectedRequest.email}
                  </p>
                </div>
                <div>
                  <Label>Password</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-mono bg-muted px-2 py-1.5 rounded flex-1">
                      {selectedRequest.password || "Not set"}
                    </p>
                    {selectedRequest.password && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedRequest.password!);
                          toast({
                            title: "Copied",
                            description: "Password copied to clipboard.",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Access Type</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedRequest.request_for}</Badge>
                  </div>
                </div>
                <div>
                  <Label>Client Consent Required</Label>
                  <p className="text-sm mt-1">{selectedRequest.client_consent_required ? "Yes" : "No"}</p>
                </div>
                <div>
                  <Label>Access From</Label>
                  <p className="text-sm mt-1">{format(new Date(selectedRequest.access_from), "PPP")}</p>
                </div>
                <div>
                  <Label>Access Until</Label>
                  <p className="text-sm mt-1">
                    {selectedRequest.access_until 
                      ? format(new Date(selectedRequest.access_until), "PPP")
                      : "Indefinite"}
                  </p>
                </div>
              </div>
              
              <div>
                <Label>Reason for Access</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded border">
                  {selectedRequest.reason_for_access}
                </p>
              </div>

              <div>
                <Label>Status</Label>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <Label>Created At</Label>
                  <p>{format(new Date(selectedRequest.created_at), "PPP pp")}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p>{format(new Date(selectedRequest.updated_at), "PPP pp")}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
