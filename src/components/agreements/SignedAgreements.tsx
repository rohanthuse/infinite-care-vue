import React, { useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Eye, Download, FileText, Calendar, User, Trash2, UserCheck, Loader2
} from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generatePDF } from "@/utils/pdfGenerator";
import { ViewAgreementDialog } from "./ViewAgreementDialog";
import { useSignedAgreements, useDeleteAgreement } from "@/data/hooks/agreements";
import { Agreement, AgreementPartyFilter } from "@/types/agreements";
import { format } from "date-fns";
import type { VariantProps } from "class-variance-authority";

type SignedAgreementsProps = {
  searchQuery?: string;
  typeFilter?: string;
  dateFilter?: string;
  branchId?: string; // Optional for global view
};

const getStatusBadgeVariant = (status: Agreement["status"]): VariantProps<typeof badgeVariants>["variant"] => {
  switch (status) {
    case "Active":
      return "success";
    case "Pending":
      return "info";
    case "Expired":
      return "warning";
    case "Terminated":
      return "destructive";
    default:
      return "default";
  }
};

const statusToNumber = (status: Agreement['status']): number => {
  switch (status) {
    case 'Active': return 1;
    case 'Pending': return 2;
    case 'Expired': return 3;
    case 'Terminated': return 4;
    default: return 0;
  }
};

export function SignedAgreements({ 
  searchQuery = "", 
  typeFilter = "all",
  dateFilter = "all",
  branchId
}: SignedAgreementsProps) {
  const [viewingAgreementId, setViewingAgreementId] = useState<string | null>(null);
  const [partyFilter, setPartyFilter] = useState<AgreementPartyFilter>("all");
  
  const { data: agreements, isLoading, isError, error } = useSignedAgreements({
    searchQuery,
    typeFilter,
    dateFilter,
    branchId,
    partyFilter,
  });

  const deleteAgreementMutation = useDeleteAgreement();

  const handleDeleteAgreement = (id: string) => {
    if(window.confirm("Are you sure you want to delete this agreement?")) {
      deleteAgreementMutation.mutate(id);
    }
  };

  const viewingAgreement = agreements?.find(a => a.id === viewingAgreementId);

  const handleDownload = (agreement: Agreement) => {
    if (!agreement) return;
    generatePDF({
      id: agreement.id,
      title: agreement.title,
      date: agreement.signed_at ? format(new Date(agreement.signed_at), 'dd MMM yyyy') : 'N/A',
      status: agreement.status,
      signedBy: agreement.signed_by_name || 'N/A',
    });
    toast.success(`Downloaded ${agreement.title}`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <>
      {branchId && (
        <div className="px-4 py-2 bg-card">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium">Filter by:</span>
            <select 
              className="px-2 py-1 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value as AgreementPartyFilter)}
            >
              <option value="all">All Parties</option>
              <option value="client">Client Agreements</option>
              <option value="staff">Staff Agreements</option>
            </select>
          </div>
        </div>
      )}

      <div className="w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[5%]">#</TableHead>
              <TableHead className="w-[20%]">Title</TableHead>
              <TableHead className="w-[20%]">Signed By</TableHead>
              <TableHead className="w-[15%]">Date</TableHead>
              <TableHead className="w-[15%]">Type</TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agreements && agreements.length > 0 ? (
              agreements.map((agreement, index) => (
                <TableRow key={agreement.id} className="hover:bg-accent/50">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">{agreement.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {agreement.signing_party === "client" ? (
                        <User className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-primary" />
                      )}
                      <span>{agreement.signed_by_name}</span>
                      {agreement.signing_party && <Badge variant="outline" className="text-xs capitalize">
                        {agreement.signing_party}
                      </Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{agreement.signed_at ? format(new Date(agreement.signed_at), 'dd MMM yyyy') : 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{agreement.agreement_types?.name || 'N/A'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={getStatusBadgeVariant(agreement.status)}
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
                        onClick={() => setViewingAgreementId(agreement.id)}
                      >
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownload(agreement)}
                      >
                        <Download className="h-4 w-4 text-primary" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteAgreement(agreement.id)}
                        disabled={deleteAgreementMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-1 py-4 text-muted-foreground">
                    <FileText className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm">No signed agreements found</p>
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

      <ViewAgreementDialog 
        open={viewingAgreementId !== null} 
        onOpenChange={(open) => !open && setViewingAgreementId(null)}
        agreement={viewingAgreement}
        onDownload={handleDownload}
      />
    </>
  );
}
