import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { 
  fetchOrganizationSettings, 
  loadImageAsBase64, 
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
    if (orgSettings?.logo_url) {
      logoBase64 = await loadImageAsBase64(orgSettings.logo_url);
    }
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = await addPDFHeader(doc, orgSettings, logoBase64);
  currentY += 10;

  const clientName = `${report.clients?.first_name || ''} ${report.clients?.last_name || ''}`.trim() || 'N/A';
  currentY = addDocumentTitle(doc, 'Service Report', clientName, currentY);
  currentY += 5;

  const visitDate = visitRecord?.visit_date ? format(new Date(visitRecord.visit_date), 'dd/MM/yyyy') : 'N/A';
  const startTime = visitRecord?.start_time || 'N/A';
  const endTime = visitRecord?.end_time || 'N/A';
  const duration = visitRecord?.actual_duration_minutes ? `${visitRecord.actual_duration_minutes} mins` : 'N/A';
  const carerName = `${report.staff?.first_name || ''} ${report.staff?.last_name || ''}`.trim() || 'N/A';
  
  doc.setFillColor(PDF_COLORS.gray[50].r, PDF_COLORS.gray[50].g, PDF_COLORS.gray[50].b);
  doc.roundedRect(20, currentY, pageWidth - 40, 35, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
  
  let boxY = currentY + 7;
  doc.text(`Visit Date: ${visitDate}`, 25, boxY);
  doc.text(`Time: ${startTime} - ${endTime}`, 25, boxY + 6);
  doc.text(`Duration: ${duration}`, 25, boxY + 12);
  doc.text(`Carer: ${carerName}`, 25, boxY + 18);
  
  const statusColor = report.status === 'approved' ? PDF_COLORS.success : report.status === 'rejected' ? PDF_COLORS.danger : PDF_COLORS.warning;
  doc.setTextColor(statusColor.r, statusColor.g, statusColor.b);
  doc.setFont(undefined, 'bold');
  doc.text(`Status: ${report.status || 'Pending'}`, 25, boxY + 24);
  currentY += 40;

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

  // Events
  if (incidents?.length > 0 || accidents?.length > 0 || observations?.length > 0) {
    currentY = await checkAndAddNewPage(doc, currentY, 40, orgSettings, logoBase64);
    currentY = addSectionHeader(doc, 'Events & Incidents', currentY, SECTION_COLORS.events);
    currentY += 10;
  }

  // Carer Details
  if (report.client_mood || report.carer_observations || report.client_feedback || report.next_visit_preparations) {
    currentY = await checkAndAddNewPage(doc, currentY, 60, orgSettings, logoBase64);
    currentY = addSectionHeader(doc, 'Carer Visit Details', currentY, SECTION_COLORS.carerDetails);
    doc.setFontSize(9);
    if (report.client_mood) {
      doc.setFont(undefined, 'bold');
      doc.text('Client Mood:', 20, currentY);
      doc.setFont(undefined, 'normal');
      doc.text(report.client_mood, 60, currentY);
      currentY += 6;
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
  }

  // Signatures
  if (visitRecord?.carer_signature_data || visitRecord?.client_signature_data) {
    currentY = await checkAndAddNewPage(doc, currentY, 50, orgSettings, logoBase64);
    currentY = addSectionHeader(doc, 'Signatures', currentY, SECTION_COLORS.signatures);
    if (visitRecord?.carer_signature_data) {
      try {
        doc.addImage(visitRecord.carer_signature_data, 'PNG', 20, currentY, 60, 20);
      } catch (e) {}
    }
    currentY += 30;
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc, orgSettings, i, totalPages, true);
  }

  doc.save(`Service_Report_${clientName.replace(/\s+/g, '_')}_${visitDate.replace(/\//g, '-')}.pdf`);
};
