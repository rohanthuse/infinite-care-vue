import React, { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Phone, Building, MessageSquare, CheckCircle, Clock, AlertCircle, Search, Trash2 } from "lucide-react";
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const { data: demoRequests, isLoading, error } = useQuery({
    queryKey: ['demo-requests'],
    queryFn: async () => {
      try {
        console.log('[DemoRequestsTable] Fetching demo requests...');
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[DemoRequestsTable] Current session:', session ? 'authenticated' : 'not authenticated');
        
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
    refetchInterval: 5000,
    staleTime: 1000,
  });

  // Filter requests based on search query
  const filteredRequests = useMemo(() => {
    if (!demoRequests || !searchQuery.trim()) return demoRequests;
    
    const query = searchQuery.toLowerCase();
    return demoRequests.filter(request => 
      request.full_name?.toLowerCase().includes(query) ||
      request.email?.toLowerCase().includes(query) ||
      request.phone?.toLowerCase().includes(query) ||
      request.company_name?.toLowerCase().includes(query) ||
      request.status?.toLowerCase().includes(query) ||
      formatDate(request.created_at).toLowerCase().includes(query)
    );
  }, [demoRequests, searchQuery]);

  // Selection state helpers
  const isAllSelected = filteredRequests && filteredRequests.length > 0 && 
    filteredRequests.every(r => selectedIds.has(r.id));
  
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked && filteredRequests) {
      setSelectedIds(new Set(filteredRequests.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ['demo-request-stats'] });
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

  // Delete mutation with optimistic updates
  const deleteRequestsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase.rpc('delete_demo_requests', {
        p_request_ids: ids
      });
      if (error) throw error;
      return data as { success: boolean; deleted_count: number };
    },
    onMutate: async (ids) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['demo-requests'] });
      
      // Snapshot previous value
      const previousRequests = queryClient.getQueryData(['demo-requests']);
      
      // Optimistic update - remove deleted items immediately
      queryClient.setQueryData(['demo-requests'], (old: DemoRequest[] = []) =>
        old.filter(r => !ids.includes(r.id))
      );
      
      return { previousRequests };
    },
    onError: (err, ids, context) => {
      // Rollback on error
      queryClient.setQueryData(['demo-requests'], context?.previousRequests);
      toast({
        title: "Error deleting requests",
        description: "Failed to delete selected demo requests. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      setSelectedIds(new Set());
      toast({
        title: "Requests deleted",
        description: `Successfully deleted ${data?.deleted_count || 'selected'} demo request(s).`,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-requests'] });
      queryClient.invalidateQueries({ queryKey: ['demo-request-stats'] });
    },
  });

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    deleteRequestsMutation.mutate(Array.from(selectedIds));
  };

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
        {/* Search and Actions Bar */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {selectedIds.size > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteSelected}
              disabled={deleteRequestsMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteRequestsMutation.isPending ? "Deleting..." : `Delete Selected (${selectedIds.size})`}
            </Button>
          )}
        </div>

        {!filteredRequests || filteredRequests.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "No demo requests match your search" : "No demo requests found"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className={isIndeterminate ? "opacity-50" : ""}
                    />
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="w-12">
                      <Checkbox
                        checked={selectedIds.has(request.id)}
                        onCheckedChange={(checked) => handleSelectOne(request.id, !!checked)}
                        aria-label={`Select ${request.full_name}`}
                      />
                    </TableCell>
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
                                  <Label className="text-sm font-medium">Organisation</Label>
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
