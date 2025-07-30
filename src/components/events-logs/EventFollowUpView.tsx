import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface EventFollowUpViewProps {
  actionRequired?: boolean;
  followUpDate?: string;
  followUpAssignedTo?: string;
  followUpNotes?: string;
}

export function EventFollowUpView({ 
  actionRequired, 
  followUpDate, 
  followUpAssignedTo, 
  followUpNotes 
}: EventFollowUpViewProps) {
  if (!actionRequired) return null;

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Follow-up Requirements
      </h4>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Action Required
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {followUpDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <span className="font-medium">Follow-up Date:</span>
              <span>{format(new Date(followUpDate), 'PPP')}</span>
            </div>
          )}
          
          {followUpAssignedTo && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-yellow-600" />
              <span className="font-medium">Assigned To:</span>
              <span>{followUpAssignedTo}</span>
            </div>
          )}
        </div>
        
        {followUpNotes && (
          <div className="mt-3">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <FileText className="h-4 w-4 text-yellow-600" />
              Follow-up Notes
            </div>
            <div className="bg-white rounded p-3 text-sm border">
              {followUpNotes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}