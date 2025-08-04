import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ClientChangeRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitRequest: (comments: string) => void;
  carePlan: any;
  isLoading: boolean;
  hasExistingRequest: boolean;
  existingRequestDate?: string;
  existingComments?: string;
}

export const ClientChangeRequestDialog: React.FC<ClientChangeRequestDialogProps> = ({
  open,
  onOpenChange,
  onSubmitRequest,
  carePlan,
  isLoading,
  hasExistingRequest,
  existingRequestDate,
  existingComments
}) => {
  const [comments, setComments] = useState('');

  const handleSubmit = () => {
    if (!comments.trim()) return;
    onSubmitRequest(comments);
    setComments('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setComments('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Request Care Plan Changes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {hasExistingRequest && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Previous Request Pending</span>
              </div>
              <p className="text-sm text-amber-700 mb-2">
                You already submitted a change request on {existingRequestDate}
              </p>
              {existingComments && (
                <div className="text-sm">
                  <strong>Your previous comment:</strong>
                  <p className="mt-1 text-amber-700 italic">"{existingComments}"</p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comments">
              {hasExistingRequest ? 'Additional Comments' : 'What changes would you like to request?'}
            </Label>
            <Textarea
              id="comments"
              placeholder="Please describe what changes you would like to see in your care plan..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Care Plan:</strong> {carePlan?.display_id}
            </p>
            <p className="text-sm text-blue-700">
              <strong>Provider:</strong> {carePlan?.provider_name}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!comments.trim() || isLoading}
          >
            {isLoading ? 'Submitting...' : hasExistingRequest ? 'Add Comments' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};