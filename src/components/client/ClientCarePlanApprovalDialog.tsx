import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignatureCanvas } from '@/components/ui/signature-canvas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  User,
  Pill,
  Activity,
  Target
} from 'lucide-react';
import { CarePlanWithDetails } from '@/hooks/useCarePlanData';
import { toast } from 'sonner';

interface ClientCarePlanApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carePlan: CarePlanWithDetails;
  onApprove: (signatureData: string, comments: string) => Promise<void>;
  onReject: (comments: string) => Promise<void>;
  isLoading?: boolean;
}

export function ClientCarePlanApprovalDialog({
  open,
  onOpenChange,
  carePlan,
  onApprove,
  onReject,
  isLoading = false,
}: ClientCarePlanApprovalDialogProps) {
  const [comments, setComments] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [hasReadPlan, setHasReadPlan] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');

  const steps = [
    { id: 'review', title: 'Review Care Plan', icon: FileText },
    { id: 'signature', title: 'Digital Signature', icon: User },
  ];

  const handleApprove = async () => {
    if (!signatureData || signatureData.trim() === '') {
      toast.error('Please provide your digital signature');
      return;
    }

    try {
      await onApprove(signatureData, comments);
      onOpenChange(false);
      setCurrentStep(0);
      setComments('');
      setHasReadPlan(false);
      setSignatureData('');
    } catch (error: any) {
      console.error('Error approving care plan:', error);
      // Let the hook's onError handle the specific error message
      // This provides a fallback in case the hook doesn't catch it
      if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to approve care plan. Please try again.');
      }
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      toast.error('Please provide comments when requesting changes');
      return;
    }

    try {
      await onReject(comments);
      onOpenChange(false);
      setCurrentStep(0);
      setComments('');
      setHasReadPlan(false);
    } catch (error: any) {
      console.error('Error rejecting care plan:', error);
      // Let the hook's onError handle the specific error message
      if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to request changes. Please try again.');
      }
    }
  };

  const canProceedToSignature = hasReadPlan;
  const canApprove = canProceedToSignature && signatureData && signatureData.trim() !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Care Plan Approval Required
          </DialogTitle>
          <DialogDescription>
            Please review your care plan carefully and provide your digital signature to acknowledge your agreement.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex-shrink-0 flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2 md:space-x-4 overflow-x-auto pb-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep || (index === 0 && hasReadPlan);
              
              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
                    ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 
                      isActive ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}
                  `}>
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`ml-2 text-sm font-medium whitespace-nowrap ${
                    isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-4 md:w-8 h-0.5 mx-2 md:mx-4 ${
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          {currentStep === 0 && (
            <div className="h-full flex flex-col min-h-0">
              {/* Care Plan Summary */}
              <Card className="flex-shrink-0 mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between flex-wrap gap-2">
                    <span className="min-w-0 truncate">{carePlan.title}</span>
                    <Badge variant="outline" className="flex-shrink-0">
                      {carePlan.status === 'pending_client_approval' ? 'Pending Approval' : carePlan.status}
                    </Badge>
                  </CardTitle>
                  <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 md:gap-4">
                    <span className="min-w-0">Provider: {carePlan.provider_name}</span>
                    <span className="flex-shrink-0">Plan ID: {carePlan.display_id}</span>
                    {carePlan.review_date && (
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        Next Review: {new Date(carePlan.review_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardHeader>
              </Card>

              {/* Acknowledgment */}
              <Card className="flex-1 min-h-0">
                <CardContent className="pt-6 h-full flex items-center justify-center">
                  <div className="flex items-start gap-3 max-w-md">
                    <input
                      type="checkbox"
                      id="readPlan"
                      checked={hasReadPlan}
                      onChange={(e) => setHasReadPlan(e.target.checked)}
                      className="mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="readPlan" className="text-sm font-medium cursor-pointer">
                        I have thoroughly reviewed this care plan
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Please confirm that you have read and understood all sections of your care plan including goals, medications, and activities.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 1 && (
            <div className="h-full flex flex-col space-y-4 min-h-0">
              <Card className="min-h-[400px]">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Digital Signature Required
                  </CardTitle>
                  <CardDescription>
                    By signing below, you acknowledge that you have read, understood, and agree to this care plan.
                    <br />
                    <strong>Instructions:</strong> Draw your signature in the box below using your mouse or finger, then click "Save" to confirm.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-y-auto max-h-[320px] space-y-4 pb-4">
                  <SignatureCanvas
                    onSave={(signature) => {
                      setSignatureData(signature);
                    }}
                    width={Math.min(500, window.innerWidth - 100)}
                    height={200}
                    disabled={isLoading}
                  />
                  {signatureData && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-sm text-green-800 dark:text-green-300 font-medium">Signature captured successfully</span>
                    </div>
                  )}
                  {!signatureData && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="text-sm text-blue-800 dark:text-blue-300">Please draw your signature above and click "Save" to continue</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="flex-1 min-h-0">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-base">Comments (Optional)</CardTitle>
                  <CardDescription>
                    Any additional comments or questions about your care plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter any comments or questions you have about this care plan..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    disabled={isLoading}
                    rows={4}
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 mt-4">
          {currentStep === 0 && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={() => setCurrentStep(1)}
                disabled={!canProceedToSignature || isLoading}
              >
                Continue to Signature
              </Button>
            </>
          )}

          {currentStep === 1 && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep(0)} disabled={isLoading}>
                Back to Review
              </Button>
              <Button
                onClick={handleApprove}
                disabled={!canApprove || isLoading}
              >
                {isLoading ? 'Processing...' : 'Sign & Approve Care Plan'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}