import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, Download, FileCheck, AlertCircle, Clock, XCircle, User, Calendar, Clock as ClockIcon, PoundSterling, Car, Ban, CheckCircle2 } from "lucide-react";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { exportPayrollPayslip, OrganizationInfo, PayslipBookingDetail } from "@/utils/payslipPdfGenerator";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
// Define payroll-related types locally since we're using database types
interface PayrollRecord {
  id: string;
  staff_id: string;
  branch_id: string;
  pay_period_start: string;
  pay_period_end: string;
  regular_hours: number;
  overtime_hours: number;
  hourly_rate: number;
  overtime_rate?: number;
  basic_salary: number;
  overtime_pay: number;
  bonus: number;
  gross_pay: number;
  tax_deduction: number;
  ni_deduction: number;
  pension_deduction: number;
  other_deductions: number;
  net_pay: number;
  payment_status: string;
  payment_method: string;
  payment_date?: string;
  payment_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  staff?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const paymentMethodLabels: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  cheque: "Cheque",
  other: "Other"
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Pending",
  processed: "Processed",
  failed: "Failed",
  cancelled: "Cancelled"
};

// Format currency helper
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};

// Parse notes to extract breakdown details
const parsePayrollNotes = (notes?: string) => {
  if (!notes) return null;
  
  const breakdown = {
    completedBookings: 0,
    cancelledPaidBookings: 0,
    cancelledPayment: 0,
    travelPayment: 0,
    travelType: '',
    extraTimePayment: 0,
    extraTimeCount: 0,
    rateSchedulesApplied: false
  };

  // Parse bookings: "Bookings: X completed, Y cancelled (paid £Z)"
  const bookingsMatch = notes.match(/Bookings:\s*(\d+)\s*completed/);
  if (bookingsMatch) {
    breakdown.completedBookings = parseInt(bookingsMatch[1]);
  }

  const cancelledMatch = notes.match(/(\d+)\s*cancelled\s*\(paid\s*£([\d.]+)\)/);
  if (cancelledMatch) {
    breakdown.cancelledPaidBookings = parseInt(cancelledMatch[1]);
    breakdown.cancelledPayment = parseFloat(cancelledMatch[2]);
  }

  // Parse travel: "Travel: £X (type)"
  const travelMatch = notes.match(/Travel:\s*£([\d.]+)\s*\(([^)]+)\)/);
  if (travelMatch) {
    breakdown.travelPayment = parseFloat(travelMatch[1]);
    breakdown.travelType = travelMatch[2];
  }

  // Parse extra time: "Extra Time: £X (Y approved)"
  const extraTimeMatch = notes.match(/Extra Time:\s*£([\d.]+)\s*\((\d+)\s*approved\)/);
  if (extraTimeMatch) {
    breakdown.extraTimePayment = parseFloat(extraTimeMatch[1]);
    breakdown.extraTimeCount = parseInt(extraTimeMatch[2]);
  }

  // Check for rate schedules
  breakdown.rateSchedulesApplied = notes.includes('Rate schedules applied');

  return breakdown;
};

interface ViewPayrollDialogProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  payrollRecord: PayrollRecord;
}

