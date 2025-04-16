
import React, { useState, useEffect } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Client, Carer } from "./BookingTimeGrid";

interface EntitySelectorProps {
  type: "client" | "carer";
  entities: Client[] | Carer[];
  selectedEntity: string | null;
  onSelect: (id: string | null) => void;
}

export const EntitySelector: React.FC<EntitySelectorProps> = ({
  type,
  entities,
  selectedEntity,
  onSelect
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEntities, setFilteredEntities] = useState<Client[] | Carer[]>(entities);
  
  // Find the selected entity object
  const selected = entities.find(entity => entity.id === selectedEntity);
  
  // Handle search filtering
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredEntities(entities);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = entities.filter(entity => 
        entity.name.toLowerCase().includes(query) || 
        entity.id.toLowerCase().includes(query) ||
        entity.initials.toLowerCase().includes(query)
      );
      setFilteredEntities(filtered);
    }
  }, [searchQuery, entities]);
  
  // Log for debugging
  useEffect(() => {
    console.log(`EntitySelector (${type}) rendered with selectedEntity:`, selectedEntity);
    if (selected) {
      console.log(`Selected ${type}:`, selected.name);
    }
  }, [selectedEntity, type, selected]);
  
  const handleSelectEntity = (id: string) => {
    console.log(`${type} selected:`, id);
    onSelect(id);
    setOpen(false);
  };
  
  const handleClearSelection = () => {
    console.log(`Clearing ${type} selection`);
    onSelect(null);
    setOpen(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };
  
  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 bg-white border-gray-200"
            data-testid={`${type}-selector-trigger`}
          >
            {selected ? (
              <div className="flex items-center">
                <div className={`h-6 w-6 rounded-full ${type === "client" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"} flex items-center justify-center text-xs font-medium mr-2`}>
                  {(selected as any).initials}
                </div>
                <span className="truncate max-w-[180px]">{(selected as any).name}</span>
                <Badge className={`ml-2 ${type === "client" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"} font-normal text-xs`} variant="outline">
                  {(selected as any).bookingCount} booking{(selected as any).bookingCount !== 1 ? "s" : ""}
                </Badge>
              </div>
            ) : (
              <span className="text-gray-500">Select a {type}</span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start" sideOffset={4}>
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="h-4 w-4 shrink-0 opacity-50 mr-2" />
              <CommandInput 
                placeholder={`Search ${type}s...`} 
                className="flex-1 h-9 border-none focus:ring-0 py-2 px-0" 
                value={searchQuery}
                onValueChange={handleSearchChange}
              />
            </div>
            <CommandList className="max-h-[200px] overflow-auto">
              <CommandEmpty>No {type} found.</CommandEmpty>
              <CommandGroup>
                {filteredEntities.map((entity) => (
                  <CommandItem
                    key={entity.id}
                    value={entity.id}
                    onSelect={() => handleSelectEntity(entity.id)}
                    className="flex items-center py-2"
                    data-testid={`${type}-option-${entity.id}`}
                  >
                    <div className={`h-6 w-6 rounded-full ${type === "client" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"} flex items-center justify-center text-xs font-medium mr-2`}>
                      {entity.initials}
                    </div>
                    <span className="flex-1 truncate">{entity.name}</span>
                    <Badge className={`ml-2 ${type === "client" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"} font-normal text-xs`} variant="outline">
                      {entity.bookingCount}
                    </Badge>
                    {entity.id === selectedEntity && <Check className="h-4 w-4 text-green-600 ml-1" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            {selectedEntity && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  data-testid={`${type}-clear-selection`}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear selection
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
