import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { VisitBillingCalculator } from "@/utils/visitBillingCalculator";
import type { Visit } from "@/types/clientAccounting";
import { fetchClientBillingConfig, type ClientBillingConfig } from "./useClientBillingConfig";

export interface BulkGenerationProgress {
  current: number;
  total: number;
  currentClient?: string;
}

interface ExtraTimeRecord {
  id: string;
  client_id: string;
  work_date: string;
  extra_time_minutes: number;
  total_cost: number;
  reason?: string;
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
    extraTimeCount?: number;
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
    // Defensive validation
    if (!organizationId || organizationId === '') {
      throw new Error('Organization ID is required for invoice generation');
    }
    
    if (!branchId || branchId === '') {
      throw new Error('Branch ID is required for invoice generation');
    }

    const results: BulkGenerationResult = {
      successCount: 0,
      errorCount: 0,
      errors: [],
      totalAmount: 0,
      invoices: []
    };

    console.log('[BulkInvoiceGeneration] Starting bulk generation for period:', periodDetails);

    // Step 1: Fetch only completed/done bookings that are NOT already invoiced
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        clients!inner(id, first_name, last_name, branch_id),
        services(title),
        staff(first_name, last_name)
      `)
      .eq('branch_id', branchId)
      .in('status', ['done', 'completed', 'in_progress'])
      .eq('is_invoiced', false)
      .gte('start_time', periodDetails.startDate)
      .lte('start_time', periodDetails.endDate);

    if (bookingsError) {
      console.error('[BulkInvoiceGeneration] Error fetching bookings:', bookingsError);
      throw bookingsError;
    }

    if (!bookings || bookings.length === 0) {
      console.log('[BulkInvoiceGeneration] No uninvoiced completed bookings found for this period');
      return { ...results, message: 'No uninvoiced completed bookings found for this period' };
    }

    console.log(`[BulkInvoiceGeneration] Found ${bookings.length} uninvoiced completed bookings`);

    // Step 2: Fetch approved extra time records for the period
    const { data: extraTimeRecords, error: extraTimeError } = await supabase
      .from('extra_time_records')
      .select('id, client_id, work_date, extra_time_minutes, total_cost, reason')
      .eq('branch_id', branchId)
      .eq('status', 'approved')
      .eq('invoiced', false)
      .gte('work_date', periodDetails.startDate)
      .lte('work_date', periodDetails.endDate);

    if (extraTimeError) {
      console.error('[BulkInvoiceGeneration] Error fetching extra time records:', extraTimeError);
    }

    // Group extra time by client
    const clientExtraTimeMap = new Map<string, ExtraTimeRecord[]>();
    (extraTimeRecords || []).forEach((record: ExtraTimeRecord) => {
      if (record.client_id) {
        if (!clientExtraTimeMap.has(record.client_id)) {
          clientExtraTimeMap.set(record.client_id, []);
        }
        clientExtraTimeMap.get(record.client_id)!.push(record);
      }
    });

    console.log(`[BulkInvoiceGeneration] Found ${extraTimeRecords?.length || 0} approved extra time records`);

    // Step 3: Group bookings by client
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

    // Step 4: Process each client
    for (const [clientId, clientData] of clientBookingsMap) {
      try {
        onProgress?.({ 
          current: processedClients, 
          total: totalClients, 
          currentClient: clientData.clientName 
        });

        console.log(`[BulkInvoiceGeneration] Processing client: ${clientData.clientName} (${clientData.bookings.length} bookings)`);

        // 4a. Fetch client billing configuration (NEW: integrates accounting settings)
        const billingConfig = await fetchClientBillingConfig(clientId);
        console.log(`[BulkInvoiceGeneration] Client ${clientData.clientName} billing config:`, {
          useActualTime: billingConfig.useActualTime,
          creditPeriodDays: billingConfig.creditPeriodDays,
          billToType: billingConfig.billToType,
          extraTimeEnabled: billingConfig.extraTimeEnabled
        });

        // Get extra time records for this client
        const clientExtraTime = clientExtraTimeMap.get(clientId) || [];
        console.log(`[BulkInvoiceGeneration] Client has ${clientExtraTime.length} extra time records`);

        // 4b. Fetch client rate schedules (check both tables)
        const { data: rateSchedules, error: rateError } = await supabase
          .from('client_rate_schedules')
          .select('*')
          .eq('client_id', clientId)
          .eq('is_active', true);

        if (rateError) throw rateError;
        
        let typedRateSchedules: any[] = rateSchedules || [];

        // If no rate schedules, check client_rate_assignments as fallback
        if (typedRateSchedules.length === 0) {
          console.log(`[BulkInvoiceGeneration] No client_rate_schedules found, checking client_rate_assignments for: ${clientData.clientName}`);
          
          const { data: rateAssignments, error: assignmentError } = await supabase
            .from('client_rate_assignments')
            .select(`
              *,
              service_rate:service_rates(*)
            `)
            .eq('client_id', clientId)
            .eq('is_active', true);

          if (assignmentError) {
            console.error(`[BulkInvoiceGeneration] Error fetching rate assignments:`, assignmentError);
          }

          if (rateAssignments && rateAssignments.length > 0) {
            console.log(`[BulkInvoiceGeneration] Found ${rateAssignments.length} rate assignments for: ${clientData.clientName}`);
            
            // Convert rate assignments to rate schedule format for the calculator
            typedRateSchedules = rateAssignments.map((assignment: any) => ({
              id: assignment.id,
              client_id: assignment.client_id,
              rate_type: assignment.service_rate?.rate_type || 'hourly',
              hourly_rate: assignment.service_rate?.hourly_rate || assignment.service_rate?.rate_per_unit || 0,
              rate_per_unit: assignment.service_rate?.rate_per_unit || assignment.service_rate?.hourly_rate || 0,
              effective_from: assignment.start_date,
              effective_to: assignment.end_date,
              is_active: assignment.is_active,
              bank_holiday_multiplier: assignment.service_rate?.bank_holiday_multiplier || 1.5,
              service_id: assignment.service_rate_id,
              description: assignment.service_rate?.name || assignment.service_rate?.description || 'Service Rate'
            }));
          }
        }

        // Still no rates found after checking both tables
        if (typedRateSchedules.length === 0) {
          console.warn(`[BulkInvoiceGeneration] No active rate schedule or assignment for client: ${clientData.clientName}`);
          results.errors.push({
            clientId,
            clientName: clientData.clientName,
            reason: 'No active rate schedule or rate assignment found',
            bookingCount: clientData.bookings.length
          });
          results.errorCount++;
          processedClients++;
          continue;
        }

        console.log(`[BulkInvoiceGeneration] Using ${typedRateSchedules.length} rate schedule(s) for: ${clientData.clientName}`);

        // 4c. Convert bookings to Visit format for calculator
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

        // 4d. Calculate using VisitBillingCalculator with correct time basis from config
        const calculator = new VisitBillingCalculator(typedRateSchedules, billingConfig.useActualTime);
        const billingSummary = calculator.calculateVisitsBilling(visits);

        // 4e. Calculate total booked time from all scheduled booking times
        const totalBookedMinutes = clientData.bookings.reduce((sum, booking) => {
          const duration = Math.round(
            (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 60000
          );
          return sum + duration;
        }, 0);

        // 4f. Add extra time costs only if enabled in client settings
        const extraTimeCost = billingConfig.extraTimeEnabled 
          ? clientExtraTime.reduce((sum, et) => sum + (et.total_cost || 0), 0)
          : 0;
        const totalWithExtraTime = billingSummary.total_amount + extraTimeCost;

        console.log(`[BulkInvoiceGeneration] Calculated billing for ${clientData.clientName}:`, {
          net: billingSummary.net_amount,
          vat: billingSummary.vat_amount,
          total: billingSummary.total_amount,
          extraTimeCost,
          extraTimeEnabled: billingConfig.extraTimeEnabled,
          totalWithExtraTime,
          lineItems: billingSummary.line_items.length
        });

        // 4g. Generate unique invoice number
        const invoiceNumber = await generateUniqueInvoiceNumber(organizationId);

        // 4h. Calculate due date based on credit period from client settings
        const dueDate = new Date(Date.now() + billingConfig.creditPeriodDays * 24 * 60 * 60 * 1000);

        // 4i. Build description with authority reference if applicable
        let description = `${periodDetails.type.charAt(0).toUpperCase() + periodDetails.type.slice(1)} Invoice (${periodDetails.startDate} to ${periodDetails.endDate})`;
        if (billingConfig.billToType === 'authority' && billingConfig.authorityReferenceNumber) {
          description = `${description} - Ref: ${billingConfig.authorityReferenceNumber}`;
        }

        // 4j. Create invoice with correct settings from client config
        const { data: invoice, error: invoiceError } = await supabase
          .from('client_billing')
          .insert({
            client_id: clientId,
            organization_id: organizationId,
            invoice_number: invoiceNumber,
            description,
            amount: billingSummary.net_amount + extraTimeCost,
            net_amount: billingSummary.net_amount + extraTimeCost,
            vat_amount: billingSummary.vat_amount,
            total_amount: totalWithExtraTime + billingSummary.vat_amount,
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            status: 'pending',
            start_date: periodDetails.startDate,
            end_date: periodDetails.endDate,
            invoice_type: 'automatic',
            invoice_method: billingConfig.invoiceMethod || periodDetails.type,
            bill_to_type: billingConfig.billToType,
            authority_id: billingConfig.billToType === 'authority' ? billingConfig.authorityId : null,
            booked_time_minutes: totalBookedMinutes,
            generated_from_booking: true
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        console.log(`[BulkInvoiceGeneration] Created invoice ${invoiceNumber} for ${clientData.clientName} (bill_to: ${billingConfig.billToType}, due in ${billingConfig.creditPeriodDays} days)`);

        // 4k. Create line items for bookings
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

        // 4l. Add extra time as line items (only if enabled)
        if (billingConfig.extraTimeEnabled && clientExtraTime.length > 0) {
          const extraTimeLineItems = clientExtraTime.map(et => ({
            invoice_id: invoice.id,
            organization_id: organizationId,
            description: `Extra Time: ${et.reason || 'Additional work time'}`,
            visit_date: et.work_date,
            duration_minutes: et.extra_time_minutes,
            rate_type_applied: 'extra_time',
            rate_per_unit: et.total_cost / (et.extra_time_minutes / 60),
            unit_price: et.total_cost / (et.extra_time_minutes / 60),
            quantity: et.extra_time_minutes / 60,
            line_total: et.total_cost,
            day_type: 'extra_time'
          }));

          const { error: extraTimeLineError } = await supabase
            .from('invoice_line_items')
            .insert(extraTimeLineItems);

          if (extraTimeLineError) {
            console.error('[BulkInvoiceGeneration] Error adding extra time line items:', extraTimeLineError);
          }

          // Mark extra time records as invoiced
          const extraTimeIds = clientExtraTime.map(et => et.id);
          const { error: markInvoicedError } = await supabase
            .from('extra_time_records')
            .update({ invoiced: true, invoice_id: invoice.id })
            .in('id', extraTimeIds);

          if (markInvoicedError) {
            console.error('[BulkInvoiceGeneration] Error marking extra time as invoiced:', markInvoicedError);
          }
        }

        // Mark bookings as invoiced
        const bookingIds = clientData.bookings.map(b => b.id);
        if (bookingIds.length > 0) {
          const { error: bookingUpdateError } = await supabase
            .from('bookings')
            .update({ 
              is_invoiced: true, 
              included_in_invoice_id: invoice.id 
            })
            .in('id', bookingIds);

          if (bookingUpdateError) {
            console.error(`[BulkInvoiceGeneration] Error marking bookings as invoiced:`, bookingUpdateError);
          }
        }

        // Success!
        results.successCount++;
        results.totalAmount += totalWithExtraTime + billingSummary.vat_amount;
        results.invoices.push({
          clientId,
          clientName: clientData.clientName,
          invoiceNumber,
          amount: totalWithExtraTime + billingSummary.vat_amount,
          lineItemCount: lineItemsData.length,
          extraTimeCount: billingConfig.extraTimeEnabled ? clientExtraTime.length : 0
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
