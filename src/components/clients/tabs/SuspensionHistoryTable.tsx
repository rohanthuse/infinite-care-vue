import React from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";

interface SuspensionRecord {
  id: string;
  action: string;
  suspension_type?: string;
  reason?: string;
  details?: string;
  effective_from: string;
  effective_until?: string;
  created_at: string;
}

interface SuspensionHistoryTableProps {
  suspensions: SuspensionRecord[];
  onView: (suspension: SuspensionRecord) => void;
  onEdit: (suspension: SuspensionRecord) => void;
  onDelete: (suspension: SuspensionRecord) => void;
}

export const SuspensionHistoryTable: React.FC<SuspensionHistoryTableProps> = ({
  suspensions,
  onView,
  onEdit,
  onDelete,
}) => {
  if (!suspensions || suspensions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No suspension history found.
      </div>
    );
  }

  const getStatusBadge = (action: string) => {
    switch (action) {
      case "suspend":
        return <Badge variant="destructive">Suspended</Badge>;
      case "resume":
        return <Badge variant="default">Resumed</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm");
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>From Date</TableHead>
            <TableHead>Until Date</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suspensions.map((suspension) => (
            <TableRow key={suspension.id}>
              <TableCell>{getStatusBadge(suspension.action)}</TableCell>
              <TableCell className="capitalize">
                {suspension.suspension_type || "-"}
              </TableCell>
              <TableCell>{formatDate(suspension.effective_from)}</TableCell>
              <TableCell>
                {suspension.effective_until
                  ? formatDate(suspension.effective_until)
                  : "-"}
              </TableCell>
              <TableCell>{suspension.reason || "-"}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {suspension.details || "-"}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(suspension)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    {suspension.action === "suspend" && (
                      <DropdownMenuItem onClick={() => onEdit(suspension)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(suspension)}
                      className="text-destructive"
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
  );
};