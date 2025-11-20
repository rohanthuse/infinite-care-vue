import React, { useState } from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { SystemTenantAgreement } from '@/types/systemTenantAgreements';
import { ViewSystemTenantAgreementDialog } from './ViewSystemTenantAgreementDialog';
import { EditSystemTenantAgreementDialog } from './EditSystemTenantAgreementDialog';
import { useDeleteSystemTenantAgreement } from '@/hooks/useSystemTenantAgreements';

interface SystemTenantAgreementsTableProps {
  agreements: SystemTenantAgreement[];
  isLoading: boolean;
}

export const SystemTenantAgreementsTable: React.FC<SystemTenantAgreementsTableProps> = ({
  agreements,
  isLoading,
}) => {
  const [selectedAgreement, setSelectedAgreement] = useState<SystemTenantAgreement | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const deleteAgreement = useDeleteSystemTenantAgreement();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      Active: 'default',
      Pending: 'secondary',
      Expired: 'destructive',
      Terminated: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const handleView = (agreement: SystemTenantAgreement) => {
    setSelectedAgreement(agreement);
    setViewDialogOpen(true);
  };

  const handleEdit = (agreement: SystemTenantAgreement) => {
    setSelectedAgreement(agreement);
    setEditDialogOpen(true);
  };

  const handleDelete = async (agreement: SystemTenantAgreement) => {
    if (confirm(`Are you sure you want to delete the agreement "${agreement.title}"?`)) {
      await deleteAgreement.mutateAsync(agreement.id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading agreements...</div>;
  }

  if (agreements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No tenant agreements found.</p>
        <p className="text-sm mt-2">Create your first agreement to get started.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Agreement Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Signed Date</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agreements.map((agreement) => (
            <TableRow key={agreement.id}>
              <TableCell className="font-medium">
                {agreement.organizations?.name || 'Unknown Tenant'}
              </TableCell>
              <TableCell>{agreement.title}</TableCell>
              <TableCell>{agreement.system_tenant_agreement_types?.name || 'N/A'}</TableCell>
              <TableCell>{getStatusBadge(agreement.status)}</TableCell>
              <TableCell>
                {agreement.signed_at ? format(new Date(agreement.signed_at), 'PP') : 'Not signed'}
              </TableCell>
              <TableCell>
                {agreement.expiry_date ? format(new Date(agreement.expiry_date), 'PP') : 'N/A'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(agreement)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(agreement)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(agreement)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedAgreement && (
        <>
          <ViewSystemTenantAgreementDialog
            agreement={selectedAgreement}
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
          />
          <EditSystemTenantAgreementDialog
            agreement={selectedAgreement}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
        </>
      )}
    </>
  );
}
