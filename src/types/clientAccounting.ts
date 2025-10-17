export interface ClientAccountingSettings {
  id: string;
  client_id: string;
  care_lead_id?: string;
  agreement_type?: string;
  expiry_date?: string;
  show_in_task_matrix: boolean;
  show_in_form_matrix: boolean;
  enable_geo_fencing: boolean;
  invoice_method: InvoiceMethod;
  invoice_display_type: string;
  billing_address_same_as_personal: boolean;
  pay_method?: string;
  rate_type: RateCategory;
  mileage_rule_no_payment: boolean;
  service_payer: ServicePayer;
  created_at: string;
  updated_at: string;
  branch_id: string;
  organization_id: string;
  // Authority-specific fields
  authority_invoice_config?: string;
  consolidation_preference?: 'single' | 'split_by_client';
  contract_reference?: string;
  contract_notes?: string;
}

export interface ClientPrivateAccounting {
  id: string;
  client_id: string;
  private_invoice_config?: string;
  charge_based_on: ChargeBasedOn;
  extra_time_calculation: boolean;
  travel_rate_id?: string;
  credit_period_days: number;
  created_at: string;
  updated_at: string;
  branch_id: string;
  organization_id: string;
}

export interface ServiceType {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientRateSchedule {
  id: string;
  client_id: string;
  service_type_code?: string;
  authority_type: string;
  start_date: string;
  end_date?: string;
  days_covered: string[];
  time_from: string;
  time_until: string;
  rate_category: RateCategory;
  pay_based_on: PayBasedOn;
  charge_type: ChargeType;
  base_rate: number;
  rate_15_minutes?: number;
  rate_30_minutes?: number;
  rate_45_minutes?: number;
  rate_60_minutes?: number;
  consecutive_hours_rate?: number;
  bank_holiday_multiplier: number;
  is_vatable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  branch_id: string;
  organization_id: string;
}

export type InvoiceMethod = 'per_visit' | 'weekly' | 'monthly';

export type RateCategory = 'standard' | 'adult' | 'cyp';

export type ServicePayer = 'authorities' | 'direct_payment' | 'self_funder' | 'other';

export type ChargeBasedOn = 'planned_time' | 'actual_time';

export type PayBasedOn = 'service' | 'hours_minutes' | 'daily_flat_rate';

export type ChargeType = 
  | 'flat_rate' 
  | 'pro_rata' 
  | 'hourly_rate' 
  | 'hour_minutes' 
  | 'rate_per_hour' 
  | 'rate_per_minutes_pro_rata' 
  | 'rate_per_minutes_flat_rate' 
  | 'daily_flat_rate';

export interface Visit {
  id: string;
  client_id: string;
  date: string;
  planned_start: string;
  planned_end: string;
  actual_start?: string;
  actual_end?: string;
  is_bank_holiday: boolean;
}

export const invoiceMethodLabels: Record<InvoiceMethod, string> = {
  per_visit: 'Per Visit',
  weekly: 'Weekly',
  monthly: 'Monthly'
};

export const rateCategoryLabels: Record<RateCategory, string> = {
  standard: 'Standard',
  adult: 'Adult',
  cyp: 'CYP (Children & Young People)'
};

export const servicePayerLabels: Record<ServicePayer, string> = {
  authorities: 'Authorities',
  direct_payment: 'Direct Payment',
  self_funder: 'Self-Funder',
  other: 'Other'
};

export const chargeBasedOnLabels: Record<ChargeBasedOn, string> = {
  planned_time: 'Planned Time',
  actual_time: 'Actual Time'
};

export const payBasedOnLabels: Record<PayBasedOn, string> = {
  service: 'Service',
  hours_minutes: 'Hours/Minutes',
  daily_flat_rate: 'Daily Flat Rate'
};

export const chargeTypeLabels: Record<ChargeType, string> = {
  flat_rate: 'Flat Rate',
  pro_rata: 'Pro Rata',
  hourly_rate: 'Hourly Rate',
  hour_minutes: 'Hour/Minutes',
  rate_per_hour: 'Rate per Hour',
  rate_per_minutes_pro_rata: 'Rate per Minutes (Pro Rata)',
  rate_per_minutes_flat_rate: 'Rate per Minutes (Flat Rate)',
  daily_flat_rate: 'Daily Flat Rate'
};

export const dayLabels: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday', 
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
  bank_holiday: 'Bank Holiday'
};