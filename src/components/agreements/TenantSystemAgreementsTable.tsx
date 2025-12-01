import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, FileText, Calendar, Loader2, Download } from "lucide-react";
import { format } from "date-fns";
import { useTenantSystemAgreements } from "@/hooks/useTenantSystemAgreements";
import { ViewSystemTenantAgreementDialog } from "@/components/system/tenant-agreements/ViewSystemTenantAgreementDialog";
import type { SystemTenantAgreement } from "@/types/systemTenantAgreements";
import { generateAgreementPDF } from "@/utils/agreementPdfGenerator";
import { useToast } from "@/hooks/use-toast";

export function TenantSystemAgreementsTable() {
  const { data: agreements, isLoading, isError, error } = useTenantSystemAgreements();
  const [viewingAgreementId, setViewingAgreementId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      Active: 'bg-green-500/10 text-green-700 dark:text-green-400',
      Draft: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
      Pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
      Terminated: 'bg-red-500/10 text-red-700 dark:text-red-400',
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-500/10'}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateValue: string | null | undefined) => {
    if (!dateValue) return 'N/A';
    try {
      return format(new Date(dateValue), 'dd MMM yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const handleDownloadPDF = async (agreement: SystemTenantAgreement) => {
    try {
      await generateAgreementPDF(agreement);
      toast({
        title: "PDF Generated",
        description: "Agreement PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center">
        <div className="text-destructive mb-4">
          {error?.message === 'No organization found' 
            ? 'Unable to identify your organization. Please refresh the page.'
            : `Error loading agreements: ${error?.message || 'Unknown error'}`}
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[5%]">#</TableHead>
              <TableHead className="w-[25%]">Agreement Title</TableHead>
              <TableHead className="w-[15%]">Agreement Type</TableHead>
              <TableHead className="w-[15%]">Start Date</TableHead>
              <TableHead className="w-[15%]">End Date</TableHead>
              <TableHead className="w-[12%]">Signed Date</TableHead>
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
                    <span className="text-muted-foreground">
                      {agreement.system_tenant_agreement_types?.name || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(agreement.start_date)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(agreement.expiry_date)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatDate(agreement.signed_at || agreement.tenant_signature_date)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(agreement.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewingAgreementId(agreement.id)}
                        title="View agreement details"
                      >
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownloadPDF(agreement)}
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4 text-primary" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-1 py-4 text-muted-foreground">
                    <FileText className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm">No agreements found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {viewingAgreementId && agreements && (
        <ViewSystemTenantAgreementDialog 
          open={!!viewingAgreementId} 
          onOpenChange={(open) => !open && setViewingAgreementId(null)}
          agreement={agreements.find(a => a.id === viewingAgreementId)!}
        />
      )}
    </>
  );
}
