
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Eye, Edit, MoreHorizontal, Key, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Archive, CheckCircle, XCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useBranchClients, useDeleteClient, useDeleteMultipleClients } from "@/data/hooks/useBranchClients";
import { SetClientPasswordDialog } from "@/components/clients/SetClientPasswordDialog";
import { useUpdateClientStatus } from "@/hooks/useUpdateClientStatus";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface ClientsManagementSectionProps {
  branchId?: string;
  onNewClient: () => void;
  onViewClient: (client: any) => void;
  onEditClient: (client: any) => void;
}

export function ClientsManagementSection({ 
  branchId, 
  onNewClient, 
  onViewClient, 
  onEditClient 
}: ClientsManagementSectionProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [postCodeSearch, setPostCodeSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [regionFilter, setRegionFilter] = useState("all");
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'pin_code' | 'region' | 'created_at' | 'client_id'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [selectedClients, setSelectedClients] = useState<any[]>([]);
  const [deletingClient, setDeletingClient] = useState<any>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [archivingClient, setArchivingClient] = useState<any>(null);
  const [activatingClient, setActivatingClient] = useState<any>(null);
  const [deactivatingClient, setDeactivatingClient] = useState<any>(null);
  
  const itemsPerPage = 10;
  
  const deleteMutation = useDeleteClient();
  const deleteMultipleMutation = useDeleteMultipleClients();
  const updateStatusMutation = useUpdateClientStatus();

  const { data: clientsData, isLoading, error } = useBranchClients({
    branchId,
    searchTerm,
    postCodeSearch,
    statusFilter,
    regionFilter,
    sortBy,
    sortOrder,
    page: currentPage,
    itemsPerPage,
  });

  const clients = clientsData?.clients || [];
  const totalCount = clientsData?.count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Handle auto-opening client from search - fetch directly from DB to handle pagination
  useEffect(() => {
    const selectedClientId = searchParams.get('selected');
    console.log('[ClientsManagementSection] useEffect triggered:', {
      selectedClientId,
      branchId,
      clientsCount: clients.length
    });
    
    if (selectedClientId && branchId) {
      // First check if client is already in the current page
      const clientInPage = clients.find(c => c.id === selectedClientId);
      if (clientInPage) {
        console.log('[ClientsManagementSection] Client found in current page, opening popup');
        onViewClient(clientInPage);
        searchParams.delete('selected');
        setSearchParams(searchParams, { replace: true });
        return;
      }
      
      // If not in current page, fetch directly from database
      console.log('[ClientsManagementSection] Client not in page, fetching from database');
      const fetchSelectedClient = async () => {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', selectedClientId)
          .eq('branch_id', branchId)
          .single();
        
        console.log('[ClientsManagementSection] Fetch result:', { data, error });
        
        if (data && !error) {
          console.log('[ClientsManagementSection] Opening client popup');
          onViewClient(data);
          searchParams.delete('selected');
          setSearchParams(searchParams, { replace: true });
        } else {
          console.error('[ClientsManagementSection] Failed to fetch client:', error);
        }
      };
      fetchSelectedClient();
    }
  }, [searchParams, branchId, clients, onViewClient, setSearchParams]);

  const handleViewClient = (client: any) => {
    // Close dropdown first to prevent focus trap conflicts
    setDropdownOpen(null);
    setTimeout(() => {
      onViewClient(client);
    }, 50);
  };

  const handleSetPassword = (client: any) => {
    // Close dropdown first to prevent focus trap conflicts
    setDropdownOpen(null);
    setTimeout(() => {
      setSelectedClient(client);
      setPasswordDialogOpen(true);
    }, 50);
  };

  const handleArchiveClient = (client: any) => {
    setDropdownOpen(null);
    setTimeout(() => setArchivingClient(client), 50);
  };

  const handleActivateClient = (client: any) => {
    setDropdownOpen(null);
    setTimeout(() => setActivatingClient(client), 50);
  };

  const handleDeactivateClient = (client: any) => {
    setDropdownOpen(null);
    setTimeout(() => setDeactivatingClient(client), 50);
  };

  const confirmArchive = async () => {
    if (!archivingClient) return;
    await updateStatusMutation.mutateAsync({
      clientId: archivingClient.id,
      newStatus: 'Archived'
    });
    setArchivingClient(null);
  };

  const confirmActivate = async () => {
    if (!activatingClient) return;
    await updateStatusMutation.mutateAsync({
      clientId: activatingClient.id,
      newStatus: 'Active'
    });
    setActivatingClient(null);
  };

  const confirmDeactivate = async () => {
    if (!deactivatingClient) return;
    await updateStatusMutation.mutateAsync({
      clientId: deactivatingClient.id,
      newStatus: 'Inactive'
    });
    setDeactivatingClient(null);
  };

  const handleSort = (column: 'name' | 'email' | 'pin_code' | 'region' | 'created_at' | 'client_id') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      : <ArrowDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    
    try {
      await deleteMutation.mutateAsync(deletingClient.id);
      setDeletingClient(null);
      setSelectedClients(prev => prev.filter(c => c.id !== deletingClient.id));
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleBulkDelete = async () => {
    if (selectedClients.length === 0) return;
    
    try {
      const clientIds = selectedClients.map(c => c.id);
      await deleteMultipleMutation.mutateAsync(clientIds);
      setSelectedClients([]);
      setShowBulkDeleteDialog(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClientSelection = (client: any, checked: boolean) => {
    setSelectedClients(prev => {
      if (checked) {
        return prev.some(c => c.id === client.id) ? prev : [...prev, client];
      } else {
        return prev.filter(c => c.id !== client.id);
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(clients);
    } else {
      setSelectedClients([]);
    }
  };

  const isClientSelected = (client: any) => {
    return selectedClients.some(c => c.id === client.id);
  };

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Branch ID is required</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Error loading clients: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Clients Management</h2>
          <p className="text-muted-foreground">Manage your clients and their information</p>
        </div>
        <Button onClick={onNewClient} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add New Client
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or Client ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative sm:w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by Post Code"
                  value={postCodeSearch}
                  onChange={(e) => setPostCodeSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="New Enquiries">New Enquiries</SelectItem>
                  <SelectItem value="Actively Assessing">Actively Assessing</SelectItem>
                  <SelectItem value="Closed Enquiries">Closed Enquiries</SelectItem>
                  <SelectItem value="Former">Former</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="North">North</SelectItem>
                  <SelectItem value="South">South</SelectItem>
                  <SelectItem value="East">East</SelectItem>
                  <SelectItem value="West">West</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="text-sm text-muted-foreground">Sort by:</div>
              <Select value={sortBy} onValueChange={(value: any) => { setSortBy(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_id">Client ID</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="pin_code">Post code (Area)</SelectItem>
                  <SelectItem value="region">Region</SelectItem>
                  <SelectItem value="created_at">Registration Date</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(value: any) => { setSortOrder(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedClients.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedClients.length === clients.length && clients.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedClients([])}
                >
                  Clear Selection
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Clients ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No clients found</p>
              <Button onClick={onNewClient}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Client
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 w-12">
                        <Checkbox
                          checked={selectedClients.length === clients.length && clients.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all clients"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        <button 
                          onClick={() => handleSort('client_id')}
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                        >
                          Client ID {getSortIcon('client_id')}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        <button 
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                        >
                          Name {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        <button 
                          onClick={() => handleSort('email')}
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                        >
                          Email {getSortIcon('email')}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium">Phone</th>
                      <th className="text-left py-3 px-4 font-medium">
                        <button 
                          onClick={() => handleSort('pin_code')}
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                        >
                          Post code {getSortIcon('pin_code')}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">
                        <button 
                          onClick={() => handleSort('region')}
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                        >
                          Region {getSortIcon('region')}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        <button 
                          onClick={() => handleSort('created_at')}
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                        >
                          Registered {getSortIcon('created_at')}
                        </button>
                      </th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id} className="border-b hover:bg-muted">
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={isClientSelected(client)}
                            onCheckedChange={(checked) => handleClientSelection(client, checked as boolean)}
                            aria-label={`Select ${client.first_name} ${client.last_name}`}
                          />
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded text-xs font-medium">
                            {client.client_id || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {client.avatar_initials || `${client.first_name?.[0]}${client.last_name?.[0]}`}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{client.first_name} {client.last_name}</p>
                              {client.preferred_name && (
                                <p className="text-sm text-muted-foreground">"{client.preferred_name}"</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{client.email || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm">{client.phone || client.mobile_number || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded text-xs">
                            {client.pin_code || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={client.status === 'Active' ? 'default' : 'secondary'}>
                            {client.status || 'N/A'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm">{client.region || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm">
                          {client.registered_on ? new Date(client.registered_on).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu open={dropdownOpen === client.id} onOpenChange={(open) => setDropdownOpen(open ? client.id : null)}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background border border-border shadow-md z-50">
                              <DropdownMenuItem onClick={() => handleViewClient(client)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEditClient(client)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Client
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {client.status !== 'Active' && (
                                <DropdownMenuItem 
                                  onClick={() => handleActivateClient(client)}
                                  className="text-green-600 focus:text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              {client.status === 'Active' && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeactivateClient(client)}
                                  className="text-orange-600 focus:text-orange-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  De-Activate
                                </DropdownMenuItem>
                              )}
                              {client.status !== 'Archived' && (
                                <DropdownMenuItem 
                                  onClick={() => handleArchiveClient(client)}
                                  className="text-gray-600 focus:text-gray-600"
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleSetPassword(client)}>
                                <Key className="h-4 w-4 mr-2" />
                                Set Password
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setDropdownOpen(null);
                                  setTimeout(() => setDeletingClient(client), 50);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Client
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {clients.map((client) => (
                  <Card key={client.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={isClientSelected(client)}
                            onCheckedChange={(checked) => handleClientSelection(client, checked as boolean)}
                            aria-label={`Select ${client.first_name} ${client.last_name}`}
                          />
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {client.avatar_initials || `${client.first_name?.[0]}${client.last_name?.[0]}`}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{client.first_name} {client.last_name}</p>
                            {client.client_id && (
                              <p className="text-xs text-gray-500 font-mono">
                                ID: <span className="text-indigo-600 font-medium">{client.client_id}</span>
                              </p>
                            )}
                            <p className="text-sm text-gray-600">{client.email || 'No email'}</p>
                            <p className="text-sm text-gray-600">{client.phone || client.mobile_number || 'No phone'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={client.status === 'Active' ? 'default' : 'secondary'}>
                            {client.status || 'N/A'}
                          </Badge>
                          <DropdownMenu open={dropdownOpen === `mobile-${client.id}`} onOpenChange={(open) => setDropdownOpen(open ? `mobile-${client.id}` : null)}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background border border-border shadow-md z-50">
                              <DropdownMenuItem onClick={() => handleViewClient(client)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEditClient(client)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Client
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {client.status !== 'Active' && (
                                <DropdownMenuItem 
                                  onClick={() => handleActivateClient(client)}
                                  className="text-green-600 focus:text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              {client.status === 'Active' && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeactivateClient(client)}
                                  className="text-orange-600 focus:text-orange-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  De-Activate
                                </DropdownMenuItem>
                              )}
                              {client.status !== 'Archived' && (
                                <DropdownMenuItem 
                                  onClick={() => handleArchiveClient(client)}
                                  className="text-gray-600 focus:text-gray-600"
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleSetPassword(client)}>
                                <Key className="h-4 w-4 mr-2" />
                                Set Password
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setDropdownOpen(null);
                                  setTimeout(() => setDeletingClient(client), 50);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Client
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
                        <span>Post code: 
                          <span className="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs ml-1">
                            {client.pin_code || 'N/A'}
                          </span>
                        </span>
                        <span>•</span>
                        <span>Region: {client.region || 'N/A'}</span>
                        <span>•</span>
                        <span>Registered: {client.registered_on ? new Date(client.registered_on).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Set Client Password Dialog */}
      <SetClientPasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        client={selectedClient}
      />

      {/* Delete Single Client Dialog */}
      <AlertDialog open={!!deletingClient} onOpenChange={(open) => !open && setDeletingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingClient?.first_name} {deletingClient?.last_name}? 
              This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Multiple Clients Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Clients</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''}? 
              This action cannot be undone and will remove all associated data for these clients.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMultipleMutation.isPending}
            >
              {deleteMultipleMutation.isPending ? 'Deleting...' : `Delete ${selectedClients.length} Client${selectedClients.length !== 1 ? 's' : ''}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Client Dialog */}
      <AlertDialog open={!!archivingClient} onOpenChange={(open) => !open && setArchivingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive {archivingClient?.first_name} {archivingClient?.last_name}? 
              Archived clients will be hidden from active lists but can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? 'Archiving...' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Client Dialog */}
      <AlertDialog open={!!activatingClient} onOpenChange={(open) => !open && setActivatingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate {activatingClient?.first_name} {activatingClient?.last_name}? 
              This will change their status to Active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmActivate} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? 'Activating...' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* De-Activate Client Dialog */}
      <AlertDialog open={!!deactivatingClient} onOpenChange={(open) => !open && setDeactivatingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>De-Activate Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to de-activate {deactivatingClient?.first_name} {deactivatingClient?.last_name}? 
              This will change their status to Inactive. They can be re-activated later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? 'De-activating...' : 'De-Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
