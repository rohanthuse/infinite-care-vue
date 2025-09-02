
import React from "react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Eye, Download, FileText, Calendar, Badge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generatePDF } from "@/utils/pdfGenerator";
import { ViewAgreementDialog } from "./ViewAgreementDialog";
import { useSignedAgreements } from "@/data/hooks/agreements";
import { Agreement } from "@/types/agreements";
import { format } from "date-fns";
import { useState } from "react";

const getStatusColor = (status: Agreement["status"]) => {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-800";
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "Expired":
      return "bg-red-100 text-red-800";
    case "Terminated":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function MyAgreements() {
  const [viewingAgreementId, setViewingAgreementId] = useState<string | null>(null);
  
  const { data: agreements, isLoading, error } = useSignedAgreements({
    searchQuery: "",
    typeFilter: "all",
    dateFilter: "all"
  });

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
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading your agreements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading agreements: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Agreements</h2>
          <p className="text-muted-foreground">
            View and download agreements signed with you
          </p>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agreement Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Signed Date</TableHead>
              <TableHead>Status</TableHead>
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
                      <div>
                        <p className="font-medium">{agreement.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Signed by: {agreement.signed_by_name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {agreement.agreement_types?.name || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {agreement.signed_at 
                          ? format(new Date(agreement.signed_at), 'dd MMM yyyy') 
                          : 'Not signed'
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agreement.status)}`}
                    >
                      {agreement.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewingAgreementId(agreement.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownload(agreement)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 py-4 text-muted-foreground">
                    <FileText className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm">No agreements found</p>
                    <p className="text-xs text-muted-foreground/70">
                      Agreements signed with you will appear here
                    </p>
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
    </div>
  );
}
