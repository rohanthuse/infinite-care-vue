import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, MoreHorizontal, Edit, Trash, Loader2, Heart } from 'lucide-react';
import { useSystemHobbies, useCreateSystemHobby, useUpdateSystemHobby, useDeleteSystemHobby, SystemHobby } from '@/hooks/useSystemMasterData';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { format } from 'date-fns';

export function SystemHobbiesTab() {
  const { user } = useSystemAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SystemHobby | null>(null);
  const [formData, setFormData] = useState({ title: '' });

  const { data: hobbies = [], isLoading } = useSystemHobbies();
  const createHobby = useCreateSystemHobby();
  const updateHobby = useUpdateSystemHobby();
  const deleteHobby = useDeleteSystemHobby();

  const filteredHobbies = hobbies.filter(hobby =>
    hobby.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setFormData({ title: '' });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (hobby: SystemHobby) => {
    setSelectedItem(hobby);
    setFormData({ title: hobby.title });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (hobby: SystemHobby) => {
    setSelectedItem(hobby);
    setDeleteDialogOpen(true);
  };

  const handleSubmitAdd = () => {
    if (!formData.title.trim()) return;
    createHobby.mutate({
      title: formData.title,
      status: 'active',
      created_by: user?.id || null,
    }, {
      onSuccess: () => setIsAddDialogOpen(false),
    });
  };

  const handleSubmitEdit = () => {
    if (!selectedItem || !formData.title.trim()) return;
    updateHobby.mutate({
      id: selectedItem.id,
      title: formData.title,
    }, {
      onSuccess: () => setIsEditDialogOpen(false),
    });
  };

  const handleConfirmDelete = () => {
    if (selectedItem) {
      deleteHobby.mutate(selectedItem.id, {
        onSuccess: () => setDeleteDialogOpen(false),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading hobbies...</span>
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
              placeholder="Search hobbies..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredHobbies.length} hobb{filteredHobbies.length !== 1 ? 'ies' : 'y'}
          </span>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Hobby
        </Button>
      </div>

      {filteredHobbies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Heart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No hobbies found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? 'Try adjusting your search criteria' : 'Add your first hobby to get started'}
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
              {filteredHobbies.map((hobby) => (
                <TableRow key={hobby.id}>
                  <TableCell className="font-medium">{hobby.title}</TableCell>
                  <TableCell>
                    <Badge variant={hobby.status === 'active' ? 'default' : 'secondary'}>
                      {hobby.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(hobby.updated_at), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => handleEdit(hobby)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(hobby)}>
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
            <DialogTitle>Add Hobby</DialogTitle>
            <DialogDescription>Create a new system hobby template.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ title: e.target.value })} placeholder="Enter hobby title" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitAdd} disabled={createHobby.isPending}>
              {createHobby.isPending ? 'Adding...' : 'Add Hobby'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Hobby</DialogTitle>
            <DialogDescription>Update the hobby details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input id="edit-title" value={formData.title} onChange={(e) => setFormData({ title: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitEdit} disabled={updateHobby.isPending}>
              {updateHobby.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Hobby</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedItem?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteHobby.isPending}>
              {deleteHobby.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
