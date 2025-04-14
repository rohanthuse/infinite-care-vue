
import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Agreement {
  id: number;
  title: string;
  signedBy: string;
  signedDate: string;
  type: string;
  status: string;
  content: string;
}

interface ViewAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: number | null;
  agreements: Agreement[];
  onDownload: (id: number) => void;
}

export function ViewAgreementDialog({
  open,
  onOpenChange,
  agreementId,
  agreements,
  onDownload
}: ViewAgreementDialogProps) {
  const agreement = agreements.find(a => a.id === agreementId) || null;

  if (!agreement) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{agreement.title}</DialogTitle>
          <DialogDescription>
            Signed by {agreement.signedBy} on {agreement.signedDate}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <Badge 
              className={
                agreement.status === "Active" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-amber-100 text-amber-800"
              }
            >
              {agreement.status}
            </Badge>
            <span className="text-sm text-gray-500">Type: {agreement.type}</span>
          </div>
          
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50 min-h-[200px] text-gray-700">
            {agreement.content}
          </div>
          
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button 
              onClick={() => onDownload(agreement.id)}
            >
              <Download className="mr-2 h-4 w-4" /> 
              Download PDF
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
