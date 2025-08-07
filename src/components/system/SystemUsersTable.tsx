import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CustomButton } from '@/components/ui/CustomButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Edit, 
  Power, 
  PowerOff, 
  Shield, 
  User,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSystemUsers, useToggleUserStatus } from '@/hooks/useSystemUsers';
import { format } from 'date-fns';

export const SystemUsersTable: React.FC = () => {
  const { data: users, isLoading } = useSystemUsers();
  const toggleUserStatus = useToggleUserStatus();

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    toggleUserStatus.mutate({ userId, isActive: !currentStatus });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No System Users</h3>
        <p className="text-muted-foreground mb-4">
          No system users have been created yet. Add your first system user to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/20">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={user.role === 'super_admin' ? 'default' : 'secondary'}
                  className="flex items-center space-x-1 w-fit"
                >
                  {user.role === 'super_admin' ? (
                    <Shield className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  <span>
                    {user.role === 'super_admin' ? 'Super Admin' : 
                     user.role === 'tenant_manager' ? 'Tenant Manager' :
                     user.role === 'analytics_viewer' ? 'Analytics Viewer' : 'Support Admin'}
                  </span>
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={user.is_active ? 'success' : 'destructive'}
                  className="flex items-center space-x-1 w-fit"
                >
                  {user.is_active ? (
                    <Power className="h-3 w-3" />
                  ) : (
                    <PowerOff className="h-3 w-3" />
                  )}
                  <span>{user.is_active ? 'Active' : 'Inactive'}</span>
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {user.last_login_at 
                      ? format(new Date(user.last_login_at), 'MMM d, yyyy')
                      : 'Never'
                    }
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(user.created_at), 'MMM d, yyyy')}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <CustomButton variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </CustomButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center space-x-2">
                      <Edit className="h-4 w-4" />
                      <span>Edit User</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleToggleStatus(user.id, user.is_active)}
                      className="flex items-center space-x-2"
                    >
                      {user.is_active ? (
                        <>
                          <PowerOff className="h-4 w-4" />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4" />
                          <span>Activate</span>
                        </>
                      )}
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