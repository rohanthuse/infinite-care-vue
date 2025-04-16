
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Clock } from "lucide-react";
import { Client, Carer, Booking } from "./BookingTimeGrid";

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
  const calculateTotalHours = (bookings?: Booking[]) => {
    if (!bookings || bookings.length === 0) return 0;
    
    let totalMinutes = 0;
    bookings.forEach(booking => {
      if (booking.status !== "cancelled") {
        const startParts = booking.startTime.split(':').map(Number);
        const endParts = booking.endTime.split(':').map(Number);
        
        const startMinutes = startParts[0] * 60 + startParts[1];
        const endMinutes = endParts[0] * 60 + endParts[1];
        
        totalMinutes += endMinutes - startMinutes;
      }
    });
    
    return Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal place
  };
  
  const formatHourText = (hours: number) => {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  };
  
  const getBookingsByStatus = (bookings?: Booking[]) => {
    if (!bookings || bookings.length === 0) return {};
    
    const result: Record<string, { count: number, hours: number }> = {};
    
    bookings.forEach(booking => {
      if (!result[booking.status]) {
        result[booking.status] = { count: 0, hours: 0 };
      }
      
      result[booking.status].count += 1;
      
      const startParts = booking.startTime.split(':').map(Number);
      const endParts = booking.endTime.split(':').map(Number);
      
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];
      
      const hours = (endMinutes - startMinutes) / 60;
      result[booking.status].hours += hours;
    });
    
    return result;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold">
          {type === "client" ? "Clients" : "Carers"}
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {entities.map((entity) => {
            // Calculate total hours for this entity if it has bookings
            const totalHours = calculateTotalHours('bookings' in entity ? entity.bookings : undefined);
            const bookingsByStatus = getBookingsByStatus('bookings' in entity ? entity.bookings : undefined);
            
            return (
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
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Badge
                        className={`${
                          type === "client"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        } text-xs`}
                      >
                        {entity.bookingCount} booking{entity.bookingCount !== 1 ? "s" : ""}
                      </Badge>
                      
                      {type === "client" && totalHours > 0 && (
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-green-50 text-green-700 border-green-200 cursor-pointer flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect(entity.id);
                              }}
                            >
                              <Clock className="h-3 w-3" />
                              {formatHourText(totalHours)}
                            </Badge>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-60 p-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">{entity.name}</h4>
                              <div className="text-xs text-gray-500">Total Hours: {totalHours}</div>
                              
                              {Object.entries(bookingsByStatus).length > 0 && (
                                <div className="space-y-1 pt-2">
                                  <div className="text-xs font-medium">Hours by status:</div>
                                  {Object.entries(bookingsByStatus).map(([status, data]) => (
                                    <div key={status} className="flex justify-between text-xs">
                                      <span className="capitalize">{status}:</span>
                                      <span>{Math.round(data.hours * 10) / 10} hours ({data.count})</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
