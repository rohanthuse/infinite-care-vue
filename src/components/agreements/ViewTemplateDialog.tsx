
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AgreementTemplate } from '@/types/agreements';
import { format } from 'date-fns';

interface ViewTemplateDialogProps {
  template: AgreementTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewTemplateDialog: React.FC<ViewTemplateDialogProps> = ({
  template,
  open,
  onOpenChange,
}) => {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template.title}</DialogTitle>
          <DialogDescription>
            Details for the agreement template.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <span className="text-gray-500">Type:</span>
            <span className="col-span-2 font-medium">{template.agreement_types?.name || 'N/A'}</span>

            <span className="text-gray-500">Created At:</span>
            <span className="col-span-2 font-medium">{format(new Date(template.created_at), 'dd MMM yyyy, HH:mm')}</span>

            <span className="text-gray-500">Last Updated:</span>
            <span className="col-span-2 font-medium">{format(new Date(template.updated_at), 'dd MMM yyyy, HH:mm')}</span>

            <span className="text-gray-500">Usage Count:</span>
            <span className="col-span-2 font-medium">{template.usage_count}</span>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Template Content</h4>
            <div className="prose prose-sm max-w-none p-4 border rounded-md bg-gray-50">
              {template.content ? (
                <div dangerouslySetInnerHTML={{ __html: template.content }} />
              ) : (
                <p className="text-gray-500 italic">No content available for this template.</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
