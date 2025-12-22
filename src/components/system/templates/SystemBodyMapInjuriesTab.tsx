import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Plus, Search, MoreHorizontal, Edit, Trash, Loader2, ActivitySquare, Check } from 'lucide-react';
import { useSystemBodyMapPoints, useCreateSystemBodyMapPoint, useUpdateSystemBodyMapPoint, useDeleteSystemBodyMapPoint, SystemBodyMapPoint } from '@/hooks/useSystemMasterData';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const COLORS = [
  '#FF0000', '#FF6B6B', '#E74C3C', '#C0392B',
  '#FF8C00', '#F39C12', '#E67E22', '#D35400',
  '#27AE60', '#2ECC71', '#1ABC9C', '#16A085',
  '#3498DB', '#2980B9', '#9B59B6', '#8E44AD',
  '#34495E', '#2C3E50', '#95A5A6', '#7F8C8D',
];

export function SystemBodyMapInjuriesTab() {
  const { user } = useSystemAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SystemBodyMapPoint | null>(null);
  const [formData, setFormData] = useState({ letter: '', title: '', color: '#FF0000' });
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const { data: points = [], isLoading } = useSystemBodyMapPoints();
  const createPoint = useCreateSystemBodyMapPoint();
  const updatePoint = useUpdateSystemBodyMapPoint();
  const deletePoint = useDeleteSystemBodyMapPoint();

  const filteredPoints = points.filter(point =>
    point.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    point.letter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setFormData({ letter: '', title: '', color: '#FF0000' });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (point: SystemBodyMapPoint) => {
    setSelectedItem(point);
    setFormData({
      letter: point.letter,
      title: point.title,
      color: point.color,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (point: SystemBodyMapPoint) => {
    setSelectedItem(point);
    setDeleteDialogOpen(true);
  };

  const handleSubmitAdd = () => {
    if (!formData.letter.trim() || !formData.title.trim()) return;
    createPoint.mutate({
      letter: formData.letter,
      title: formData.title,
      color: formData.color,
      status: 'active',
      created_by: user?.id || null,
    }, {
      onSuccess: () => setIsAddDialogOpen(false),
    });
  };

  const handleSubmitEdit = () => {
    if (!selectedItem || !formData.letter.trim() || !formData.title.trim()) return;
    updatePoint.mutate({
      id: selectedItem.id,
      letter: formData.letter,
      title: formData.title,
      color: formData.color,
    }, {
      onSuccess: () => setIsEditDialogOpen(false),
    });
  };

  const handleConfirmDelete = () => {
    if (selectedItem) {
      deletePoint.mutate(selectedItem.id, {
        onSuccess: () => setDeleteDialogOpen(false),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading body map points...</span>
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
              placeholder="Search body map points..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredPoints.length} point{filteredPoints.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Point
        </Button>
      </div>

      {filteredPoints.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <ActivitySquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No body map points found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? 'Try adjusting your search criteria' : 'Add your first body map point to get started'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Letter</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPoints.map((point) => (
                <TableRow key={point.id}>
                  <TableCell>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: point.color }}
                    >
                      {point.letter}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{point.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: point.color }}
                      />
                      <span className="text-xs text-muted-foreground">{point.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={point.status === 'active' ? 'default' : 'secondary'}>
                      {point.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(point.updated_at), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => handleEdit(point)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(point)}>
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
            <DialogTitle>Add Body Map Point</DialogTitle>
            <DialogDescription>Create a new body map injury point.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="letter">Letter *</Label>
              <Input
                id="letter"
                value={formData.letter}
                onChange={(e) => setFormData({ ...formData, letter: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="e.g., A, B, C"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Bruise, Cut, Burn"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <div
                      className="w-5 h-5 rounded mr-2 border"
                      style={{ backgroundColor: formData.color }}
                    />
                    {formData.color}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="grid grid-cols-5 gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 flex items-center justify-center",
                          formData.color === color ? "border-primary" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setFormData({ ...formData, color });
                          setColorPickerOpen(false);
                        }}
                      >
                        {formData.color === color && <Check className="h-4 w-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitAdd} disabled={createPoint.isPending}>
              {createPoint.isPending ? 'Adding...' : 'Add Point'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Body Map Point</DialogTitle>
            <DialogDescription>Update the body map point details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-letter">Letter *</Label>
              <Input
                id="edit-letter"
                value={formData.letter}
                onChange={(e) => setFormData({ ...formData, letter: e.target.value.toUpperCase().slice(0, 2) })}
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <div
                      className="w-5 h-5 rounded mr-2 border"
                      style={{ backgroundColor: formData.color }}
                    />
                    {formData.color}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="grid grid-cols-5 gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 flex items-center justify-center",
                          formData.color === color ? "border-primary" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      >
                        {formData.color === color && <Check className="h-4 w-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitEdit} disabled={updatePoint.isPending}>
              {updatePoint.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Body Map Point</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedItem?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deletePoint.isPending}>
              {deletePoint.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
