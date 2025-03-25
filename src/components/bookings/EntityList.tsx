
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Client, Carer } from "./BookingTimeGrid";

interface EntityListProps {
  type: "client" | "carer";
  entities: Client[] | Carer[];
  selectedEntityId: string | null;
  onSelect: (id: string) => void;
}

export const EntityList: React.FC<EntityListProps> = ({
  type,
  entities,
  selectedEntityId,
  onSelect,
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold">
          {type === "client" ? "Clients" : "Carers"}
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {entities.map((entity) => (
            <div
              key={entity.id}
              className={`p-2 rounded-md cursor-pointer transition-colors
                ${
                  entity.id === selectedEntityId
                    ? type === "client"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-purple-50 border-purple-200"
                    : "bg-white hover:bg-gray-50"
                } 
                border`}
              onClick={() => onSelect(entity.id)}
            >
              <div className="flex items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium mr-2 
                    ${
                      type === "client"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-purple-100 text-purple-600"
                    }`}
                >
                  {entity.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{entity.name}</div>
                  <Badge
                    className={`${
                      type === "client"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-purple-50 text-purple-700"
                    } text-xs`}
                  >
                    {entity.bookingCount} booking{entity.bookingCount !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
