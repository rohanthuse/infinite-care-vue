import React from "react";
import { ServiceRate } from "@/hooks/useAccountingData";
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

interface RatesTableProps {
  rates: ServiceRate[];
  staffMap?: Map<string, { first_name: string; last_name: string }>;
  authoritiesMap?: Map<string, string>;
  onViewRate: (rate: ServiceRate) => void;
  onEditRate: (rate: ServiceRate) => void;
  onDeleteRate: (rateId: string) => void;
}

const RatesTable: React.FC<RatesTableProps> = ({
  rates,
  staffMap = new Map(),
  authoritiesMap = new Map(),
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
      case "inactive":
        return (
          <div className="flex items-center gap-1.5 text-red-700 bg-red-50 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Inactive</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-gray-700 bg-gray-100 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <span>{status}</span>
          </div>
        );
    }
  };

  // Format date function
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "Ongoing";
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get creator name from staff map
  const getCreatorName = (createdBy: string | undefined) => {
    if (!createdBy) return "System";
    const staff = staffMap.get(createdBy);
    if (staff) {
      return `${staff.first_name} ${staff.last_name}`;
    }
    return "Admin";
  };

  // Get authority name from map
  const getAuthorityName = (fundingSource: string | undefined) => {
    if (!fundingSource) return "Self Funded";
    const authorityName = authoritiesMap.get(fundingSource);
    return authorityName || fundingSource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Caption</TableHead>
            <TableHead>Authorities</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Registered On</TableHead>
            <TableHead>Registered By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                No rates found
              </TableCell>
            </TableRow>
          ) : (
            rates.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell>
                  <div className="font-medium">{rate.service_name}</div>
                  <div className="text-sm text-muted-foreground">{formatCurrency(rate.amount)}</div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{getAuthorityName(rate.funding_source)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{formatDate(rate.effective_from)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{formatDate(rate.effective_to)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{formatDate(rate.created_at)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{getCreatorName(rate.created_by)}</span>
                </TableCell>
                <TableCell>{renderStatusBadge(rate.status)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onViewRate(rate)}
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEditRate(rate)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => onDeleteRate(rate.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default RatesTable;
