
import React from "react";
import { Users, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface AttendanceProps {
  staffPresent?: Array<{ id: string; name: string; timeIn?: string; timeOut?: string }>;
  otherAttendees?: Array<{ id: string; name: string; relationship: string }>;
}

export function AttendanceInfo({ staffPresent = [], otherAttendees = [] }: AttendanceProps) {
  if (staffPresent.length === 0 && otherAttendees.length === 0) {
    return null;
  }

  const totalPeople = staffPresent.length + otherAttendees.length;

  return (
    <div className="flex items-start">
      <Users className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
      <div>
        <div className="text-xs text-gray-500">Attendance</div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {totalPeople} {totalPeople === 1 ? 'person' : 'people'} present
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="w-80 p-0">
                <div className="p-3">
                  {staffPresent.length > 0 && (
                    <div className="mb-2">
                      <h4 className="text-sm font-semibold mb-1">Staff Present ({staffPresent.length})</h4>
                      <ul className="text-xs space-y-1">
                        {staffPresent.map(staff => (
                          <li key={staff.id} className="flex justify-between">
                            <span>{staff.name}</span>
                            {staff.timeIn && (
                              <span className="text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {staff.timeIn}{staff.timeOut ? ` - ${staff.timeOut}` : ''}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {otherAttendees.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Others Present ({otherAttendees.length})</h4>
                      <ul className="text-xs space-y-1">
                        {otherAttendees.map(person => (
                          <li key={person.id}>{person.name} ({person.relationship})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
