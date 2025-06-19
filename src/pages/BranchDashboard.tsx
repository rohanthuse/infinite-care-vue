import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  SearchIcon, Filter, UserCheck, Download, RefreshCw, 
  Edit, EyeIcon, HelpCircle, CheckCircle, 
  ChevronLeft, ChevronRight, Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClientFilters } from "@/components/clients/ClientFilters";
import { AddClientDialog } from "@/components/clients/AddClientDialog";
import { useToast } from "@/hooks/use-toast";
import { useBranchClients, useDeleteClient, ClientDB } from "@/data/hooks/useBranchClients";

const BranchDashboard = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch clients data from Supabase
  const { data: clients = [], isLoading, error, refetch } = useBranchClients(id);
  const deleteClientMutation = useDeleteClient();

  useEffect(() => {
    if (error) {
      console.error('Error loading clients:', error);
      toast({
        title: "Error loading clients",
        description: "Failed to load clients data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const filteredClients = clients.filter((client: ClientDB) => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchValue.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchValue.toLowerCase())) ||
      client.id.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    const matchesRegion = regionFilter === "all" || client.region === regionFilter;
    
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (window.confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      try {
        await deleteClientMutation.mutateAsync(clientId);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const getAvatarInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, regionFilter, searchValue]);

  const handleEditClient = (clientId: string) => {
    navigate(`/branch-dashboard/${id}/${branchName}/clients/${clientId}/edit`);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading clients...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderClientsTab = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Clients</h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage clients, view their details, and track assignments
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <AddClientDialog branchId={id} />
          </div>
        </div>
        
        <ClientFilters 
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          regionFilter={regionFilter}
          setRegionFilter={setRegionFilter}
        />
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-gray-50/90">
              <TableHead className="text-gray-600 font-medium w-[100px]">Client ID</TableHead>
              <TableHead className="text-gray-600 font-medium">Client Name</TableHead>
              <TableHead className="text-gray-600 font-medium">Email Address</TableHead>
              <TableHead className="text-gray-600 font-medium">Region</TableHead>
              <TableHead className="text-gray-600 font-medium">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedClients.length > 0 ? (
              paginatedClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-gray-50 border-t border-gray-100">
                  <TableCell className="font-medium">{client.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                        {getAvatarInitials(client.first_name, client.last_name)}
                      </div>
                      <span>{client.last_name}, {client.first_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{client.email || 'Not provided'}</TableCell>
                  <TableCell>{client.region || 'Not specified'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${client.status === "Active" ? "bg-green-50 text-green-700 border-0" : ""}
                        ${client.status === "New Enquiries" ? "bg-blue-50 text-blue-700 border-0" : ""}
                        ${client.status === "Actively Assessing" ? "bg-purple-50 text-purple-700 border-0" : ""}
                        ${client.status === "Closed Enquiries" ? "bg-orange-50 text-orange-700 border-0" : ""}
                        ${client.status === "Former" ? "bg-red-50 text-red-700 border-0" : ""}
                        px-4 py-1 rounded-full
                      `}
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEditClient(client.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteClient(client.id, `${client.first_name} ${client.last_name}`)}
                        disabled={deleteClientMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                  {isLoading ? "Loading clients..." : "No clients found matching your search criteria."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {paginatedClients.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} clients
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="h-8"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full">
      <Tabs defaultValue="clients" className="h-full flex flex-col">
        <TabsList className="border-b">
          <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
          <TabsTrigger value="carers">Carers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="clients" className="h-full p-6 pt-0">
          {renderClientsTab()}
        </TabsContent>
        <TabsContent value="carers" className="h-full p-6 pt-0">
          Carers Tab Content
        </TabsContent>
        <TabsContent value="analytics" className="h-full p-6 pt-0">
          Analytics Tab Content
        </TabsContent>
        <TabsContent value="settings" className="h-full p-6 pt-0">
          Settings Tab Content
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BranchDashboard;
