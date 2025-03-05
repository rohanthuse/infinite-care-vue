
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, FileText } from "lucide-react";
import { generatePDF } from "@/utils/pdfGenerator";
import { toast } from "@/hooks/use-toast";

// Mock data for agreements
const agreementsData = [
  { 
    id: 1, 
    title: "Service Level Agreement", 
    date: "2023-05-15", 
    status: "Active",
    signedBy: "John Doe" 
  },
  { 
    id: 2, 
    title: "Confidentiality Agreement", 
    date: "2023-06-22", 
    status: "Active",
    signedBy: "John Doe" 
  },
  { 
    id: 3, 
    title: "Data Processing Agreement", 
    date: "2023-07-30", 
    status: "Active",
    signedBy: "John Doe" 
  },
  { 
    id: 4, 
    title: "Annual Service Contract", 
    date: "2023-08-12", 
    status: "Active",
    signedBy: "Jane Smith" 
  },
];

export const AgreementList = () => {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<typeof agreementsData[0] | null>(null);

  const handleView = (agreement: typeof agreementsData[0]) => {
    setSelectedAgreement(agreement);
    setIsViewOpen(true);
  };

  const handleDownload = (agreement: typeof agreementsData[0]) => {
    generatePDF(agreement);
    toast({
      title: "Download started",
      description: `${agreement.title} is being downloaded.`,
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle>Signed Agreements</CardTitle>
        <CardDescription>
          View and download agreements signed with the super admin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Agreement Title</TableHead>
              <TableHead className="w-[15%]">Signed Date</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[15%]">Signed By</TableHead>
              <TableHead className="w-[15%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agreementsData.map((agreement) => (
              <TableRow key={agreement.id}>
                <TableCell className="font-medium">{agreement.title}</TableCell>
                <TableCell>{new Date(agreement.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800 font-medium border-0 rounded-full px-3">
                    {agreement.status}
                  </Badge>
                </TableCell>
                <TableCell>{agreement.signedBy}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(agreement)}
                    className="h-8 px-3 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(agreement)}
                    className="h-8 px-3 text-xs"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedAgreement?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-4 border rounded-md bg-gray-50 max-h-[60vh] overflow-auto">
            <h3 className="text-lg font-bold mb-4">{selectedAgreement?.title}</h3>
            <p className="mb-2"><strong>Signed on:</strong> {selectedAgreement?.date && new Date(selectedAgreement.date).toLocaleDateString()}</p>
            <p className="mb-4"><strong>Signed by:</strong> {selectedAgreement?.signedBy}</p>
            
            <div className="prose prose-sm max-w-none">
              <h4>Agreement Terms</h4>
              <p>This Agreement ("Agreement") is entered into by and between Med-Infinite ("Company") and the undersigned party ("Client").</p>
              
              <h5>1. Services</h5>
              <p>The Company agrees to provide healthcare management services as described in the attached Schedule of Services.</p>
              
              <h5>2. Term</h5>
              <p>This Agreement shall commence on the date of signing and shall continue for a period of 12 months unless terminated earlier as provided herein.</p>
              
              <h5>3. Fees and Payment</h5>
              <p>Client agrees to pay the Company the fees as set forth in the attached Fee Schedule. Payments are due within 30 days of receipt of invoice.</p>
              
              <h5>4. Confidentiality</h5>
              <p>Each party shall maintain the confidentiality of all proprietary or confidential information provided by the other party.</p>
              
              <h5>5. Termination</h5>
              <p>Either party may terminate this Agreement with 30 days written notice to the other party.</p>
              
              <h5>6. Governing Law</h5>
              <p>This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the Company is located.</p>
              
              <h5>7. Entire Agreement</h5>
              <p>This Agreement constitutes the entire understanding between the parties concerning the subject matter hereof.</p>
              
              <div className="mt-8 pt-4 border-t">
                <p className="italic">Signed and agreed to by authorized representatives of both parties on the date indicated.</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsViewOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedAgreement) {
                  handleDownload(selectedAgreement);
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
