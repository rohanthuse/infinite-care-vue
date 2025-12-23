import { ClientRateSchedule } from '@/types/clientAccounting';

export interface Visit {
  id: string;
  client_id: string;
  date: string;
  planned_start: string;
  planned_end: string;
  actual_start?: string;
  actual_end?: string;
  is_bank_holiday?: boolean;
}

export interface BillingCalculation {
  visit_id: string;
  description: string;
  date: string;
  planned_duration_minutes: number;
  actual_duration_minutes: number;
  billing_duration_minutes: number; // What we bill for
  rate_type: string;
  base_rate: number;
  multiplier: number;
  unit_rate: number; // Rate per unit (minute/hour)
  line_total: number;
  is_vatable: boolean;
  vat_amount: number;
  is_bank_holiday: boolean;
  applies_60_min_rule: boolean;
}

export interface BillingSummary {
  line_items: BillingCalculation[];
  net_amount: number;
  vat_amount: number;
  total_amount: number;
  total_billable_hours: number;
  total_billable_minutes: number;
}

/**
 * Calculate billing for visits based on rate schedules and billing rules
 */
export class VisitBillingCalculator {
  private rateSchedules: ClientRateSchedule[];
  private useActualTime: boolean;

  constructor(rateSchedules: ClientRateSchedule[], useActualTime: boolean = false) {
    this.rateSchedules = rateSchedules;
    this.useActualTime = useActualTime;
  }

  /**
   * Calculate billing for multiple visits
   */
  calculateVisitsBilling(visits: Visit[]): BillingSummary {
    const lineItems: BillingCalculation[] = [];

    for (const visit of visits) {
      const calculation = this.calculateVisitBilling(visit);
      if (calculation) {
        lineItems.push(calculation);
      }
    }

    // Calculate totals
    const netAmount = lineItems.reduce((sum, item) => sum + item.line_total, 0);
    const vatAmount = lineItems.reduce((sum, item) => sum + item.vat_amount, 0);
    const totalAmount = netAmount + vatAmount;
    const totalMinutes = lineItems.reduce((sum, item) => sum + item.billing_duration_minutes, 0);

    return {
      line_items: lineItems,
      net_amount: netAmount,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      total_billable_hours: Math.floor(totalMinutes / 60),
      total_billable_minutes: totalMinutes // Return full total minutes, not remainder
    };
  }

  /**
   * Calculate billing for a single visit
   */
  private calculateVisitBilling(visit: Visit): BillingCalculation | null {
    const rate = this.findApplicableRate(visit);
    if (!rate) {
      console.warn(`No applicable rate found for visit ${visit.id} on ${visit.date}`);
      return null;
    }

    const plannedMinutes = this.calculateDurationMinutes(visit.planned_start, visit.planned_end);
    const actualMinutes = visit.actual_start && visit.actual_end 
      ? this.calculateDurationMinutes(visit.actual_start, visit.actual_end)
      : plannedMinutes;

    const billingMinutes = this.useActualTime ? actualMinutes : plannedMinutes;
    
    // Apply >60 minute hourly rule
    const applies60MinRule = billingMinutes > 60;
    const adjustedBillingMinutes = applies60MinRule 
      ? Math.ceil(billingMinutes / 60) * 60 // Round up to nearest hour
      : billingMinutes;

    // Calculate rate and multiplier
    const bankHolidayMultiplier = visit.is_bank_holiday 
      ? (rate.bank_holiday_multiplier || 1) 
      : 1;

    const unitRate = this.calculateUnitRate(rate, adjustedBillingMinutes);
    const lineTotal = (unitRate * adjustedBillingMinutes / 60) * bankHolidayMultiplier;

    // Calculate VAT
    const vatAmount = rate.is_vatable ? lineTotal * 0.2 : 0;

    return {
      visit_id: visit.id,
      description: this.generateLineDescription(visit, rate),
      date: visit.date,
      planned_duration_minutes: plannedMinutes,
      actual_duration_minutes: actualMinutes,
      billing_duration_minutes: adjustedBillingMinutes,
      rate_type: rate.charge_type || 'rate_per_minutes_pro_rata',
      base_rate: rate.base_rate,
      multiplier: bankHolidayMultiplier,
      unit_rate: unitRate,
      line_total: lineTotal,
      is_vatable: rate.is_vatable,
      vat_amount: vatAmount,
      is_bank_holiday: visit.is_bank_holiday || false,
      applies_60_min_rule: applies60MinRule
    };
  }

