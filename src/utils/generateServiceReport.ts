import { format } from 'date-fns';

export interface GenerateServiceReportData {
  visitRecord: {
    id: string;
    booking_id: string;
    client_id: string;
    staff_id: string;
    branch_id: string;
    organization_id?: string;
    visit_start_time: string;
    visit_end_time?: string;
    actual_duration_minutes?: number;
    visit_notes?: string;
    visit_summary?: string;
    client_signature_data?: string;
    staff_signature_data?: string;
    visit_photos?: string[];
  };
  tasks?: Array<{
    task_name: string;
    task_description?: string;
    is_completed: boolean;
    completion_notes?: string;
  }>;
  medications?: Array<{
    medication_name: string;
    is_administered: boolean;
    administration_notes?: string;
    missed_reason?: string;
  }>;
  events?: Array<{
    event_type: string;
    event_category?: string;
    severity?: string;
    event_title: string;
    event_description: string;
  }>;
  createdBy: string;
}

export function generateServiceReportFromVisit(data: GenerateServiceReportData) {
  // Extract completed tasks
  const completedTasks = data.tasks
    ?.filter(t => t.is_completed)
    .map(t => t.task_name) || [];

  // Check for medications
  const medicationsAdministered = data.medications?.filter(m => m.is_administered) || [];
  const medicationNotes = medicationsAdministered.length > 0
    ? `Administered: ${medicationsAdministered.map(m => m.medication_name).join(', ')}`
    : undefined;

  // Check for incidents
  const hasIncidents = data.events?.some(e => 
    e.event_type === 'incident' || e.event_type === 'accident'
  ) || false;
  
  const incidentDetails = hasIncidents
    ? data.events
        ?.filter(e => e.event_type === 'incident' || e.event_type === 'accident')
        .map(e => `${e.event_title}: ${e.event_description}`)
        .join('\n\n')
    : undefined;

  // Compile observations from visit notes and events
  const observations = [
    data.visitRecord.visit_notes,
    ...(data.events?.filter(e => e.event_type === 'observation').map(e => e.event_description) || [])
  ].filter(Boolean).join('\n\n');

  return {
    client_id: data.visitRecord.client_id,
    staff_id: data.visitRecord.staff_id,
    visit_record_id: data.visitRecord.id,
    booking_id: data.visitRecord.booking_id || undefined,
    branch_id: data.visitRecord.branch_id,
    organization_id: data.visitRecord.organization_id || undefined,
    service_date: format(new Date(data.visitRecord.visit_start_time), 'yyyy-MM-dd'),
    service_duration_minutes: data.visitRecord.actual_duration_minutes || undefined,
    services_provided: ['Home Care Visit'], // Default, can be enhanced
    tasks_completed: completedTasks.length > 0 ? completedTasks : undefined,
    medication_administered: medicationsAdministered.length > 0,
    medication_notes: medicationNotes,
    incident_occurred: hasIncidents,
    incident_details: incidentDetails,
    carer_observations: observations || undefined,
    status: 'pending' as const, // Will need admin review
    created_by: data.createdBy,
  };
}
