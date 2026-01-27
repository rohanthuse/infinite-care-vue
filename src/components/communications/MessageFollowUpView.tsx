import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface MessageFollowUpViewProps {
  actionRequired?: boolean;
  followUpDate?: string;
  followUpAssignedTo?: string;
  followUpAssignedToName?: string;
  followUpNotes?: string;
}

export const MessageFollowUpView: React.FC<MessageFollowUpViewProps> = ({ 
  actionRequired, 
  followUpDate, 
  followUpAssignedTo,
  followUpAssignedToName, 
  followUpNotes 
}) => {
  // Don't render if no action required or no follow-up details
  if (!actionRequired) return null;
  
  const hasFollowUpDetails = followUpDate || followUpAssignedTo || followUpNotes;
  
  if (!hasFollowUpDetails) return null;

  return (
    <div className="mt-3 border-t border-yellow-200 dark:border-yellow-700 pt-3">
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Follow-up Required
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {followUpDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
              <span className="text-muted-foreground">Due:</span>
              <span className="font-medium">{format(new Date(followUpDate), 'PPP')}</span>
            </div>
          )}
          
          {(followUpAssignedTo || followUpAssignedToName) && (
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
              <span className="text-muted-foreground">Assigned:</span>
              <span className="font-medium">{followUpAssignedToName || 'Staff member'}</span>
            </div>
          )}
        </div>
        
        {followUpNotes && (
          <div className="mt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
              Notes:
            </div>
            <div className="bg-white dark:bg-card rounded p-2 text-sm border border-yellow-100 dark:border-yellow-800">
              {followUpNotes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
