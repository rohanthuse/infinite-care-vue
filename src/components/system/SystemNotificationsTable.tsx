import React, { useState } from "react";
import { useSystemNotifications } from "@/hooks/useSystemNotifications";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SystemNotificationsTableProps {
  statusFilter?: 'all' | 'read' | 'unread';
  typeFilter?: string;
  onFiltersChange?: (status: 'all' | 'read' | 'unread', type: string) => void;
}

export const SystemNotificationsTable: React.FC<SystemNotificationsTableProps> = ({
  statusFilter = 'all',
  typeFilter = 'all',
  onFiltersChange,
}) => {
  const [localStatusFilter, setLocalStatusFilter] = useState<'all' | 'read' | 'unread'>(statusFilter);
  const [localTypeFilter, setLocalTypeFilter] = useState(typeFilter);
  const [pageSize, setPageSize] = useState(20);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { notifications, isLoading, markAsRead, markAllAsRead } = useSystemNotifications();

  // Apply filters
  const filteredNotifications = notifications
    .filter(n => {
      if (localStatusFilter === 'read' && !n.read_at) return false;
      if (localStatusFilter === 'unread' && n.read_at) return false;
      if (localTypeFilter !== 'all' && n.type !== localTypeFilter) return false;
      return true;
    })
    .slice(0, pageSize);

  const handleStatusFilterChange = (value: string) => {
    const newFilter = value as 'all' | 'read' | 'unread';
    setLocalStatusFilter(newFilter);
    onFiltersChange?.(newFilter, localTypeFilter);
  };

  const handleTypeFilterChange = (value: string) => {
    setLocalTypeFilter(value);
    onFiltersChange?.(localStatusFilter, value);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
      default:
        return 'secondary';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'info':
      default:
        return 'info';
    }
  };

  const uniqueTypes = Array.from(new Set(notifications.map(n => n.type)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <Select value={localStatusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>

          <Select value={localTypeFilter} onValueChange={handleTypeFilterChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllAsRead()}
          disabled={notifications.filter(n => !n.read_at).length === 0}
        >
          Mark All as Read
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">Status</TableHead>
              <TableHead className="min-w-[200px]">Title</TableHead>
              <TableHead className="hidden md:table-cell">Message</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead className="w-[100px]">Priority</TableHead>
              <TableHead className="w-[100px]">Category</TableHead>
              <TableHead className="w-[140px]">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNotifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No notifications found
                </TableCell>
              </TableRow>
            ) : (
              filteredNotifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <TableRow
                    className={cn(
                      "cursor-pointer transition-colors",
                      !notification.read_at && "bg-primary/5 hover:bg-primary/10",
                      notification.read_at && "hover:bg-muted/30"
                    )}
                    onClick={() => {
                      if (!notification.read_at) {
                        markAsRead(notification.id);
                      }
                      setExpandedRow(expandedRow === notification.id ? null : notification.id);
                    }}
                  >
                    <TableCell>
                      {notification.read_at ? (
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Circle className="h-4 w-4 text-primary fill-primary" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {notification.title}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="line-clamp-1 text-muted-foreground text-sm">
                        {notification.message}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-muted-foreground">
                        {notification.type.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                        {notification.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getCategoryColor(notification.category)} className="text-xs">
                        {notification.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(notification.created_at), 'MMM d, HH:mm')}
                    </TableCell>
                  </TableRow>
                  {expandedRow === notification.id && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/20">
                        <div className="p-4 space-y-2">
                          <div>
                            <span className="text-sm font-semibold">Full Message:</span>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          {notification.data && (
                            <div>
                              <span className="text-sm font-semibold">Additional Data:</span>
                              <pre className="text-xs bg-background/50 p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(notification.data, null, 2)}
                              </pre>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Created: {format(new Date(notification.created_at), 'PPpp')}
                            {notification.read_at && (
                              <> • Read: {format(new Date(notification.read_at), 'PPpp')}</>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results Info */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {filteredNotifications.length} of {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};
