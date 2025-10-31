import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Calendar, Building2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface ViewLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leave: any | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ViewLeaveDialog: React.FC<ViewLeaveDialogProps> = ({
  open,
  onOpenChange,
  leave,
  onEdit,
  onDelete
}) => {
  if (!leave) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            View Leave Details
          </DialogTitle>
          <DialogDescription>Leave/Holiday Information</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scope and Status Badges */}
          <div className="flex gap-2 flex-wrap">
            {leave.is_company_wide && (
              <Badge variant="success" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Company-wide
              </Badge>
            )}
            {!leave.is_company_wide && leave.branches?.name && (
              <Badge variant="info" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {leave.branches.name}
              </Badge>
            )}
            {leave.is_recurring && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Recurring Annually
              </Badge>
            )}
          </div>

          {/* Leave Title */}
          <div>
            <Label className="text-sm text-muted-foreground">Leave Name</Label>
            <p className="text-lg font-semibold">{leave.leave_name}</p>
          </div>

          {/* Date */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Date</Label>
              <p className="font-medium">
                {format(new Date(leave.leave_date), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </div>

          {/* Scope/Location */}
          <div>
            <Label className="text-sm text-muted-foreground">Applies To</Label>
            <p className="font-medium">
              {leave.is_company_wide 
                ? "All Branches" 
                : leave.branches?.name || "Specific Branch"}
            </p>
          </div>

          {/* Metadata */}
          <div className="border-t pt-4 text-sm text-muted-foreground space-y-1">
            <p>Leave ID: {leave.id}</p>
            <p>Created: {format(new Date(leave.created_at), "PPP p")}</p>
            {leave.updated_at && (
              <p>Last Updated: {format(new Date(leave.updated_at), "PPP p")}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onDelete && (
            <Button 
              variant="destructive" 
              onClick={onDelete}
            >
              Delete Leave
            </Button>
          )}
          {onEdit && (
            <Button onClick={onEdit}>
              Edit Leave
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
