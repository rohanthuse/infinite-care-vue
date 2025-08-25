
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ExtraTimeRecord, useApproveExtraTime, useRejectExtraTime } from "@/hooks/useAccountingData";
import { toast } from "sonner";

interface ViewExtraTimeDialogProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  record: ExtraTimeRecord;
  branchId?: string;
  canApprove?: boolean;
}

const ViewExtraTimeDialog: React.FC<ViewExtraTimeDialogProps> = ({ 
  open, 
  onClose, 
  onEdit, 
  record,
  branchId,
  canApprove = true
}) => {
  const approveExtraTime = useApproveExtraTime();
  const rejectExtraTime = useRejectExtraTime();

  const handleApprove = async () => {
    if (!branchId) {
      toast.error('Branch ID not available');
      return;
    }
    
    try {
      await approveExtraTime.mutateAsync({ id: record.id, branchId });
      onClose();
    } catch (error) {
      console.error('Failed to approve extra time:', error);
    }
  };

  const handleReject = async () => {
    if (!branchId) {
      toast.error('Branch ID not available');
      return;
    }
    
    try {
      await rejectExtraTime.mutateAsync({ id: record.id, branchId });
      onClose();
    } catch (error) {
      console.error('Failed to reject extra time:', error);
    }
  };
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "secondary" | "default" | "destructive"; label: string; className?: string }> = {
      pending: { variant: "secondary" as const, label: "Pending" },
      approved: { variant: "default" as const, label: "Approved", className: "bg-green-100 text-green-800" },
      rejected: { variant: "destructive" as const, label: "Rejected" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.className || ""}>
        {config.label}
      </Badge>
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Extra Time Record Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Staff and Client Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Staff Member</h4>
              <p className="text-sm font-medium">
                {record.staff ? `${record.staff.first_name} ${record.staff.last_name}` : 'Unknown Staff'}
              </p>
              <p className="text-xs text-gray-500">{record.staff_id}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Client</h4>
              {record.client ? (
                <>
                  <p className="text-sm font-medium">{record.client.first_name} {record.client.last_name}</p>
                  <p className="text-xs text-gray-500">{record.client_id}</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">No specific client</p>
              )}
            </div>
          </div>

          {/* Date, Status, and Creator Information */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Work Date</h4>
              <p className="text-sm">{new Date(record.work_date).toLocaleDateString()}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              {getStatusBadge(record.status)}
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Created By</h4>
              {record.created_by ? (
                <p className="text-xs text-gray-500">{record.created_by}</p>
              ) : (
                <p className="text-xs text-gray-400">System</p>
              )}
            </div>
          </div>

          {/* Time Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Time Details</h4>
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h5 className="text-xs font-medium text-gray-600">Scheduled Time</h5>
                <p className="text-sm">{record.scheduled_start_time} - {record.scheduled_end_time}</p>
                <p className="text-xs text-gray-500">Duration: {formatDuration(record.scheduled_duration_minutes)}</p>
              </div>
              <div>
                <h5 className="text-xs font-medium text-gray-600">Actual Time</h5>
                {record.actual_start_time && record.actual_end_time ? (
                  <>
                    <p className="text-sm">{record.actual_start_time} - {record.actual_end_time}</p>
                    <p className="text-xs text-gray-500">
                      Duration: {formatDuration(record.actual_duration_minutes || 0)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Not recorded</p>
                )}
              </div>
            </div>
          </div>

          {/* Extra Time and Cost */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="text-sm font-medium text-orange-800 mb-2">Extra Time Summary</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-orange-600">Extra Time</p>
                <p className="text-sm font-medium text-orange-800">
                  {formatDuration(record.extra_time_minutes)}
                </p>
              </div>
              <div>
                <p className="text-xs text-orange-600">Rate</p>
                <p className="text-sm font-medium text-orange-800">
                  £{(record.extra_time_rate || record.hourly_rate).toFixed(2)}/hr
                </p>
              </div>
              <div>
                <p className="text-xs text-orange-600">Total Cost</p>
                <p className="text-lg font-bold text-orange-800">£{record.total_cost.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Rates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Regular Hourly Rate</h4>
              <p className="text-sm">£{record.hourly_rate.toFixed(2)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Extra Time Rate</h4>
              <p className="text-sm">£{(record.extra_time_rate || record.hourly_rate).toFixed(2)}</p>
            </div>
          </div>

          {/* Reason and Notes */}
          {record.reason && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Reason for Extra Time</h4>
              <p className="text-sm mt-1">{record.reason}</p>
            </div>
          )}

          {record.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Additional Notes</h4>
              <p className="text-sm mt-1">{record.notes}</p>
            </div>
          )}

          {/* Approval Information */}
          {record.approved_by && record.approved_at && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-medium text-green-800">Approval Information</h4>
              <p className="text-sm text-green-700">
                Approved by: {record.approved_by}
              </p>
              <p className="text-sm text-green-700">
                Approved at: {new Date(record.approved_at).toLocaleString()}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-500 pt-4 border-t">
            <p>Created: {new Date(record.created_at).toLocaleString()}</p>
            <p>Updated: {new Date(record.updated_at).toLocaleString()}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          
          {canApprove && record.status === 'pending' && (
            <>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={rejectExtraTime.isPending}
              >
                {rejectExtraTime.isPending ? 'Rejecting...' : 'Reject'}
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={approveExtraTime.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {approveExtraTime.isPending ? 'Approving...' : 'Approve'}
              </Button>
            </>
          )}
          
          <Button onClick={onEdit}>
            Edit Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewExtraTimeDialog;
