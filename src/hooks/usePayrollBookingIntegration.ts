import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO, differenceInMinutes, isWeekend, getDay } from 'date-fns';
import { TravelPaymentType, calculateTravelCompensation } from './useStaffTravelPayment';
import { StaffRateSchedule } from './useStaffAccounting';

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
  // Rate applied
  appliedRate?: number;
  rateSource?: string;
  isBankHoliday?: boolean;
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
  // New fields for enhanced breakdown
  travelPaymentType: TravelPaymentType | null;
  travelCompensation: number;
  cancelledBookingPayment: number;
  approvedExtraTimePayment: number;
  rateSchedulesApplied: boolean;
}

// Safe helper to extract date part from ISO string or date string
const safeDatePart = (dateStr: string | undefined | null): string => {
  if (!dateStr || typeof dateStr !== 'string') return '';
  try {
    return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  } catch (error) {
    console.warn('[safeDatePart] Error parsing date string:', dateStr, error);
    return '';
  }
};

// Day name mapping for rate schedule matching
const dayNameMap: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
};

// Get existing payroll record from database
const getExistingPayrollRecord = async (
  branchId: string,
  staffId: string,
  payPeriodStart: string,
  payPeriodEnd: string
): Promise<any | null> => {
  // Guard clause for undefined parameters
  if (!branchId || !staffId || !payPeriodStart || !payPeriodEnd) {
    console.warn('Missing required parameters for getExistingPayrollRecord:', { branchId, staffId, payPeriodStart, payPeriodEnd });
    return null;
  }

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
    .eq('pay_period_start', safeDatePart(payPeriodStart))
    .eq('pay_period_end', safeDatePart(payPeriodEnd))
    .maybeSingle();

  if (error) {
    console.error('Error fetching existing payroll:', error);
    return null;
  }

  return data;
};

// Fetch bank holidays for the period
const fetchBankHolidays = async (startDate: string, endDate: string): Promise<string[]> => {
  // Guard clause for undefined parameters
  if (!startDate || !endDate) {
    console.warn('Missing required parameters for fetchBankHolidays');
    return [];
  }

  const { data, error } = await supabase
    .from('bank_holidays')
    .select('registered_on')
    .gte('registered_on', safeDatePart(startDate))
    .lte('registered_on', safeDatePart(endDate))
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching bank holidays:', error);
    return [];
  }

  return (data || []).map(h => h.registered_on);
};

// Match booking to appropriate rate schedule
const matchRateSchedule = (
  booking: any,
  rateSchedules: StaffRateSchedule[],
  bankHolidays: string[]
): { rate: number; source: string; isBankHoliday: boolean } => {
  const defaultResult = { rate: 12.00, source: 'Default Rate', isBankHoliday: false };
  
  try {
    // Guard for missing booking or start_time
    if (!booking?.start_time || typeof booking.start_time !== 'string') {
      console.warn('[matchRateSchedule] Booking missing valid start_time:', booking?.id);
      return defaultResult;
    }

    const bookingDate = parseISO(booking.start_time);
    
    // Check if parsing was successful
    if (!bookingDate || isNaN(bookingDate.getTime())) {
      console.warn('[matchRateSchedule] Invalid booking start_time:', booking.start_time);
      return defaultResult;
    }

    const bookingDateStr = format(bookingDate, 'yyyy-MM-dd');
    const bookingTime = format(bookingDate, 'HH:mm');
    const dayName = dayNameMap[getDay(bookingDate)];
    const isBankHoliday = bankHolidays.includes(bookingDateStr);

    // Find matching rate schedule
    for (const schedule of rateSchedules) {
      if (!schedule.is_active) continue;

      // Check date range
      if (schedule.start_date && bookingDateStr < schedule.start_date) continue;
      if (schedule.end_date && bookingDateStr > schedule.end_date) continue;

      // Check service type match
      if (schedule.service_type_codes && schedule.service_type_codes.length > 0) {
        if (!booking.service_id || !schedule.service_type_codes.includes(booking.service_id)) {
          continue;
        }
      }

      // Check day of week
      if (schedule.days_covered && schedule.days_covered.length > 0) {
        if (!schedule.days_covered.includes(dayName)) continue;
      }

      // Check time range
      if (schedule.time_from && schedule.time_until) {
        if (bookingTime < schedule.time_from || bookingTime > schedule.time_until) continue;
      }

      // Found matching schedule - apply rate with bank holiday multiplier if applicable
      let rate = schedule.base_rate;
      if (isBankHoliday && schedule.bank_holiday_multiplier > 1) {
        rate = rate * schedule.bank_holiday_multiplier;
      }

      return {
        rate,
        source: `${schedule.rate_category} (${schedule.authority_type})`,
        isBankHoliday
      };
    }

    // Default fallback rate
    return { ...defaultResult, isBankHoliday };
  } catch (error) {
    console.error('[matchRateSchedule] Error processing booking:', booking?.id, error);
    return defaultResult;
  }
};

