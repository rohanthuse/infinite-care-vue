
import React, { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Eye, Download, FileText, Calendar, User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generatePDF } from "@/utils/pdfGenerator";

// Mock data for agreements
const agreementsData = [
  {
    id: 1,
    title: "Employment Contract",
    signedBy: "Aderinsola Thomas",
    signedDate: "15 May 2023",
    type: "Employment Agreement",
    status: "Active"
  },
  {
    id: 2,
    title: "Non-Disclosure Agreement",
    signedBy: "James Wilson",
    signedDate: "24 June 2023",
    type: "NDA",
    status: "Active"
  },
  {
    id: 3,
    title: "Service Level Agreement",
    signedBy: "Sophia Martinez",
    signedDate: "07 August 2023",
    type: "Service Agreement",
    status: "Active"
  },
  {
    id: 4,
    title: "Caretaker Contract",
    signedBy: "Michael Johnson",
    signedDate: "12 September 2023",
    type: "Employment Agreement",
    status: "Active"
  },
  {
    id: 5,
    title: "Data Processing Agreement",
    signedBy: "Emma Williams",
    signedDate: "05 October 2023",
    type: "Data Agreement",
    status: "Active"
  },
  {
    id: 6,
    title: "Branch Operational Agreement",
    signedBy: "Daniel Smith",
    signedDate: "18 November 2023",
    type: "Service Agreement",
    status: "Active"
  },
  {
    id: 7,
    title: "Client Care Agreement",
    signedBy: "Olivia Brown",
    signedDate: "29 December 2023",
    type: "Service Agreement",
    status: "Expired"
  },
  {
    id: 8,
    title: "Staff Training Agreement",
    signedBy: "William Taylor",
    signedDate: "14 January 2024",
    type: "Employment Agreement",
    status: "Active"
  }
];

type AgreementListProps = {
  searchQuery?: string;
};

export function AgreementList({ searchQuery = "" }: AgreementListProps) {
  const [agreements, setAgreements] = useState(agreementsData);
  const [filteredAgreements, setFilteredAgreements] = useState(agreements);
  
  useEffect(() => {
    if (!searchQuery) {
      setFilteredAgreements(agreements);
    } else {
      const filtered = agreements.filter(
        agreement => 
          agreement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agreement.signedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agreement.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAgreements(filtered);
    }
  }, [searchQuery, agreements]);
  
  const handleView = (id: number) => {
    // In a real app, this would open the agreement viewer
    toast.success(`Viewing agreement #${id}`);
  };
  
  const handleDownload = (id: number, title: string) => {
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
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="w-[5%]">#</TableHead>
            <TableHead className="w-[30%]">Title</TableHead>
            <TableHead className="w-[20%]">Signed By</TableHead>
            <TableHead className="w-[15%]">Date</TableHead>
            <TableHead className="w-[15%]">Type</TableHead>
            <TableHead className="w-[15%]">Status</TableHead>
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
                      onClick={() => handleDownload(agreement.id, agreement.title)}
                    >
                      <Download className="h-4 w-4 text-blue-600" />
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
  );
}
