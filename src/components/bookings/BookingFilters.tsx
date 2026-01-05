import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Client, Carer } from "./BookingTimeGrid";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BookingFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  selectedClientIds: string[];
  onClientChange: (clientIds: string[]) => void;
  selectedCarerIds: string[];
  onCarerChange: (carerIds: string[]) => void;
  clients: Client[];
  carers: Carer[];
}

export const BookingFilters: React.FC<BookingFiltersProps> = ({
  statusFilter,
  onStatusFilterChange,
  selectedClientIds,
  onClientChange,
  selectedCarerIds,
  onCarerChange,
  clients,
  carers,
}) => {
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [carerPopoverOpen, setCarerPopoverOpen] = useState(false);

  const handleClientToggle = (clientId: string) => {
    if (selectedClientIds.includes(clientId)) {
      onClientChange(selectedClientIds.filter(id => id !== clientId));
    } else {
      onClientChange([...selectedClientIds, clientId]);
    }
  };

  const handleCarerToggle = (carerId: string) => {
    if (selectedCarerIds.includes(carerId)) {
      onCarerChange(selectedCarerIds.filter(id => id !== carerId));
    } else {
      onCarerChange([...selectedCarerIds, carerId]);
    }
  };

  const handleSelectAllClients = () => {
    onClientChange(clients.map(c => c.id));
  };

  const handleClearAllClients = () => {
    onClientChange([]);
  };

  const handleSelectAllCarers = () => {
    onCarerChange(carers.map(c => c.id));
  };

  const handleClearAllCarers = () => {
    onCarerChange([]);
  };

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
              <SelectItem value="late">Late Arrivals</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
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
          <Label htmlFor="client">Clients</Label>
          <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={clientPopoverOpen}
                className="w-full justify-between"
              >
                {selectedClientIds.length === 0
                  ? "All clients"
                  : `${selectedClientIds.length} selected`}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 pointer-events-auto" align="start">
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllClients}
                    className="h-8 text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllClients}
                    className="h-8 text-xs"
                  >
                    Clear All
                  </Button>
                </div>
                {selectedClientIds.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedClientIds.length}
                  </Badge>
                )}
              </div>
              <ScrollArea className="max-h-[300px] overflow-y-auto pointer-events-auto">
                <div className="p-3 space-y-2">
                  {clients.map((client) => (
                    <div key={client.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`client-${client.id}`}
                        checked={selectedClientIds.includes(client.id)}
                        onCheckedChange={() => handleClientToggle(client.id)}
                      />
                      <label
                        htmlFor={`client-${client.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {client.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="carer">Carers</Label>
          <Popover open={carerPopoverOpen} onOpenChange={setCarerPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={carerPopoverOpen}
                className="w-full justify-between"
              >
                {selectedCarerIds.length === 0
                  ? "All carers"
                  : `${selectedCarerIds.length} selected`}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 pointer-events-auto" align="start">
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllCarers}
                    className="h-8 text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllCarers}
                    className="h-8 text-xs"
                  >
                    Clear All
                  </Button>
                </div>
                {selectedCarerIds.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedCarerIds.length}
                  </Badge>
                )}
              </div>
              <ScrollArea className="max-h-[300px] overflow-y-auto pointer-events-auto">
                <div className="p-3 space-y-2">
                  {carers.map((carer) => (
                    <div key={carer.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`carer-${carer.id}`}
                        checked={selectedCarerIds.includes(carer.id)}
                        onCheckedChange={() => handleCarerToggle(carer.id)}
                      />
                      <label
                        htmlFor={`carer-${carer.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {carer.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};
