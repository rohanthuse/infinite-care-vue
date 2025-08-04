import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Calendar, 
  User, 
  Edit,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface CarePlan {
  id: string;
  display_id: string;
  title?: string;
  client: {
    first_name: string;
    last_name: string;
    id: string;
  };
  created_at: string;
  updated_at: string;
  status: string;
  provider_name: string;
  staff?: {
    first_name: string;
    last_name: string;
  };
  notes?: string;
  completion_percentage?: number;
  changes_requested_at?: string;
  change_request_comments?: string;
  changes_requested_by?: string;
}

interface AdminChangeRequestViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carePlan: CarePlan | null;
  onEditCarePlan: (carePlanId: string) => void;
}

export const AdminChangeRequestViewDialog: React.FC<AdminChangeRequestViewDialogProps> = ({
  open,
  onOpenChange,
  carePlan,
  onEditCarePlan,
}) => {
  if (!carePlan) return null;

  const hasChangeRequest = carePlan.changes_requested_at && carePlan.change_request_comments;

  const handleEditClick = () => {
    onEditCarePlan(carePlan.display_id || carePlan.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-600" />
            Change Request Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Care Plan Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Care Plan Information
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-600">Plan ID:</span>
                <p className="text-sm">{carePlan.display_id}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Client:</span>
                <p className="text-sm">{carePlan.client.first_name} {carePlan.client.last_name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Current Status:</span>
                <Badge variant="destructive" className="mt-1">
                  Changes Requested
                </Badge>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Assigned Provider:</span>
                <p className="text-sm">
                  {carePlan.staff 
                    ? `${carePlan.staff.first_name} ${carePlan.staff.last_name}` 
                    : carePlan.provider_name || 'Unassigned'
                  }
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Change Request Details */}
          {hasChangeRequest && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Client Change Request
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Requested on {format(new Date(carePlan.changes_requested_at), 'MMM dd, yyyy \'at\' h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>By Client</span>
                  </div>
                </div>

                <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-2">Client Comments:</h4>
                  <p className="text-sm text-amber-700 whitespace-pre-wrap">
                    {carePlan.change_request_comments}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!hasChangeRequest && (
            <div className="text-center text-gray-500 py-4">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No change request details available for this care plan.</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleEditClick} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Care Plan to Address Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};