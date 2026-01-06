import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useStaffList } from '@/hooks/useAccountingData';
import { usePayrollBookingIntegration } from '@/hooks/usePayrollBookingIntegration';
import { useAuthSafe } from '@/hooks/useAuthSafe';
import { format, startOfWeek, endOfWeek, subWeeks, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface BulkPayrollGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  onPayrollCreated?: () => void;
}

interface StaffPayrollPreview {
  staffId: string;
  staffName: string;
  bookingsCount: number;
  totalHours: number;
  estimatedGrossPay: number;
  hasExistingPayroll: boolean;
  status: 'pending' | 'processing' | 'success' | 'error' | 'skipped';
  error?: string;
}

const BulkPayrollGenerationDialog: React.FC<BulkPayrollGenerationDialogProps> = ({
  isOpen,
  onClose,
  branchId,
  onPayrollCreated
}) => {
  const { user } = useAuthSafe();
  const [payPeriodStart, setPayPeriodStart] = useState<string>('');
  const [payPeriodEnd, setPayPeriodEnd] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [staffPreviews, setStaffPreviews] = useState<StaffPayrollPreview[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentStaff, setCurrentStaff] = useState<string>('');

  const { data: staffList = [], isLoading: isLoadingStaff } = useStaffList(branchId);
  const { 
    calculatePayrollFromBookings,
    useAutoGeneratePayroll,
    getBookingTimeData
  } = usePayrollBookingIntegration();

  const autoGeneratePayrollMutation = useAutoGeneratePayroll();

  // Initialize dates when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      setPayPeriodStart(format(lastWeekStart, 'yyyy-MM-dd'));
      setPayPeriodEnd(format(lastWeekEnd, 'yyyy-MM-dd'));
      setStaffPreviews([]);
      setCurrentProgress(0);
      setIsCalculating(false);
      setIsGenerating(false);
    }
  }, [isOpen]);

  // Calculate payroll previews for all staff
  const handleCalculateAll = async () => {
    if (!payPeriodStart || !payPeriodEnd) {
      toast.error('Please select a pay period');
      return;
    }

    setIsCalculating(true);
    setStaffPreviews([]);
    const previews: StaffPayrollPreview[] = [];

    try {
      for (let i = 0; i < staffList.length; i++) {
        const staff = staffList[i];
        setCurrentStaff(`${staff.first_name} ${staff.last_name}`);
        setCurrentProgress(Math.round(((i + 1) / staffList.length) * 100));

        try {
          const calculationData = await calculatePayrollFromBookings(
            branchId,
            staff.id,
            payPeriodStart,
            payPeriodEnd
          );

          // Calculate gross pay
          const completedBookingsPay = calculationData.bookings
            .filter(b => b.status !== 'cancelled')
            .reduce((sum, booking) => {
              const hours = (booking.actualMinutes || booking.scheduledMinutes) / 60;
              const rate = booking.appliedRate || calculationData.basHourlyRate;
              return sum + (hours * rate);
            }, 0);

          const grossPay = completedBookingsPay +
            (calculationData.overtimeHours * calculationData.overtimeRate) +
            calculationData.approvedExtraTimePayment +
            calculationData.travelCompensation +
            calculationData.cancelledBookingPayment;

          previews.push({
            staffId: staff.id,
            staffName: `${staff.first_name} ${staff.last_name}`,
            bookingsCount: calculationData.bookings.length,
            totalHours: calculationData.totalActualHours,
            estimatedGrossPay: grossPay,
            hasExistingPayroll: false,
            status: calculationData.bookings.length > 0 ? 'pending' : 'skipped'
          });
        } catch (error) {
          previews.push({
            staffId: staff.id,
            staffName: `${staff.first_name} ${staff.last_name}`,
            bookingsCount: 0,
            totalHours: 0,
            estimatedGrossPay: 0,
            hasExistingPayroll: false,
            status: 'skipped',
            error: 'No eligible bookings'
          });
        }
      }

      setStaffPreviews(previews);
    } catch (error) {
      console.error('Error calculating payroll previews:', error);
      toast.error('Failed to calculate payroll previews');
    } finally {
      setIsCalculating(false);
      setCurrentStaff('');
      setCurrentProgress(100);
    }
  };

  // Generate payroll for all eligible staff
  const handleGenerateAll = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    const eligibleStaff = staffPreviews.filter(p => p.status === 'pending' && p.bookingsCount > 0);
    
    if (eligibleStaff.length === 0) {
      toast.error('No eligible staff for payroll generation');
      return;
    }

    setIsGenerating(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < eligibleStaff.length; i++) {
      const staff = eligibleStaff[i];
      setCurrentStaff(staff.staffName);
      setCurrentProgress(Math.round(((i + 1) / eligibleStaff.length) * 100));

      // Update status to processing
      setStaffPreviews(prev => prev.map(p => 
        p.staffId === staff.staffId ? { ...p, status: 'processing' as const } : p
      ));

      try {
        await autoGeneratePayrollMutation.mutateAsync({
          branchId,
          staffId: staff.staffId,
          payPeriodStart,
          payPeriodEnd,
          createdBy: user.id
        });

        setStaffPreviews(prev => prev.map(p => 
          p.staffId === staff.staffId ? { ...p, status: 'success' as const } : p
        ));
        successCount++;
      } catch (error) {
        setStaffPreviews(prev => prev.map(p => 
          p.staffId === staff.staffId ? { 
            ...p, 
            status: 'error' as const, 
            error: (error as Error).message 
          } : p
        ));
        errorCount++;
      }
    }

    setIsGenerating(false);
    setCurrentStaff('');

    if (successCount > 0) {
      toast.success(`Successfully generated ${successCount} payroll records`);
      onPayrollCreated?.();
    }
    if (errorCount > 0) {
      toast.error(`Failed to generate ${errorCount} payroll records`);
    }
  };

  const eligibleCount = staffPreviews.filter(p => p.status === 'pending' && p.bookingsCount > 0).length;
  const skippedCount = staffPreviews.filter(p => p.status === 'skipped' || p.bookingsCount === 0).length;
  const successCount = staffPreviews.filter(p => p.status === 'success').length;
  const errorCount = staffPreviews.filter(p => p.status === 'error').length;

  const totalEstimatedPay = staffPreviews
    .filter(p => p.status === 'pending' || p.status === 'success')
    .reduce((sum, p) => sum + p.estimatedGrossPay, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Payroll Generation
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Pay Period Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pay Period Start</Label>
              <Input
                type="date"
                value={payPeriodStart}
                onChange={(e) => setPayPeriodStart(e.target.value)}
                disabled={isCalculating || isGenerating}
              />
            </div>
            <div className="space-y-2">
              <Label>Pay Period End</Label>
              <Input
                type="date"
                value={payPeriodEnd}
                onChange={(e) => setPayPeriodEnd(e.target.value)}
                disabled={isCalculating || isGenerating}
              />
            </div>
          </div>

          {/* Calculate Button */}
          {staffPreviews.length === 0 && !isCalculating && (
            <Button 
              onClick={handleCalculateAll}
              className="w-full"
              disabled={!payPeriodStart || !payPeriodEnd || isLoadingStaff}
            >
              <Zap className="h-4 w-4 mr-2" />
              Calculate Payroll for All {staffList.length} Staff
            </Button>
          )}

          {/* Progress Indicator */}
          {(isCalculating || isGenerating) && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm font-medium">
                      {isCalculating ? 'Calculating payroll...' : 'Generating payroll records...'}
                    </span>
                  </div>
                  <Progress value={currentProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    Processing: {currentStaff}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Cards */}
          {staffPreviews.length > 0 && !isCalculating && (
            <>
              <div className="grid grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-1" />
                    <div className="text-xl font-bold text-green-600">{eligibleCount + successCount}</div>
                    <div className="text-xs text-muted-foreground">Eligible</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <AlertCircle className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                    <div className="text-xl font-bold text-amber-600">{skippedCount}</div>
                    <div className="text-xs text-muted-foreground">No Bookings</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <Clock className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                    <div className="text-xl font-bold text-blue-600">
                      {staffPreviews.reduce((sum, p) => sum + p.totalHours, 0).toFixed(1)}h
                    </div>
                    <div className="text-xs text-muted-foreground">Total Hours</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <DollarSign className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                    <div className="text-xl font-bold text-purple-600">£{totalEstimatedPay.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">Est. Total</div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Staff List with Timesheet Preview */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Staff Payroll Summary (Timesheet)
                </h3>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-4">
                    {staffPreviews.map((preview) => (
                      <Card 
                        key={preview.staffId}
                        className={`border ${
                          preview.status === 'success' ? 'border-green-200 bg-green-50/30' :
                          preview.status === 'error' ? 'border-red-200 bg-red-50/30' :
                          preview.status === 'skipped' || preview.bookingsCount === 0 ? 'border-gray-200 bg-gray-50/30' :
                          preview.status === 'processing' ? 'border-blue-200 bg-blue-50/30' :
                          'border-border'
                        }`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {preview.status === 'processing' && (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                              )}
                              {preview.status === 'success' && (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              )}
                              {preview.status === 'error' && (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              )}
                              {(preview.status === 'pending' || preview.status === 'skipped') && (
                                <Users className="h-4 w-4 text-gray-400" />
                              )}
                              <div>
                                <div className="font-medium text-sm">{preview.staffName}</div>
                                {preview.error && (
                                  <div className="text-xs text-red-600">{preview.error}</div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm font-medium">{preview.bookingsCount} bookings</div>
                                <div className="text-xs text-muted-foreground">
                                  {preview.totalHours.toFixed(1)} hours
                                </div>
                              </div>
                              <div className="text-right min-w-[80px]">
                                <div className="text-sm font-bold text-primary">
                                  £{preview.estimatedGrossPay.toFixed(2)}
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    preview.status === 'success' ? 'border-green-300 text-green-700' :
                                    preview.status === 'error' ? 'border-red-300 text-red-700' :
                                    preview.status === 'skipped' || preview.bookingsCount === 0 ? 'border-gray-300 text-gray-600' :
                                    preview.status === 'processing' ? 'border-blue-300 text-blue-700' :
                                    'border-amber-300 text-amber-700'
                                  }`}
                                >
                                  {preview.status === 'success' ? 'Generated' :
                                   preview.status === 'error' ? 'Failed' :
                                   preview.status === 'skipped' || preview.bookingsCount === 0 ? 'Skipped' :
                                   preview.status === 'processing' ? 'Processing' :
                                   'Ready'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            {successCount > 0 ? 'Close' : 'Cancel'}
          </Button>
          {staffPreviews.length > 0 && eligibleCount > 0 && !isGenerating && (
            <Button 
              onClick={handleGenerateAll}
              className="bg-green-600 hover:bg-green-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Generate {eligibleCount} Payroll Records
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkPayrollGenerationDialog;
