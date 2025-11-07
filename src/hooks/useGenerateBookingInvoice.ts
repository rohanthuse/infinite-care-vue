import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { VisitBillingCalculator } from "@/utils/visitBillingCalculator";
import type { Visit } from "@/types/clientAccounting";
import { toast } from "@/hooks/use-toast";

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

      // 3. Fetch client's active rate schedules
      const { data: rateSchedules, error: rateError } = await supabase
        .from('client_rate_schedules')
        .select('*')
        .eq('client_id', typedBooking.client_id)
        .eq('is_active', true);

      if (rateError) {
        console.error('[generateInvoiceForBooking] Error fetching rate schedules:', rateError);
        throw new Error(`Failed to fetch rate schedules`);
      }

      if (!rateSchedules || rateSchedules.length === 0) {
        console.warn('[generateInvoiceForBooking] No active rate schedule found for client');
        throw new Error('No active rate schedule found for this client. Please set up a rate schedule first.');
      }

    // 4. Convert booking to Visit format
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

    // 5. Calculate billing using VisitBillingCalculator
    const calculator = new VisitBillingCalculator(rateSchedules as any[], false);
    const billingSummary = calculator.calculateVisitsBilling([visit]);

    console.log('[generateInvoiceForBooking] Calculated billing:', {
      net: billingSummary.net_amount,
      vat: billingSummary.vat_amount,
      total: billingSummary.total_amount
    });

    // 6. Generate unique invoice number
    const invoiceNumber = await generateUniqueInvoiceNumber(input.organizationId);

    // 7. Create invoice with booking_id set (CRITICAL FIX)
    const clientName = `${typedBooking.clients.first_name} ${typedBooking.clients.last_name}`;
    const serviceTitle = typedBooking.services?.title || 'Service';
    const bookingDate = format(new Date(typedBooking.start_time), 'dd/MM/yyyy HH:mm');

    const { data: invoice, error: invoiceError } = await supabase
      .from('client_billing')
      .insert({
        client_id: typedBooking.client_id,
        organization_id: input.organizationId,
        booking_id: typedBooking.id, // CRITICAL: Link invoice to booking
        invoice_number: invoiceNumber,
        description: `${serviceTitle} - ${bookingDate}`,
        amount: billingSummary.net_amount,
        net_amount: billingSummary.net_amount,
        vat_amount: billingSummary.vat_amount,
        total_amount: billingSummary.total_amount,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft',
        invoice_type: 'booking',
        generated_from_booking: true,
        service_provided_date: format(new Date(typedBooking.start_time), 'yyyy-MM-dd'),
        booked_time_minutes: billingSummary.total_billable_minutes
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('[generateInvoiceForBooking] Error creating invoice:', invoiceError);
      throw new Error(`Failed to create invoice: ${invoiceError.message}`);
    }

    console.log('[generateInvoiceForBooking] Invoice created:', invoiceNumber);

    // 8. Create line items
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
      // Try to clean up the invoice
      await supabase.from('client_billing').delete().eq('id', invoice.id);
      throw new Error(`Failed to create invoice line items: ${lineItemsError.message}`);
    }

    // 9. Mark booking as invoiced
    const { error: bookingUpdateError } = await supabase
      .from('bookings')
      .update({ 
        is_invoiced: true, 
        included_in_invoice_id: invoice.id 
      })
      .eq('id', typedBooking.id);

    if (bookingUpdateError) {
      console.error('[generateInvoiceForBooking] Error marking booking as invoiced:', bookingUpdateError);
      // Don't fail - invoice is already created
    }

      console.log('[generateInvoiceForBooking] Successfully generated invoice for booking:', {
        bookingId: typedBooking.id,
        invoiceId: invoice.id,
        invoiceNumber,
        amount: billingSummary.total_amount
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
