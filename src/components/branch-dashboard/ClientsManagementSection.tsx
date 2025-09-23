
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Edit, MoreHorizontal, Key, ArrowUpDown, ArrowUp, ArrowDown, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useBranchClients } from "@/data/hooks/useBranchClients";
import { SetClientPasswordDialog } from "@/components/clients/SetClientPasswordDialog";
import { AdminClientDetailsDialog } from "@/components/clients/dialogs/AdminClientDetailsDialog";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'pin_code' | 'region' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [clientDetailsDialogOpen, setClientDetailsDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  
  const itemsPerPage = 10;

  const { data: clientsData, isLoading, error } = useBranchClients({
    branchId,
    searchTerm,
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


  const handleClientDetails = (client: any) => {
    // Close dropdown first to prevent focus trap conflicts
    setDropdownOpen(null);
    // Small delay to allow dropdown to close completely
    setTimeout(() => {
      setSelectedClient(client);
      setClientDetailsDialogOpen(true);
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

  const handleSort = (column: 'name' | 'email' | 'pin_code' | 'region' | 'created_at') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Branch ID is required</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Clients Management</h2>
          <p className="text-gray-600">Manage your clients and their information</p>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search clients by name, email, or post code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="north">North</SelectItem>
                  <SelectItem value="south">South</SelectItem>
                  <SelectItem value="east">East</SelectItem>
                  <SelectItem value="west">West</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="text-sm text-gray-600">Sort by:</div>
              <Select value={sortBy} onValueChange={(value: any) => { setSortBy(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
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
              <p className="text-gray-500 mb-4">No clients found</p>
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
                      <tr key={client.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {client.avatar_initials || `${client.first_name?.[0]}${client.last_name?.[0]}`}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{client.first_name} {client.last_name}</p>
                              {client.preferred_name && (
                                <p className="text-sm text-gray-500">"{client.preferred_name}"</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{client.email || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm">{client.phone || client.mobile_number || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">
                            {client.pin_code || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                            {client.status || 'pending'}
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
                              <DropdownMenuItem onClick={() => onViewClient(client)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEditClient(client)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Client
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleClientDetails(client)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Add Client Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSetPassword(client)}>
                                <Key className="h-4 w-4 mr-2" />
                                Set Password
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
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {client.avatar_initials || `${client.first_name?.[0]}${client.last_name?.[0]}`}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{client.first_name} {client.last_name}</p>
                            <p className="text-sm text-gray-600">{client.email || 'No email'}</p>
                            <p className="text-sm text-gray-600">{client.phone || client.mobile_number || 'No phone'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                            {client.status || 'pending'}
                          </Badge>
                          <DropdownMenu open={dropdownOpen === `mobile-${client.id}`} onOpenChange={(open) => setDropdownOpen(open ? `mobile-${client.id}` : null)}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background border border-border shadow-md z-50">
                              <DropdownMenuItem onClick={() => onViewClient(client)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEditClient(client)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Client
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleClientDetails(client)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Add Client Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSetPassword(client)}>
                                <Key className="h-4 w-4 mr-2" />
                                Set Password
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

      {/* Add Client Details Dialog */}
      <AdminClientDetailsDialog
        open={clientDetailsDialogOpen}
        onOpenChange={setClientDetailsDialogOpen}
        client={selectedClient}
      />
    </div>
  );
}
