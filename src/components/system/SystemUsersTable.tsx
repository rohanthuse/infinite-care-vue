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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MoreHorizontal, 
  Edit, 
  Power, 
  PowerOff, 
  Shield, 
  User,
  Key,
  Building2,
  Trash2
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
import { EditSystemUserDialog } from '@/components/system/EditSystemUserDialog';
import { SetSystemUserPasswordDialog } from '@/components/system/SetSystemUserPasswordDialog';
import { DeleteSystemUserDialog } from '@/components/system/DeleteSystemUserDialog';
import { SystemUsersBulkActionsBar } from '@/components/system/SystemUsersBulkActionsBar';
import { BulkDeleteSystemUsersDialog } from '@/components/system/BulkDeleteSystemUsersDialog';
import { useDeleteMultipleSystemUsers } from '@/hooks/useDeleteMultipleSystemUsers';

export const SystemUsersTable: React.FC = () => {
  const { data: users, isLoading } = useSystemUsers();
  const toggleUserStatus = useToggleUserStatus();
  const [editingUser, setEditingUser] = React.useState<any | null>(null);
  const [passwordResetUser, setPasswordResetUser] = React.useState<any | null>(null);
  const [deleteDialogUser, setDeleteDialogUser] = React.useState<any | null>(null);
  
  // Bulk delete state
  const [selectedUserIds, setSelectedUserIds] = React.useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = React.useState(false);
  const deleteMultipleUsers = useDeleteMultipleSystemUsers();

  // Selection handlers
  const handleSelectAll = () => {
    if (!users) return;
    
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map(u => u.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const handleClearSelection = () => {
    setSelectedUserIds(new Set());
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteDialog(true);
  };

  const handleConfirmBulkDelete = () => {
    if (!users || selectedUserIds.size === 0) return;

    const usersToDelete = users.filter(u => selectedUserIds.has(u.id));
    
    deleteMultipleUsers.mutate(
      {
        userIds: Array.from(selectedUserIds),
        users: usersToDelete,
      },
      {
        onSuccess: () => {
          setShowBulkDeleteDialog(false);
          setSelectedUserIds(new Set());
        },
      }
    );
  };

  const isAllSelected = users && users.length > 0 && selectedUserIds.size === users.length;
  const isSomeSelected = selectedUserIds.size > 0 && !isAllSelected;

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    toggleUserStatus.mutate({ userId, isActive: !currentStatus });
  };
  const handleEditUser = (u: any) => setEditingUser(u);
  const handleResetPassword = (u: any) => setPasswordResetUser(u);

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
        <h3 className="text-lg font-semibold text-foreground mb-2">No Tenant Users</h3>
        <p className="text-muted-foreground mb-4">
          No tenant users have been created yet. Add your first tenant user to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-border/50 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected || isSomeSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all users"
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Organisations</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isSelected = selectedUserIds.has(user.id);
            
            return (
              <TableRow 
                key={user.id} 
                className={isSelected ? 'bg-muted/50 hover:bg-muted/60' : 'hover:bg-muted/20'}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleSelectUser(user.id)}
                    aria-label={`Select ${user.first_name} ${user.last_name}`}
                  />
                </TableCell>
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
                <div className="flex flex-wrap gap-1">
                  {user.organizations && user.organizations.length > 0 ? (
                    user.organizations.map((org) => (
                      <Badge 
                        key={org.id}
                        variant="outline" 
                        className="text-xs"
                      >
                        {org.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">System Admin</span>
                  )}
                </div>
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
                    <DropdownMenuItem onClick={() => handleEditUser(user)} className="flex items-center space-x-2">
                      <Edit className="h-4 w-4" />
                      <span>Edit User</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleResetPassword(user)} className="flex items-center space-x-2">
                      <Key className="h-4 w-4" />
                      <span>Reset Password</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleEditUser(user)} className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4" />
                      <span>Manage Organisations</span>
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialogUser(user)}
                      className="flex items-center space-x-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete User</span>
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

    <SystemUsersBulkActionsBar
      selectedCount={selectedUserIds.size}
      onClearSelection={handleClearSelection}
      onBulkDelete={handleBulkDelete}
      isDeleting={deleteMultipleUsers.isPending}
    />

    <BulkDeleteSystemUsersDialog
      users={users?.filter(u => selectedUserIds.has(u.id)) || []}
      open={showBulkDeleteDialog}
      onOpenChange={setShowBulkDeleteDialog}
      onConfirm={handleConfirmBulkDelete}
    />

    {editingUser && (
      <EditSystemUserDialog
        open={!!editingUser}
        onOpenChange={(o) => { if (!o) setEditingUser(null); }}
        user={editingUser}
      />
    )}
    {passwordResetUser && (
      <SetSystemUserPasswordDialog
        open={!!passwordResetUser}
        onOpenChange={(o) => { if (!o) setPasswordResetUser(null); }}
        user={passwordResetUser}
      />
    )}
    {deleteDialogUser && (
      <DeleteSystemUserDialog
        user={deleteDialogUser}
        open={!!deleteDialogUser}
        onOpenChange={(open) => {
          if (!open) setDeleteDialogUser(null);
        }}
      />
    )}
    </>
  );
};