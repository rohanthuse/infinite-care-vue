import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, MoreHorizontal, Edit, Trash, Loader2, Stethoscope, FolderOpen } from 'lucide-react';
import {
  useSystemMedicalCategories, useCreateSystemMedicalCategory, useUpdateSystemMedicalCategory, useDeleteSystemMedicalCategory,
  useSystemMedicalConditions, useCreateSystemMedicalCondition, useUpdateSystemMedicalCondition, useDeleteSystemMedicalCondition,
  SystemMedicalCategory, SystemMedicalCondition
} from '@/hooks/useSystemMasterData';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { format } from 'date-fns';

export function SystemMedicalMentalTab() {
  const { user } = useSystemAuth();
  const [activeTab, setActiveTab] = useState('conditions');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Category state
  const [isCategoryAddOpen, setIsCategoryAddOpen] = useState(false);
  const [isCategoryEditOpen, setIsCategoryEditOpen] = useState(false);
  const [categoryDeleteOpen, setCategoryDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SystemMedicalCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });

  // Condition state
  const [isConditionAddOpen, setIsConditionAddOpen] = useState(false);
  const [isConditionEditOpen, setIsConditionEditOpen] = useState(false);
  const [conditionDeleteOpen, setConditionDeleteOpen] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<SystemMedicalCondition | null>(null);
  const [conditionFormData, setConditionFormData] = useState({ title: '', category_id: '', field_caption: '' });

  // Hooks
  const { data: categories = [], isLoading: loadingCategories } = useSystemMedicalCategories();
  const createCategory = useCreateSystemMedicalCategory();
  const updateCategory = useUpdateSystemMedicalCategory();
  const deleteCategory = useDeleteSystemMedicalCategory();

  const { data: conditions = [], isLoading: loadingConditions } = useSystemMedicalConditions();
  const createCondition = useCreateSystemMedicalCondition();
  const updateCondition = useUpdateSystemMedicalCondition();
  const deleteCondition = useDeleteSystemMedicalCondition();

  // Filtered data
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConditions = conditions.filter(cond =>
    cond.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cond.category?.name && cond.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Category handlers
  const handleAddCategory = () => {
    setCategoryFormData({ name: '' });
    setIsCategoryAddOpen(true);
  };

  const handleEditCategory = (category: SystemMedicalCategory) => {
    setSelectedCategory(category);
    setCategoryFormData({ name: category.name });
    setIsCategoryEditOpen(true);
  };

  const handleDeleteCategory = (category: SystemMedicalCategory) => {
    setSelectedCategory(category);
    setCategoryDeleteOpen(true);
  };

  const handleSubmitAddCategory = () => {
    if (!categoryFormData.name.trim()) return;
    createCategory.mutate({
      name: categoryFormData.name,
      status: 'active',
      created_by: user?.id || null,
    }, { onSuccess: () => setIsCategoryAddOpen(false) });
  };

  const handleSubmitEditCategory = () => {
    if (!selectedCategory || !categoryFormData.name.trim()) return;
    updateCategory.mutate({
      id: selectedCategory.id,
      name: categoryFormData.name,
    }, { onSuccess: () => setIsCategoryEditOpen(false) });
  };

  const handleConfirmDeleteCategory = () => {
    if (selectedCategory) {
      deleteCategory.mutate(selectedCategory.id, { onSuccess: () => setCategoryDeleteOpen(false) });
    }
  };

  // Condition handlers
  const handleAddCondition = () => {
    setConditionFormData({ title: '', category_id: '', field_caption: '' });
    setIsConditionAddOpen(true);
  };

  const handleEditCondition = (condition: SystemMedicalCondition) => {
    setSelectedCondition(condition);
    setConditionFormData({
      title: condition.title,
      category_id: condition.category_id || '',
      field_caption: condition.field_caption || '',
    });
    setIsConditionEditOpen(true);
  };

  const handleDeleteCondition = (condition: SystemMedicalCondition) => {
    setSelectedCondition(condition);
    setConditionDeleteOpen(true);
  };

  const handleSubmitAddCondition = () => {
    if (!conditionFormData.title.trim()) return;
    createCondition.mutate({
      title: conditionFormData.title,
      category_id: conditionFormData.category_id || null,
      field_caption: conditionFormData.field_caption || null,
      status: 'active',
      created_by: user?.id || null,
    }, { onSuccess: () => setIsConditionAddOpen(false) });
  };

  const handleSubmitEditCondition = () => {
    if (!selectedCondition || !conditionFormData.title.trim()) return;
    updateCondition.mutate({
      id: selectedCondition.id,
      title: conditionFormData.title,
      category_id: conditionFormData.category_id || null,
      field_caption: conditionFormData.field_caption || null,
    }, { onSuccess: () => setIsConditionEditOpen(false) });
  };

  const handleConfirmDeleteCondition = () => {
    if (selectedCondition) {
      deleteCondition.mutate(selectedCondition.id, { onSuccess: () => setConditionDeleteOpen(false) });
    }
  };

  const isLoading = loadingCategories || loadingConditions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading medical data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="conditions" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Conditions
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Categories
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab}...`}
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={activeTab === 'conditions' ? handleAddCondition : handleAddCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Add {activeTab === 'conditions' ? 'Condition' : 'Category'}
          </Button>
        </div>

        {/* Conditions Tab */}
        <TabsContent value="conditions" className="mt-4">
          {filteredConditions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Stethoscope className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No conditions found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'Try adjusting your search criteria' : 'Add your first condition to get started'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Field Caption</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConditions.map((condition) => (
                    <TableRow key={condition.id}>
                      <TableCell className="font-medium">{condition.title}</TableCell>
                      <TableCell>{condition.category?.name || '-'}</TableCell>
                      <TableCell>{condition.field_caption || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={condition.status === 'active' ? 'default' : 'secondary'}>
                          {condition.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(condition.updated_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => handleEditCondition(condition)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCondition(condition)}>
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
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-4">
          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No categories found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'Try adjusting your search criteria' : 'Add your first category to get started'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
                          {category.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(category.updated_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCategory(category)}>
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
        </TabsContent>
      </Tabs>

      {/* Category Add Dialog */}
      <Dialog open={isCategoryAddOpen} onOpenChange={setIsCategoryAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new medical category.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name *</Label>
              <Input id="cat-name" value={categoryFormData.name} onChange={(e) => setCategoryFormData({ name: e.target.value })} placeholder="Enter category name" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitAddCategory} disabled={createCategory.isPending}>
              {createCategory.isPending ? 'Adding...' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Edit Dialog */}
      <Dialog open={isCategoryEditOpen} onOpenChange={setIsCategoryEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the category details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cat-name">Name *</Label>
              <Input id="edit-cat-name" value={categoryFormData.name} onChange={(e) => setCategoryFormData({ name: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitEditCategory} disabled={updateCategory.isPending}>
              {updateCategory.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Delete Dialog */}
      <Dialog open={categoryDeleteOpen} onOpenChange={setCategoryDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDeleteCategory} disabled={deleteCategory.isPending}>
              {deleteCategory.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Condition Add Dialog */}
      <Dialog open={isConditionAddOpen} onOpenChange={setIsConditionAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Condition</DialogTitle>
            <DialogDescription>Create a new medical condition.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cond-title">Title *</Label>
              <Input id="cond-title" value={conditionFormData.title} onChange={(e) => setConditionFormData({ ...conditionFormData, title: e.target.value })} placeholder="Enter condition title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cond-category">Category</Label>
              <Select value={conditionFormData.category_id} onValueChange={(v) => setConditionFormData({ ...conditionFormData, category_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cond-caption">Field Caption</Label>
              <Input id="cond-caption" value={conditionFormData.field_caption} onChange={(e) => setConditionFormData({ ...conditionFormData, field_caption: e.target.value })} placeholder="Enter field caption" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConditionAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitAddCondition} disabled={createCondition.isPending}>
              {createCondition.isPending ? 'Adding...' : 'Add Condition'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Condition Edit Dialog */}
      <Dialog open={isConditionEditOpen} onOpenChange={setIsConditionEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Condition</DialogTitle>
            <DialogDescription>Update the condition details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cond-title">Title *</Label>
              <Input id="edit-cond-title" value={conditionFormData.title} onChange={(e) => setConditionFormData({ ...conditionFormData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cond-category">Category</Label>
              <Select value={conditionFormData.category_id} onValueChange={(v) => setConditionFormData({ ...conditionFormData, category_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cond-caption">Field Caption</Label>
              <Input id="edit-cond-caption" value={conditionFormData.field_caption} onChange={(e) => setConditionFormData({ ...conditionFormData, field_caption: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConditionEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitEditCondition} disabled={updateCondition.isPending}>
              {updateCondition.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Condition Delete Dialog */}
      <Dialog open={conditionDeleteOpen} onOpenChange={setConditionDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Condition</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCondition?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConditionDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDeleteCondition} disabled={deleteCondition.isPending}>
              {deleteCondition.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
