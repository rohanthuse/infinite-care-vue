import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO, differenceInMinutes, startOfWeek, endOfWeek } from 'date-fns';

interface BookingTimeData {
  bookingId: string;
  clientId: string;
  clientName: string;
  staffId: string;
  staffName: string;
  startTime: string;
  endTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  status: string;
  serviceId?: string;
  serviceName?: string;
  scheduledMinutes: number;
  actualMinutes?: number;
  extraMinutes: number;
  // Cancellation payment fields
  staffPaymentType?: string;
  staffPaymentAmount?: number;
}

interface PayrollCalculationData {
  staffId: string;
  staffName: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  totalScheduledHours: number;
  totalActualHours: number;
  regularHours: number;
  overtimeHours: number;
  extraTimeHours: number;
  bookings: BookingTimeData[];
  attendanceRecords: any[];
  extraTimeRecords: any[];
  travelRecords: any[];
  basHourlyRate: number;
  overtimeRate: number;
}

// Get existing payroll record from database
const getExistingPayrollRecord = async (
  branchId: string,
  staffId: string,
  payPeriodStart: string,
  payPeriodEnd: string
): Promise<any | null> => {
  console.log('Fetching existing payroll record:', { branchId, staffId, payPeriodStart, payPeriodEnd });
  
  const { data, error } = await supabase
    .from('payroll_records')
    .select(`
      *,
      staff (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('branch_id', branchId)
    .eq('staff_id', staffId)
    .eq('pay_period_start', payPeriodStart.split('T')[0])
    .eq('pay_period_end', payPeriodEnd.split('T')[0])
    .maybeSingle();

  if (error) {
    console.error('Error fetching existing payroll:', error);
    return null;
  }

  return data;
};

export const usePayrollBookingIntegration = () => {
  const queryClient = useQueryClient();

  // Get booking and attendance data for payroll calculation
  const getBookingTimeData = async (branchId: string, startDate: string, endDate: string, staffId?: string): Promise<BookingTimeData[]> => {
    console.log('Fetching booking time data:', { branchId, startDate, endDate, staffId });

    let query = supabase
      .from('bookings')
      .select(`
        id,
        client_id,
        staff_id,
        start_time,
        end_time,
        status,
        service_id,
        suspension_honor_staff_payment,
        staff_payment_type,
        staff_payment_amount,
        clients (
          id,
          first_name,
          last_name
        ),
        staff (
          id,
          first_name,
          last_name
        ),
        services (
          id,
          title
        )
      `)
      .eq('branch_id', branchId)
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      // Include completed bookings OR cancelled bookings where staff payment is honored
      .or('status.in.(in_progress,done,completed),and(status.eq.cancelled,suspension_honor_staff_payment.eq.true)');

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data: bookings, error } = await query.order('start_time', { ascending: true });

    if (error) throw error;

    // Get attendance records for actual times
    const bookingIds = (bookings || []).map(b => b.id);
    let attendanceData: any[] = [];
    
    if (bookingIds.length > 0) {
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .in('notes', bookingIds.map(id => `%${id}%`))
        .gte('attendance_date', startDate.split('T')[0])
        .lte('attendance_date', endDate.split('T')[0]);

      if (!attendanceError) {
        attendanceData = attendance || [];
      }
    }

    return (bookings || []).map(booking => {
      const scheduledStart = parseISO(booking.start_time);
      const scheduledEnd = parseISO(booking.end_time);
      const scheduledMinutes = differenceInMinutes(scheduledEnd, scheduledStart);

      // Try to find actual times from attendance records
      const attendanceRecord = attendanceData.find(record => 
        record.notes && record.notes.includes(booking.id)
      );

      let actualMinutes = scheduledMinutes;
      let actualStartTime = booking.start_time;
      let actualEndTime = booking.end_time;

      if (attendanceRecord && attendanceRecord.check_in_time && attendanceRecord.check_out_time) {
        // Calculate actual time from attendance
        const checkIn = new Date(`${attendanceRecord.attendance_date}T${attendanceRecord.check_in_time}`);
        const checkOut = new Date(`${attendanceRecord.attendance_date}T${attendanceRecord.check_out_time}`);
        actualMinutes = differenceInMinutes(checkOut, checkIn);
        actualStartTime = checkIn.toISOString();
        actualEndTime = checkOut.toISOString();
      }

      const extraMinutes = Math.max(0, actualMinutes - scheduledMinutes);

      return {
        bookingId: booking.id,
        clientId: booking.client_id,
        clientName: booking.clients ? `${booking.clients.first_name} ${booking.clients.last_name}` : 'Unknown Client',
        staffId: booking.staff_id,
        staffName: booking.staff ? `${booking.staff.first_name} ${booking.staff.last_name}` : 'Unknown Staff',
        startTime: booking.start_time,
        endTime: booking.end_time,
        actualStartTime,
        actualEndTime,
        status: booking.status,
        serviceId: booking.service_id,
        serviceName: booking.services?.title || 'No Service',
        scheduledMinutes,
        actualMinutes,
        extraMinutes,
        // Include cancellation payment details
        staffPaymentType: (booking as any).staff_payment_type || 'none',
        staffPaymentAmount: (booking as any).staff_payment_amount || null,
      };
    });
  };

  // Calculate payroll data from bookings and time tracking
  const calculatePayrollFromBookings = async (
    branchId: string, 
    staffId: string, 
    payPeriodStart: string, 
    payPeriodEnd: string
  ): Promise<PayrollCalculationData> => {
    console.log('Calculating payroll from bookings:', { branchId, staffId, payPeriodStart, payPeriodEnd });

    // Get booking time data
    const bookingData = await getBookingTimeData(branchId, payPeriodStart, payPeriodEnd, staffId);

    // Get staff information and rates - remove hourly_rate column that doesn't exist
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select(`
        id,
        first_name,
        last_name
      `)
      .eq('id', staffId)
      .single();

    if (staffError) throw staffError;

    // Get default hourly rate or use minimum wage as fallback
    const baseHourlyRate = 12.00; // Default minimum wage - should be configurable

    // Get attendance records for the period
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('person_id', staffId)
      .eq('person_type', 'staff')
      .gte('attendance_date', payPeriodStart.split('T')[0])
      .lte('attendance_date', payPeriodEnd.split('T')[0]);

    if (attendanceError) throw attendanceError;

    // Get extra time records
    const { data: extraTimeRecords, error: extraTimeError } = await supabase
      .from('extra_time_records')
      .select('*')
      .eq('staff_id', staffId)
      .gte('work_date', payPeriodStart.split('T')[0])
      .lte('work_date', payPeriodEnd.split('T')[0]);

    if (extraTimeError) throw extraTimeError;

    // Get travel records
    const { data: travelRecords, error: travelError } = await supabase
      .from('travel_records')
      .select('*')
      .eq('staff_id', staffId)
      .gte('travel_date', payPeriodStart.split('T')[0])
      .lte('travel_date', payPeriodEnd.split('T')[0]);

    if (travelError) throw travelError;

    // Calculate totals
    const totalScheduledMinutes = bookingData.reduce((sum, booking) => sum + booking.scheduledMinutes, 0);
    const totalActualMinutes = bookingData.reduce((sum, booking) => sum + (booking.actualMinutes || booking.scheduledMinutes), 0);
    const totalExtraMinutes = bookingData.reduce((sum, booking) => sum + booking.extraMinutes, 0);

    const totalScheduledHours = totalScheduledMinutes / 60;
    const totalActualHours = totalActualMinutes / 60;
    const extraTimeHours = totalExtraMinutes / 60;

    // Calculate regular vs overtime hours (assuming 40 hours = regular, above = overtime)
    const regularHours = Math.min(totalActualHours, 40);
    const overtimeHours = Math.max(0, totalActualHours - 40);

    const overtimeRate = baseHourlyRate * 1.5; // Time and a half for overtime

    return {
      staffId,
      staffName: staff ? `${staff.first_name} ${staff.last_name}` : 'Unknown Staff',
      payPeriodStart,
      payPeriodEnd,
      totalScheduledHours,
      totalActualHours,
      regularHours,
      overtimeHours,
      extraTimeHours,
      bookings: bookingData,
      attendanceRecords: attendanceRecords || [],
      extraTimeRecords: extraTimeRecords || [],
      travelRecords: travelRecords || [],
      basHourlyRate: baseHourlyRate,
      overtimeRate
    };
  };

  // Hook to get payroll calculation data
  const usePayrollCalculationData = (branchId?: string, staffId?: string, payPeriodStart?: string, payPeriodEnd?: string) => {
    return useQuery({
      queryKey: ['payroll-calculation', branchId, staffId, payPeriodStart, payPeriodEnd],
      queryFn: () => calculatePayrollFromBookings(branchId!, staffId!, payPeriodStart!, payPeriodEnd!),
      enabled: !!(branchId && staffId && payPeriodStart && payPeriodEnd),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Hook to get existing payroll record
  const useExistingPayrollRecord = (
    branchId?: string,
    staffId?: string,
    payPeriodStart?: string,
    payPeriodEnd?: string
  ) => {
    return useQuery({
      queryKey: ['existing-payroll-record', branchId, staffId, payPeriodStart, payPeriodEnd],
      queryFn: () => getExistingPayrollRecord(branchId!, staffId!, payPeriodStart!, payPeriodEnd!),
      enabled: !!(branchId && staffId && payPeriodStart && payPeriodEnd),
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    });
  };

  // Hook to get booking time data for a period
  const useBookingTimeData = (branchId?: string, startDate?: string, endDate?: string, staffId?: string) => {
    return useQuery({
      queryKey: ['booking-time-data', branchId, startDate, endDate, staffId],
      queryFn: () => getBookingTimeData(branchId!, startDate!, endDate!, staffId),
      enabled: !!(branchId && startDate && endDate),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Auto-generate payroll record from booking data
  const useAutoGeneratePayroll = () => {
    return useMutation({
      mutationFn: async ({
        branchId,
        staffId,
        payPeriodStart,
        payPeriodEnd,
        createdBy
      }: {
        branchId: string;
        staffId: string;
        payPeriodStart: string;
        payPeriodEnd: string;
        createdBy: string;
      }) => {
        console.log('Auto-generating payroll record:', { branchId, staffId, payPeriodStart, payPeriodEnd });

        // Calculate payroll data from bookings
        const calculationData = await calculatePayrollFromBookings(branchId, staffId, payPeriodStart, payPeriodEnd);

        // Calculate travel reimbursement from APPROVED records only
        const approvedTravelRecords = (calculationData.travelRecords || []).filter(
          (r: any) => r.status === 'approved'
        );
        const travelReimbursement = approvedTravelRecords.reduce(
          (sum: number, record: any) => sum + (record.total_cost || 0),
          0
        );

        // Calculate cancellation payment from cancelled bookings with payment
        const cancelledBookingPayment = calculationData.bookings
          .filter(b => b.status === 'cancelled' && b.staffPaymentType && b.staffPaymentType !== 'none')
          .reduce((sum, booking) => {
            if (booking.staffPaymentAmount) {
              return sum + booking.staffPaymentAmount;
            }
            // Calculate based on type if no explicit amount
            const hourlyRate = calculationData.basHourlyRate;
            const hours = booking.scheduledMinutes / 60;
            const fullAmount = hourlyRate * hours;
            switch (booking.staffPaymentType) {
              case 'full': return sum + fullAmount;
              case 'half': return sum + (fullAmount / 2);
              default: return sum;
            }
          }, 0);

        // Calculate pay components
        const basicSalary = calculationData.regularHours * calculationData.basHourlyRate;
        const overtimePay = calculationData.overtimeHours * calculationData.overtimeRate;
        const extraTimePay = calculationData.extraTimeHours * calculationData.overtimeRate;
        
        const grossPay = basicSalary + overtimePay + extraTimePay + travelReimbursement + cancelledBookingPayment;
        
        // Calculate deductions (basic estimates - should be configurable)
        const taxRate = 0.20; // 20% tax estimate
        const niRate = 0.12; // 12% NI estimate
        const pensionRate = 0.03; // 3% pension estimate

        const taxDeduction = grossPay * taxRate;
        const niDeduction = grossPay * niRate;
        const pensionDeduction = grossPay * pensionRate;
        
        const netPay = grossPay - taxDeduction - niDeduction - pensionDeduction;

        // Create payroll record
        const payrollRecord = {
          branch_id: branchId,
          staff_id: staffId,
          pay_period_start: payPeriodStart.split('T')[0],
          pay_period_end: payPeriodEnd.split('T')[0],
          regular_hours: calculationData.regularHours,
          overtime_hours: calculationData.overtimeHours + calculationData.extraTimeHours,
          hourly_rate: calculationData.basHourlyRate,
          overtime_rate: calculationData.overtimeRate,
          basic_salary: basicSalary,
          overtime_pay: overtimePay + extraTimePay,
          bonus: 0,
          gross_pay: grossPay,
          tax_deduction: taxDeduction,
          ni_deduction: niDeduction,
          pension_deduction: pensionDeduction,
          other_deductions: 0,
          net_pay: netPay,
          payment_status: 'pending' as const,
          payment_method: 'bank_transfer' as const,
          payment_date: payPeriodEnd.split('T')[0],
          notes: `Auto-generated from ${calculationData.bookings.length} bookings, ${calculationData.attendanceRecords.length} attendance records, ${approvedTravelRecords.length} approved travel records (£${travelReimbursement.toFixed(2)} travel), and £${cancelledBookingPayment.toFixed(2)} cancelled booking payments`,
          created_by: createdBy
        };

        const { data, error } = await supabase
          .from('payroll_records')
          .insert(payrollRecord)
          .select()
          .single();

        if (error) throw error;
        return { payrollRecord: data, calculationData };
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
        toast.success('Payroll record auto-generated successfully');
      },
      onError: (error) => {
        console.error('Error auto-generating payroll:', error);
        toast.error('Failed to auto-generate payroll record');
      }
    });
  };

  return {
    usePayrollCalculationData,
    useBookingTimeData,
    useAutoGeneratePayroll,
    useExistingPayrollRecord,
    getBookingTimeData,
    calculatePayrollFromBookings
  };
};