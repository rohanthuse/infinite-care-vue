
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, CheckCircle, Link } from "lucide-react";
import { ExtraTimeRecord } from "@/hooks/useAccountingData";

interface ExtraTimeTableProps {
  records: ExtraTimeRecord[];
  onViewRecord: (record: ExtraTimeRecord) => void;
  onEditRecord: (record: ExtraTimeRecord) => void;
  onDeleteRecord: (recordId: string) => void;
}

const ExtraTimeTable: React.FC<ExtraTimeTableProps> = ({
  records,
  onViewRecord,
  onEditRecord,
  onDeleteRecord,
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "secondary" | "default" | "destructive"; label: string; className?: string }> = {
      pending: { variant: "secondary" as const, label: "Pending" },
      approved: { variant: "default" as const, label: "Approved", className: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50" },
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
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Scheduled Time</TableHead>
              <TableHead>Actual Time</TableHead>
              <TableHead>Extra Time</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {record.staff ? `${record.staff.first_name} ${record.staff.last_name}` : 'Unknown Staff'}
                      {record.booking_id && (
                        <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                          <Link className="h-3 w-3 mr-1" />
                          Visit Linked
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{record.staff_id}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {record.client ? (
                    <div>
                      <div className="font-medium">{record.client.first_name} {record.client.last_name}</div>
                      <div className="text-sm text-muted-foreground">{record.client_id}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(record.work_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{record.scheduled_start_time} - {record.scheduled_end_time}</div>
                    <div className="text-muted-foreground">
                      ({formatDuration(record.scheduled_duration_minutes)})
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {record.actual_start_time && record.actual_end_time ? (
                    <div className="text-sm">
                      <div>{record.actual_start_time} - {record.actual_end_time}</div>
                      <div className="text-muted-foreground">
                        ({formatDuration(record.actual_duration_minutes || 0)})
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not recorded</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium text-orange-600 dark:text-orange-400">
                      {formatDuration(record.extra_time_minutes)}
                    </div>
                    <div className="text-muted-foreground">
                      @ £{(record.extra_time_rate || record.hourly_rate).toFixed(2)}/hr
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">£{record.total_cost.toFixed(2)}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {record.created_by ? (
                      <div className="text-muted-foreground">{record.created_by}</div>
                    ) : (
                      <div className="text-muted-foreground/60">System</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(record.status)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewRecord(record)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditRecord(record)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDeleteRecord(record.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ExtraTimeTable;
