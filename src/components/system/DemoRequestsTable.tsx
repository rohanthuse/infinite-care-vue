import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Building, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DemoRequest {
  id: string;
  full_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  notes: string | null;
}

export const DemoRequestsTable: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState<'pending' | 'contacted' | 'completed' | 'cancelled'>('contacted');

  const { data: demoRequests, isLoading, error } = useQuery({
    queryKey: ['demo-requests'],
    queryFn: async () => {
      try {
        console.log('[DemoRequestsTable] Fetching demo requests...');
        
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[DemoRequestsTable] Current session:', session ? 'authenticated' : 'not authenticated');
        
        // Use the security definer function that bypasses RLS
        const { data, error } = await supabase.rpc('get_demo_requests');

        if (error) {
          console.error('Error fetching demo requests:', error);
          throw error;
        }

        console.log('[DemoRequestsTable] Demo requests data:', data);
        return data as DemoRequest[];
      } catch (error) {
        console.error('Unexpected error fetching demo requests:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
    staleTime: 1000, // Consider data stale after 1 second to force fresh data
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      // Use the security definer function that bypasses RLS
      const { data, error } = await supabase.rpc('update_demo_request_status', {
        request_id: id,
        new_status: status,
        new_notes: notes || null
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-requests'] });
      toast({
        title: "Request updated successfully",
        description: "The demo request status has been updated.",
      });
      setSelectedRequest(null);
      setNotes("");
    },
    onError: (error) => {
      console.error('Error updating demo request:', error);
      toast({
        title: "Error updating request",
        description: "Failed to update the demo request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateRequest = () => {
    if (!selectedRequest) return;
    
    updateRequestMutation.mutate({
      id: selectedRequest.id,
      status: newStatus,
      notes: notes.trim() || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'contacted':
        return <Badge variant="default"><Mail className="h-3 w-3 mr-1" />Contacted</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demo Requests</CardTitle>
          <CardDescription>Loading demo requests...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demo Requests</CardTitle>
          <CardDescription>Error loading demo requests</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load demo requests. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Demo Requests
        </CardTitle>
        <CardDescription>
          Manage and track demo requests from potential customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!demoRequests || demoRequests.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No demo requests found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.full_name}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {request.email}
                        </div>
                        {request.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {request.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.company_name ? (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {request.company_name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(request.created_at)}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setNotes(request.notes || "");
                              setNewStatus(request.status === 'pending' ? 'contacted' : request.status as any);
                            }}
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Demo Request Details</DialogTitle>
                            <DialogDescription>
                              Review and update the demo request status
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedRequest && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Full Name</Label>
                                  <p className="text-sm text-muted-foreground">{selectedRequest.full_name}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Organization</Label>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedRequest.company_name || "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Email</Label>
                                  <p className="text-sm text-muted-foreground">{selectedRequest.email}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Phone</Label>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedRequest.phone || "Not provided"}
                                  </p>
                                </div>
                              </div>

                              {selectedRequest.message && (
                                <div>
                                  <Label className="text-sm font-medium">Message</Label>
                                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                    {selectedRequest.message}
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Current Status</Label>
                                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Submitted</Label>
                                  <p className="text-sm text-muted-foreground">{formatDate(selectedRequest.created_at)}</p>
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="status" className="text-sm font-medium">Update Status</Label>
                                <select
                                  id="status"
                                  value={newStatus}
                                  onChange={(e) => setNewStatus(e.target.value as any)}
                                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="contacted">Contacted</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>

                              <div>
                                <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                                <Textarea
                                  id="notes"
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  placeholder="Add notes about this demo request..."
                                  rows={3}
                                  className="mt-1"
                                />
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setSelectedRequest(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleUpdateRequest}
                                  disabled={updateRequestMutation.isPending}
                                >
                                  {updateRequestMutation.isPending ? "Updating..." : "Update Request"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};