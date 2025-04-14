
import React, { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Eye, Download, FileText, Calendar, User, PenLine, Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generatePDF } from "@/utils/pdfGenerator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ViewAgreementDialog } from "./ViewAgreementDialog";

// Mock data for signed agreements
const mockSignedAgreements = [
  {
    id: 1,
    title: "Employment Contract",
    signedBy: "Aderinsola Thomas",
    signedDate: "15 May 2023",
    type: "Employment Agreement",
    status: "Active",
    clientId: "CL001",
    content: "This is the employment agreement content for Aderinsola Thomas."
  },
  {
    id: 2,
    title: "Non-Disclosure Agreement",
    signedBy: "James Wilson",
    signedDate: "24 June 2023",
    type: "NDA",
    status: "Active",
    clientId: "CL002",
    content: "This is the non-disclosure agreement content for James Wilson."
  },
  {
    id: 3,
    title: "Service Level Agreement",
    signedBy: "Sophia Martinez",
    signedDate: "07 August 2023",
    type: "Service Agreement",
    status: "Active",
    clientId: "CL003",
    content: "This is the service level agreement content for Sophia Martinez."
  },
  {
    id: 4,
    title: "Caretaker Contract",
    signedBy: "Michael Johnson",
    signedDate: "12 September 2023",
    type: "Employment Agreement",
    status: "Active",
    clientId: "CL004",
    content: "This is the caretaker contract content for Michael Johnson."
  },
  {
    id: 5,
    title: "Data Processing Agreement",
    signedBy: "Emma Williams",
    signedDate: "05 October 2023",
    type: "Data Agreement",
    status: "Expired",
    clientId: "CL005",
    content: "This is the data processing agreement content for Emma Williams."
  },
  {
    id: 6,
    title: "Branch Operational Agreement",
    signedBy: "Daniel Smith",
    signedDate: "18 November 2023",
    type: "Service Agreement",
    status: "Active",
    clientId: "CL006",
    content: "This is the branch operational agreement content for Daniel Smith."
  },
];

type SignedAgreementsProps = {
  searchQuery?: string;
  typeFilter?: string;
  dateFilter?: string;
  branchId: string;
};

export function SignedAgreements({ 
  searchQuery = "", 
  typeFilter = "all",
  dateFilter = "all",
  branchId
}: SignedAgreementsProps) {
  const [agreements, setAgreements] = useState(mockSignedAgreements);
  const [filteredAgreements, setFilteredAgreements] = useState(agreements);
  const [viewingAgreementId, setViewingAgreementId] = useState<number | null>(null);
  
  // In a real implementation, this would fetch data based on the branch ID
  useEffect(() => {
    // Simulate API call to get agreements by branch
    setAgreements(mockSignedAgreements);
  }, [branchId]);
  
  useEffect(() => {
    let filtered = agreements;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        agreement => 
          agreement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agreement.signedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agreement.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter(agreement => agreement.type === typeFilter);
    }
    
    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch(dateFilter) {
        case "last7days":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "last30days":
          filterDate.setDate(now.getDate() - 30);
          break;
        case "last90days":
          filterDate.setDate(now.getDate() - 90);
          break;
      }
      
      filtered = filtered.filter(agreement => {
        const agreementDate = new Date(agreement.signedDate);
        return agreementDate >= filterDate;
      });
    }
    
    setFilteredAgreements(filtered);
  }, [searchQuery, typeFilter, dateFilter, agreements]);
  
  const handleView = (id: number) => {
    setViewingAgreementId(id);
  };
  
  const handleDownload = (id: number) => {
    const agreement = agreements.find(a => a.id === id);
    if (!agreement) return;
    
    // Convert the agreement to the format expected by generatePDF
    generatePDF({
      id: agreement.id,
      title: agreement.title,
      date: agreement.signedDate,
      status: agreement.status,
      signedBy: agreement.signedBy
    });
    
    toast.success(`Downloaded ${agreement.title}`);
  };

  const handleDeleteAgreement = (id: number) => {
    // In a real application, this would make an API call
    setAgreements(agreements.filter(a => a.id !== id));
    toast.success("Agreement deleted successfully");
  };

  return (
    <>
      <div className="w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-[5%]">#</TableHead>
              <TableHead className="w-[25%]">Title</TableHead>
              <TableHead className="w-[20%]">Signed By</TableHead>
              <TableHead className="w-[15%]">Date</TableHead>
              <TableHead className="w-[15%]">Type</TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAgreements.length > 0 ? (
              filteredAgreements.map((agreement) => (
                <TableRow key={agreement.id} className="border-b border-gray-100 hover:bg-gray-50/40">
                  <TableCell className="font-medium">{agreement.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-gray-800">{agreement.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{agreement.signedBy}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{agreement.signedDate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">{agreement.type}</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        agreement.status === "Active" 
                          ? "bg-green-100 text-green-800 hover:bg-green-100" 
                          : "bg-amber-100 text-amber-800 hover:bg-amber-100"
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
                        onClick={() => handleView(agreement.id)}
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownload(agreement.id)}
                      >
                        <Download className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDeleteAgreement(agreement.id)}
                      >
                        <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-1 py-4 text-gray-500">
                    <FileText className="h-10 w-10 text-gray-300" />
                    <p className="text-sm">No agreements found</p>
                    {searchQuery && (
                      <p className="text-xs text-gray-400">Try a different search term</p>
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
        agreementId={viewingAgreementId}
        agreements={agreements}
        onDownload={handleDownload}
      />
    </>
  );
}
