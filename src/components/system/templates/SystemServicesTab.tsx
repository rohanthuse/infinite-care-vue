import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, MoreHorizontal, Edit, Trash, Loader2, Briefcase } from 'lucide-react';
import { useSystemServices, useCreateSystemService, useUpdateSystemService, useDeleteSystemService, SystemService } from '@/hooks/useSystemMasterData';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { format } from 'date-fns';

export function SystemServicesTab() {
  const { user } = useSystemAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SystemService | null>(null);
  const [formData, setFormData] = useState({ title: '', category: '', description: '', code: '' });

  const { data: services = [], isLoading } = useSystemServices();
  const createService = useCreateSystemService();
  const updateService = useUpdateSystemService();
  const deleteService = useDeleteSystemService();

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (service.code && service.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAdd = () => {
    setFormData({ title: '', category: '', description: '', code: '' });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (service: SystemService) => {
    setSelectedItem(service);
    setFormData({
      title: service.title,
      category: service.category || '',
      description: service.description || '',
      code: service.code || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (service: SystemService) => {
    setSelectedItem(service);
    setDeleteDialogOpen(true);
  };

  const handleSubmitAdd = () => {
    if (!formData.title.trim()) return;
    createService.mutate({
      title: formData.title,
      category: formData.category || null,
      description: formData.description || null,
      code: formData.code || null,
      status: 'active',
      created_by: user?.id || null,
    }, {
      onSuccess: () => setIsAddDialogOpen(false),
    });
  };

  const handleSubmitEdit = () => {
    if (!selectedItem || !formData.title.trim()) return;
    updateService.mutate({
      id: selectedItem.id,
      title: formData.title,
      category: formData.category || null,
      description: formData.description || null,
      code: formData.code || null,
    }, {
      onSuccess: () => setIsEditDialogOpen(false),
    });
  };

  const handleConfirmDelete = () => {
    if (selectedItem) {
      deleteService.mutate(selectedItem.id, {
        onSuccess: () => setDeleteDialogOpen(false),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading services...</span>
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
              placeholder="Search services..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {filteredServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No services found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? 'Try adjusting your search criteria' : 'Add your first service to get started'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{service.title}</div>
                      {service.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">{service.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{service.category || '-'}</TableCell>
                  <TableCell>{service.code || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                      {service.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(service.updated_at), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => handleEdit(service)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(service)}>
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
            <DialogTitle>Add Service</DialogTitle>
            <DialogDescription>Create a new system service template.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitAdd} disabled={createService.isPending}>
              {createService.isPending ? 'Adding...' : 'Add Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update the service details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input id="edit-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input id="edit-category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">Code</Label>
              <Input id="edit-code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitEdit} disabled={updateService.isPending}>
              {updateService.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedItem?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteService.isPending}>
              {deleteService.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
