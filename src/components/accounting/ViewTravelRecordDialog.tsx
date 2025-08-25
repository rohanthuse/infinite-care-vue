
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TravelRecord, useApproveTravelRecord, useRejectTravelRecord } from "@/hooks/useAccountingData";
import { format } from "date-fns";
import { Edit, Download, ArrowRight, MapPin, Clock, Car, FileText, User, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ReportExporter } from "@/utils/reportExporter";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

interface ViewTravelRecordDialogProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  travelRecord: TravelRecord;
  branchId?: string;
  canApprove?: boolean;
}

const vehicleTypeLabels: Record<string, string> = {
  car_personal: "Personal Car",
  car_company: "Company Car",
  public_transport: "Public Transport",
  taxi: "Taxi",
  other: "Other"
};

const travelStatusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  reimbursed: "Reimbursed"
};

const ViewTravelRecordDialog: React.FC<ViewTravelRecordDialogProps> = ({
  open,
  onClose,
  onEdit,
  travelRecord,
  branchId,
  canApprove = true
}) => {
  const { toast: uiToast } = useToast();
  const approveTravelRecord = useApproveTravelRecord();
  const rejectTravelRecord = useRejectTravelRecord();

  const handleApprove = async () => {
    if (!branchId) {
      toast.error('Branch ID not available');
      return;
    }
    
    try {
      await approveTravelRecord.mutateAsync({ id: travelRecord.id, branchId });
      onClose();
    } catch (error) {
      console.error('Failed to approve travel record:', error);
    }
  };

  const handleReject = async () => {
    if (!branchId) {
      toast.error('Branch ID not available');
      return;
    }
    
    try {
      await rejectTravelRecord.mutateAsync({ id: travelRecord.id, branchId });
      onClose();
    } catch (error) {
      console.error('Failed to reject travel record:', error);
    }
  };

  const handleExportTravel = () => {
    try {
      const exportData = [{
        "Date": format(new Date(travelRecord.travel_date), "dd/MM/yyyy"),
        "From": travelRecord.start_location,
        "To": travelRecord.end_location,
        "Distance (miles)": travelRecord.distance_miles.toFixed(1),
        "Duration": formatDuration(travelRecord.travel_time_minutes),
        "Vehicle Type": vehicleTypeLabels[travelRecord.vehicle_type] || travelRecord.vehicle_type,
        "Mileage Rate": `£${travelRecord.mileage_rate.toFixed(2)}`,
        "Total Cost": formatCurrency(travelRecord.total_cost),
        "Purpose": travelRecord.purpose,
        "Staff": travelRecord.staff ? `${travelRecord.staff.first_name} ${travelRecord.staff.last_name}` : "-",
        "Client": travelRecord.client ? `${travelRecord.client.first_name} ${travelRecord.client.last_name}` : "-",
        "Status": travelStatusLabels[travelRecord.status],
        "Notes": travelRecord.notes || "-"
      }];

      const columns = [
        "Date", "From", "To", "Distance (miles)", "Duration", "Vehicle Type", 
        "Mileage Rate", "Total Cost", "Purpose", "Staff", "Client", "Status", "Notes"
      ];

      ReportExporter.exportToPDF({
        title: "Travel Record Details",
        data: exportData,
        columns,
        fileName: `Travel_Record_${format(new Date(travelRecord.travel_date), 'yyyy-MM-dd')}.pdf`
      });

      uiToast({
        title: "Export Successful",
        description: "Travel record has been exported to PDF.",
      });
    } catch (error) {
      console.error("Export error:", error);
      uiToast({
        title: "Export Failed",
        description: "Failed to export travel record. Please try again.",
        variant: "destructive",
      });
    }
  };
  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    let colorClass = "";
    switch (status) {
      case "approved":
        colorClass = "bg-green-50 text-green-700 border-green-200";
        break;
      case "rejected":
        colorClass = "bg-red-50 text-red-700 border-red-200";
        break;
      case "reimbursed":
        colorClass = "bg-blue-50 text-blue-700 border-blue-200";
        break;
      default:
        colorClass = "bg-amber-50 text-amber-700 border-amber-200";
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {travelStatusLabels[travelRecord.status]}
      </span>
    );
  };

  // Format duration to hours and minutes
  const formatDuration = (minutes?: number) => {
    if (!minutes) return "Not specified";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Travel Record Details</span>
            {renderStatusBadge(travelRecord.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Top section with key info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="text-sm text-gray-500">Date</div>
                <div className="font-medium">
                  {format(new Date(travelRecord.travel_date), "PPP")}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Distance</div>
                <div className="font-medium">{travelRecord.distance_miles.toFixed(1)} miles</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Cost</div>
                <div className="font-bold text-lg">{formatCurrency(travelRecord.total_cost)}</div>
              </div>
            </div>
          </div>

          {/* Journey details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Journey Details
              </h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start">
                    <div className="min-w-[80px] text-gray-500">From:</div>
                    <div className="font-medium">{travelRecord.start_location}</div>
                  </div>
                  <div className="flex items-start">
                    <div className="min-w-[80px] text-gray-500">To:</div>
                    <div className="font-medium">{travelRecord.end_location}</div>
                  </div>
                  <div className="flex items-center mt-2">
                    <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                    <div className="text-sm text-gray-600">
                      {formatDuration(travelRecord.travel_time_minutes)} journey time
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle and cost details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <Car className="h-4 w-4 mr-1" />
                  Vehicle Details
                </h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="min-w-[100px] text-gray-500">Vehicle Type:</div>
                      <div className="font-medium">
                        {vehicleTypeLabels[travelRecord.vehicle_type] || travelRecord.vehicle_type}
                      </div>
                    </div>
                    {(travelRecord.vehicle_type === 'car_personal' || travelRecord.vehicle_type === 'car_company') && (
                      <div className="flex items-start">
                        <div className="min-w-[100px] text-gray-500">Rate:</div>
                        <div className="font-medium">
                          £{travelRecord.mileage_rate.toFixed(2)} per mile
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Purpose & People
                </h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="min-w-[80px] text-gray-500">Purpose:</div>
                      <div className="font-medium">{travelRecord.purpose}</div>
                    </div>
                    
                    {travelRecord.staff && (
                      <div className="flex items-start">
                        <div className="min-w-[80px] text-gray-500">Staff:</div>
                        <div>{travelRecord.staff.first_name} {travelRecord.staff.last_name}</div>
                      </div>
                    )}
                    
                    {travelRecord.client && (
                      <div className="flex items-start">
                        <div className="min-w-[80px] text-gray-500">Client:</div>
                        <div>{travelRecord.client.first_name} {travelRecord.client.last_name}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {travelRecord.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Additional Notes
                </h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-sm">{travelRecord.notes}</p>
                </div>
              </div>
            )}

            {/* Created info */}
            <div className="text-sm text-gray-500 mt-4 flex items-center">
              <User className="h-4 w-4 mr-1" />
              <span>Created on {format(new Date(travelRecord.created_at), "PPP")}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-between">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="space-x-2">
              {canApprove && travelRecord.status === 'pending' && (
                <>
                  <Button 
                    variant="destructive" 
                    onClick={handleReject}
                    disabled={rejectTravelRecord.isPending}
                  >
                    {rejectTravelRecord.isPending ? 'Rejecting...' : 'Reject'}
                  </Button>
                  <Button 
                    onClick={handleApprove}
                    disabled={approveTravelRecord.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {approveTravelRecord.isPending ? 'Approving...' : 'Approve'}
                  </Button>
                </>
              )}
              <Button variant="outline" className="gap-2" onClick={handleExportTravel}>
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button onClick={onEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewTravelRecordDialog;
