import React from "react";
import { Mail, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateCarerProfilePDF } from "@/utils/pdfGenerator";
import { toast } from "@/hooks/use-toast";

interface CarerProfileSharingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    status: string;
    specialization: string;
    experience: string;
    hire_date: string;
  };
  branchId: string;
}

export function CarerProfileSharingDialog({
  open,
  onOpenChange,
  carer,
  branchId,
}: CarerProfileSharingDialogProps) {
  const handleExportAndShare = () => {
    generateCarerProfilePDF(carer, branchId);

    toast({
      title: "Success",
      description: "Carer profile exported successfully. You can now share the PDF file.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Carer Profile - {carer.first_name} {carer.last_name}
          </DialogTitle>
          <DialogDescription>
            Export the carer's profile as a PDF document for secure sharing via email or other means.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900">Export & Email</h4>
            <p className="text-sm text-green-700 mt-1">
              Download the carer profile as a PDF document for secure sharing via email or other means.
            </p>
          </div>

          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h5 className="font-medium mb-2">What's included in the export:</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Personal information and contact details</li>
                <li>• Professional qualifications and experience</li>
                <li>• Employment history and status</li>
                <li>• Training records and certifications</li>
                <li>• DBS check status and expiry dates</li>
                <li>• Bank details (if available)</li>
              </ul>
            </div>

            <Button onClick={handleExportAndShare} className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Export Profile as PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}