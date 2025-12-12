export interface ServicePlanData {
  // General Section
  caption: string;
  start_date: Date | string | null;
  end_date: Date | string | null;
  
  // Service Details Section
  selected_days: string[];
  service_id: string;
  service_name: string;
  authority: string;
  authority_category: string;
  start_time: string;
  end_time: string;
  frequency: string;
  location: string;
  note: string;
}

export const DAYS_OF_WEEK = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
] as const;

export const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
] as const;

export const getDefaultServicePlan = (authority?: string, authorityCategory?: string): ServicePlanData => ({
  caption: '',
  start_date: null,
  end_date: null,
  selected_days: [],
  service_id: '',
  service_name: '',
  authority: authority || '',
  authority_category: authorityCategory || '',
  start_time: '',
  end_time: '',
  frequency: '',
  location: '',
  note: '',
});
