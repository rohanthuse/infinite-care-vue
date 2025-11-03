import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { VisitBillingCalculator } from "@/utils/visitBillingCalculator";
import type { Visit } from "@/types/clientAccounting";

export interface BulkGenerationProgress {
  current: number;
  total: number;
  currentClient?: string;
}

export interface BulkGenerationResult {
  successCount: number;
  errorCount: number;
  errors: Array<{
    clientId: string;
    clientName: string;
    reason: string;
    bookingCount: number;
  }>;
  totalAmount: number;
  invoices: Array<{
    clientId: string;
    clientName: string;
    invoiceNumber: string;
    amount: number;
    lineItemCount: number;
  }>;
  message?: string;
}

export interface PeriodDetails {
  type: string;
  startDate: string;
  endDate: string;
  label: string;
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

export const useBulkInvoiceGeneration = () => {
  const generateBulkInvoices = async (
    periodDetails: PeriodDetails,
    branchId: string,
    organizationId: string,
    onProgress?: (progress: BulkGenerationProgress) => void
  ): Promise<BulkGenerationResult> => {
    const results: BulkGenerationResult = {
      successCount: 0,
      errorCount: 0,
      errors: [],
      totalAmount: 0,
      invoices: []
    };

    console.log('[BulkInvoiceGeneration] Starting bulk generation for period:', periodDetails);

    // Step 1: Fetch all completed bookings in period
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        clients!inner(id, first_name, last_name, branch_id),
        services(title),
        staff(first_name, last_name)
      `)
      .in('status', ['done', 'completed'])
      .eq('branch_id', branchId)
      .gte('start_time', periodDetails.startDate)
      .lte('start_time', periodDetails.endDate);

    if (bookingsError) {
      console.error('[BulkInvoiceGeneration] Error fetching bookings:', bookingsError);
      throw bookingsError;
    }

    if (!bookings || bookings.length === 0) {
      console.log('[BulkInvoiceGeneration] No completed bookings found for this period');
      return { ...results, message: 'No completed bookings found for this period' };
    }

    console.log(`[BulkInvoiceGeneration] Found ${bookings.length} completed bookings`);

    // Step 2: Group bookings by client
    const clientBookingsMap = new Map<string, { clientName: string; bookings: any[] }>();
    bookings.forEach(booking => {
      const clientId = booking.client_id;
      if (!clientBookingsMap.has(clientId)) {
        clientBookingsMap.set(clientId, {
          clientName: `${booking.clients.first_name} ${booking.clients.last_name}`,
          bookings: []
        });
      }
      clientBookingsMap.get(clientId)!.bookings.push(booking);
    });

    const totalClients = clientBookingsMap.size;
    let processedClients = 0;

    console.log(`[BulkInvoiceGeneration] Processing ${totalClients} clients`);

    // Step 3: Process each client
    for (const [clientId, clientData] of clientBookingsMap) {
      try {
        onProgress?.({ 
          current: processedClients, 
          total: totalClients, 
          currentClient: clientData.clientName 
        });

        console.log(`[BulkInvoiceGeneration] Processing client: ${clientData.clientName} (${clientData.bookings.length} bookings)`);

        // 3a. Fetch client rate schedules
        const { data: rateSchedules, error: rateError } = await supabase
          .from('client_rate_schedules')
          .select('*')
          .eq('client_id', clientId)
          .eq('is_active', true);

        if (rateError) throw rateError;
        
        if (!rateSchedules || rateSchedules.length === 0) {
          console.warn(`[BulkInvoiceGeneration] No active rate schedule for client: ${clientData.clientName}`);
          results.errors.push({
            clientId,
            clientName: clientData.clientName,
            reason: 'No active rate schedule found',
            bookingCount: clientData.bookings.length
          });
          results.errorCount++;
          processedClients++;
          continue;
        }

        // Cast rate schedules to the correct type
        const typedRateSchedules = rateSchedules as any[];

        // 3b. Convert bookings to Visit format for calculator
        const visits: Visit[] = await Promise.all(
          clientData.bookings.map(async (booking) => ({
            id: booking.id,
            client_id: clientId,
            date: format(new Date(booking.start_time), 'yyyy-MM-dd'),
            planned_start: format(new Date(booking.start_time), 'HH:mm:ss'),
            planned_end: format(new Date(booking.end_time), 'HH:mm:ss'),
            actual_start: booking.actual_start_time 
              ? format(new Date(booking.actual_start_time), 'HH:mm:ss') 
              : undefined,
            actual_end: booking.actual_end_time 
              ? format(new Date(booking.actual_end_time), 'HH:mm:ss') 
              : undefined,
            is_bank_holiday: await checkIfBankHoliday(booking.start_time)
          }))
        );

        // 3c. Calculate using existing VisitBillingCalculator
        const calculator = new VisitBillingCalculator(typedRateSchedules, false);
        const billingSummary = calculator.calculateVisitsBilling(visits);

        console.log(`[BulkInvoiceGeneration] Calculated billing for ${clientData.clientName}:`, {
          net: billingSummary.net_amount,
          vat: billingSummary.vat_amount,
          total: billingSummary.total_amount,
          lineItems: billingSummary.line_items.length
        });

        // 3d. Generate unique invoice number
        const invoiceNumber = await generateUniqueInvoiceNumber(organizationId);

        // 3e. Create invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('client_billing')
          .insert({
            client_id: clientId,
            branch_id: branchId,
            organization_id: organizationId,
            invoice_number: invoiceNumber,
            description: `${periodDetails.type.charAt(0).toUpperCase() + periodDetails.type.slice(1)} Invoice (${periodDetails.startDate} to ${periodDetails.endDate})`,
            amount: billingSummary.net_amount,
            net_amount: billingSummary.net_amount,
            vat_amount: billingSummary.vat_amount,
            total_amount: billingSummary.total_amount,
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            start_date: periodDetails.startDate,
            end_date: periodDetails.endDate,
            invoice_type: 'automatic',
            invoice_method: periodDetails.type,
            bill_to_type: 'private',
            booked_time_minutes: billingSummary.total_billable_minutes,
            generated_from_booking: true
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        console.log(`[BulkInvoiceGeneration] Created invoice ${invoiceNumber} for ${clientData.clientName}`);

        // 3f. Create line items
        const lineItemsData = billingSummary.line_items.map(item => ({
          invoice_id: invoice.id,
          organization_id: organizationId,
          booking_id: item.visit_id,
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

        if (lineItemsError) throw lineItemsError;

        // Success!
        results.successCount++;
        results.totalAmount += billingSummary.total_amount;
        results.invoices.push({
          clientId,
          clientName: clientData.clientName,
          invoiceNumber,
          amount: billingSummary.total_amount,
          lineItemCount: lineItemsData.length
        });

        console.log(`[BulkInvoiceGeneration] Successfully processed ${clientData.clientName}`);

      } catch (error: any) {
        console.error(`[BulkInvoiceGeneration] Error processing client ${clientData.clientName}:`, error);
        results.errorCount++;
        results.errors.push({
          clientId,
          clientName: clientData.clientName,
          reason: error.message || 'Unknown error occurred',
          bookingCount: clientData.bookings.length
        });
      }

      processedClients++;
    }

    console.log('[BulkInvoiceGeneration] Bulk generation complete:', {
      success: results.successCount,
      errors: results.errorCount,
      total: results.totalAmount
    });

    return results;
  };

  return { generateBulkInvoices };
};
