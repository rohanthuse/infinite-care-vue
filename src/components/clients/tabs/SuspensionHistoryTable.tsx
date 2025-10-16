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
import { Eye, Edit, Trash2, MoreHorizontal, Check, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SuspensionRecord {
  id: string;
  action: string;
  suspension_type?: string;
  reason?: string;
  details?: string;
  effective_from: string;
  effective_until?: string;
  created_at: string;
  apply_to?: any;
  notify?: any;
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

  const isActiveSuspension = (effectiveFrom: string, effectiveUntil?: string) => {
    const now = new Date();
    const from = new Date(effectiveFrom);
    const until = effectiveUntil ? new Date(effectiveUntil) : null;
    return from <= now && (!until || until > now);
  };

  const getBooleanBadge = (value: boolean) => {
    return value ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
        <Check className="h-3 w-3 mr-1" />
        Yes
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
        <X className="h-3 w-3 mr-1" />
        No
      </Badge>
    );
  };

  const getStatusBadge = (action: string, isActive: boolean) => {
    if (action === "suspend") {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="destructive">Suspended</Badge>
          {isActive && (
            <Badge className="bg-amber-500 text-white animate-pulse">
              🔴 ACTIVE
            </Badge>
          )}
        </div>
      );
    }
    if (action === "resume") {
      return <Badge variant="default">Resumed</Badge>;
    }
    return <Badge variant="secondary">{action}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm");
  };

  // Sort suspensions: active first, then by date descending
  const sortedSuspensions = [...suspensions].sort((a, b) => {
    const aActive = isActiveSuspension(a.effective_from, a.effective_until);
    const bActive = isActiveSuspension(b.effective_from, b.effective_until);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Remove from Invoice</TableHead>
              <TableHead>Pay Staff</TableHead>
              <TableHead>From Date</TableHead>
              <TableHead>Until Date</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="max-w-[200px]">Description</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSuspensions.map((suspension) => {
              const isActive = isActiveSuspension(
                suspension.effective_from,
                suspension.effective_until
              );
              const removeFromInvoice = suspension.apply_to?.billing === false;
              const payStaff = suspension.notify?.carers === true;

              return (
                <TableRow
                  key={suspension.id}
                  className={isActive ? "bg-amber-50 dark:bg-amber-950/20 font-medium" : ""}
                >
                  <TableCell>{getStatusBadge(suspension.action, isActive)}</TableCell>
                  <TableCell className="capitalize">
                    {suspension.suspension_type || "-"}
                  </TableCell>
                  <TableCell>{getBooleanBadge(removeFromInvoice)}</TableCell>
                  <TableCell>{getBooleanBadge(payStaff)}</TableCell>
                  <TableCell>{formatDate(suspension.effective_from)}</TableCell>
                  <TableCell>
                    {suspension.effective_until
                      ? formatDate(suspension.effective_until)
                      : "-"}
                  </TableCell>
                  <TableCell>{suspension.reason || "-"}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="truncate cursor-help">
                            {suspension.details || "-"}
                          </div>
                        </TooltipTrigger>
                        {suspension.details && (
                          <TooltipContent className="max-w-xs">
                            <p>{suspension.details}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            // Close dropdown first, then open dialog
                            setTimeout(() => onView(suspension), 0);
                          }}
                        >
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
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};