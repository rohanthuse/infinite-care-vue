
import React from "react";
import { ServiceRate, rateTypeLabels, clientTypeLabels, rateStatusLabels } from "@/types/rate";
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
  Check, 
  Clock, 
  AlertTriangle, 
  XCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface RatesTableProps {
  rates: ServiceRate[];
  onViewRate: (rate: ServiceRate) => void;
  onEditRate: (rate: ServiceRate) => void;
  onDeleteRate: (rateId: string) => void;
}

const RatesTable: React.FC<RatesTableProps> = ({
  rates,
  onViewRate,
  onEditRate,
  onDeleteRate,
}) => {
  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <Check className="h-3.5 w-3.5" />
            <span>Active</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <Clock className="h-3.5 w-3.5" />
            <span>Pending</span>
          </div>
        );
      case "expired":
        return (
          <div className="flex items-center gap-1.5 text-gray-700 bg-gray-100 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <XCircle className="h-3.5 w-3.5" />
            <span>Expired</span>
          </div>
        );
      case "discontinued":
        return (
          <div className="flex items-center gap-1.5 text-red-700 bg-red-50 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Discontinued</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Format date function
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Ongoing";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Service</TableHead>
            <TableHead>Rate Type</TableHead>
            <TableHead>Client Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Effective Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rates.map((rate) => (
            <TableRow key={rate.id}>
              <TableCell>
                <div className="font-medium">{rate.serviceName}</div>
                <div className="text-sm text-gray-500">{rate.serviceCode}</div>
                {rate.isDefault && (
                  <Badge variant="outline" className="mt-1 text-xs">Default</Badge>
                )}
              </TableCell>
              <TableCell>
                {rateTypeLabels[rate.rateType]}
              </TableCell>
              <TableCell>
                {clientTypeLabels[rate.clientType]}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(rate.amount)}
                <div className="text-xs text-gray-500">
                  {rate.rateType === 'hourly' && 'per hour'}
                  {rate.rateType === 'daily' && 'per day'}
                  {rate.rateType === 'weekly' && 'per week'}
                  {rate.rateType === 'per_visit' && 'per visit'}
                  {rate.rateType === 'fixed' && 'fixed rate'}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {formatDate(rate.effectiveFrom)} - {formatDate(rate.effectiveTo)}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {rate.applicableDays.length === 7 ? (
                    "All days"
                  ) : (
                    rate.applicableDays.map(day => day.charAt(0).toUpperCase() + day.slice(1).substring(0, 2)).join(", ")
                  )}
                </div>
              </TableCell>
              <TableCell>{renderStatusBadge(rate.status)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onViewRate(rate)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEditRate(rate)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onDeleteRate(rate.id)}
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

export default RatesTable;
