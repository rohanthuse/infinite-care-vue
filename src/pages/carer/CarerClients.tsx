
import React from "react";
import { Search, Filter, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCarerClients } from "@/hooks/useCarerClientData";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";
import { format, parseISO } from "date-fns";

const CarerClients: React.FC = () => {
  const { data: clients, isLoading, error } = useCarerClients();
  const { navigateToCarerPage } = useCarerNavigation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Error loading clients: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Clients</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Showing {clients?.length || 0} clients you have bookings with
        </p>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input placeholder="Search clients..." className="pl-9" />
        </div>
        
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients && clients.length > 0 ? (
          clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {client.preferred_name || `${client.first_name} ${client.last_name}`}
                    </CardTitle>
                    <p className="text-xs text-gray-500">Client ID: {client.id.slice(0, 8)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Contact</h4>
                    <p className="text-sm">{client.email || 'No email provided'}</p>
                    <p className="text-sm">{client.phone || 'No phone provided'}</p>
                  </div>
                  
                  {client.address && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Address</h4>
                      <p className="text-sm">{client.address}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Details</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {client.gender && (
                        <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                          {client.gender}
                        </div>
                      )}
                      {client.date_of_birth && (
                        <div className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                          DOB: {format(parseISO(client.date_of_birth), 'MMM d, yyyy')}
                        </div>
                      )}
                      <div className="px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs">
                        {client.status || 'Active'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigateToCarerPage("/careplans")}
                  >
                    View Care Plan
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigateToCarerPage(`/clients/${client.id}`)}
                  >
                    Client Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center p-8">
            <p className="text-gray-500">No clients assigned to you yet.</p>
            <p className="text-sm text-gray-400 mt-1">Contact your administrator to get client assignments.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarerClients;
