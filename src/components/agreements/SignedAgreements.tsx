import React, { useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Eye, Download, FileText, Calendar, User, Trash2, UserCheck, Loader2, Users,
  CheckCircle, XCircle, Archive, Clock, AlertCircle
} from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generatePDF } from "@/utils/pdfGenerator";
import { ViewAgreementDialog } from "./ViewAgreementDialog";
import { ExpiryBadge } from "./ExpiryBadge";
import { useSignedAgreements, useDeleteAgreement } from "@/data/hooks/agreements";
import { Agreement, AgreementPartyFilter, ApprovalStatusFilter } from "@/types/agreements";
import { format } from "date-fns";
import type { VariantProps } from "class-variance-authority";
import { UnifiedShareDialog } from "@/components/sharing/UnifiedShareDialog";
import { Share2 } from "lucide-react";

type SignedAgreementsProps = {
  searchQuery?: string;
  typeFilter?: string;
  dateFilter?: string;
  branchId?: string;
  isOrganizationLevel?: boolean;
  approvalFilter?: ApprovalStatusFilter;
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

const getApprovalBadge = (approvalStatus?: string) => {
  if (!approvalStatus) return null;
  
  switch (approvalStatus) {
    case 'pending_review':
      return <Badge variant="warning" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" />Review</Badge>;
    case 'approved':
      return <Badge variant="success" className="text-xs"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    case 'rejected':
      return <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    case 'archived':
      return <Badge variant="secondary" className="text-xs"><Archive className="h-3 w-3 mr-1" />Archived</Badge>;
    default:
      return null;
  }
};

export function SignedAgreements({ 
  searchQuery = "", 
  typeFilter = "all",
  dateFilter = "all",
  branchId,
  isOrganizationLevel = false,
  approvalFilter = "all"
}: SignedAgreementsProps) {
  const [viewingAgreementId, setViewingAgreementId] = useState<string | null>(null);
  const [partyFilter, setPartyFilter] = useState<AgreementPartyFilter>("all");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [agreementToShare, setAgreementToShare] = useState<Agreement | null>(null);
  
  const { data: agreements, isLoading, isError, error } = useSignedAgreements({
    searchQuery,
    typeFilter,
    dateFilter,
    branchId,
    partyFilter,
    isOrganizationLevel,
    approvalFilter,
  });

  const deleteAgreementMutation = useDeleteAgreement();

  const handleDeleteAgreement = (id: string) => {
    if(window.confirm("Are you sure you want to delete this agreement?")) {
      deleteAgreementMutation.mutate(id);
    }
  };

  const handleShareAgreement = (agreement: Agreement) => {
    setAgreementToShare(agreement);
    setShareDialogOpen(true);
  };

  const handleGenerateAgreementPDF = async (): Promise<Blob> => {
    if (!agreementToShare) return new Blob();
    
    const agreementData = {
      id: agreementToShare.id,
      title: agreementToShare.title,
      date: agreementToShare.signed_at || agreementToShare.created_at,
      status: agreementToShare.status,
      signedBy: agreementToShare.signed_by_name || 'Not signed',
    };
    
    await generatePDF(agreementData);
    
    // Generate a simple PDF blob for now
    return new Blob(['Agreement PDF content'], { type: 'application/pdf' });
  };

  const viewingAgreement = agreements?.find(a => a.id === viewingAgreementId);

  const handleDownload = (agreement: Agreement) => {
    if (!agreement) return;
    const signers = agreement.agreement_signers || [];
    const signersText = signers.length > 0 
      ? signers.map(s => s.signer_name).join(', ')
      : (agreement.signed_by_name || 'N/A');
    
    generatePDF({
      id: agreement.id,
      title: agreement.title,
      date: agreement.signed_at ? format(new Date(agreement.signed_at), 'dd MMM yyyy') : 'N/A',
      status: agreement.status,
      signedBy: signersText,
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
              <TableHead className="w-[18%]">Signed By</TableHead>
              <TableHead className="w-[12%]">Date</TableHead>
              <TableHead className="w-[12%]">Type</TableHead>
              <TableHead className="w-[12%]">Expiry Date</TableHead>
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
                      {agreement.agreement_signers && agreement.agreement_signers.length > 0 ? (
                        <>
                          <Users className="h-4 w-4 text-primary" />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {agreement.agreement_signers.length} {agreement.agreement_signers.length === 1 ? 'Signer' : 'Signers'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {agreement.agreement_signers.slice(0, 2).map(s => s.signer_name).join(', ')}
                              {agreement.agreement_signers.length > 2 && ` +${agreement.agreement_signers.length - 2} more`}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          {agreement.signing_party === "client" ? (
                            <User className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-primary" />
                          )}
                          <span>{agreement.signed_by_name || 'No signers'}</span>
                        </>
                      )}
                      {agreement.signing_party && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {agreement.signing_party}
                        </Badge>
                      )}
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
                    {agreement.expiry_date ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">
                          {format(new Date(agreement.expiry_date), 'dd MMM yyyy')}
                        </span>
                        {agreement.status === 'Active' && (
                          <ExpiryBadge expiryDate={agreement.expiry_date} />
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No expiry</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge 
                        variant={getStatusBadgeVariant(agreement.status)}
                      >
                        {agreement.status}
                      </Badge>
                      {getApprovalBadge(agreement.approval_status)}
                    </div>
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
                        className="h-8 w-8 p-0"
                        onClick={() => handleShareAgreement(agreement)}
                      >
                        <Share2 className="h-4 w-4 text-blue-600" />
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

      {agreementToShare && (
        <UnifiedShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          contentId={agreementToShare.id}
          contentType="agreement"
          contentTitle={agreementToShare.title}
          branchId={branchId || agreementToShare.branch_id || ''}
          onGeneratePDF={handleGenerateAgreementPDF}
        />
      )}
    </>
  );
}