  /**
   * Find the applicable rate schedule for a visit
   */
  private findApplicableRate(visit: Visit): ClientRateSchedule | null {
    const visitDate = new Date(visit.date);
    // Get both full and abbreviated day names for flexible matching
    const visitDayFull = visitDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // 'monday'
    const visitDayShort = visitDate.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase(); // 'mon'
    const visitTime = visit.planned_start;

    console.log(`[RateMatcher] Checking visit ${visit.id} on ${visit.date} (${visitDayFull}/${visitDayShort})`);

    for (const rate of this.rateSchedules) {
      // Check if rate is active
      if (!rate.is_active) continue;

      // Check date range
      const startDate = new Date(rate.start_date);
      const endDate = rate.end_date ? new Date(rate.end_date) : null;
      
      if (visitDate < startDate || (endDate && visitDate > endDate)) {
        console.log(`[RateMatcher] Rate ${rate.id} skipped - date out of range`);
        continue;
      }

      // Check if day is covered - support both full names ('monday') and abbreviated ('mon')
      const daysCovered = rate.days_covered || [];
      console.log(`[RateMatcher] Rate days_covered:`, daysCovered);
      
      const coversDay = daysCovered.includes(visitDayFull) || 
                        daysCovered.includes(visitDayShort) ||
                        (visit.is_bank_holiday && daysCovered.includes('bank_holiday'));
      
      if (!coversDay) {
        console.log(`[RateMatcher] Rate ${rate.id} skipped - day not covered`);
        continue;
      }

      // Check time range
      if (this.isTimeInRange(visitTime, rate.time_from, rate.time_until)) {
        console.log(`[RateMatcher] Found matching rate ${rate.id} for visit ${visit.id}`);
        return rate;
      } else {
        console.log(`[RateMatcher] Rate ${rate.id} skipped - time ${visitTime} not in range ${rate.time_from}-${rate.time_until}`);
      }
    }

    console.warn(`[RateMatcher] No matching rate found for visit ${visit.id} on ${visit.date}`);
    return null;
  }

  /**
   * Calculate unit rate based on rate schedule and duration
   */
  private calculateUnitRate(rate: ClientRateSchedule, durationMinutes: number): number {
    const chargeType = rate.charge_type || 'rate_per_minutes_pro_rata';

    switch (chargeType) {
      case 'rate_per_minutes_pro_rata':
        return rate.base_rate; // Base rate is per hour, will be pro-rated

      case 'hourly_rate':
      case 'rate_per_hour':
        return rate.base_rate;

      case 'daily_flat_rate':
        return rate.base_rate; // Flat rate regardless of duration

      case 'flat_rate':
        // Use specific rates if available
        if (durationMinutes <= 15 && rate.rate_15_minutes) return rate.rate_15_minutes;
        if (durationMinutes <= 30 && rate.rate_30_minutes) return rate.rate_30_minutes;
        if (durationMinutes <= 45 && rate.rate_45_minutes) return rate.rate_45_minutes;
        if (durationMinutes <= 60 && rate.rate_60_minutes) return rate.rate_60_minutes;
        
        return rate.base_rate;

      default:
        return rate.base_rate;
    }
  }

  /**
   * Generate description for billing line item
   */
  private generateLineDescription(visit: Visit, rate: ClientRateSchedule): string {
    const date = new Date(visit.date).toLocaleDateString();
    const time = `${visit.planned_start} - ${visit.planned_end}`;
    const duration = this.useActualTime && visit.actual_start && visit.actual_end
      ? `${this.calculateDurationMinutes(visit.actual_start, visit.actual_end)} mins (actual)`
      : `${this.calculateDurationMinutes(visit.planned_start, visit.planned_end)} mins (planned)`;
    
    let description = `Service on ${date} ${time} (${duration})`;
    
    if (visit.is_bank_holiday) {
      description += ` - Bank Holiday (${rate.bank_holiday_multiplier || 1}x)`;
    }

    return description;
  }

  /**
   * Calculate duration in minutes between two time strings
   */
  private calculateDurationMinutes(startTime: string, endTime: string): number {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    return Math.round((end.getTime() - start.getTime()) / 60000);
  }

  /**
   * Check if a time falls within a time range
   */
  private isTimeInRange(time: string, rangeStart: string, rangeEnd: string): boolean {
    const timeValue = new Date(`1970-01-01T${time}`);
    const startValue = new Date(`1970-01-01T${rangeStart}`);
    const endValue = new Date(`1970-01-01T${rangeEnd}`);
    
    return timeValue >= startValue && timeValue <= endValue;
  }
}

/**
 * Utility function to create billing calculator for a client
 */
export const createBillingCalculator = (
  rateSchedules: ClientRateSchedule[],
  useActualTime: boolean = false
): VisitBillingCalculator => {
  return new VisitBillingCalculator(rateSchedules, useActualTime);
};