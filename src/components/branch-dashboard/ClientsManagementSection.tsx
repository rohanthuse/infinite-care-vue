
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Filter, Eye, Edit, MoreHorizontal } from "lucide-react";
import { useBranchClients } from "@/data/hooks/useBranchClients";
import { AddClientDialog } from "@/components/AddClientDialog";
import { SetClientPasswordDialog } from "@/components/clients/SetClientPasswordDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientsManagementSectionProps {
  branchId: string;
}

export const ClientsManagementSection: React.FC<ClientsManagementSectionProps> = ({ branchId }) => {
  const { data: clients, isLoading } = useBranchClients(branchId);
  const [searchTerm, setSearchTerm] = useState("");
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);

  const filteredClients = clients?.filter(client =>
    client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'new enquiries': return 'bg-blue-100 text-blue-800';
      case 'actively assessing': return 'bg-yellow-100 text-yellow-800';
      case 'closed enquiries': return 'bg-red-100 text-red-800';
      case 'former': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clients Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Clients Management</CardTitle>
          <Button onClick={() => setAddClientDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Clients List */}
          <div className="space-y-3">
            {filteredClients.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No clients found</p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {client.avatar_initials || `${client.first_name?.[0] || ''}${client.last_name?.[0] || ''}`}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">
                        {client.first_name} {client.last_name}
                      </h4>
                      <p className="text-sm text-gray-600">{client.email}</p>
                      <p className="text-sm text-gray-500">{client.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(client.status || 'active')}>
                      {client.status || 'Active'}
                    </Badge>
                    
                    <div className="flex items-center gap-2">
                      {client.email && (
                        <SetClientPasswordDialog
                          clientId={client.id}
                          clientName={`${client.first_name} ${client.last_name}`}
                          clientEmail={client.email}
                        />
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>

      <AddClientDialog
        open={addClientDialogOpen}
        onOpenChange={setAddClientDialogOpen}
        branchId={branchId}
        onSuccess={() => {
          setAddClientDialogOpen(false);
          // Optionally trigger refetch here
        }}
      />
    </Card>
  );
};
