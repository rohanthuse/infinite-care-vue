import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, MoreHorizontal, Edit, Trash, Loader2, ListChecks } from 'lucide-react';
import { useSystemWorkTypes, useCreateSystemWorkType, useUpdateSystemWorkType, useDeleteSystemWorkType, SystemWorkType } from '@/hooks/useSystemMasterData';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { format } from 'date-fns';

export function SystemWorkTypesTab() {
  const { user } = useSystemAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SystemWorkType | null>(null);
  const [formData, setFormData] = useState({ title: '' });

  const { data: workTypes = [], isLoading } = useSystemWorkTypes();
  const createWorkType = useCreateSystemWorkType();
  const updateWorkType = useUpdateSystemWorkType();
  const deleteWorkType = useDeleteSystemWorkType();

  const filteredWorkTypes = workTypes.filter(workType =>
    workType.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setFormData({ title: '' });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (workType: SystemWorkType) => {
    setSelectedItem(workType);
    setFormData({ title: workType.title });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (workType: SystemWorkType) => {
    setSelectedItem(workType);
    setDeleteDialogOpen(true);
  };

  const handleSubmitAdd = () => {
    if (!formData.title.trim()) return;
    createWorkType.mutate({
      title: formData.title,
      status: 'active',
      created_by: user?.id || null,
    }, {
      onSuccess: () => setIsAddDialogOpen(false),
    });
  };

  const handleSubmitEdit = () => {
    if (!selectedItem || !formData.title.trim()) return;
    updateWorkType.mutate({
      id: selectedItem.id,
      title: formData.title,
    }, {
      onSuccess: () => setIsEditDialogOpen(false),
    });
  };

  const handleConfirmDelete = () => {
    if (selectedItem) {
      deleteWorkType.mutate(selectedItem.id, {
        onSuccess: () => setDeleteDialogOpen(false),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading work types...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search work types..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredWorkTypes.length} work type{filteredWorkTypes.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Work Type
        </Button>
      </div>

      {filteredWorkTypes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No work types found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? 'Try adjusting your search criteria' : 'Add your first work type to get started'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkTypes.map((workType) => (
                <TableRow key={workType.id}>
                  <TableCell className="font-medium">{workType.title}</TableCell>
                  <TableCell>
                    <Badge variant={workType.status === 'active' ? 'default' : 'secondary'}>
                      {workType.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(workType.updated_at), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => handleEdit(workType)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(workType)}>
                          <Trash className="mr-2 h-4 w-4" />
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
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Work Type</DialogTitle>
            <DialogDescription>Create a new work type template.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ title: e.target.value })} placeholder="Enter work type title" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitAdd} disabled={createWorkType.isPending}>
              {createWorkType.isPending ? 'Adding...' : 'Add Work Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Work Type</DialogTitle>
            <DialogDescription>Update the work type details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input id="edit-title" value={formData.title} onChange={(e) => setFormData({ title: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitEdit} disabled={updateWorkType.isPending}>
              {updateWorkType.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Work Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedItem?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteWorkType.isPending}>
              {deleteWorkType.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
