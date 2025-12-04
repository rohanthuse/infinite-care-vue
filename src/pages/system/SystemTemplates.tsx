import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/DashboardHeader';
import { SystemInfoHeader } from '@/components/system/SystemInfoHeader';
import { SystemSectionTabs } from '@/components/system/SystemSectionTabs';
import { Tabs } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FilePlus, Search, MoreHorizontal, Eye, Edit, Trash, Copy, Loader2, FileText, CheckCircle, Clock } from 'lucide-react';
import { useSystemTemplates, useCreateSystemTemplate, useDeleteSystemTemplate, useDuplicateSystemTemplate } from '@/hooks/useSystemTemplates';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { format } from 'date-fns';

export default function SystemTemplates() {
  const navigate = useNavigate();
  const { user } = useSystemAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useSystemTemplates();
  const createTemplate = useCreateSystemTemplate();
  const deleteTemplate = useDeleteSystemTemplate();
  const duplicateTemplate = useDuplicateSystemTemplate();

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateTemplate = () => {
    if (!user?.id) return;
    
    createTemplate.mutate({
      title: 'Untitled Template',
      description: '',
      created_by: user.id,
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
    }, {
      onSuccess: (data) => {
        navigate(`/system-dashboard/system-templates/${data.id}`);
      }
    });
  };

  const handleEditTemplate = (templateId: string) => {
    navigate(`/system-dashboard/system-templates/${templateId}`);
  };

  const handleDuplicateTemplate = (templateId: string) => {
    if (!user?.id) return;
    duplicateTemplate.mutate({ templateId, userId: user.id });
  };

  const handleConfirmDelete = (templateId: string) => {
    setTemplateToDelete(templateId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTemplate = () => {
    if (templateToDelete) {
      deleteTemplate.mutate(templateToDelete);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const getStatusBadge = (published: boolean) => {
    return published ? (
      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Published
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
        <Clock className="w-3 h-3 mr-1" />
        Draft
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <DashboardHeader />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <SystemInfoHeader
          systemInfo={{
            status: "Operational",
            version: "v1.0.0",
            uptime: "99.99%",
            serverLocation: "EU-West",
            lastUpdate: new Date().toLocaleString(),
          }}
          onQuickAction={() => {}}
        />

        <Tabs value="system-templates" className="w-full">
          <SystemSectionTabs value="system-templates" />
        </Tabs>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  System Templates
                </CardTitle>
                <CardDescription>
                  Create and manage system-wide form templates that can be used by all tenant organisations.
                </CardDescription>
              </div>
              <Button onClick={handleCreateTemplate} disabled={createTemplate.isPending}>
                <FilePlus className="mr-2 h-4 w-4" />
                {createTemplate.isPending ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading templates...</span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No templates found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? 'Try adjusting your search criteria' : 'Create your first system template to get started'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleCreateTemplate} className="mt-4" disabled={createTemplate.isPending}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{template.title}</div>
                            {template.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {template.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(template.published)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">v{template.version}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(template.updated_at), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditTemplate(template.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View / Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateTemplate(template.id)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleConfirmDelete(template.id)}
                              >
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
          </CardContent>
        </Card>
      </main>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
              All tenant organisations will lose access to this template.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTemplate}
              disabled={deleteTemplate.isPending}
            >
              {deleteTemplate.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
