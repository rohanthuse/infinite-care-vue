
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FilePlus, Search, Filter, MoreHorizontal, Eye, Edit, Trash, Copy, AlertCircle, ChevronDown, FileText, Clock, Calendar, LayoutGrid } from 'lucide-react';
import { Form } from '@/types/form-builder';
import { v4 as uuidv4 } from 'uuid';

interface FormBuilderTabProps {
  branchId: string;
  branchName: string;
}

export const FormBuilderTab: React.FC<FormBuilderTabProps> = ({ branchId, branchName }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'grid'>('list');

  // Mock form data - in a real app, this would be fetched from your API
  const mockForms: Form[] = [
    {
      id: '1',
      title: 'Client Assessment Form',
      description: 'Initial assessment form for new clients',
      elements: [],
      createdAt: '2025-04-01T10:00:00Z',
      updatedAt: '2025-04-05T15:30:00Z',
      createdBy: { id: '1', name: 'Admin User' },
      published: true,
      requiresReview: true,
      version: 1,
      assignees: [
        { type: 'client', id: 'c1', name: 'John Smith' },
        { type: 'staff', id: 's1', name: 'Dr. Emma Wilson' },
      ],
    },
    {
      id: '2',
      title: 'Daily Care Log',
      description: 'Form for carers to log daily care activities',
      elements: [],
      createdAt: '2025-04-02T09:15:00Z',
      updatedAt: '2025-04-02T09:15:00Z',
      createdBy: { id: '1', name: 'Admin User' },
      published: true,
      requiresReview: false,
      version: 1,
      assignees: [
        { type: 'carer', id: 'ca1', name: 'George Thompson' },
        { type: 'carer', id: 'ca2', name: 'Mary Wilson' },
      ],
    },
    {
      id: '3',
      title: 'Medication Administration Record',
      description: 'Form to record medication administration',
      elements: [],
      createdAt: '2025-04-03T14:20:00Z',
      updatedAt: '2025-04-10T11:45:00Z',
      createdBy: { id: '1', name: 'Admin User' },
      published: false,
      requiresReview: true,
      version: 2,
      assignees: [],
    },
    {
      id: '4',
      title: 'Health and Safety Checklist',
      description: 'Monthly health and safety inspection form',
      elements: [],
      createdAt: '2025-03-15T08:30:00Z',
      updatedAt: '2025-04-12T16:20:00Z',
      createdBy: { id: '2', name: 'Manager' },
      published: true,
      requiresReview: true,
      version: 3,
      assignees: [
        { type: 'branch', id: 'b1', name: 'Main Branch' },
      ],
    },
    {
      id: '5',
      title: 'Client Feedback Survey',
      description: 'Form to collect client feedback on services',
      elements: [],
      createdAt: '2025-04-08T11:00:00Z',
      updatedAt: '2025-04-08T11:00:00Z',
      createdBy: { id: '1', name: 'Admin User' },
      published: true,
      requiresReview: false,
      version: 1,
      assignees: [
        { type: 'client', id: 'c1', name: 'John Smith' },
        { type: 'client', id: 'c2', name: 'Jane Doe' },
        { type: 'client', id: 'c3', name: 'Robert Johnson' },
      ],
    },
  ];
  
  const filteredForms = mockForms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'published' && form.published) || 
                         (statusFilter === 'draft' && !form.published);
    
    const matchesAssignee = assigneeFilter === 'all' ||
                           (assigneeFilter === 'unassigned' && form.assignees.length === 0) ||
                           (assigneeFilter === 'clients' && form.assignees.some(a => a.type === 'client')) ||
                           (assigneeFilter === 'staff' && form.assignees.some(a => a.type === 'staff')) ||
                           (assigneeFilter === 'carers' && form.assignees.some(a => a.type === 'carer')) ||
                           (assigneeFilter === 'branches' && form.assignees.some(a => a.type === 'branch'));
    
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredForms.length / itemsPerPage);
  const paginatedForms = filteredForms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCreateForm = () => {
    navigate(`/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/form-builder`);
  };

  const handleEditForm = (formId: string) => {
    navigate(`/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/form-builder/${formId}`);
  };

  const handleViewForm = (formId: string) => {
    navigate(`/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/form-builder/${formId}`);
  };

  const handleDuplicateForm = (form: Form) => {
    console.log('Duplicating form:', form.id);
    // In a real app, you would call an API to duplicate the form
  };

  const handleConfirmDelete = (formId: string) => {
    setFormToDelete(formId);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteForm = () => {
    console.log('Deleting form:', formToDelete);
    // In a real app, you would call an API to delete the form
    setConfirmDeleteOpen(false);
    setFormToDelete(null);
  };

  const getStatusBadge = (published: boolean) => {
    return published ? (
      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Published</Badge>
    ) : (
      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Draft</Badge>
    );
  };

  const getAssigneeCount = (form: Form) => {
    if (form.assignees.length === 0) return 'Not assigned';
    return `${form.assignees.length} ${form.assignees.length === 1 ? 'assignee' : 'assignees'}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderListView = () => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Form</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignees</TableHead>
              <TableHead>Review Required</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedForms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-gray-500">No forms found</p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedForms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{form.title}</div>
                      {form.description && (
                        <div className="text-xs text-gray-500">{form.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(form.published)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {form.assignees.length > 0 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 text-sm">
                              {getAssigneeCount(form)}
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Assigned to</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {form.assignees.map((assignee) => (
                              <DropdownMenuItem key={assignee.id}>
                                {assignee.name} ({assignee.type})
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
                    {form.requiresReview ? (
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
                      <span>{formatDate(form.updatedAt)}</span>
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
                        <DropdownMenuItem onClick={() => handleDuplicateForm(form)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleConfirmDelete(form.id)}>
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
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
          </div>
        ) : (
          paginatedForms.map((form) => (
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
                    <div className="font-medium">{getAssigneeCount(form)}</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-gray-500">Review Required:</div>
                    <div className="font-medium">{form.requiresReview ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-gray-500">Last Updated:</div>
                    <div className="font-medium flex items-center">
                      <Calendar className="mr-1 h-3 w-3 text-gray-400" />
                      {formatDate(form.updatedAt)}
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
                      <DropdownMenuItem onClick={() => handleDuplicateForm(form)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => handleConfirmDelete(form.id)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Form Builder</h1>
        <Button onClick={handleCreateForm}>
          <FilePlus className="mr-2 h-4 w-4" />
          Create Form
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">All Forms</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
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
                <SelectItem value="carers">Carers</SelectItem>
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
          {/* This will be filtered by published status */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This tab will display only published forms.
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="drafts" className="mt-6">
          {/* This will be filtered by draft status */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This tab will display only draft forms.
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="templates" className="mt-6">
          {/* This will display form templates */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This tab will display form templates that can be used to create new forms.
            </AlertDescription>
          </Alert>
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
              Are you sure you want to delete this form? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteForm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
