
import React from "react";
import { TravelRecord } from "@/hooks/useAccountingData";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  Pencil, 
  Trash2, 
  Receipt, 
  CheckCircle, 
  XCircle, 
  Clock 
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TravelRecordsTableProps {
  travelRecords: TravelRecord[];
  onViewRecord: (record: TravelRecord) => void;
  onEditRecord: (record: TravelRecord) => void;
  onDeleteRecord: (recordId: string) => void;
}

const vehicleTypeLabels: Record<string, string> = {
  car_personal: "Personal Car",
  car_company: "Company Car",
  public_transport: "Public Transport",
  taxi: "Taxi",
  other: "Other"
};

const TravelRecordsTable: React.FC<TravelRecordsTableProps> = ({
  travelRecords,
  onViewRecord,
  onEditRecord,
  onDeleteRecord,
}) => {
  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <div className="flex items-center gap-1.5 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Approved</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-1.5 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <XCircle className="h-3.5 w-3.5" />
            <span>Rejected</span>
          </div>
        );
      case "reimbursed":
        return (
          <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <Receipt className="h-3.5 w-3.5" />
            <span>Reimbursed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <Clock className="h-3.5 w-3.5" />
            <span>Pending</span>
          </div>
        );
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead>Staff</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Journey</TableHead>
            <TableHead className="text-right">Distance</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-center">Receipt</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {travelRecords.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{new Date(record.travel_date).toLocaleDateString()}</TableCell>
              <TableCell>
                {record.staff ? (
                  <span className="font-medium">
                    {record.staff.first_name} {record.staff.last_name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {record.client ? (
                  <span>
                    {record.client.first_name} {record.client.last_name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">From: {record.start_location}</div>
                  <div className="text-muted-foreground">To: {record.end_location}</div>
                </div>
              </TableCell>
              <TableCell className="text-right">{record.distance_miles.toFixed(1)} mi</TableCell>
              <TableCell>{vehicleTypeLabels[record.vehicle_type] || record.vehicle_type}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(record.total_cost)}</TableCell>
              <TableCell className="text-center">
                {record.receipt_url ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30"
                    onClick={() => window.open(record.receipt_url, '_blank')}
                    title="View Receipt"
                  >
                    <Receipt className="h-4 w-4" />
                  </Button>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>{renderStatusBadge(record.status)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onViewRecord(record)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEditRecord(record)}
                    disabled={record.status === 'approved' || record.status === 'reimbursed'}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDeleteRecord(record.id)}
                    disabled={record.status === 'approved' || record.status === 'reimbursed'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TravelRecordsTable;