export const usePayrollBookingIntegration = () => {
  const queryClient = useQueryClient();

  // Get booking and attendance data for payroll calculation
  const getBookingTimeData = async (branchId: string, startDate: string, endDate: string, staffId?: string): Promise<BookingTimeData[]> => {
    // Guard clause for undefined parameters
    if (!branchId || !startDate || !endDate) {
      console.warn('[PayrollBookingIntegration] Missing required parameters for getBookingTimeData:', { branchId, startDate, endDate });
      return [];
    }

    console.log('[PayrollBookingIntegration] Fetching booking time data:', { branchId, startDate, endDate, staffId });

    // Fetch all potentially relevant bookings first, then filter in JS
    // This avoids the complex .or() syntax that can cause PostgREST parsing issues
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
      // Fetch bookings with these statuses - filter cancelled ones in JS
      .in('status', ['in_progress', 'done', 'completed', 'cancelled']);

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data: allBookings, error } = await query.order('start_time', { ascending: true });

    if (error) {
      console.error('[PayrollBookingIntegration] Error fetching bookings:', error);
      throw error;
    }

    // Filter bookings: include completed/in_progress/done, OR cancelled with staff payment honored
    const bookings = (allBookings || []).filter(booking => {
      if (['in_progress', 'done', 'completed'].includes(booking.status)) {
        return true;
      }
      if (booking.status === 'cancelled' && booking.suspension_honor_staff_payment === true) {
        return true;
      }
      return false;
    });

    console.log('[PayrollBookingIntegration] Filtered bookings:', {
      total: allBookings?.length || 0,
      eligible: bookings.length,
      byStatus: {
        completed: bookings.filter(b => b.status === 'completed').length,
        done: bookings.filter(b => b.status === 'done').length,
        in_progress: bookings.filter(b => b.status === 'in_progress').length,
        cancelled_paid: bookings.filter(b => b.status === 'cancelled').length
      }
    });

    // Get attendance records for actual times - fetch by person_id instead of notes matching
    let attendanceData: any[] = [];
    
    if (staffId) {
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('person_id', staffId)
        .eq('person_type', 'staff')
        .gte('attendance_date', safeDatePart(startDate))
        .lte('attendance_date', safeDatePart(endDate));

      if (attendanceError) {
        console.warn('[PayrollBookingIntegration] Error fetching attendance records:', attendanceError);
      } else {
        attendanceData = attendance || [];
        console.log('[PayrollBookingIntegration] Found attendance records:', attendanceData.length);
      }
    }

    return (bookings || []).map(booking => {
      try {
        // Validate required fields
        if (!booking.start_time || !booking.end_time) {
          console.warn('[getBookingTimeData] Booking missing start/end time:', booking.id);
          return {
            bookingId: booking.id,
            clientId: booking.client_id || '',
            clientName: booking.clients ? `${booking.clients.first_name} ${booking.clients.last_name}` : 'Unknown Client',
            staffId: booking.staff_id || '',
            staffName: booking.staff ? `${booking.staff.first_name} ${booking.staff.last_name}` : 'Unknown Staff',
            startTime: booking.start_time || '',
            endTime: booking.end_time || '',
            actualStartTime: booking.start_time || '',
            actualEndTime: booking.end_time || '',
            status: booking.status || 'unknown',
            serviceId: booking.service_id,
            serviceName: booking.services?.title || 'No Service',
            scheduledMinutes: 0,
            actualMinutes: 0,
            extraMinutes: 0,
            staffPaymentType: 'none',
            staffPaymentAmount: null,
          };
        }

        const scheduledStart = parseISO(booking.start_time);
        const scheduledEnd = parseISO(booking.end_time);
        
        // Check if parsing was successful
        if (isNaN(scheduledStart.getTime()) || isNaN(scheduledEnd.getTime())) {
          console.warn('[getBookingTimeData] Invalid booking times:', booking.id, booking.start_time, booking.end_time);
          return {
            bookingId: booking.id,
            clientId: booking.client_id || '',
            clientName: booking.clients ? `${booking.clients.first_name} ${booking.clients.last_name}` : 'Unknown Client',
            staffId: booking.staff_id || '',
            staffName: booking.staff ? `${booking.staff.first_name} ${booking.staff.last_name}` : 'Unknown Staff',
            startTime: booking.start_time,
            endTime: booking.end_time,
            actualStartTime: booking.start_time,
            actualEndTime: booking.end_time,
            status: booking.status || 'unknown',
            serviceId: booking.service_id,
            serviceName: booking.services?.title || 'No Service',
            scheduledMinutes: 0,
            actualMinutes: 0,
            extraMinutes: 0,
            staffPaymentType: 'none',
            staffPaymentAmount: null,
          };
        }

        const scheduledMinutes = differenceInMinutes(scheduledEnd, scheduledStart);

        // Try to find actual times from attendance records
        const attendanceRecord = attendanceData.find(record => 
          record.notes && record.notes.includes(booking.id)
        );

        let actualMinutes = scheduledMinutes;
        let actualStartTime = booking.start_time;
        let actualEndTime = booking.end_time;

        if (attendanceRecord && attendanceRecord.check_in_time && attendanceRecord.check_out_time) {
          try {
            // Calculate actual time from attendance
            const checkIn = new Date(`${attendanceRecord.attendance_date}T${attendanceRecord.check_in_time}`);
            const checkOut = new Date(`${attendanceRecord.attendance_date}T${attendanceRecord.check_out_time}`);
            if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
              actualMinutes = differenceInMinutes(checkOut, checkIn);
              actualStartTime = checkIn.toISOString();
              actualEndTime = checkOut.toISOString();
            }
          } catch (attendanceError) {
            console.warn('[getBookingTimeData] Error processing attendance record:', attendanceError);
          }
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
      } catch (error) {
        console.error('[getBookingTimeData] Error processing booking:', booking.id, error);
        return {
          bookingId: booking.id,
          clientId: booking.client_id || '',
          clientName: 'Unknown Client',
          staffId: booking.staff_id || '',
          staffName: 'Unknown Staff',
          startTime: booking.start_time || '',
          endTime: booking.end_time || '',
          actualStartTime: booking.start_time || '',
          actualEndTime: booking.end_time || '',
          status: booking.status || 'unknown',
          serviceId: booking.service_id,
          serviceName: 'No Service',
          scheduledMinutes: 0,
          actualMinutes: 0,
          extraMinutes: 0,
          staffPaymentType: 'none',
          staffPaymentAmount: null,
        };
      }
    });
  };

  // Calculate payroll data from bookings and time tracking
  const calculatePayrollFromBookings = async (
    branchId: string, 
    staffId: string, 
    payPeriodStart: string, 
    payPeriodEnd: string
  ): Promise<PayrollCalculationData> => {
    // Guard clause for undefined parameters
    if (!branchId || !staffId || !payPeriodStart || !payPeriodEnd) {
      throw new Error(`Missing required parameters for payroll calculation: branchId=${branchId}, staffId=${staffId}, payPeriodStart=${payPeriodStart}, payPeriodEnd=${payPeriodEnd}`);
    }

    console.log('[PayrollBookingIntegration] Calculating payroll from bookings:', { branchId, staffId, payPeriodStart, payPeriodEnd });

    try {
      // Get booking time data
      const bookingData = await getBookingTimeData(branchId, payPeriodStart, payPeriodEnd, staffId);
      console.log('[PayrollBookingIntegration] Booking data retrieved:', bookingData.length, 'bookings');

    // Get staff information including travel payment type
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select(`
        id,
        first_name,
        last_name,
        travel_payment_type
      `)
      .eq('id', staffId)
      .single();

    if (staffError) throw staffError;

    const travelPaymentType = (staff?.travel_payment_type as TravelPaymentType) || null;

    // Fetch staff rate schedules
    const { data: rateSchedules, error: rateError } = await supabase
      .from('staff_rate_schedules')
      .select('*')
      .eq('staff_id', staffId)
      .eq('is_active', true)
      .order('start_date', { ascending: false });

    if (rateError) {
      console.error('Error fetching rate schedules:', rateError);
    }

    const activeRateSchedules: StaffRateSchedule[] = rateSchedules || [];
    const rateSchedulesApplied = activeRateSchedules.length > 0;

    // Fetch bank holidays for the period
    const bankHolidays = await fetchBankHolidays(payPeriodStart, payPeriodEnd);

    // Calculate default hourly rate from rate schedules or use fallback
    let baseHourlyRate = 12.00; // Default minimum wage fallback
    if (activeRateSchedules.length > 0) {
      // Use the first active rate's base_rate as default
      baseHourlyRate = activeRateSchedules[0].base_rate || 12.00;
    }

    // Apply rate schedules to bookings with error handling
    const bookingsWithRates = bookingData.map(booking => {
      try {
        const rateMatch = matchRateSchedule(booking, activeRateSchedules, bankHolidays);
        return {
          ...booking,
          appliedRate: rateMatch.rate,
          rateSource: rateMatch.source,
          isBankHoliday: rateMatch.isBankHoliday
        };
      } catch (error) {
        console.error('[calculatePayrollFromBookings] Error applying rate to booking:', booking.bookingId, error);
        return {
          ...booking,
          appliedRate: baseHourlyRate,
          rateSource: 'Default Rate (Error)',
          isBankHoliday: false
        };
      }
    });

    // Get attendance records for the period
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('person_id', staffId)
      .eq('person_type', 'staff')
      .gte('attendance_date', safeDatePart(payPeriodStart))
      .lte('attendance_date', safeDatePart(payPeriodEnd));

    if (attendanceError) throw attendanceError;

    // Get APPROVED extra time records only
    const { data: extraTimeRecords, error: extraTimeError } = await supabase
      .from('extra_time_records')
      .select('*')
      .eq('staff_id', staffId)
      .eq('status', 'approved') // Only include approved extra time
      .gte('work_date', safeDatePart(payPeriodStart))
      .lte('work_date', safeDatePart(payPeriodEnd));

    if (extraTimeError) throw extraTimeError;

    // Get APPROVED travel records only
    const { data: travelRecords, error: travelError } = await supabase
      .from('travel_records')
      .select('*')
      .eq('staff_id', staffId)
      .eq('status', 'approved') // Only include approved travel
      .gte('travel_date', safeDatePart(payPeriodStart))
      .lte('travel_date', safeDatePart(payPeriodEnd));

    if (travelError) throw travelError;

    // Calculate travel compensation based on staff's preference
    const travelCompensationData = calculateTravelCompensation(
      travelRecords || [],
      travelPaymentType,
      baseHourlyRate
    );

    // Calculate approved extra time payment
    const approvedExtraTimePayment = (extraTimeRecords || []).reduce(
      (sum, record) => sum + (record.total_cost || 0),
      0
    );

    // Calculate totals
    const totalScheduledMinutes = bookingsWithRates.reduce((sum, booking) => sum + booking.scheduledMinutes, 0);
    const totalActualMinutes = bookingsWithRates.reduce((sum, booking) => sum + (booking.actualMinutes || booking.scheduledMinutes), 0);
    const totalExtraMinutes = bookingsWithRates.reduce((sum, booking) => sum + booking.extraMinutes, 0);

    const totalScheduledHours = totalScheduledMinutes / 60;
    const totalActualHours = totalActualMinutes / 60;
    const extraTimeHours = totalExtraMinutes / 60;

    // Calculate regular vs overtime hours using rate schedule threshold
    const overtimeThreshold = activeRateSchedules[0]?.overtime_threshold_hours || 40;
    const regularHours = Math.min(totalActualHours, overtimeThreshold);
    const overtimeHours = Math.max(0, totalActualHours - overtimeThreshold);

    // Use overtime multiplier from rate schedule
    const overtimeMultiplier = activeRateSchedules[0]?.overtime_multiplier || 1.5;
    const overtimeRate = baseHourlyRate * overtimeMultiplier;

    // Calculate cancellation payment from cancelled bookings with payment
    const cancelledBookingPayment = bookingsWithRates
      .filter(b => b.status === 'cancelled' && b.staffPaymentType && b.staffPaymentType !== 'none')
      .reduce((sum, booking) => {
        if (booking.staffPaymentAmount) {
          return sum + booking.staffPaymentAmount;
        }
        // Calculate based on type if no explicit amount
        const hourlyRate = booking.appliedRate || baseHourlyRate;
        const hours = booking.scheduledMinutes / 60;
        const fullAmount = hourlyRate * hours;
        switch (booking.staffPaymentType) {
          case 'full': return sum + fullAmount;
          case 'half': return sum + (fullAmount / 2);
          default: return sum;
        }
      }, 0);

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
      bookings: bookingsWithRates,
      attendanceRecords: attendanceRecords || [],
      extraTimeRecords: extraTimeRecords || [],
      travelRecords: travelRecords || [],
      basHourlyRate: baseHourlyRate,
      overtimeRate,
      // Enhanced fields
      travelPaymentType,
      travelCompensation: travelCompensationData.totalAmount,
      cancelledBookingPayment,
      approvedExtraTimePayment,
      rateSchedulesApplied
    };
    } catch (error) {
      console.error('[PayrollBookingIntegration] Error calculating payroll:', error);
      throw error;
    }
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

        // Use pre-calculated values from enhanced calculation
        const travelReimbursement = calculationData.travelCompensation;
        const cancelledBookingPayment = calculationData.cancelledBookingPayment;
        const approvedExtraTimePayment = calculationData.approvedExtraTimePayment;

        // Calculate booking-based pay using applied rates
        const completedBookingsPay = calculationData.bookings
          .filter(b => b.status !== 'cancelled')
          .reduce((sum, booking) => {
            const hours = (booking.actualMinutes || booking.scheduledMinutes) / 60;
            const rate = booking.appliedRate || calculationData.basHourlyRate;
            return sum + (hours * rate);
          }, 0);

        // Calculate pay components
        const basicSalary = completedBookingsPay;
        const overtimePay = calculationData.overtimeHours * calculationData.overtimeRate;
        
        const grossPay = basicSalary + overtimePay + approvedExtraTimePayment + travelReimbursement + cancelledBookingPayment;
        
        // Fetch staff-specific deduction settings
        const { data: deductionSettings } = await supabase
          .from('staff_deduction_settings')
          .select('*')
          .eq('staff_id', staffId)
          .eq('is_active', true)
          .order('effective_from', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Calculate deductions using staff-specific fixed amounts or defaults
        // Only apply deductions that are active
        let taxDeduction = 0;
        let niDeduction = 0;
        let pensionDeduction = 0;
        let otherDeductionsTotal = 0;

        if (deductionSettings) {
          // Use fixed amount fields - only if the deduction is active
          taxDeduction = deductionSettings.tax_active !== false 
            ? (deductionSettings.tax_amount || 0) : 0;
          niDeduction = deductionSettings.ni_active !== false 
            ? (deductionSettings.ni_amount || 0) : 0;
          pensionDeduction = deductionSettings.pension_active !== false 
            ? (deductionSettings.pension_amount || 0) : 0;
          otherDeductionsTotal = deductionSettings.other_deductions_active !== false 
            ? (deductionSettings.other_deductions_amount || 0) : 0;
        }
        
        const netPay = grossPay - taxDeduction - niDeduction - pensionDeduction - otherDeductionsTotal;

        // Count bookings by type
        const completedBookings = calculationData.bookings.filter(b => b.status !== 'cancelled').length;
        const cancelledPaidBookings = calculationData.bookings.filter(b => b.status === 'cancelled').length;

        // Create detailed notes
        const notesDetails = [
          `Bookings: ${completedBookings} completed`,
          cancelledPaidBookings > 0 ? `${cancelledPaidBookings} cancelled (paid £${cancelledBookingPayment.toFixed(2)})` : null,
          `Travel: £${travelReimbursement.toFixed(2)} (${calculationData.travelPaymentType || 'none'})`,
          `Extra Time: £${approvedExtraTimePayment.toFixed(2)} (${calculationData.extraTimeRecords.length} approved)`,
          calculationData.rateSchedulesApplied ? 'Rate schedules applied' : 'Default rates used'
        ].filter(Boolean).join(' | ');

        // Create payroll record
        const payrollRecord = {
          branch_id: branchId,
          staff_id: staffId,
          pay_period_start: safeDatePart(payPeriodStart),
          pay_period_end: safeDatePart(payPeriodEnd),
          regular_hours: calculationData.regularHours,
          overtime_hours: calculationData.overtimeHours + calculationData.extraTimeHours,
          hourly_rate: calculationData.basHourlyRate,
          overtime_rate: calculationData.overtimeRate,
          basic_salary: basicSalary,
          overtime_pay: overtimePay + approvedExtraTimePayment,
          bonus: travelReimbursement + cancelledBookingPayment, // Travel and cancelled booking payments as bonus/allowance
          gross_pay: grossPay,
          tax_deduction: taxDeduction,
          ni_deduction: niDeduction,
          pension_deduction: pensionDeduction,
          other_deductions: otherDeductionsTotal,
          net_pay: netPay,
          payment_status: 'pending' as const,
          payment_method: 'bank_transfer' as const,
          payment_date: safeDatePart(payPeriodEnd),
          notes: notesDetails,
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