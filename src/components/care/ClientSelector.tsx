
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  gp_details?: any;
  mobility_status?: string;
  communication_preferences?: any;
  age_group?: 'adult' | 'child' | 'young_person';
}

interface ClientSelectorProps {
  branchId: string;
  selectedClientId: string | null;
  onClientSelect: (clientId: string, clientName: string, clientData: Client) => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  branchId,
  selectedClientId,
  onClientSelect
}) => {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['branch-clients', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, address, date_of_birth, emergency_contact, emergency_phone, gp_details, mobility_status, communication_preferences, age_group, status')
        .eq('branch_id', branchId)
        .eq('status', 'Active')
        .order('last_name');
      
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!branchId
  });

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <User className="h-4 w-4" />
        <span>Loading clients...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <User className="h-4 w-4 text-gray-600" />
      <Select
        value={selectedClientId || ""}
        onValueChange={(value) => {
          const client = clients.find(c => c.id === value);
          if (client) {
            onClientSelect(value, `${client.first_name} ${client.last_name}`, client);
          }
        }}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select a client to create care plan for..." />
        </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.last_name}, {client.first_name}
                  {client.age_group && client.age_group !== 'adult' && (
                    <span className="ml-2 px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                      Young Person
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
      </Select>
    </div>
  );
};
