import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ViewSignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signerName: string;
  signatureUrl: string | null;
}

export const ViewSignatureModal: React.FC<ViewSignatureModalProps> = ({
  open,
  onOpenChange,
  signerName,
  signatureUrl
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Digital Signature</DialogTitle>
          <DialogDescription>
            Signature from {signerName}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center p-6 bg-muted rounded-lg min-h-[200px]">
          {signatureUrl ? (
            <img 
              src={signatureUrl} 
              alt={`Signature of ${signerName}`}
              className="max-w-full max-h-[300px] object-contain"
            />
          ) : (
            <p className="text-sm text-muted-foreground">No signature available</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
