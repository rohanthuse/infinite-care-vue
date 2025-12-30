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
    visit_photos?: string[] | any;
  };
  tasks?: Array<{
    task_name?: string;
    title?: string;
    task_description?: string;
    description?: string;
    is_completed?: boolean;
    status?: string;
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
  goals?: Array<{
    description: string;
    status: string;
    progress?: number;
    notes?: string;
  }>;
  activities?: Array<{
    name: string;
    description?: string;
    frequency: string;
    status: string;
  }>;
  createdBy: string;
}

export function generateServiceReportFromVisit(data: GenerateServiceReportData) {
  // Extract completed tasks - support both visit_tasks and admin-assigned tasks
  const completedTasks = data.tasks
    ?.filter(t => t.is_completed || t.status === 'done')
    .map(t => t.task_name || t.title || 'Unnamed Task') || [];

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

  // Process care plan goals
  const goalsProgress = data.goals
    ?.map(g => `${g.description} (${g.status}, ${g.progress || 0}% complete)${g.notes ? ` - Notes: ${g.notes}` : ''}`)
    .join('\n\n') || '';

  // Process care plan activities - maps to activities_undertaken column
  const activitiesPerformed = data.activities
    ?.map(a => `${a.name} (${a.frequency}, ${a.status})${a.description ? ` - ${a.description}` : ''}`)
    .join('\n\n') || undefined;

  // Compile observations from visit notes, events, and goals progress
  const observationParts = [
    data.visitRecord.visit_notes,
    ...(data.events?.filter(e => e.event_type === 'observation').map(e => e.event_description) || []),
    goalsProgress ? `\n**Care Plan Goals Progress:**\n${goalsProgress}` : ''
  ].filter(Boolean);
  
  const observations = observationParts.join('\n\n');

  return {
    client_id: data.visitRecord.client_id,
    staff_id: data.visitRecord.staff_id,
    visit_record_id: data.visitRecord.id,
    booking_id: data.visitRecord.booking_id || undefined,
    branch_id: data.visitRecord.branch_id,
    organization_id: data.visitRecord.organization_id || undefined,
    service_date: format(new Date(data.visitRecord.visit_start_time), 'yyyy-MM-dd'),
    service_duration_minutes: data.visitRecord.actual_duration_minutes || undefined,
    services_provided: ['Home Care Visit'],
    tasks_completed: completedTasks.length > 0 ? completedTasks : undefined,
    medication_administered: medicationsAdministered.length > 0,
    medication_notes: medicationNotes,
    incident_occurred: hasIncidents,
    incident_details: incidentDetails,
    carer_observations: observations || undefined,
    activities_undertaken: activitiesPerformed,
    // Set to 'pending' - carer needs to complete mood/engagement fields
    status: 'pending' as const,
    visible_to_client: false,
    created_by: data.createdBy,
  };
}
