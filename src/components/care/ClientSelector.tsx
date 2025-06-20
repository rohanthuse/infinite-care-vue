
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";

interface ClientSelectorProps {
  branchId: string;
  selectedClientId: string | null;
  onClientSelect: (clientId: string, clientName: string) => void;
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
        .select('id, first_name, last_name')
        .eq('branch_id', branchId)
        .order('last_name');
      
      if (error) throw error;
      return data;
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
            onClientSelect(value, `${client.first_name} ${client.last_name}`);
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
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
