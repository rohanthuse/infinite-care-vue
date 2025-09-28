import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  SafeSelectWrapper as Select,
  SafeSelectContent as SelectContent,
  SafeSelectItem as SelectItem,
  SafeSelectTrigger as SelectTrigger,
  SafeSelectValue as SelectValue,
} from '@/components/ui/safe-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Calendar, 
  Users, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  TrendingUp,
  DollarSign,
  FileText
} from 'lucide-react';
import { usePayrollBookingIntegration } from '@/hooks/usePayrollBookingIntegration';
import { useStaffList } from '@/hooks/useAccountingData';
import { useAuthSafe } from '@/hooks/useAuthSafe';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { toast } from 'sonner';

interface PayrollBookingIntegrationProps {
  branchId: string;
  branchName?: string;
  onPayrollCreated?: () => void;
}

const PayrollBookingIntegration: React.FC<PayrollBookingIntegrationProps> = ({
  branchId,
  branchName,
  onPayrollCreated
}) => {
  const { user } = useAuthSafe();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [payPeriodStart, setPayPeriodStart] = useState<string>('');
  const [payPeriodEnd, setPayPeriodEnd] = useState<string>('');

  // Hooks
  const { data: staffList = [], isLoading: isLoadingStaff } = useStaffList(branchId);
  const { 
    usePayrollCalculationData, 
    useBookingTimeData, 
    useAutoGeneratePayroll 
  } = usePayrollBookingIntegration();

  const autoGeneratePayrollMutation = useAutoGeneratePayroll();

  // Get calculation data when all parameters are available
  const { 
    data: calculationData, 
    isLoading: isLoadingCalculation,
    error: calculationError
  } = usePayrollCalculationData(
    branchId,
    selectedStaffId,
    payPeriodStart,
    payPeriodEnd
  );

  // Get booking time data for preview
  const { 
    data: bookingTimeData = [], 
    isLoading: isLoadingBookings 
  } = useBookingTimeData(
    branchId,
    payPeriodStart,
    payPeriodEnd,
    selectedStaffId
  );

  // Set default pay period to last week
  const handleOpenDialog = () => {
    const today = new Date();
    const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
    
    setPayPeriodStart(format(lastWeekStart, 'yyyy-MM-dd'));
    setPayPeriodEnd(format(lastWeekEnd, 'yyyy-MM-dd'));
    setSelectedStaffId('');
    setIsDialogOpen(true);
  };

  const handleAutoGenerate = async () => {
    if (!selectedStaffId || !payPeriodStart || !payPeriodEnd || !user?.id) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await autoGeneratePayrollMutation.mutateAsync({
        branchId,
        staffId: selectedStaffId,
        payPeriodStart,
        payPeriodEnd,
        createdBy: user.id
      });

      setIsDialogOpen(false);
      if (onPayrollCreated) {
        onPayrollCreated();
      }
    } catch (error) {
      console.error('Error generating payroll:', error);
    }
  };

  const selectedStaff = staffList.find(s => s.id === selectedStaffId);

  return (
    <>
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Zap className="h-5 w-5" />
            Payroll Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-blue-700">
              Automatically generate payroll records from completed bookings, attendance tracking, and time records.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700">Time Tracking Integration</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">Booking-Based Hours</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calculator className="h-4 w-4 text-purple-600" />
                <span className="text-gray-700">Auto-Calculations</span>
              </div>
            </div>

            <Button 
              onClick={handleOpenDialog}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Generate Payroll from Bookings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Payroll from Bookings & Time Tracking</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Selection Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Staff Member</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.first_name} {staff.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pay Period Start</Label>
                <Input
                  type="date"
                  value={payPeriodStart}
                  onChange={(e) => setPayPeriodStart(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Pay Period End</Label>
                <Input
                  type="date"
                  value={payPeriodEnd}
                  onChange={(e) => setPayPeriodEnd(e.target.value)}
                />
              </div>
            </div>

            {/* Calculation Preview */}
            {calculationData && (
              <div className="space-y-4">
                <Separator />
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Payroll Calculation Preview
                </h3>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">
                          {calculationData.totalActualHours.toFixed(1)}h
                        </div>
                        <div className="text-sm text-gray-500">Total Hours</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">
                          {calculationData.bookings.length}
                        </div>
                        <div className="text-sm text-gray-500">Bookings</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-amber-600">
                          {calculationData.overtimeHours.toFixed(1)}h
                        </div>
                        <div className="text-sm text-gray-500">Overtime</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <DollarSign className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-purple-600">
                          £{((calculationData.regularHours * calculationData.basHourlyRate) + 
                             (calculationData.overtimeHours * calculationData.overtimeRate) +
                             (calculationData.extraTimeHours * calculationData.overtimeRate)).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">Est. Gross Pay</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Pay Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Pay Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Regular Hours ({calculationData.regularHours.toFixed(1)}h @ £{calculationData.basHourlyRate}/h)</span>
                      <span>£{(calculationData.regularHours * calculationData.basHourlyRate).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overtime Hours ({calculationData.overtimeHours.toFixed(1)}h @ £{calculationData.overtimeRate}/h)</span>
                      <span>£{(calculationData.overtimeHours * calculationData.overtimeRate).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Extra Time ({calculationData.extraTimeHours.toFixed(1)}h @ £{calculationData.overtimeRate}/h)</span>
                      <span>£{(calculationData.extraTimeHours * calculationData.overtimeRate).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total Gross Pay</span>
                      <span>£{((calculationData.regularHours * calculationData.basHourlyRate) + 
                               (calculationData.overtimeHours * calculationData.overtimeRate) +
                               (calculationData.extraTimeHours * calculationData.overtimeRate)).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Bookings List */}
                {calculationData.bookings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Included Bookings ({calculationData.bookings.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {calculationData.bookings.map((booking) => (
                          <div key={booking.bookingId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium text-sm">{booking.clientName}</div>
                              <div className="text-xs text-gray-500">
                                {format(new Date(booking.startTime), 'MMM dd, HH:mm')} - 
                                {format(new Date(booking.endTime), 'HH:mm')}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={booking.status === 'done' ? 'default' : 'secondary'}>
                                {booking.status}
                              </Badge>
                              <div className="text-xs text-gray-500 mt-1">
                                {(booking.actualMinutes || booking.scheduledMinutes) / 60}h
                                {booking.extraMinutes > 0 && (
                                  <span className="text-amber-600"> (+{booking.extraMinutes}m)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {isLoadingCalculation && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
                <span>Calculating payroll data...</span>
              </div>
            )}

            {calculationError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">Error loading calculation data. Please try again.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAutoGenerate}
                disabled={!calculationData || autoGeneratePayrollMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {autoGeneratePayrollMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Generate Payroll Record
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PayrollBookingIntegration;