const ViewPayrollDialog: React.FC<ViewPayrollDialogProps> = ({
  open,
  onClose,
  onEdit,
  payrollRecord,
}) => {
  const { toast } = useToast();
  const { organization } = useTenant();
  const breakdown = parsePayrollNotes(payrollRecord.notes);

  // Helper function to convert image URL to base64
  const getLogoBase64 = async (logoUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to fetch logo:', error);
      return null;
    }
  };

  const handleExportPayslip = async () => {
    try {
      // Fetch logo as base64 if available
      let logoBase64: string | null = null;
      if (organization?.logo_url) {
        logoBase64 = await getLogoBase64(organization.logo_url);
      }

      // Build organization info for PDF
      const orgInfo: OrganizationInfo | undefined = organization ? {
        name: organization.name || 'Company',
        address: organization.address || '',
        email: organization.contact_email || organization.billing_email || '',
        phone: organization.contact_phone || undefined,
        logoBase64: logoBase64,
        registrationNumber: undefined,
      } : undefined;

      // Fetch booking details for the pay period
      let bookingDetails: PayslipBookingDetail[] = [];
      try {
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select(`
            id,
            start_time,
            end_time,
            status,
            suspension_honor_staff_payment,
            clients (first_name, last_name),
            services (title)
          `)
          .eq('branch_id', payrollRecord.branch_id)
          .eq('staff_id', payrollRecord.staff_id)
          .gte('start_time', payrollRecord.pay_period_start)
          .lte('end_time', payrollRecord.pay_period_end)
          .in('status', ['in_progress', 'done', 'completed', 'cancelled'])
          .order('start_time', { ascending: true });

        if (!error && bookings) {
          // Filter: include completed OR cancelled with staff payment honored
          const eligibleBookings = bookings.filter(b => 
            ['in_progress', 'done', 'completed'].includes(b.status) ||
            (b.status === 'cancelled' && b.suspension_honor_staff_payment === true)
          );

          bookingDetails = eligibleBookings.map(booking => {
            const startTime = parseISO(booking.start_time);
            const endTime = parseISO(booking.end_time);
            const durationMins = differenceInMinutes(endTime, startTime);
            const hours = durationMins / 60;
            const rate = payrollRecord.hourly_rate || 12;
            const amount = hours * rate;

            return {
              bookingId: booking.id,
              date: format(startTime, 'dd/MM'),
              shiftTime: `${format(startTime, 'HH:mm')}-${format(endTime, 'HH:mm')}`,
              clientName: booking.clients ? `${booking.clients.first_name} ${booking.clients.last_name}` : 'Unknown',
              serviceName: booking.services?.title || 'N/A',
              duration: `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`,
              hoursWorked: hours,
              rate: rate,
              amount: amount,
              status: booking.status
            };
          });
        }
      } catch (bookingError) {
        console.warn('Could not fetch booking details:', bookingError);
      }

      exportPayrollPayslip(payrollRecord, orgInfo, bookingDetails);
      toast({
        title: "Success",
        description: "Payslip exported successfully",
      });
    } catch (error) {
      console.error('Failed to export payslip:', error);
      toast({
        title: "Error",
        description: "Failed to export payslip",
        variant: "destructive",
      });
    }
  };
  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    let colorClass = "";
    let StatusIcon = Clock;
    
    switch (status) {
      case "processed":
        colorClass = "bg-green-50 text-green-700 border-green-200";
        StatusIcon = FileCheck;
        break;
      case "failed":
        colorClass = "bg-red-50 text-red-700 border-red-200";
        StatusIcon = AlertCircle;
        break;
      case "cancelled":
        colorClass = "bg-gray-100 text-gray-700 border-gray-200";
        StatusIcon = XCircle;
        break;
      default:
        colorClass = "bg-amber-50 text-amber-700 border-amber-200";
        StatusIcon = Clock;
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${colorClass}`}>
        <StatusIcon className="h-3.5 w-3.5" />
        {paymentStatusLabels[payrollRecord.payment_status] || payrollRecord.payment_status}
      </span>
    );
  };

  // Calculate total deductions
  const totalDeductions = 
    payrollRecord.tax_deduction + 
    payrollRecord.ni_deduction + 
    payrollRecord.pension_deduction + 
    payrollRecord.other_deductions;

  const employeeName = payrollRecord.staff 
    ? `${payrollRecord.staff.first_name} ${payrollRecord.staff.last_name}`
    : 'Unknown Employee';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payroll Record Details</span>
            {renderStatusBadge(payrollRecord.payment_status)}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Top section with employee info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                  <User className="h-4 w-4" />
                  <span>Employee</span>
                </div>
                <div className="font-medium text-lg">{employeeName}</div>
                <div className="text-sm text-gray-600">{payrollRecord.staff?.email || 'N/A'}</div>
                <div className="text-sm text-gray-500">ID: {payrollRecord.staff_id}</div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-sm text-gray-500">Net Pay</div>
                <div className="font-bold text-xl">{formatCurrency(payrollRecord.net_pay)}</div>
              </div>
            </div>
          </div>

          {/* Pay period details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Pay Period Details
              </h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Period</div>
                    <div className="font-medium">
                      {format(new Date(payrollRecord.pay_period_start), "PP")} - {format(new Date(payrollRecord.pay_period_end), "PP")}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Payment Date</div>
                    <div className="font-medium">
                      {payrollRecord.payment_date ? format(new Date(payrollRecord.payment_date), "PP") : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Payment Method</div>
                    <div className="font-medium">
                      {paymentMethodLabels[payrollRecord.payment_method] || payrollRecord.payment_method}
                    </div>
                  </div>
                  {payrollRecord.payment_reference && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Payment Reference</div>
                      <div className="font-medium">{payrollRecord.payment_reference}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Breakdown from Notes */}
            {breakdown && (breakdown.cancelledPaidBookings > 0 || breakdown.travelPayment > 0 || breakdown.extraTimePayment > 0) && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <PoundSterling className="h-4 w-4 mr-1" />
                  Payment Breakdown
                </h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                  {/* Rate Schedule Indicator */}
                  <div className="flex items-center gap-2 mb-3">
                    {breakdown.rateSchedulesApplied ? (
                      <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Staff rate schedules applied
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Default rates used
                      </Badge>
                    )}
                  </div>

                  {/* Completed Bookings */}
                  {breakdown.completedBookings > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Completed Bookings
                      </span>
                      <span className="font-medium">{breakdown.completedBookings} bookings</span>
                    </div>
                  )}

                  {/* Cancelled Bookings (Paid) */}
                  {breakdown.cancelledPaidBookings > 0 && (
                    <div className="flex justify-between items-center bg-amber-50 p-2 rounded">
                      <span className="text-sm flex items-center gap-2 text-amber-800">
                        <Ban className="h-4 w-4" />
                        Cancelled Bookings (Staff Payable)
                      </span>
                      <div className="text-right">
                        <span className="font-medium text-amber-800">{breakdown.cancelledPaidBookings} bookings</span>
                        <span className="text-amber-700 ml-2">({formatCurrency(breakdown.cancelledPayment)})</span>
                      </div>
                    </div>
                  )}

                  {/* Travel Reimbursement */}
                  {breakdown.travelPayment > 0 && (
                    <div className="flex justify-between items-center bg-green-50 p-2 rounded">
                      <span className="text-sm flex items-center gap-2 text-green-800">
                        <Car className="h-4 w-4" />
                        Travel Reimbursement
                        <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                          {breakdown.travelType}
                        </Badge>
                      </span>
                      <span className="font-medium text-green-800">{formatCurrency(breakdown.travelPayment)}</span>
                    </div>
                  )}

                  {/* Extra Time Payment */}
                  {breakdown.extraTimePayment > 0 && (
                    <div className="flex justify-between items-center bg-blue-50 p-2 rounded">
                      <span className="text-sm flex items-center gap-2 text-blue-800">
                        <Clock className="h-4 w-4" />
                        Approved Extra Time
                      </span>
                      <div className="text-right">
                        <span className="font-medium text-blue-800">{breakdown.extraTimeCount} records</span>
                        <span className="text-blue-700 ml-2">({formatCurrency(breakdown.extraTimePayment)})</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hours and earnings */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                Hours and Earnings
              </h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Regular Hours</div>
                    <div className="font-medium">{payrollRecord.regular_hours}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Overtime Hours</div>
                    <div className="font-medium">{payrollRecord.overtime_hours}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Hourly Rate</div>
                    <div className="font-medium">{formatCurrency(payrollRecord.hourly_rate)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Basic Salary</div>
                    <div className="font-medium">{formatCurrency(payrollRecord.basic_salary)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Overtime Pay</div>
                    <div className="font-medium">{formatCurrency(payrollRecord.overtime_pay)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Bonus / Allowances</div>
                    <div className="font-medium">{formatCurrency(payrollRecord.bonus)}</div>
                  </div>
                  <div className="md:col-span-3">
                    <Separator className="my-2" />
                    <div className="text-sm text-gray-500 mb-1">Gross Pay</div>
                    <div className="font-bold text-lg text-green-700">{formatCurrency(payrollRecord.gross_pay)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <PoundSterling className="h-4 w-4 mr-1" />
                Deductions
              </h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Tax</div>
                    <div className="font-medium text-red-600">-{formatCurrency(payrollRecord.tax_deduction)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">National Insurance</div>
                    <div className="font-medium text-red-600">-{formatCurrency(payrollRecord.ni_deduction)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Pension</div>
                    <div className="font-medium text-red-600">-{formatCurrency(payrollRecord.pension_deduction)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Other Deductions</div>
                    <div className="font-medium text-red-600">-{formatCurrency(payrollRecord.other_deductions)}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-500 mb-1">Total Deductions</div>
                    <div className="font-medium text-red-600 font-bold">-{formatCurrency(totalDeductions)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Gross Pay</div>
                  <div className="font-bold text-lg">{formatCurrency(payrollRecord.gross_pay)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Net Pay</div>
                  <div className="font-bold text-xl text-green-700">{formatCurrency(payrollRecord.net_pay)}</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {payrollRecord.notes && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Notes</div>
                <p className="text-sm">{payrollRecord.notes}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-between">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="space-x-2">
              <Button variant="outline" className="gap-2" onClick={handleExportPayslip}>
                <Download className="h-4 w-4" />
                Export Payslip
              </Button>
              <Button onClick={onEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewPayrollDialog;
