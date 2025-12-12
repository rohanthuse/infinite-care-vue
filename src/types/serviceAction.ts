export interface ServiceActionData {
  // Identification
  id?: string;
  
  // Section 1: Action Type
  action_type: 'existing' | 'new';
  existing_action_id?: string;
  action_name: string;
  
  // Section 2: Additional Requirements
  has_instructions: boolean;
  instructions?: string;
  required_written_outcome: boolean;
  written_outcome?: string;
  is_service_specific: boolean;
  linked_service_id?: string;
  linked_service_name?: string;
  
  // Section 3: Schedule Section
  start_date: Date | string | null;
  end_date: Date | string | null;
  schedule_type: 'shift' | 'time_specific';
  shift_times?: string[];
  start_time?: string;
  end_time?: string;
  selected_days: string[];
  frequency: string;
  notes?: string;
  
  // Status & Registration
  status: 'active' | 'inactive';
  registered_on?: string;
  registered_by?: string;
  registered_by_name?: string;
  is_saved?: boolean;
}

export const SHIFT_OPTIONS = [
  { key: 'am', label: 'AM' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'pm', label: 'PM' },
  { key: 'night', label: 'Night' },
] as const;

export const EXISTING_ACTIONS_OPTIONS = [
  { id: 'medication-admin', name: 'Medication Administration' },
  { id: 'mobility-assist', name: 'Mobility Assistance' },
  { id: 'personal-hygiene', name: 'Personal Hygiene Support' },
  { id: 'meal-prep', name: 'Meal Preparation' },
  { id: 'vital-signs', name: 'Vital Signs Monitoring' },
  { id: 'wound-care', name: 'Wound Care' },
  { id: 'physio-exercises', name: 'Physiotherapy Exercises' },
  { id: 'emotional-support', name: 'Emotional Support' },
] as const;

export const ACTION_FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
] as const;

export const getDefaultServiceAction = (): ServiceActionData => ({
  id: crypto.randomUUID(),
  action_type: 'new',
  action_name: '',
  has_instructions: false,
  instructions: '',
  required_written_outcome: false,
  written_outcome: '',
  is_service_specific: false,
  linked_service_id: '',
  linked_service_name: '',
  start_date: null,
  end_date: null,
  schedule_type: 'shift',
  shift_times: [],
  start_time: '',
  end_time: '',
  selected_days: [],
  frequency: '',
  notes: '',
  status: 'active',
  registered_on: undefined,
  registered_by: undefined,
  registered_by_name: undefined,
  is_saved: false,
});
