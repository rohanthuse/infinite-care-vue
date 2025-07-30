import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserPlus } from 'lucide-react';

interface EventStaffDetailsViewProps {
  staffPresent?: string[];
  staffAware?: string[];
  otherPeoplePresent?: any[];
}

export function EventStaffDetailsView({ 
  staffPresent, 
  staffAware, 
  otherPeoplePresent 
}: EventStaffDetailsViewProps) {
  const hasStaffData = staffPresent?.length || staffAware?.length || otherPeoplePresent?.length;
  
  if (!hasStaffData) return null;

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <Users className="h-4 w-4" />
        Staff & People Present
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Staff Present */}
        {staffPresent && staffPresent.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <UserCheck className="h-4 w-4 text-green-600" />
              Staff Present
            </div>
            <div className="space-y-1">
              {staffPresent.map((staffId, index) => (
                <Badge key={index} variant="outline" className="mr-1">
                  {staffId}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Staff Made Aware */}
        {staffAware && staffAware.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-blue-600" />
              Staff Made Aware
            </div>
            <div className="space-y-1">
              {staffAware.map((staffId, index) => (
                <Badge key={index} variant="secondary" className="mr-1">
                  {staffId}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Other People Present */}
        {otherPeoplePresent && otherPeoplePresent.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <UserPlus className="h-4 w-4 text-purple-600" />
              Other People Present
            </div>
            <div className="space-y-2">
              {otherPeoplePresent.map((person, index) => (
                <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                  <div className="font-medium">{person.name}</div>
                  <div className="text-gray-600">{person.relationship}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
