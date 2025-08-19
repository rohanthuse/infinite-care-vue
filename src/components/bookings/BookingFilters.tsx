
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Client, Carer } from "./BookingTimeGrid";

interface BookingFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  selectedClientId: string;
  onClientChange: (clientId: string) => void;
  selectedCarerId: string;
  onCarerChange: (carerId: string) => void;
  clients: Client[];
  carers: Carer[];
}

export const BookingFilters: React.FC<BookingFiltersProps> = ({
  statusFilter,
  onStatusFilterChange,
  selectedClientId,
  onClientChange,
  selectedCarerId,
  onCarerChange,
  clients,
  carers,
}) => {
  return (
    <div className="space-y-4 bg-card p-4 rounded-lg border border-border shadow-sm">  
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="departed">Departed</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client">Client</Label>
          <Select value={selectedClientId} onValueChange={onClientChange}>
            <SelectTrigger>
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-clients">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="carer">Carer</Label>
          <Select value={selectedCarerId} onValueChange={onCarerChange}>
            <SelectTrigger>
              <SelectValue placeholder="All carers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-carers">All Carers</SelectItem>
              {carers.map((carer) => (
                <SelectItem key={carer.id} value={carer.id}>
                  {carer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
