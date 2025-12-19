import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { VisitBillingCalculator } from "@/utils/visitBillingCalculator";
import type { Visit } from "@/types/clientAccounting";
import { toast } from "@/hooks/use-toast";
import { fetchClientBillingConfig } from "./useClientBillingConfig";

export interface GenerateBookingInvoiceInput {
  bookingId: string;
  branchId: string;
  organizationId: string;
}

interface BookingDetails {
  id: string;
  client_id: string;
  branch_id: string;
  start_time: string;
  end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  service_id?: string;
  is_invoiced: boolean;
  included_in_invoice_id?: string;
  clients: {
    first_name: string;
    last_name: string;
  };
  services?: {
    title: string;
  };
}

const generateUniqueInvoiceNumber = async (organizationId: string): Promise<string> => {
  const prefix = `INV-${format(new Date(), 'yyyy-MM')}`;
  
  const { count } = await supabase
    .from('client_billing')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .like('invoice_number', `${prefix}%`);
  
  const sequence = (count || 0) + 1;
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

const checkIfBankHoliday = async (dateTime: string): Promise<boolean> => {
  const date = format(new Date(dateTime), 'yyyy-MM-dd');
  
  const { data } = await supabase
    .from('bank_holidays')
    .select('id')
    .eq('registered_on', date)
    .eq('status', 'Active')
    .maybeSingle();
  
  return !!data;
};

export const useGenerateBookingInvoice = () => {
  const generateInvoiceForBooking = async (input: GenerateBookingInvoiceInput) => {
    console.log('[generateInvoiceForBooking] Starting invoice generation for booking:', input.bookingId);

    try {
      // 1. Fetch booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          clients!inner(first_name, last_name),
          services(title)
        `)
        .eq('id', input.bookingId)
        .single();

      if (bookingError) {
        console.error('[generateInvoiceForBooking] Error fetching booking:', bookingError);
        throw new Error(`Failed to fetch booking details`);
      }

      if (!booking) {
        throw new Error('Booking not found');
      }

      const typedBooking = booking as unknown as BookingDetails;

      // 2. Check if booking already has an invoice
      if (typedBooking.is_invoiced) {
        console.warn('[generateInvoiceForBooking] Booking already has an invoice:', typedBooking.included_in_invoice_id);
        return {
          success: false,
          message: 'Invoice already exists for this booking',
          invoice: null
        };
      }

      // 3. Fetch client billing configuration (NEW: integrates accounting settings)
      const billingConfig = await fetchClientBillingConfig(typedBooking.client_id);
      console.log('[generateInvoiceForBooking] Client billing config:', {
        useActualTime: billingConfig.useActualTime,
        creditPeriodDays: billingConfig.creditPeriodDays,
        billToType: billingConfig.billToType,
        servicePayer: billingConfig.servicePayer
      });

      // 4. Fetch client's active rate schedules (check both tables)
      const { data: rateSchedules, error: rateError } = await supabase
        .from('client_rate_schedules')
        .select('*')
        .eq('client_id', typedBooking.client_id)
        .eq('is_active', true);

      if (rateError) {
        console.error('[generateInvoiceForBooking] Error fetching rate schedules:', rateError);
        throw new Error(`Failed to fetch rate schedules`);
      }

      let typedRateSchedules: any[] = rateSchedules || [];

      // If no rate schedules, check client_rate_assignments as fallback
      if (typedRateSchedules.length === 0) {
        console.log('[generateInvoiceForBooking] No client_rate_schedules found, checking client_rate_assignments');
        
        const { data: rateAssignments, error: assignmentError } = await supabase
          .from('client_rate_assignments')
          .select(`
            *,
            service_rate:service_rates(*)
          `)
          .eq('client_id', typedBooking.client_id)
          .eq('is_active', true);

        if (assignmentError) {
          console.error('[generateInvoiceForBooking] Error fetching rate assignments:', assignmentError);
        }

        if (rateAssignments && rateAssignments.length > 0) {
          console.log(`[generateInvoiceForBooking] Found ${rateAssignments.length} rate assignments`);
          
          // Convert rate assignments to rate schedule format for the calculator
          // Convert rate assignments to rate schedule format with ALL required fields for VisitBillingCalculator
          typedRateSchedules = rateAssignments.map((assignment: any) => ({
            id: assignment.id,
            client_id: assignment.client_id,
            // Required date range fields
            start_date: assignment.start_date || assignment.service_rate?.effective_from || '2000-01-01',
            end_date: assignment.end_date || assignment.service_rate?.effective_to || null,
            // Required days_covered - default to all days if not specified
            days_covered: assignment.service_rate?.applicable_days || 
                          ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'bank_holiday'],
            // Required time range - default to full day if not specified
            time_from: assignment.service_rate?.time_from || '00:00:00',
            time_until: assignment.service_rate?.time_until || '23:59:59',
            // Required base_rate for billing calculation
            base_rate: assignment.service_rate?.amount || 
                       assignment.service_rate?.hourly_rate || 
                       assignment.service_rate?.rate_per_unit || 0,
            // Required charge_type for rate calculation logic
            charge_type: assignment.service_rate?.charge_type || 'rate_per_minutes_pro_rata',
            // Flat rate tiers (optional)
            rate_15_minutes: assignment.service_rate?.rate_15_minutes,
            rate_30_minutes: assignment.service_rate?.rate_30_minutes,
            rate_45_minutes: assignment.service_rate?.rate_45_minutes,
            rate_60_minutes: assignment.service_rate?.rate_60_minutes,
            // Status and multipliers
            is_active: assignment.is_active ?? true,
            is_vatable: assignment.service_rate?.is_vatable || false,
            bank_holiday_multiplier: assignment.service_rate?.bank_holiday_multiplier || 1.5,
            // Legacy fields for compatibility
            service_id: assignment.service_rate_id,
            description: assignment.service_rate?.name || assignment.service_rate?.description || 'Service Rate'
          }));
        }
      }

      // Still no rates found after checking both tables
      if (typedRateSchedules.length === 0) {
        console.log('[generateInvoiceForBooking] Skipping - No active rate schedule or assignment for client');
        return {
          success: false,
          skipped: true,
          message: 'No active rate schedule or rate assignment found for this client',
          invoice: null,
          invoiceNumber: null,
          amount: null,
          lineItemCount: null
        };
      }

      console.log(`[generateInvoiceForBooking] Using ${typedRateSchedules.length} rate schedule(s)`);

      // 5. Convert booking to Visit format
      const visit: Visit = {
        id: typedBooking.id,
        client_id: typedBooking.client_id,
        date: format(new Date(typedBooking.start_time), 'yyyy-MM-dd'),
        planned_start: format(new Date(typedBooking.start_time), 'HH:mm:ss'),
        planned_end: format(new Date(typedBooking.end_time), 'HH:mm:ss'),
        actual_start: typedBooking.actual_start_time 
          ? format(new Date(typedBooking.actual_start_time), 'HH:mm:ss') 
          : undefined,
        actual_end: typedBooking.actual_end_time 
          ? format(new Date(typedBooking.actual_end_time), 'HH:mm:ss') 
          : undefined,
        is_bank_holiday: await checkIfBankHoliday(typedBooking.start_time)
      };

      // 6. Calculate billing using VisitBillingCalculator with correct time basis
      const calculator = new VisitBillingCalculator(typedRateSchedules, billingConfig.useActualTime);
      const billingSummary = calculator.calculateVisitsBilling([visit]);

      // Calculate booked time directly from scheduled booking times
      const bookedTimeMinutes = Math.round(
        (new Date(typedBooking.end_time).getTime() - new Date(typedBooking.start_time).getTime()) / 60000
      );

      console.log('[generateInvoiceForBooking] Calculated billing:', {
        net: billingSummary.net_amount,
        vat: billingSummary.vat_amount,
        total: billingSummary.total_amount,
        lineItems: billingSummary.line_items.length,
        bookedTimeMinutes,
        useActualTime: billingConfig.useActualTime
      });

      // Validation: Prevent £0.00 invoice if no line items were generated
      if (billingSummary.line_items.length === 0) {
        console.error('[generateInvoiceForBooking] No billable line items generated - rate matching may have failed');
        return {
          success: false,
          skipped: true,
          message: 'Could not calculate billing - no matching rate found for this booking. Check that the client has an active rate covering the booking date, time, and day of week.',
          invoice: null,
          invoiceNumber: null,
          amount: null,
          lineItemCount: null
        };
      }

      // 7. Generate unique invoice number
      const invoiceNumber = await generateUniqueInvoiceNumber(input.organizationId);

      // 8. Calculate due date based on credit period
      const dueDate = new Date(Date.now() + billingConfig.creditPeriodDays * 24 * 60 * 60 * 1000);

      // 9. Create invoice with correct bill_to_type based on service payer
      const clientName = `${typedBooking.clients.first_name} ${typedBooking.clients.last_name}`;
      const serviceTitle = typedBooking.services?.title || 'Service';
      const bookingDate = format(new Date(typedBooking.start_time), 'dd/MM/yyyy HH:mm');

      // Build description with authority reference if applicable
      let description = `${serviceTitle} - ${bookingDate}`;
      if (billingConfig.billToType === 'authority' && billingConfig.authorityReferenceNumber) {
        description = `${description} (Ref: ${billingConfig.authorityReferenceNumber})`;
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from('client_billing')
        .insert({
          client_id: typedBooking.client_id,
          organization_id: input.organizationId,
          booking_id: typedBooking.id,
          invoice_number: invoiceNumber,
          description,
          amount: billingSummary.net_amount,
          net_amount: billingSummary.net_amount,
          vat_amount: billingSummary.vat_amount,
          total_amount: billingSummary.total_amount,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          status: 'draft',
          invoice_type: 'booking',
          bill_to_type: billingConfig.billToType,
          authority_id: billingConfig.billToType === 'authority' ? billingConfig.authorityId : null,
          generated_from_booking: true,
          service_provided_date: format(new Date(typedBooking.start_time), 'yyyy-MM-dd'),
          booked_time_minutes: bookedTimeMinutes
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('[generateInvoiceForBooking] Error creating invoice:', invoiceError);
        throw new Error(`Failed to create invoice: ${invoiceError.message}`);
      }

      console.log('[generateInvoiceForBooking] Invoice created:', invoiceNumber);

      // 10. Create line items
      const lineItemsData = billingSummary.line_items.map(item => ({
        invoice_id: invoice.id,
        organization_id: input.organizationId,
        booking_id: typedBooking.id,
        description: item.description,
        visit_date: item.date,
        duration_minutes: item.billing_duration_minutes,
        rate_type_applied: item.rate_type,
        rate_per_unit: item.unit_rate,
        unit_price: item.unit_rate,
        quantity: item.billing_duration_minutes / 60,
        line_total: item.line_total,
        bank_holiday_multiplier_applied: item.multiplier,
        day_type: item.is_bank_holiday ? 'bank_holiday' : 'weekday'
      }));

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsData);

      if (lineItemsError) {
        console.error('[generateInvoiceForBooking] Error creating line items:', lineItemsError);
        await supabase.from('client_billing').delete().eq('id', invoice.id);
        throw new Error(`Failed to create invoice line items: ${lineItemsError.message}`);
      }

      // 11. Mark booking as invoiced
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({ 
          is_invoiced: true, 
          included_in_invoice_id: invoice.id 
        })
        .eq('id', typedBooking.id);

      if (bookingUpdateError) {
        console.error('[generateInvoiceForBooking] Error marking booking as invoiced:', bookingUpdateError);
      }

      console.log('[generateInvoiceForBooking] Successfully generated invoice for booking:', {
        bookingId: typedBooking.id,
        invoiceId: invoice.id,
        invoiceNumber,
        amount: billingSummary.total_amount,
        billToType: billingConfig.billToType,
        creditPeriodDays: billingConfig.creditPeriodDays
      });

      return {
        success: true,
        invoice,
        invoiceNumber,
        amount: billingSummary.total_amount,
        lineItemCount: lineItemsData.length
      };
    } catch (error: any) {
      console.error('[generateInvoiceForBooking] Error:', error);
      throw error;
    }
  };

  return { generateInvoiceForBooking };
};
