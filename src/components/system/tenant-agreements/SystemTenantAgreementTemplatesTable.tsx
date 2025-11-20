import React from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useSystemTenantAgreementTemplates, useDeleteSystemTenantAgreementTemplate } from '@/hooks/useSystemTenantAgreements';

export const SystemTenantAgreementTemplatesTable: React.FC = () => {
  const { data: templates, isLoading } = useSystemTenantAgreementTemplates();
  const deleteTemplate = useDeleteSystemTenantAgreementTemplate();

  const handleDelete = async (templateId: string, title: string) => {
    if (confirm(`Are you sure you want to delete the template "${title}"?`)) {
      await deleteTemplate.mutateAsync(templateId);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading templates...</div>;
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No agreement templates found.</p>
        <p className="text-sm mt-2">Create your first template to get started.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Template Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Usage Count</TableHead>
          <TableHead>Created Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((template) => (
          <TableRow key={template.id}>
            <TableCell className="font-medium">{template.title}</TableCell>
            <TableCell>
              {template.system_tenant_agreement_types?.name || 'N/A'}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{template.usage_count}</Badge>
            </TableCell>
            <TableCell>
              {format(new Date(template.created_at), 'PP')}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {}}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(template.id, template.title)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
