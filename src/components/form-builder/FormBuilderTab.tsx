import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FilePlus, Search, MoreHorizontal, Eye, Edit, Trash, Copy, AlertCircle, ChevronDown, FileText, Clock, Calendar, LayoutGrid, Loader2 } from 'lucide-react';
import { useFormManagement } from '@/hooks/useFormManagement';
import { useFormSubmissions } from '@/hooks/useFormSubmissions';
import { FormTemplatesContent } from './FormTemplatesContent';
import { useAuthSafe } from '@/hooks/useAuthSafe';
import { toast } from '@/hooks/use-toast';

interface FormBuilderTabProps {
  branchId: string;
  branchName: string;
}

export const FormBuilderTab: React.FC<FormBuilderTabProps> = ({ branchId, branchName }) => {
  const navigate = useNavigate();
  const { user } = useAuthSafe();
  const { tenantSlug } = useTenant();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'grid'>('list');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Use the new hooks
  const { 
    forms, 
    formAssignees, 
    isLoading, 
    createForm, 
    updateForm, 
    deleteForm, 
    duplicateForm,
    isCreating,
    isDeleting,
    isDuplicating
  } = useFormManagement(branchId);

  const { submissions } = useFormSubmissions(branchId);

  // Transform database forms to match the UI format and apply filters
  const filteredForms = useMemo(() => {
    let filtered = forms.filter(form => {
      const matchesSearch = form.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchesStatus = true;
      if (activeTab === 'published') {
        matchesStatus = form.published;
      } else if (activeTab === 'drafts') {
        matchesStatus = !form.published;
      } else if (statusFilter !== 'all') {
        matchesStatus = (statusFilter === 'published' && form.published) || 
                      (statusFilter === 'draft' && !form.published);
      }
      
      const formAssigneesList = formAssignees.filter(a => a.form_id === form.id);
      const matchesAssignee = assigneeFilter === 'all' ||
                             (assigneeFilter === 'unassigned' && formAssigneesList.length === 0) ||
                             (assigneeFilter === 'clients' && formAssigneesList.some(a => a.assignee_type === 'client')) ||
                             (assigneeFilter === 'staff' && formAssigneesList.some(a => a.assignee_type === 'staff' || a.assignee_type === 'carer')) ||
                             (assigneeFilter === 'branches' && formAssigneesList.some(a => a.assignee_type === 'branch'));
      
      return matchesSearch && matchesStatus && matchesAssignee;
    });

    return filtered;
  }, [forms, formAssignees, searchQuery, statusFilter, assigneeFilter, activeTab]);

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredForms.length / itemsPerPage);
  const paginatedForms = filteredForms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCreateForm = () => {
    const userId = user?.id || 'temp-user-id';
    
    const newFormData = {
      title: 'Untitled Form',
      description: '',
      created_by: userId,
      published: false,
      requires_review: false,
      settings: {
        showProgressBar: false,
        allowSaveAsDraft: false,
        autoSaveEnabled: false,
        autoSaveInterval: 60,
        redirectAfterSubmit: false,
        submitButtonText: 'Submit'
      }
    };

    // Just call createForm - the hook's onSuccess callback will handle navigation
    createForm(newFormData);
  };

  const handleEditForm = (formId: string) => {
    const fullPath = tenantSlug 
      ? `/${tenantSlug}/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/form-builder/${formId}?source=forms`
      : `/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/form-builder/${formId}?source=forms`;
    navigate(fullPath);
  };

  const handleViewForm = (formId: string) => {
    const fullPath = tenantSlug 
      ? `/${tenantSlug}/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/form-builder/${formId}?source=forms`
      : `/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/form-builder/${formId}?source=forms`;
    navigate(fullPath);
  };

  const handleViewSubmissions = (formId: string) => {
    const fullPath = tenantSlug 
      ? `/${tenantSlug}/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/form-builder/${formId}?tab=submissions&source=forms`
      : `/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/form-builder/${formId}?tab=submissions&source=forms`;
    navigate(fullPath);
  };

  const handleDuplicateForm = (formId: string) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to duplicate forms",
        variant: "destructive",
      });
      return;
    }
    
    duplicateForm({ formId, userId: user.id });
  };

  const handleConfirmDelete = (formId: string) => {
    setFormToDelete(formId);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteForm = () => {
    if (formToDelete) {
      deleteForm(formToDelete);
      setConfirmDeleteOpen(false);
      setFormToDelete(null);
    }
  };

  const getStatusBadge = (published: boolean) => {
    return published ? (
      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Published</Badge>
    ) : (
      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Draft</Badge>
    );
  };

  const getAssigneeCount = (formId: string) => {
    const assignees = formAssignees.filter(a => a.form_id === formId);
    if (assignees.length === 0) return 'Not assigned';
    return `${assignees.length} ${assignees.length === 1 ? 'assignee' : 'assignees'}`;
  };

  const getFormAssignees = (formId: string) => {
    return formAssignees.filter(a => a.form_id === formId);
  };

  const getSubmissionCount = (formId: string) => {
    return submissions.filter(s => s.form_id === formId).length;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading forms...</span>
      </div>
    );
  }

  const renderListView = () => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Form</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignees</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Review Required</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedForms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-gray-500">No forms found</p>
                  {searchQuery && (
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedForms.map((form) => {
                const assignees = getFormAssignees(form.id);
                const submissionCount = getSubmissionCount(form.id);
                
                return (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{form.title}</div>
                        {form.description && (
                          <div className="text-xs text-gray-500 line-clamp-2">{form.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(form.published)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {assignees.length > 0 ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 text-sm">
                                {getAssigneeCount(form.id)}
                                <ChevronDown className="ml-1 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuLabel>Assigned to</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {assignees.map((assignee) => (
                                <DropdownMenuItem key={assignee.id}>
                                  {assignee.assignee_name} ({assignee.assignee_type})
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-sm text-gray-500">Not assigned</span>
                        )}
                      </div>
                    </TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                           {submissionCount}
                         </Badge>
                         {submissionCount > 0 && (
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-6 px-2 text-xs"
                             onClick={() => handleViewSubmissions(form.id)}
                           >
                             View
                           </Button>
                         )}
                       </div>
                     </TableCell>
                    <TableCell>
                      {form.requires_review ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                          Required
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-500">Not required</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-gray-400" />
                        <span>{formatDate(form.updated_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => handleViewForm(form.id)}>
                             <Eye className="mr-2 h-4 w-4" />
                             View
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleEditForm(form.id)}>
                             <Edit className="mr-2 h-4 w-4" />
                             Edit
                           </DropdownMenuItem>
                           {submissionCount > 0 && (
                             <DropdownMenuItem onClick={() => handleViewSubmissions(form.id)}>
                               <FileText className="mr-2 h-4 w-4" />
                               View Submissions ({submissionCount})
                             </DropdownMenuItem>
                           )}
                          <DropdownMenuItem 
                            onClick={() => handleDuplicateForm(form.id)}
                            disabled={isDuplicating}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            {isDuplicating ? 'Duplicating...' : 'Duplicate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600" 
                            onClick={() => handleConfirmDelete(form.id)}
                            disabled={isDeleting}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedForms.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <p className="text-gray-500">No forms found</p>
            {searchQuery && (
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
            )}
          </div>
        ) : (
          paginatedForms.map((form) => {
            const assignees = getFormAssignees(form.id);
            const submissionCount = getSubmissionCount(form.id);
            
            return (
              <Card key={form.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{form.title}</CardTitle>
                      {form.description && (
                        <CardDescription className="line-clamp-2">{form.description}</CardDescription>
                      )}
                    </div>
                    {getStatusBadge(form.published)}
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <div className="text-gray-500">Assignees:</div>
                      <div className="font-medium">{getAssigneeCount(form.id)}</div>
                    </div>
                     <div className="flex justify-between">
                       <div className="text-gray-500">Submissions:</div>
                       <div className="flex items-center gap-2">
                         <span className="font-medium">{submissionCount}</span>
                         {submissionCount > 0 && (
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-5 px-1 text-xs"
                             onClick={() => handleViewSubmissions(form.id)}
                           >
                             View
                           </Button>
                         )}
                       </div>
                     </div>
                    <div className="flex justify-between">
                      <div className="text-gray-500">Review Required:</div>
                      <div className="font-medium">{form.requires_review ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-gray-500">Last Updated:</div>
                      <div className="font-medium flex items-center">
                        <Calendar className="mr-1 h-3 w-3 text-gray-400" />
                        {formatDate(form.updated_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <div className="flex justify-between w-full">
                    <Button variant="outline" size="sm" onClick={() => handleViewForm(form.id)}>
                      <Eye className="mr-1 h-3.5 w-3.5" /> View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditForm(form.id)}>
                      <Edit className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleDuplicateForm(form.id)}
                          disabled={isDuplicating}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {isDuplicating ? 'Duplicating...' : 'Duplicate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600" 
                          onClick={() => handleConfirmDelete(form.id)}
                          disabled={isDeleting}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Form Builder</h1>
        <Button onClick={handleCreateForm} disabled={isCreating}>
          <FilePlus className="mr-2 h-4 w-4" />
          {isCreating ? 'Creating...' : 'Create Form'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">All Forms ({forms.length})</TabsTrigger>
            <TabsTrigger value="published">Published ({forms.filter(f => f.published).length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({forms.filter(f => !f.published).length})</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search forms..."
                className="pl-9 w-full md:w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="clients">Clients</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="branches">Branches</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <Button
                variant={activeView === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="px-2"
                onClick={() => setActiveView('list')}
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant={activeView === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="px-2"
                onClick={() => setActiveView('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-6">
          {activeView === 'list' ? renderListView() : renderGridView()}
        </TabsContent>
        
        <TabsContent value="published" className="mt-6">
          {activeView === 'list' ? renderListView() : renderGridView()}
        </TabsContent>
        
        <TabsContent value="drafts" className="mt-6">
          {activeView === 'list' ? renderListView() : renderGridView()}
        </TabsContent>
        
        <TabsContent value="templates" className="mt-6">
          <FormTemplatesContent branchId={branchId} branchName={branchName} />
        </TabsContent>
      </Tabs>

      {filteredForms.length > itemsPerPage && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      onClick={() => setCurrentPage(pageNum)} 
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this form? This action cannot be undone and will also delete all associated submissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteForm} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
