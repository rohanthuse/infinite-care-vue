
import React from "react";
import { TravelRecord, travelStatusLabels, vehicleTypeLabels } from "@/types/travel";
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
          <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Approved</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-1.5 text-red-700 bg-red-50 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <XCircle className="h-3.5 w-3.5" />
            <span>Rejected</span>
          </div>
        );
      case "reimbursed":
        return (
          <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <Receipt className="h-3.5 w-3.5" />
            <span>Reimbursed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium w-fit">
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
            <TableHead className="w-[140px]">Date</TableHead>
            <TableHead>Journey</TableHead>
            <TableHead className="text-right">Distance</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {travelRecords.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{new Date(record.date).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">From: {record.startLocation}</div>
                  <div className="text-gray-500">To: {record.endLocation}</div>
                </div>
              </TableCell>
              <TableCell className="text-right">{record.distance.toFixed(1)} miles</TableCell>
              <TableCell>{vehicleTypeLabels[record.vehicleType]}</TableCell>
              <TableCell>
                <div className="text-sm max-w-[200px] truncate" title={record.purpose}>
                  {record.purpose}
                </div>
                {record.clientName && (
                  <div className="text-xs text-gray-500">
                    Client: {record.clientName}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(record.totalCost)}</TableCell>
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
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onDeleteRecord(record.id)}
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
