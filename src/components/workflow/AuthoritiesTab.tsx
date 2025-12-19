import { useState } from "react";
import { Plus, Building2, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { AddAuthorityDialog, DialogMode } from "./AddAuthorityDialog";
import { useAuthorities, AuthorityData } from "@/contexts/AuthoritiesContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const AuthoritiesTab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('add');
  const [selectedAuthority, setSelectedAuthority] = useState<AuthorityData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [authorityToDelete, setAuthorityToDelete] = useState<AuthorityData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { authorities, isLoading, addAuthority, updateAuthority, removeAuthority } = useAuthorities();

  const handleSaveAuthority = async (data: AuthorityData) => {
    setIsSaving(true);
    try {
      if (dialogMode === 'edit') {
        await updateAuthority(data);
        toast.success("Authority updated successfully");
      } else {
        await addAuthority(data);
        toast.success("Authority added successfully");
      }
    } catch (error) {
      console.error('Error saving authority:', error);
      toast.error("Failed to save authority");
    } finally {
      setIsSaving(false);
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

  const handleConfirmDelete = async () => {
    if (authorityToDelete) {
      setIsDeleting(true);
      try {
        await removeAuthority(authorityToDelete.id);
        toast.success("Authority deleted successfully");
        setAuthorityToDelete(null);
      } catch (error) {
        console.error('Error deleting authority:', error);
        toast.error("Failed to delete authority");
      } finally {
        setIsDeleting(false);
      }
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

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <Card className="bg-card border border-border">
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 w-24" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Authorities</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage authority organizations and their configurations</p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Authorities
        </Button>
      </div>

      {authorities.length > 0 ? (
        <Card className="bg-card border border-border">
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
        <Card className="bg-card border border-border">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-2">No Authorities Added</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
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
            <AlertDialogTitle>Delete Authority and Associated Rates?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  This action cannot be undone. Deleting the authority 
                  "<strong>{authorityToDelete?.organization}</strong>" will also:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                  <li>Delete all rates linked to this authority from Rate Management</li>
                  <li>Remove all client rate assignments for this authority</li>
                </ul>
                <p className="mt-2 font-medium">Do you want to continue?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Authority & Rates'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AuthoritiesTab;
