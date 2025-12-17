import { useState } from "react";
import { Plus, Building2, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddAuthorityDialog, AuthorityData, DialogMode } from "./AddAuthorityDialog";
import { useAuthorities } from "@/contexts/AuthoritiesContext";

export const AuthoritiesTab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('add');
  const [selectedAuthority, setSelectedAuthority] = useState<AuthorityData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [authorityToDelete, setAuthorityToDelete] = useState<AuthorityData | null>(null);
  
  const { authorities, addAuthority, updateAuthority, removeAuthority } = useAuthorities();

  const handleSaveAuthority = (data: AuthorityData) => {
    if (dialogMode === 'edit') {
      updateAuthority(data);
    } else {
      addAuthority(data);
    }
  };

  const handleView = (authority: AuthorityData) => {
    setSelectedAuthority(authority);
    setDialogMode('view');
    setIsDialogOpen(true);
  };

  const handleEdit = (authority: AuthorityData) => {
    setSelectedAuthority(authority);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (authority: AuthorityData) => {
    setAuthorityToDelete(authority);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (authorityToDelete) {
      removeAuthority(authorityToDelete.id);
      setAuthorityToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleAddNew = () => {
    setSelectedAuthority(null);
    setDialogMode('add');
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedAuthority(null);
      setDialogMode('add');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">Authorities</h2>
          <p className="text-sm text-gray-500 mt-1">Manage authority organizations and their configurations</p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Authorities
        </Button>
      </div>

      {authorities.length > 0 ? (
        <Card className="bg-white border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organisation</TableHead>
                <TableHead>Telephone</TableHead>
                <TableHead>Key Contact Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authorities.map((authority) => (
                <TableRow key={authority.id}>
                  <TableCell className="font-medium">{authority.organization}</TableCell>
                  <TableCell>{authority.telephone || "-"}</TableCell>
                  <TableCell>{authority.contactName || "-"}</TableCell>
                  <TableCell>{authority.address || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(authority)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(authority)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(authority)}
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-2">No Authorities Added</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-sm">
              Get started by adding your first authority organization to manage billing and integrations.
            </p>
            <Button onClick={handleAddNew} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Authority
            </Button>
          </CardContent>
        </Card>
      )}

      <AddAuthorityDialog 
        open={isDialogOpen} 
        onOpenChange={handleDialogClose}
        onSave={handleSaveAuthority}
        mode={dialogMode}
        initialData={selectedAuthority}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this authority?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the authority
              "{authorityToDelete?.organization}" from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AuthoritiesTab;
