
import React, { useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Eye, Calendar, User, FileText, Trash2, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useScheduledAgreements, useDeleteScheduledAgreement } from "@/data/hooks/agreements";
import { format } from 'date-fns';
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
import { ViewScheduledAgreementDialog } from "./ViewScheduledAgreementDialog";
import { ScheduledAgreement } from "@/types/agreements";

type ScheduledAgreementsProps = {
  searchQuery?: string;
  typeFilter?: string;
  dateFilter?: string;
  branchId?: string;
  isOrganizationLevel?: boolean;
};

export function ScheduledAgreements({ 
  searchQuery = "", 
  typeFilter = "all",
  dateFilter = "all",
  branchId,
  isOrganizationLevel = false
}: ScheduledAgreementsProps) {
  const [selectedAgreement, setSelectedAgreement] = useState<ScheduledAgreement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: agreements, isLoading, isError, error } = useScheduledAgreements({
    searchQuery,
    typeFilter,
    dateFilter,
    branchId,
    isOrganizationLevel
  });

  const deleteScheduledMutation = useDeleteScheduledAgreement();
  
  const handleView = (agreement: ScheduledAgreement) => {
    setSelectedAgreement(agreement);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteScheduledMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500">
        Error: {error.message}
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[25%]">Title</TableHead>
            <TableHead className="w-[15%]">Scheduled With</TableHead>
            <TableHead className="w-[15%]">Scheduled For</TableHead>
            <TableHead className="w-[15%]">Type</TableHead>
            <TableHead className="w-[10%]">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agreements && agreements.length > 0 ? (
            agreements.map((agreement) => (
              <TableRow key={agreement.id} className="hover:bg-accent/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">{agreement.title}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{agreement.scheduled_with_name || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {agreement.scheduled_for 
                        ? format(new Date(agreement.scheduled_for), 'dd MMM yyyy')
                        : 'Not scheduled'
                      }
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {agreement.agreement_types?.name || 'N/A'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge 
                    className={
                      agreement.status === "Upcoming" 
                        ? "bg-green-500/10 text-green-500 hover:bg-green-500/10" 
                        : agreement.status === "Under Review"
                          ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10"
                          : agreement.status === "Pending Approval"
                            ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/10"
                            : "bg-muted text-muted-foreground hover:bg-muted"
                    }
                  >
                    {agreement.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleView(agreement)}
                    >
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          disabled={deleteScheduledMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the scheduled agreement.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(agreement.id)}>
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
                    <Calendar className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm">No scheduled agreements found</p>
                    {searchQuery && (
                      <p className="text-xs text-muted-foreground/70">Try a different search term</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
          )}
        </TableBody>
      </Table>
      
      <ViewScheduledAgreementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        agreement={selectedAgreement}
      />
    </div>
  );
}
