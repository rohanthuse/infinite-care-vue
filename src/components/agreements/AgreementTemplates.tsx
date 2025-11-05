
import React, { useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Eye, FileText, Copy, PenLine, Trash2, Tag, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgreementTemplates, useDeleteTemplate, useCopyTemplate } from "@/data/hooks/agreements";
import { AgreementTemplate } from "@/types/agreements";
import { format } from 'date-fns';
import { ViewTemplateDialog } from './ViewTemplateDialog';
import { EditTemplateDialog } from './EditTemplateDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type AgreementTemplatesProps = {
  searchQuery?: string;
  typeFilter?: string;
  branchId?: string;
  isOrganizationLevel?: boolean;
};

export function AgreementTemplates({ 
  searchQuery = "", 
  typeFilter = "all",
  branchId,
  isOrganizationLevel = false
}: AgreementTemplatesProps) {
  const [viewingTemplate, setViewingTemplate] = useState<AgreementTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<AgreementTemplate | null>(null);

  const { data: templates, isLoading, isError, error } = useAgreementTemplates({
    searchQuery,
    typeFilter,
    branchId,
    isOrganizationLevel
  });

  const deleteTemplateMutation = useDeleteTemplate();
  const copyTemplateMutation = useCopyTemplate();
  
  const handleCopy = (id: string) => {
    copyTemplateMutation.mutate(id);
  };
  
  const handleDelete = (id: string) => {
    deleteTemplateMutation.mutate(id);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <>
      <div className="w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Template Name</TableHead>
              <TableHead className="w-[15%]">Type</TableHead>
              <TableHead className="w-[15%]">Created</TableHead>
              <TableHead className="w-[15%]">Last Updated</TableHead>
              <TableHead className="w-[10%]">Usage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates && templates.length > 0 ? (
              templates.map((template) => (
                <TableRow key={template.id} className="hover:bg-accent/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">{template.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{template.agreement_types?.name || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(template.created_at), 'dd MMM yyyy')}</TableCell>
                  <TableCell>{format(new Date(template.updated_at), 'dd MMM yyyy')}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{template.usage_count} times</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewingTemplate(template)}
                      >
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => setEditingTemplate(template)}
                      >
                        <PenLine className="h-4 w-4 text-primary" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopy(template.id)}
                        disabled={copyTemplateMutation.isPending}
                      >
                        <Copy className="h-4 w-4 text-primary" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            disabled={deleteTemplateMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the template.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(template.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-1 py-4 text-muted-foreground">
                    <FileText className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm">No templates found</p>
                    {searchQuery && (
                      <p className="text-xs text-muted-foreground/70">Try a different search term</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <ViewTemplateDialog 
        template={viewingTemplate}
        open={!!viewingTemplate}
        onOpenChange={(open) => !open && setViewingTemplate(null)}
      />
      <EditTemplateDialog 
        template={editingTemplate}
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
      />
    </>
  );
}
