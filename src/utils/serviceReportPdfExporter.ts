import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchOrganizationSettings, 
  getLogoForPDF,
  addPDFHeader, 
  addPDFFooter,
  addSectionHeader,
  addDocumentTitle,
  checkAndAddNewPage,
  PDF_COLORS,
  type OrganizationSettings
} from '@/lib/pdfExportHelpers';

interface ServiceReportPdfData {
  report: any;
  visitRecord: any;
  tasks: any[];
  medications: any[];
  news2Readings: any[];
  otherVitals: any[];
  events: any[];
  incidents: any[];
  accidents: any[];
  observations: any[];
  branchId?: string;
}

const SECTION_COLORS = {
  visitSummary: PDF_COLORS.primaryLight,
  tasks: PDF_COLORS.gray[100],
  medications: { r: 233, g: 213, b: 255 },
  vitals: { r: 254, g: 226, b: 226 },
  events: { r: 254, g: 243, b: 199 },
  carerDetails: { r: 220, g: 252, b: 231 },
  signatures: PDF_COLORS.primaryLight,
  adminReview: PDF_COLORS.gray[100],
};

export const exportSingleServiceReportPDF = async (data: ServiceReportPdfData) => {
  const { report, visitRecord, tasks, medications, news2Readings, otherVitals, events, incidents, accidents, observations, branchId } = data;
  
  let orgSettings: OrganizationSettings | null = null;
  let logoBase64: string | null = null;
  
  if (branchId) {
    orgSettings = await fetchOrganizationSettings(branchId);
  }
  logoBase64 = await getLogoForPDF(orgSettings);

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = await addPDFHeader(doc, orgSettings, logoBase64);
  currentY += 10;

  const clientName = `${report.clients?.first_name || ''} ${report.clients?.last_name || ''}`.trim() || 'N/A';
  currentY = addDocumentTitle(doc, 'Service Report', clientName, currentY);
  currentY += 5;

  const visitDate = visitRecord?.visit_start_time 
    ? format(new Date(visitRecord.visit_start_time), 'dd/MM/yyyy')
    : report.service_date 
      ? format(new Date(report.service_date), 'dd/MM/yyyy')
      : 'N/A';

  const startTime = visitRecord?.visit_start_time 
    ? format(new Date(visitRecord.visit_start_time), 'HH:mm')
    : 'N/A';

  const endTime = visitRecord?.visit_end_time 
    ? format(new Date(visitRecord.visit_end_time), 'HH:mm')
    : 'N/A';
    
  const duration = visitRecord?.actual_duration_minutes ? `${visitRecord.actual_duration_minutes} mins` : 'N/A';
  const carerName = `${report.staff?.first_name || ''} ${report.staff?.last_name || ''}`.trim() || 'N/A';
  const reportId = report.id.substring(0, 8).toUpperCase();
  
  doc.setFillColor(PDF_COLORS.gray[50].r, PDF_COLORS.gray[50].g, PDF_COLORS.gray[50].b);
  doc.roundedRect(20, currentY, pageWidth - 40, 40, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
  
  let boxY = currentY + 7;
  const col1X = 25;
  const col2X = pageWidth / 2 + 5;
  
  // Left column
  doc.setFont(undefined, 'bold');
  doc.text('Visit Date:', col1X, boxY);
  doc.setFont(undefined, 'normal');
  doc.text(visitDate, col1X + 25, boxY);
  
  doc.setFont(undefined, 'bold');
  doc.text('Time:', col1X, boxY + 6);
  doc.setFont(undefined, 'normal');
  doc.text(`${startTime} - ${endTime}`, col1X + 25, boxY + 6);
  
  doc.setFont(undefined, 'bold');
  doc.text('Duration:', col1X, boxY + 12);
  doc.setFont(undefined, 'normal');
  doc.text(duration, col1X + 25, boxY + 12);
  
  // Right column
  doc.setFont(undefined, 'bold');
  doc.text('Carer:', col2X, boxY);
  doc.setFont(undefined, 'normal');
  doc.text(carerName, col2X + 20, boxY);
  
  doc.setFont(undefined, 'bold');
  doc.text('Report ID:', col2X, boxY + 6);
  doc.setFont(undefined, 'normal');
  doc.text(reportId, col2X + 25, boxY + 6);
  
  doc.setFont(undefined, 'bold');
  doc.text('Status:', col2X, boxY + 12);
  const statusColor = report.status === 'approved' ? PDF_COLORS.success : report.status === 'rejected' ? PDF_COLORS.danger : PDF_COLORS.warning;
  doc.setTextColor(statusColor.r, statusColor.g, statusColor.b);
  doc.setFont(undefined, 'bold');
  doc.text((report.status || 'Pending').toUpperCase(), col2X + 20, boxY + 12);
  
  doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
  currentY += 45;

  // Visit Summary
  if (report.services_provided?.length > 0) {
    currentY = await checkAndAddNewPage(doc, currentY, 40, orgSettings, logoBase64);
    currentY = addSectionHeader(doc, 'Visit Summary', currentY, SECTION_COLORS.visitSummary);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
    report.services_provided.forEach((service: string) => {
      doc.text(`• ${service}`, 25, currentY);
      currentY += 5;
    });
    currentY += 5;
  }

  // Tasks
  if (tasks?.length > 0) {
    currentY = await checkAndAddNewPage(doc, currentY, 50, orgSettings, logoBase64);
    currentY = addSectionHeader(doc, 'Task Details', currentY, SECTION_COLORS.tasks);
    const taskData = tasks.map(t => [t.task_categories?.name || 'Uncategorized', t.tasks?.name || 'N/A', t.is_completed ? '✓' : '✗', t.completed_at ? format(new Date(t.completed_at), 'HH:mm') : '-', t.notes || '-']);
    autoTable(doc, {
      startY: currentY,
      head: [['Category', 'Task', 'Done', 'Time', 'Notes']],
      body: taskData,
      theme: 'striped',
      headStyles: { fillColor: [PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b], fontSize: 9, fontStyle: 'bold', textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [PDF_COLORS.gray[50].r, PDF_COLORS.gray[50].g, PDF_COLORS.gray[50].b] }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Medications
  if (medications?.length > 0) {
    currentY = await checkAndAddNewPage(doc, currentY, 50, orgSettings, logoBase64);
    currentY = addSectionHeader(doc, 'Medication Details', currentY, SECTION_COLORS.medications);
    const medData = medications.map(m => [m.medications?.name || 'N/A', [m.medications?.dosage, m.medications?.route].filter(Boolean).join(' - ') || 'N/A', m.scheduled_time || '-', m.is_administered ? 'Administered' : m.missed_reason ? 'Missed' : 'Pending', m.administered_at ? format(new Date(m.administered_at), 'HH:mm') : '-', m.administration_notes || m.missed_reason || '-']);
    autoTable(doc, {
      startY: currentY,
      head: [['Medication', 'Dosage & Route', 'Scheduled', 'Status', 'Actual Time', 'Notes']],
      body: medData,
      theme: 'striped',
      headStyles: { fillColor: [147, 51, 234], fontSize: 9, fontStyle: 'bold', textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [PDF_COLORS.gray[50].r, PDF_COLORS.gray[50].g, PDF_COLORS.gray[50].b] }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // NEWS2 & Vitals
  if (news2Readings?.length > 0) {
    currentY = await checkAndAddNewPage(doc, currentY, 70, orgSettings, logoBase64);
    currentY = addSectionHeader(doc, 'NEWS2 & Vital Signs', currentY, SECTION_COLORS.vitals);
    news2Readings.forEach((r: any) => {
      autoTable(doc, {
        startY: currentY,
        head: [['Parameter', 'Value', 'Score']],
        body: [['Respiratory Rate', r.respiratory_rate || '-', r.respiratory_rate_score || '0'], ['SpO2', r.spo2 ? `${r.spo2}%` : '-', r.spo2_score || '0'], ['Temperature', r.temperature ? `${r.temperature}°C` : '-', r.temperature_score || '0'], ['Blood Pressure', r.systolic_bp || '-', r.systolic_bp_score || '0'], ['Heart Rate', r.heart_rate || '-', r.heart_rate_score || '0'], ['Consciousness', r.consciousness_level || '-', r.consciousness_score || '0']],
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], fontSize: 9, fontStyle: 'bold', textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 3 },
        alternateRowStyles: { fillColor: [PDF_COLORS.gray[50].r, PDF_COLORS.gray[50].g, PDF_COLORS.gray[50].b] }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    });
  }

  // Events & Incidents
  let hasEvents = false;

  if (incidents?.length > 0) {
    currentY = await checkAndAddNewPage(doc, currentY, 40, orgSettings, logoBase64);
    if (!hasEvents) {
      currentY = addSectionHeader(doc, 'Events & Incidents', currentY, SECTION_COLORS.events);
      hasEvents = true;
    }
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
    doc.text('Incidents:', 20, currentY);
    currentY += 6;
    
    const incidentData = incidents.map(inc => [
      inc.time ? format(new Date(inc.time), 'HH:mm') : '-',
      inc.title || 'Incident',
      inc.description || '-',
      inc.severity || 'Low'
    ]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Time', 'Title', 'Description', 'Severity']],
      body: incidentData,
      theme: 'striped',
      headStyles: { fillColor: [251, 191, 36], fontSize: 9, fontStyle: 'bold', textColor: [0, 0, 0] },
      styles: { fontSize: 8, cellPadding: 3 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  if (accidents?.length > 0) {
    currentY = await checkAndAddNewPage(doc, currentY, 40, orgSettings, logoBase64);
    if (!hasEvents) {
      currentY = addSectionHeader(doc, 'Events & Incidents', currentY, SECTION_COLORS.events);
      hasEvents = true;
    }
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
    doc.text('Accidents:', 20, currentY);
    currentY += 6;
    
    const accidentData = accidents.map(acc => [
      acc.time ? format(new Date(acc.time), 'HH:mm') : '-',
      acc.title || 'Accident',
      acc.description || '-',
      acc.follow_up_required ? 'Yes' : 'No'
    ]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Time', 'Title', 'Description', 'Follow-up Required']],
      body: accidentData,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68], fontSize: 9, fontStyle: 'bold', textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 3 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  if (observations?.length > 0) {
    currentY = await checkAndAddNewPage(doc, currentY, 40, orgSettings, logoBase64);
    if (!hasEvents) {
      currentY = addSectionHeader(doc, 'Events & Incidents', currentY, SECTION_COLORS.events);
      hasEvents = true;
    }
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
    doc.text('Observations:', 20, currentY);
    currentY += 6;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    observations.forEach((obs: any) => {
      doc.setFont(undefined, 'bold');
      doc.text(`${obs.time ? format(new Date(obs.time), 'HH:mm') : '-'}:`, 25, currentY);
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(obs.observation || '-', pageWidth - 60);
      doc.text(lines, 40, currentY);
      currentY += lines.length * 4 + 3;
    });
    currentY += 5;
  }

  // Carer Details
  if (report.client_mood || report.carer_observations || report.client_feedback || report.next_visit_preparations || report.client_engagement || report.activities_undertaken || (report.medication_administered && report.medication_notes) || (report.incident_occurred && report.incident_details)) {
    currentY = await checkAndAddNewPage(doc, currentY, 60, orgSettings, logoBase64);
    currentY = addSectionHeader(doc, 'Carer Visit Details', currentY, SECTION_COLORS.carerDetails);
    doc.setFontSize(9);
    doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
    
    if (report.client_mood) {
      doc.setFont(undefined, 'bold');
      doc.text('Client Mood:', 20, currentY);
      doc.setFont(undefined, 'normal');
      doc.text(report.client_mood, 60, currentY);
      currentY += 6;
    }
    
    if (report.client_engagement) {
      doc.setFont(undefined, 'bold');
      doc.text('Client Engagement:', 20, currentY);
      doc.setFont(undefined, 'normal');
      doc.text(report.client_engagement, 60, currentY);
      currentY += 6;
    }
    
    if (report.activities_undertaken) {
      doc.setFont(undefined, 'bold');
      doc.text('Activities Undertaken:', 20, currentY);
      currentY += 5;
      doc.setFont(undefined, 'normal');
      const actLines = doc.splitTextToSize(report.activities_undertaken, pageWidth - 50);
      doc.text(actLines, 25, currentY);
      currentY += actLines.length * 5 + 8;
    }
    
    if (report.carer_observations) {
      doc.setFont(undefined, 'bold');
      doc.text('Carer Observations:', 20, currentY);
      currentY += 5;
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(report.carer_observations, pageWidth - 50);
      doc.text(lines, 25, currentY);
      currentY += lines.length * 5 + 8;
    }
    
    if (report.client_feedback) {
      doc.setFont(undefined, 'bold');
      doc.text('Client Feedback:', 20, currentY);
      currentY += 5;
      doc.setFont(undefined, 'normal');
      const feedbackLines = doc.splitTextToSize(report.client_feedback, pageWidth - 50);
      doc.text(feedbackLines, 25, currentY);
      currentY += feedbackLines.length * 5 + 8;
    }
    
    if (report.next_visit_preparations) {
      doc.setFont(undefined, 'bold');
      doc.text('Next Visit Preparations:', 20, currentY);
      currentY += 5;
      doc.setFont(undefined, 'normal');
      const prepLines = doc.splitTextToSize(report.next_visit_preparations, pageWidth - 50);
      doc.text(prepLines, 25, currentY);
      currentY += prepLines.length * 5 + 8;
    }
    
    if (report.medication_administered && report.medication_notes) {
      doc.setFont(undefined, 'bold');
      doc.text('Medication Notes:', 20, currentY);
      currentY += 5;
      doc.setFont(undefined, 'normal');
      const medLines = doc.splitTextToSize(report.medication_notes, pageWidth - 50);
      doc.text(medLines, 25, currentY);
      currentY += medLines.length * 5 + 8;
    }
    
    if (report.incident_occurred && report.incident_details) {
      doc.setFont(undefined, 'bold');
      doc.setTextColor(PDF_COLORS.danger.r, PDF_COLORS.danger.g, PDF_COLORS.danger.b);
      doc.text('⚠ Incident Details:', 20, currentY);
      currentY += 5;
      doc.setFont(undefined, 'normal');
      doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
      const incLines = doc.splitTextToSize(report.incident_details, pageWidth - 50);
      doc.text(incLines, 25, currentY);
      currentY += incLines.length * 5 + 8;
    }
  }

  // Signatures
  if (visitRecord?.staff_signature_data || visitRecord?.client_signature_data) {
    currentY = await checkAndAddNewPage(doc, currentY, 60, orgSettings, logoBase64);
    currentY = addSectionHeader(doc, 'Signatures', currentY, SECTION_COLORS.signatures);
    
    if (visitRecord?.staff_signature_data) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
      doc.text('Carer Signature:', 20, currentY);
      currentY += 5;
      try {
        doc.addImage(visitRecord.staff_signature_data, 'PNG', 20, currentY, 60, 20);
      } catch (e) {
        console.error('Error adding carer signature:', e);
      }
      currentY += 25;
    }
    
    if (visitRecord?.client_signature_data) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
      doc.text('Client Signature:', visitRecord?.staff_signature_data ? 100 : 20, visitRecord?.staff_signature_data ? currentY - 30 : currentY);
      try {
        doc.addImage(visitRecord.client_signature_data, 'PNG', visitRecord?.staff_signature_data ? 100 : 20, visitRecord?.staff_signature_data ? currentY - 25 : currentY + 5, 60, 20);
      } catch (e) {
        console.error('Error adding client signature:', e);
      }
      if (!visitRecord?.staff_signature_data) {
        currentY += 30;
      }
    }
    currentY += 10;
  }
  
  // Admin Review Section
  if (report.reviewed_at && report.review_notes) {
    currentY = await checkAndAddNewPage(doc, currentY, 40, orgSettings, logoBase64);
    currentY = addSectionHeader(doc, 'Admin Review', currentY, SECTION_COLORS.adminReview);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
    doc.text('Review Status:', 20, currentY);
    
    const reviewStatusColor = report.status === 'approved' ? PDF_COLORS.success : 
                       report.status === 'rejected' ? PDF_COLORS.danger : 
                       PDF_COLORS.warning;
    doc.setTextColor(reviewStatusColor.r, reviewStatusColor.g, reviewStatusColor.b);
    doc.text((report.status || '').toUpperCase(), 60, currentY);
    doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
    currentY += 6;
    
    doc.setFont(undefined, 'bold');
    doc.text('Review Notes:', 20, currentY);
    currentY += 5;
    doc.setFont(undefined, 'normal');
    const reviewLines = doc.splitTextToSize(report.review_notes, pageWidth - 50);
    doc.text(reviewLines, 25, currentY);
    currentY += reviewLines.length * 5 + 5;
    
    doc.setFont(undefined, 'bold');
    doc.text('Reviewed On:', 20, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(format(new Date(report.reviewed_at), 'dd/MM/yyyy HH:mm'), 60, currentY);
    currentY += 10;
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc, orgSettings, i, totalPages, true);
  }

  doc.save(`Service_Report_${clientName.replace(/\s+/g, '_')}_${visitDate.replace(/\//g, '-')}.pdf`);
};

/**
 * Fetches all visit-related data and generates a PDF
 * This is a standalone function that can be called from anywhere
 */
export const generatePDFForServiceReport = async (
  report: any,
  branchId?: string
) => {
  // Create safeReport with fallbacks (same as ViewServiceReportDialog)
  const safeReport = {
    ...report,
    clients: report.clients || { first_name: '', last_name: '', email: '' },
    staff: report.staff || { first_name: '', last_name: '', email: '' },
    services_provided: report.services_provided || [],
    client_mood: report.client_mood || '',
    client_engagement: report.client_engagement || '',
    carer_observations: report.carer_observations || '',
    client_feedback: report.client_feedback || '',
    activities_undertaken: report.activities_undertaken || '',
    medication_notes: report.medication_notes || '',
    incident_details: report.incident_details || '',
    next_visit_preparations: report.next_visit_preparations || '',
    review_notes: report.review_notes || '',
    medication_administered: report.medication_administered ?? false,
    incident_occurred: report.incident_occurred ?? false,
  };

  // Try to find visit_record_id - first from report, then via booking_id
  let visitRecordId = safeReport.visit_record_id;

  if (!visitRecordId && safeReport.booking_id) {
    // Try to find visit record via booking_id
    const { data: foundVisitRecord } = await supabase
      .from('visit_records')
      .select('id')
      .eq('booking_id', safeReport.booking_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (foundVisitRecord) {
      visitRecordId = foundVisitRecord.id;
    }
  }

  // If no visit record found, generate simplified PDF with report data only
  if (!visitRecordId) {
    await exportSingleServiceReportPDF({
      report: safeReport,
      visitRecord: null,
      tasks: [],
      medications: [],
      news2Readings: [],
      otherVitals: [],
      events: [],
      incidents: [],
      accidents: [],
      observations: [],
      branchId: branchId || safeReport.branch_id,
    });
    return;
  }

  // Fetch visit record
  const { data: visitRecord, error: visitError } = await supabase
    .from('visit_records')
    .select('*')
    .eq('id', visitRecordId)
    .single();

  if (visitError) {
    // If visit record fetch fails, generate PDF without visit data
    console.warn('Could not fetch visit record, generating simplified PDF:', visitError.message);
    await exportSingleServiceReportPDF({
      report: safeReport,
      visitRecord: null,
      tasks: [],
      medications: [],
      news2Readings: [],
      otherVitals: [],
      events: [],
      incidents: [],
      accidents: [],
      observations: [],
      branchId: branchId || safeReport.branch_id,
    });
    return;
  }

  // Fetch tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('visit_tasks')
    .select('*')
    .eq('visit_record_id', visitRecordId)
    .order('created_at', { ascending: true });

  if (tasksError) console.warn('Failed to fetch tasks:', tasksError.message);

  // Fetch medications
  const { data: medications, error: medsError } = await supabase
    .from('visit_medications')
    .select('*')
    .eq('visit_record_id', visitRecordId)
    .order('prescribed_time', { ascending: true });

  if (medsError) console.warn('Failed to fetch medications:', medsError.message);

  // Fetch vitals
  const { data: vitals, error: vitalsError } = await supabase
    .from('visit_vitals')
    .select('*')
    .eq('visit_record_id', visitRecordId)
    .order('reading_time', { ascending: true });

  if (vitalsError) console.warn('Failed to fetch vitals:', vitalsError.message);

  const news2Readings = vitals?.filter(v => v.vital_type === 'news2') || [];
  const otherVitals = vitals?.filter(v => v.vital_type !== 'news2') || [];

  // Fetch all events types
  const { data: allEvents, error: eventsError } = await supabase
    .from('visit_events')
    .select('*')
    .eq('visit_record_id', visitRecordId)
    .order('event_time', { ascending: true });

  if (eventsError) console.warn('Failed to fetch events:', eventsError.message);

  // Separate events by type
  const events = allEvents?.filter(e => e.event_type === 'general') || [];
  const incidents = allEvents?.filter(e => e.event_type === 'incident') || [];
  const accidents = allEvents?.filter(e => e.event_type === 'accident') || [];
  const observations = allEvents?.filter(e => e.event_type === 'observation') || [];

  // Generate PDF with all data
  await exportSingleServiceReportPDF({
    report: safeReport,
    visitRecord: visitRecord,
    tasks: tasks || [],
    medications: medications || [],
    news2Readings: news2Readings,
    otherVitals: otherVitals,
    events: events,
    incidents: incidents,
    accidents: accidents,
    observations: observations,
    branchId: branchId || safeReport.branch_id,
  });
};
