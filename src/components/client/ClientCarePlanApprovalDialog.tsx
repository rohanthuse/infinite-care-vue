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
    } catch (error) {
      console.error('Error approving care plan:', error);
      toast.error('Failed to approve care plan. Please try again.');
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
    } catch (error) {
      console.error('Error rejecting care plan:', error);
      toast.error('Failed to request changes. Please try again.');
    }
  };

  const canProceedToSignature = hasReadPlan;
  const canApprove = canProceedToSignature && signatureData && signatureData.trim() !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-6xl h-[95vh] flex flex-col">
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

        <div className="flex-1 min-h-0 overflow-hidden">
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

              {/* Care Plan Content */}
              <Card className="flex-1 min-h-0">
                <CardContent className="p-0 h-full flex flex-col">
                  <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
                    <div className="flex-shrink-0 p-4 border-b">
                      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
                        <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
                        <TabsTrigger value="goals" className="text-xs md:text-sm">Goals</TabsTrigger>
                        <TabsTrigger value="medications" className="text-xs md:text-sm">Medications</TabsTrigger>
                        <TabsTrigger value="activities" className="text-xs md:text-sm">Activities</TabsTrigger>
                      </TabsList>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                      <div className="p-4">
                        <TabsContent value="overview" className="mt-0">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Care Plan Overview</h4>
                              <p className="text-sm text-muted-foreground">
                                {carePlan.notes || 'This care plan has been specifically designed for your needs by your healthcare team.'}
                              </p>
                            </div>
                            
                            {carePlan.goals_progress !== undefined && (
                              <div>
                                <h4 className="font-medium mb-2">Overall Progress</h4>
                                <div className="flex items-center gap-3">
                                  <Progress value={carePlan.goals_progress} className="flex-1" />
                                  <span className="text-sm font-medium">{carePlan.goals_progress}%</span>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
                              <div className="p-2 md:p-3 bg-muted rounded-lg">
                                <Target className="h-4 md:h-5 w-4 md:w-5 mx-auto mb-1 text-primary" />
                                <div className="text-sm font-medium">{carePlan.goals?.length || 0}</div>
                                <div className="text-xs text-muted-foreground">Goals</div>
                              </div>
                              <div className="p-2 md:p-3 bg-muted rounded-lg">
                                <Pill className="h-4 md:h-5 w-4 md:w-5 mx-auto mb-1 text-primary" />
                                <div className="text-sm font-medium">{carePlan.medications?.length || 0}</div>
                                <div className="text-xs text-muted-foreground">Medications</div>
                              </div>
                              <div className="p-2 md:p-3 bg-muted rounded-lg">
                                <Activity className="h-4 md:h-5 w-4 md:w-5 mx-auto mb-1 text-primary" />
                                <div className="text-sm font-medium">{carePlan.activities?.length || 0}</div>
                                <div className="text-xs text-muted-foreground">Activities</div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="goals" className="mt-0">
                          <div className="space-y-3">
                            {carePlan.goals && carePlan.goals.length > 0 ? (
                              carePlan.goals.map((goal) => (
                                <Card key={goal.id} className="p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <h5 className="font-medium text-sm">{goal.description}</h5>
                                    <Badge variant="secondary" className="text-xs">
                                      {goal.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Progress value={goal.progress || 0} className="flex-1 h-1" />
                                    <span className="text-xs text-muted-foreground">{goal.progress || 0}%</span>
                                  </div>
                                  {goal.notes && (
                                    <p className="text-xs text-muted-foreground">{goal.notes}</p>
                                  )}
                                </Card>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No goals defined in this care plan.
                              </p>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="medications" className="mt-0">
                          <div className="space-y-3">
                            {carePlan.medications && carePlan.medications.length > 0 ? (
                              carePlan.medications.map((med) => (
                                <Card key={med.id} className="p-3">
                                  <div className="flex justify-between items-start mb-1">
                                    <h5 className="font-medium text-sm">{med.name}</h5>
                                    <Badge variant="secondary" className="text-xs">
                                      {med.status}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {med.dosage} • {med.frequency}
                                  </p>
                                  <div className="text-xs text-muted-foreground">
                                    Start: {new Date(med.start_date).toLocaleDateString()}
                                    {med.end_date && (
                                      <span> • End: {new Date(med.end_date).toLocaleDateString()}</span>
                                    )}
                                  </div>
                                </Card>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No medications defined in this care plan.
                              </p>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="activities" className="mt-0">
                          <div className="space-y-3">
                            {carePlan.activities && carePlan.activities.length > 0 ? (
                              carePlan.activities.map((activity) => (
                                <Card key={activity.id} className="p-3">
                                  <div className="flex justify-between items-start mb-1">
                                    <h5 className="font-medium text-sm">{activity.name}</h5>
                                    <Badge variant="secondary" className="text-xs">
                                      {activity.status}
                                    </Badge>
                                  </div>
                                  {activity.description && (
                                    <p className="text-xs text-muted-foreground mb-2">{activity.description}</p>
                                  )}
                                  <div className="text-xs text-muted-foreground">
                                    Frequency: {activity.frequency}
                                  </div>
                                </Card>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No activities defined in this care plan.
                              </p>
                            )}
                          </div>
                        </TabsContent>
                      </div>
                    </ScrollArea>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Acknowledgment */}
              <Card className="flex-shrink-0 mt-4">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
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
              <Card className="flex-shrink-0">
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
                <CardContent className="space-y-4">
                  <div className="bg-muted/30 p-2 md:p-4 rounded-lg overflow-hidden">
                    <SignatureCanvas
                      onSave={(signature) => {
                        setSignatureData(signature);
                      }}
                      width={Math.min(500, window.innerWidth - 100)}
                      height={200}
                      disabled={isLoading}
                    />
                  </div>
                  {signatureData && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-800 font-medium">Signature captured successfully</span>
                    </div>
                  )}
                  {!signatureData && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-blue-800">Please draw your signature above and click "Save" to continue</span>
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
                variant="destructive"
                onClick={handleReject}
                disabled={isLoading}
              >
                Need to Add Some Changes
              </Button>
              <Button
                onClick={handleApprove}
                disabled={!canApprove || isLoading}
              >
                {isLoading ? 'Processing...' : 'Care Plan is Approved'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}