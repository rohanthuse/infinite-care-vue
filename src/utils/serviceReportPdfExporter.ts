import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchOrganizationSettings, 
  getLogoForPDF,
  PDF_COLORS,
  type OrganizationSettings
} from '@/lib/pdfExportHelpers';

interface FluidIntakeRecord {
  time: string;
  fluid_type: string;
  amount_ml: number;
  method?: string;
  comments?: string;
}

interface FluidOutputRecord {
  time: string;
  output_type: string;
  amount_ml?: number;
  amount_estimate?: string;
  appearance?: string;
  comments?: string;
}

interface UrinaryOutputRecord {
  time: string;
  collection_method: string;
  amount_ml?: number;
  amount_estimate?: string;
  colour?: string;
  odour?: string;
  discomfort_observations?: string;
}

interface FluidBalanceTarget {
  daily_intake_target_ml?: number;
  daily_output_target_ml?: number;
  alert_threshold_percentage?: number;
  notes?: string;
}

interface DietaryRequirements {
  dietary_restrictions?: string[];
  food_allergies?: string[];
  food_preferences?: string[];
  nutritional_needs?: string;
  supplements?: string[];
  feeding_assistance_required?: boolean;
  texture_modifications?: string;
  fluid_restrictions?: string;
  hydration_needs?: string;
  meal_preparation_needs?: string;
  eating_assistance?: string;
}

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
  carePlanGoals?: any[];
  activities?: any[];
  branchId?: string;
  // NEW: Fluid Balance Records
  fluidIntakeRecords?: FluidIntakeRecord[];
  fluidOutputRecords?: FluidOutputRecord[];
  urinaryOutputRecords?: UrinaryOutputRecord[];
  fluidBalanceTarget?: FluidBalanceTarget;
  // NEW: Dietary Requirements
  dietaryRequirements?: DietaryRequirements;
  // NEW: Visit Photos
  visitPhotos?: string[];
}

// Compact section colors
const SECTION_BG = {
  header: { r: 59, g: 130, b: 246 },      // Blue header
  light: { r: 248, g: 250, b: 252 },      // Very light gray
  tasks: { r: 240, g: 253, b: 244 },      // Light green
  meds: { r: 245, g: 243, b: 255 },       // Light purple
  vitals: { r: 254, g: 242, b: 242 },     // Light red
  notes: { r: 254, g: 252, b: 232 },      // Light yellow
  signatures: { r: 240, g: 249, b: 255 }, // Light blue
  goals: { r: 236, g: 253, b: 245 },      // Light teal
  activities: { r: 255, g: 247, b: 237 }, // Light orange
  fluid: { r: 219, g: 234, b: 254 },      // Light blue for fluid balance
  dietary: { r: 254, g: 243, b: 199 },    // Light yellow for dietary
  photos: { r: 237, g: 233, b: 254 },     // Light purple for photos
};

// Safe color accessor with fallback
const getGrayColor = (shade: number): { r: number; g: number; b: number } => {
  const color = PDF_COLORS.gray[shade as keyof typeof PDF_COLORS.gray];
  return color || PDF_COLORS.gray[700]; // Default to gray-700
};

// Page dimensions and safe margins for pagination
const PAGE_HEIGHT = 297; // A4 height in mm
const FOOTER_HEIGHT = 20; // Reserved space for footer
const SAFE_BOTTOM = PAGE_HEIGHT - FOOTER_HEIGHT; // Content must stop here (277mm)

/**
 * Check if we need a page break and add one if necessary
 * Returns the new Y position after potential page break
 */
const checkPageBreak = (
  doc: jsPDF,
  currentY: number,
  requiredSpace: number,
  orgSettings: OrganizationSettings | null,
  branchName: string,
  logoBase64: string | null,
  clientName: string,
  visitDate: string,
  reportId: string
): number => {
  if (currentY + requiredSpace > SAFE_BOTTOM) {
    // Add new page
    doc.addPage();
    // Add full header to new page (matches first page)
    const newY = addFullPageHeader(doc, orgSettings, logoBase64, branchName, clientName, visitDate, reportId);
    return newY;
  }
  return currentY;
};

/**
 * Add full header for continuation pages (matches first page header)
 */
const addFullPageHeader = (
  doc: jsPDF,
  orgSettings: OrganizationSettings | null,
  logoBase64: string | null,
  branchName: string,
  clientName: string,
  visitDate: string,
  reportId: string
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Thin blue top strip (same as page 1)
  doc.setFillColor(SECTION_BG.header.r, SECTION_BG.header.g, SECTION_BG.header.b);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // LEFT SIDE: Logo (same as page 1)
  if (logoBase64) {
    try {
      const getImageFormat = (base64: string): 'PNG' | 'JPEG' | 'GIF' => {
        if (base64.includes('data:image/jpeg') || base64.includes('data:image/jpg')) return 'JPEG';
        if (base64.includes('data:image/gif')) return 'GIF';
        return 'PNG';
      };
      doc.addImage(logoBase64, getImageFormat(logoBase64), margin, 8, 40, 22);
    } catch (e) {
      console.error('Error adding logo:', e);
    }
  }

  // RIGHT SIDE: Organization details (aligned right)
  const rightX = pageWidth - margin;
  
  doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(orgSettings?.name || 'Healthcare Services', rightX, 12, { align: 'right' });
  
  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(PDF_COLORS.gray[600].r, PDF_COLORS.gray[600].g, PDF_COLORS.gray[600].b);
  doc.text(`Branch: ${branchName}`, rightX, 17, { align: 'right' });
  doc.text(`Date: ${visitDate}`, rightX, 22, { align: 'right' });

  // CENTERED TITLE WITH CLIENT NAME
  let currentY = 32;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
  doc.text('SERVICE REPORT', pageWidth / 2, currentY, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
  doc.text(`Client: ${clientName} | Report ID: ${reportId}`, pageWidth / 2, currentY + 5, { align: 'center' });

  return 42; // Return Y position after full header
};

/**
 * Add compact professional header with thin blue top strip, logo LEFT, org details RIGHT
 */
const addCompactHeader = async (
  doc: jsPDF,
  orgSettings: OrganizationSettings | null,
  logoBase64: string | null,
  branchName: string,
  reportDate: string
): Promise<number> => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Thin blue top strip only (5px height)
  doc.setFillColor(SECTION_BG.header.r, SECTION_BG.header.g, SECTION_BG.header.b);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // White background for rest of header (no fill needed, default is white)
  
  // LEFT SIDE: Logo
  if (logoBase64) {
    try {
      const getImageFormat = (base64: string): 'PNG' | 'JPEG' | 'GIF' => {
        if (base64.includes('data:image/jpeg') || base64.includes('data:image/jpg')) return 'JPEG';
        if (base64.includes('data:image/gif')) return 'GIF';
        return 'PNG';
      };
      doc.addImage(logoBase64, getImageFormat(logoBase64), margin, 8, 40, 22);
    } catch (e) {
      console.error('Error adding logo:', e);
    }
  }

  // RIGHT SIDE: Organization details (aligned right)
  const rightX = pageWidth - margin;
  
  // Organization name
  doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(orgSettings?.name || 'Healthcare Services', rightX, 12, { align: 'right' });
  
  // Organization details
  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(PDF_COLORS.gray[600].r, PDF_COLORS.gray[600].g, PDF_COLORS.gray[600].b);
  
  let detailY = 17;
  
  // Address
  if (orgSettings?.address) {
    const addressLine = orgSettings.address.split('\n')[0];
    doc.text(addressLine, rightX, detailY, { align: 'right' });
    detailY += 4;
  }
  
  // Contact number
  if (orgSettings?.telephone) {
    doc.text(`Tel: ${orgSettings.telephone}`, rightX, detailY, { align: 'right' });
    detailY += 4;
  }
  
  // Email
  if (orgSettings?.email) {
    doc.text(orgSettings.email, rightX, detailY, { align: 'right' });
    detailY += 4;
  }
  
  // Branch name
  doc.text(`Branch: ${branchName}`, rightX, detailY, { align: 'right' });
  detailY += 4;
  
  // Report generated date
  doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, rightX, detailY, { align: 'right' });

  return 38; // Return Y position after header
};

/**
 * Add centered document title
 */
const addTitle = (doc: jsPDF, reportId: string, currentY: number): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
  doc.text('SERVICE REPORT', pageWidth / 2, currentY, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
  doc.text(`Report ID: ${reportId}`, pageWidth / 2, currentY + 5, { align: 'center' });
  
  return currentY + 10;
};

/**
 * Add compact section header (smaller height)
 */
const addCompactSectionHeader = (
  doc: jsPDF,
  title: string,
  currentY: number,
  bgColor: { r: number; g: number; b: number }
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  
  doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
  doc.rect(margin, currentY - 3, pageWidth - (margin * 2), 7, 'F');
  
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(PDF_COLORS.gray[800] ? PDF_COLORS.gray[800].r || 40 : 40, 40, 40);
  doc.text(title, margin + 2, currentY + 1);
  
  return currentY + 6;
};

/**
 * Add two-column info box
 */
const addTwoColumnBox = (
  doc: jsPDF,
  leftData: { label: string; value: string }[],
  rightData: { label: string; value: string }[],
  currentY: number,
  bgColor: { r: number; g: number; b: number }
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const boxHeight = Math.max(leftData.length, rightData.length) * 5 + 4;
  
  // Background
  doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), boxHeight, 1, 1, 'F');
  
  const col1X = margin + 3;
  const col2X = pageWidth / 2 + 3;
  
  doc.setFontSize(7);
  doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
  
  // Left column
  leftData.forEach((item, i) => {
    const y = currentY + 5 + (i * 5);
    doc.setFont(undefined, 'bold');
    doc.text(`${item.label}:`, col1X, y);
    doc.setFont(undefined, 'normal');
    doc.text(item.value, col1X + 28, y);
  });
  
  // Right column
  rightData.forEach((item, i) => {
    const y = currentY + 5 + (i * 5);
    doc.setFont(undefined, 'bold');
    doc.text(`${item.label}:`, col2X, y);
    doc.setFont(undefined, 'normal');
    doc.text(item.value, col2X + 28, y);
  });
  
  return currentY + boxHeight + 3;
};

/**
 * Add professional footer with disclaimer
 */
const addProfessionalFooter = (
  doc: jsPDF,
  orgSettings: OrganizationSettings | null,
  pageNumber: number,
  totalPages: number
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 12;
  const margin = 15;
  
  // Divider line
  doc.setDrawColor(PDF_COLORS.gray[300].r, PDF_COLORS.gray[300].g, PDF_COLORS.gray[300].b);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
  
  // Footer text
  doc.setFontSize(6);
  doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
  doc.setFont(undefined, 'normal');
  
  // Left: Confidential disclaimer
  doc.text('Confidential - For authorised use only', margin, footerY);
  
  // Center: System name and copyright
  const centerText = `Generated by Laniwyn Care System | © ${orgSettings?.name || 'Healthcare Services'}`;
  doc.text(centerText, pageWidth / 2, footerY, { align: 'center' });
  
  // Right: Page number
  doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
};

export const exportSingleServiceReportPDF = async (data: ServiceReportPdfData) => {
  const { report, visitRecord, tasks, medications, news2Readings, otherVitals, events, incidents, accidents, observations, carePlanGoals, activities, branchId, fluidIntakeRecords, fluidOutputRecords, urinaryOutputRecords, fluidBalanceTarget, dietaryRequirements, visitPhotos } = data;
  
  let orgSettings: OrganizationSettings | null = null;
  let logoBase64: string | null = null;
  let branchName = 'Main Branch';
  
  if (branchId) {
    orgSettings = await fetchOrganizationSettings(branchId);
    
    // Fetch branch name
    const { data: branchData } = await supabase
      .from('branches')
      .select('name')
      .eq('id', branchId)
      .single();
    if (branchData?.name) branchName = branchData.name;
  }
  logoBase64 = await getLogoForPDF(orgSettings);

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  
  // Extract data
  const clientName = `${report.clients?.first_name || ''} ${report.clients?.last_name || ''}`.trim() || 'N/A';
  const carerName = `${report.staff?.first_name || ''} ${report.staff?.last_name || ''}`.trim() || 'N/A';
  const reportId = report.id?.substring(0, 8).toUpperCase() || 'N/A';
  
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

  // === COMPACT HEADER ===
  let currentY = await addCompactHeader(doc, orgSettings, logoBase64, branchName, visitDate);
  
  // === TITLE ===
  currentY = addTitle(doc, reportId, currentY);
  
  // === CLIENT & CARER DETAILS (Combined Two-Column Layout) ===
  currentY = addCompactSectionHeader(doc, 'CLIENT & CARER DETAILS', currentY, SECTION_BG.light);
  currentY = addTwoColumnBox(doc, 
    [
      { label: 'Client Name', value: clientName },
      { label: 'Date of Birth', value: 'On file' },
      { label: 'Address', value: 'On file' },
    ],
    [
      { label: 'Staff Name', value: carerName },
      { label: 'Contact', value: report.staff?.email || 'N/A' },
    ],
    currentY, SECTION_BG.light
  );
  
  // === SERVICE DETAILS (Two-Column) ===
  currentY += 5;
  currentY = addCompactSectionHeader(doc, 'SERVICE DETAILS', currentY, SECTION_BG.light);
  
  const statusText = (report.status || 'pending').toUpperCase();
  currentY = addTwoColumnBox(doc, 
    [
      { label: 'Service Date', value: visitDate },
      { label: 'Start Time', value: startTime },
      { label: 'Duration', value: duration },
    ],
    [
      { label: 'End Time', value: endTime },
      { label: 'Service Type', value: 'Home Care Visit' },
      { label: 'Status', value: statusText },
    ],
    currentY, SECTION_BG.light
  );

  // === TASKS SECTION (Enhanced with Description and Duration) ===
  currentY += 5;
  currentY = addCompactSectionHeader(doc, 'TASKS COMPLETED', currentY, SECTION_BG.tasks);
  
  if (tasks?.length > 0) {
    const taskData = tasks.map(t => [
      t.task_name || t.task_category || 'N/A',
      (t.task_description || '-').substring(0, 30) + (t.task_description?.length > 30 ? '...' : ''),
      t.is_completed ? '✓' : '✗',
      t.completed_at ? format(new Date(t.completed_at), 'HH:mm') : '-',
      t.completion_time_minutes ? `${t.completion_time_minutes} mins` : '-',
    ]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Task Name', 'Description', 'Status', 'Time', 'Duration']],
      body: taskData,
      theme: 'grid',
      headStyles: { 
        fillColor: [34, 197, 94], 
        fontSize: 7, 
        fontStyle: 'bold', 
        textColor: [255, 255, 255],
        cellPadding: 1.5
      },
      styles: { fontSize: 6, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 40 },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 'auto', halign: 'center' }
      },
      margin: { left: margin, right: margin, bottom: FOOTER_HEIGHT + 5, top: 45 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          addFullPageHeader(doc, orgSettings, logoBase64, branchName, clientName, visitDate, reportId);
        }
      }
    });
    currentY = (doc as any).lastAutoTable.finalY + 3;
  } else {
    doc.setFontSize(7);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
    doc.text('No data available', margin + 2, currentY + 3);
    currentY += 8;
  }

  // === MEDICATIONS SECTION (Enhanced with Frequency) ===
  currentY += 5;
  currentY = addCompactSectionHeader(doc, 'MEDICATIONS', currentY, SECTION_BG.meds);
  
  if (medications?.length > 0) {
    const medData = medications.map(m => [
      m.medication_name || 'N/A',
      m.dosage || 'N/A',
      m.prescribed_time || 'As needed',
      m.administration_method || 'N/A',
      m.is_administered ? 'Given' : m.missed_reason ? 'Missed' : 'Pending',
      (m.administration_notes || m.missed_reason || '-').substring(0, 25)
    ]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Medication', 'Dosage', 'Frequency', 'Method', 'Status', 'Notes']],
      body: medData,
      theme: 'grid',
      headStyles: { 
        fillColor: [147, 51, 234], 
        fontSize: 7, 
        fontStyle: 'bold', 
        textColor: [255, 255, 255],
        cellPadding: 1.5
      },
      styles: { fontSize: 6, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 'auto' }
      },
      margin: { left: margin, right: margin, bottom: FOOTER_HEIGHT + 5, top: 45 },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          addFullPageHeader(doc, orgSettings, logoBase64, branchName, clientName, visitDate, reportId);
        }
      }
    });
    currentY = (doc as any).lastAutoTable.finalY + 3;
  } else {
    doc.setFontSize(7);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
    doc.text('No data available', margin + 2, currentY + 3);
    currentY += 8;
  }

  // === NEWS2 & VITAL SIGNS (Table Format) ===
  currentY += 5;
  // Check for page break before NEWS2 section (requires ~80mm for table + score)
  currentY = checkPageBreak(doc, currentY, 80, orgSettings, branchName, logoBase64, clientName, visitDate, reportId);
  currentY = addCompactSectionHeader(doc, 'NEWS2 & VITAL SIGNS', currentY, SECTION_BG.vitals);
  
  if (news2Readings?.length > 0) {
    const reading = news2Readings[0];
    
    // Create vitals table data with Type | Value | Unit | Time columns
    const vitalsTableData = [
      ['Respiratory Rate', reading.respiratory_rate || '-', '/min', reading.reading_time ? format(new Date(reading.reading_time), 'HH:mm') : '-'],
      ['Oxygen Saturation (SpO2)', reading.oxygen_saturation || reading.spo2 || '-', '%', ''],
      ['Temperature', reading.temperature || '-', '°C', ''],
      ['Blood Pressure', reading.systolic_bp ? `${reading.systolic_bp}/${reading.diastolic_bp || '-'}` : '-', 'mmHg', ''],
      ['Heart Rate', reading.pulse_rate || reading.heart_rate || '-', 'bpm', ''],
      ['Consciousness Level', reading.consciousness_level || '-', '-', ''],
    ];
    
    // Render vitals table
    autoTable(doc, {
      startY: currentY,
      head: [['Vital Sign', 'Value', 'Unit', 'Recorded Time']],
      body: vitalsTableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [239, 68, 68], 
        fontSize: 7, 
        fontStyle: 'bold', 
        textColor: [255, 255, 255],
        cellPadding: 1.5
      },
      styles: { fontSize: 6, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 'auto', halign: 'center' }
      },
      margin: { left: margin, right: margin, bottom: FOOTER_HEIGHT + 5, top: 45 },
      alternateRowStyles: { fillColor: [254, 242, 242] },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          addFullPageHeader(doc, orgSettings, logoBase64, branchName, clientName, visitDate, reportId);
        }
      }
    });
    currentY = (doc as any).lastAutoTable.finalY + 3;
    
    // NEWS2 Score - Dedicated line below table with proper spacing
    const news2Score = reading.news2_total_score || reading.total_score || 0;
    const riskLevel = news2Score >= 7 ? 'High Risk' : news2Score >= 5 ? 'Medium-High Risk' : news2Score >= 3 ? 'Low-Medium Risk' : 'Low Risk';
    const scoreColor = news2Score >= 5 ? PDF_COLORS.danger : news2Score >= 3 ? PDF_COLORS.warning : PDF_COLORS.success;
    
    doc.setFillColor(SECTION_BG.vitals.r, SECTION_BG.vitals.g, SECTION_BG.vitals.b);
    doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 8, 1, 1, 'F');
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b);
    doc.text(`NEWS2 Score: ${news2Score} (${riskLevel})`, margin + 3, currentY + 5.5);
    
    currentY += 11;
  } else {
    doc.setFontSize(7);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
    doc.text('No vital signs recorded', margin + 2, currentY + 3);
    currentY += 8;
  }

  // === CARE PLAN GOALS & ACTIVITIES (Two-Column Side-by-Side Layout) ===
  currentY += 5;
  // Check for page break before Goals & Activities section (requires ~60mm)
  currentY = checkPageBreak(doc, currentY, 60, orgSettings, branchName, logoBase64, clientName, visitDate, reportId);
  
  const halfWidth = (pageWidth - (margin * 2) - 5) / 2;
  const leftX = margin;
  const rightX = margin + halfWidth + 5;
  const columnStartY = currentY;
  
  // Left Column Header: CARE PLAN GOALS
  doc.setFillColor(SECTION_BG.goals.r, SECTION_BG.goals.g, SECTION_BG.goals.b);
  doc.roundedRect(leftX, currentY - 3, halfWidth, 7, 1, 1, 'F');
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  const gray800 = getGrayColor(800);
  doc.setTextColor(gray800.r, gray800.g, gray800.b);
  doc.text('CARE PLAN GOALS', leftX + 2, currentY + 1);
  
  // Right Column Header: ACTIVITIES
  doc.setFillColor(SECTION_BG.activities.r, SECTION_BG.activities.g, SECTION_BG.activities.b);
  doc.roundedRect(rightX, currentY - 3, halfWidth, 7, 1, 1, 'F');
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(gray800.r, gray800.g, gray800.b);
  doc.text('ACTIVITIES', rightX + 2, currentY + 1);
  
  currentY += 6;
  
  // Calculate content for both columns
  let leftColumnHeight = 0;
  let rightColumnHeight = 0;
  
  // Left Column Content: Care Plan Goals
  const goalsContentY = currentY;
  doc.setFillColor(240, 253, 244); // Light green background
  
  if (carePlanGoals?.length > 0) {
    const goalLines: string[] = [];
    carePlanGoals.forEach((g, idx) => {
      const goalText = `${idx + 1}. ${(g.description || 'N/A').substring(0, 45)}${g.description?.length > 45 ? '...' : ''}`;
      const statusText = `   Status: ${g.status || 'In Progress'}${g.progress ? ` (${g.progress}%)` : ''}`;
      goalLines.push(goalText, statusText);
    });
    leftColumnHeight = goalLines.length * 4 + 4;
    
    doc.roundedRect(leftX, goalsContentY, halfWidth, leftColumnHeight, 1, 1, 'F');
    doc.setFontSize(6);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
    
    goalLines.forEach((line, idx) => {
      if (line.startsWith('   Status:')) {
        doc.setFont(undefined, 'italic');
        doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
      } else {
        doc.setFont(undefined, 'normal');
        doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
      }
      doc.text(line, leftX + 2, goalsContentY + 4 + (idx * 4));
    });
  } else {
    leftColumnHeight = 10;
    doc.roundedRect(leftX, goalsContentY, halfWidth, leftColumnHeight, 1, 1, 'F');
    doc.setFontSize(6);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
    doc.text('No goals recorded', leftX + 2, goalsContentY + 6);
  }
  
  // Right Column Content: Activities (extracted from tasks with category='Activity')
  doc.setFillColor(255, 247, 237); // Light orange background
  
  // Extract activities from tasks array (deduped by name)
  const activityTasks = tasks?.filter(t => t.task_category === 'Activity') || [];
  const seenActivityNames = new Set<string>();
  const dedupedActivities = activityTasks.filter(t => {
    const key = (t.task_name || '').toLowerCase().trim().replace(/\s+/g, ' ');
    if (seenActivityNames.has(key)) return false;
    seenActivityNames.add(key);
    return true;
  });
  
  if (dedupedActivities.length > 0) {
    const activityLines: string[] = [];
    dedupedActivities.forEach((a, idx) => {
      const actName = `${idx + 1}. ${(a.task_name || 'N/A').substring(0, 40)}`;
      const status = a.is_completed ? '✓ Completed' : '○ Pending';
      activityLines.push(actName, `   ${status}`);
    });
    rightColumnHeight = activityLines.length * 4 + 4;
    
    doc.roundedRect(rightX, goalsContentY, halfWidth, rightColumnHeight, 1, 1, 'F');
    doc.setFontSize(6);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
    
    activityLines.forEach((line, idx) => {
      if (line.startsWith('   ')) {
        doc.setFont(undefined, 'italic');
        doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
      } else {
        doc.setFont(undefined, 'normal');
        doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
      }
      doc.text(line, rightX + 2, goalsContentY + 4 + (idx * 4));
    });
  } else if (report.activities_undertaken) {
    const activitiesText = doc.splitTextToSize(report.activities_undertaken, halfWidth - 6);
    rightColumnHeight = activitiesText.length * 4 + 4;
    doc.roundedRect(rightX, goalsContentY, halfWidth, rightColumnHeight, 1, 1, 'F');
    doc.setFontSize(6);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
    doc.text(activitiesText, rightX + 2, goalsContentY + 4);
  } else {
    rightColumnHeight = 10;
    doc.roundedRect(rightX, goalsContentY, halfWidth, rightColumnHeight, 1, 1, 'F');
    doc.setFontSize(6);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
    doc.text('No activities recorded', rightX + 2, goalsContentY + 6);
  }
  
  // Move currentY past the tallest column
  currentY = goalsContentY + Math.max(leftColumnHeight, rightColumnHeight) + 3;

  // === FLUID BALANCE SECTION (NEW) ===
  const hasFluidData = (fluidIntakeRecords && fluidIntakeRecords.length > 0) || 
                       (fluidOutputRecords && fluidOutputRecords.length > 0) || 
                       (urinaryOutputRecords && urinaryOutputRecords.length > 0);
  
  if (hasFluidData || fluidBalanceTarget) {
    currentY += 5;
    // Check for page break before Fluid Balance section (requires ~80mm)
    currentY = checkPageBreak(doc, currentY, 80, orgSettings, branchName, logoBase64, clientName, visitDate, reportId);
    currentY = addCompactSectionHeader(doc, 'FLUID BALANCE MONITORING', currentY, SECTION_BG.fluid);
    
    // Fluid Balance Summary Box - 4 columns
    const totalIntake = fluidIntakeRecords?.reduce((sum, r) => sum + (r.amount_ml || 0), 0) || 0;
    const totalOutput = (fluidOutputRecords?.reduce((sum, r) => sum + (r.amount_ml || 0), 0) || 0) +
                        (urinaryOutputRecords?.reduce((sum, r) => sum + (r.amount_ml || 0), 0) || 0);
    const balance = totalIntake - totalOutput;
    const dailyTarget = fluidBalanceTarget?.daily_intake_target_ml || 0;
    
    // Summary boxes
    const summaryBoxWidth = (pageWidth - (margin * 2) - 9) / 4;
    const summaryBoxHeight = 14;
    
    // Box 1: Total Intake
    doc.setFillColor(219, 234, 254);
    doc.roundedRect(margin, currentY, summaryBoxWidth, summaryBoxHeight, 1, 1, 'F');
    doc.setFontSize(6);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('Total Intake', margin + 3, currentY + 5);
    doc.setFontSize(9);
    doc.text(`${totalIntake} ml`, margin + 3, currentY + 11);
    
    // Box 2: Total Output
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(margin + summaryBoxWidth + 3, currentY, summaryBoxWidth, summaryBoxHeight, 1, 1, 'F');
    doc.setFontSize(6);
    doc.setTextColor(217, 119, 6);
    doc.text('Total Output', margin + summaryBoxWidth + 6, currentY + 5);
    doc.setFontSize(9);
    doc.text(`${totalOutput} ml`, margin + summaryBoxWidth + 6, currentY + 11);
    
    // Box 3: Balance
    const balanceColor = balance >= 0 ? { r: 34, g: 197, b: 94 } : { r: 239, g: 68, b: 68 };
    doc.setFillColor(balance >= 0 ? 220 : 254, balance >= 0 ? 252 : 226, balance >= 0 ? 231 : 226);
    doc.roundedRect(margin + (summaryBoxWidth + 3) * 2, currentY, summaryBoxWidth, summaryBoxHeight, 1, 1, 'F');
    doc.setFontSize(6);
    doc.setTextColor(balanceColor.r, balanceColor.g, balanceColor.b);
    doc.text('Balance', margin + (summaryBoxWidth + 3) * 2 + 3, currentY + 5);
    doc.setFontSize(9);
    doc.text(`${balance >= 0 ? '+' : ''}${balance} ml`, margin + (summaryBoxWidth + 3) * 2 + 3, currentY + 11);
    
    // Box 4: Daily Target
    doc.setFillColor(237, 233, 254);
    doc.roundedRect(margin + (summaryBoxWidth + 3) * 3, currentY, summaryBoxWidth, summaryBoxHeight, 1, 1, 'F');
    doc.setFontSize(6);
    doc.setTextColor(139, 92, 246);
    doc.text('Daily Target', margin + (summaryBoxWidth + 3) * 3 + 3, currentY + 5);
    doc.setFontSize(9);
    doc.text(dailyTarget ? `${dailyTarget} ml` : 'Not set', margin + (summaryBoxWidth + 3) * 3 + 3, currentY + 11);
    
    currentY += summaryBoxHeight + 5;
    
    // Fluid Intake Table
    if (fluidIntakeRecords && fluidIntakeRecords.length > 0) {
      const intakeData = fluidIntakeRecords.map(r => [
        r.time || '-',
        r.fluid_type || '-',
        `${r.amount_ml || 0} ml`,
        r.method || '-',
        (r.comments || '-').substring(0, 25)
      ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['Time', 'Fluid Type', 'Amount', 'Method', 'Comments']],
        body: intakeData,
        theme: 'grid',
        headStyles: { 
          fillColor: [59, 130, 246], 
          fontSize: 6, 
          fontStyle: 'bold', 
          textColor: [255, 255, 255],
          cellPadding: 1
        },
        styles: { fontSize: 5, cellPadding: 1 },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 25 },
          4: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin, bottom: FOOTER_HEIGHT + 5, top: 45 },
        alternateRowStyles: { fillColor: [219, 234, 254] },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            addFullPageHeader(doc, orgSettings, logoBase64, branchName, clientName, visitDate, reportId);
          }
        }
      });
      currentY = (doc as any).lastAutoTable.finalY + 3;
    }
    
    // Fluid Output Table
    if (fluidOutputRecords && fluidOutputRecords.length > 0) {
      const outputData = fluidOutputRecords.map(r => [
        r.time || '-',
        r.output_type || '-',
        r.amount_ml ? `${r.amount_ml} ml` : (r.amount_estimate || '-'),
        r.appearance || '-',
        (r.comments || '-').substring(0, 25)
      ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['Time', 'Output Type', 'Amount', 'Appearance', 'Comments']],
        body: outputData,
        theme: 'grid',
        headStyles: { 
          fillColor: [217, 119, 6], 
          fontSize: 6, 
          fontStyle: 'bold', 
          textColor: [255, 255, 255],
          cellPadding: 1
        },
        styles: { fontSize: 5, cellPadding: 1 },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 25 },
          4: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin, bottom: FOOTER_HEIGHT + 5, top: 45 },
        alternateRowStyles: { fillColor: [254, 243, 199] },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            addFullPageHeader(doc, orgSettings, logoBase64, branchName, clientName, visitDate, reportId);
          }
        }
      });
      currentY = (doc as any).lastAutoTable.finalY + 3;
    }
    
    // Urinary Output Table
    if (urinaryOutputRecords && urinaryOutputRecords.length > 0) {
      const urinaryData = urinaryOutputRecords.map(r => [
        r.time || '-',
        r.collection_method || '-',
        r.amount_ml ? `${r.amount_ml} ml` : (r.amount_estimate || '-'),
        r.colour || '-',
        r.odour || '-',
        (r.discomfort_observations || '-').substring(0, 20)
      ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['Time', 'Method', 'Amount', 'Colour', 'Odour', 'Observations']],
        body: urinaryData,
        theme: 'grid',
        headStyles: { 
          fillColor: [139, 92, 246], 
          fontSize: 6, 
          fontStyle: 'bold', 
          textColor: [255, 255, 255],
          cellPadding: 1
        },
        styles: { fontSize: 5, cellPadding: 1 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin, bottom: FOOTER_HEIGHT + 5, top: 45 },
        alternateRowStyles: { fillColor: [237, 233, 254] },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            addFullPageHeader(doc, orgSettings, logoBase64, branchName, clientName, visitDate, reportId);
          }
        }
      });
      currentY = (doc as any).lastAutoTable.finalY + 3;
    }
  }

  // === DIETARY REQUIREMENTS SECTION (NEW) ===
  if (dietaryRequirements) {
    const hasDietaryData = dietaryRequirements.food_allergies?.length || 
                           dietaryRequirements.dietary_restrictions?.length ||
                           dietaryRequirements.texture_modifications ||
                           dietaryRequirements.feeding_assistance_required ||
                           dietaryRequirements.hydration_needs;
    
    if (hasDietaryData) {
      currentY += 5;
      // Check for page break before Dietary section (requires ~40mm)
      currentY = checkPageBreak(doc, currentY, 40, orgSettings, branchName, logoBase64, clientName, visitDate, reportId);
      currentY = addCompactSectionHeader(doc, 'DIETARY REQUIREMENTS', currentY, SECTION_BG.dietary);
      
      const dietaryItems: { label: string; value: string; isAlert?: boolean }[] = [];
      
      // Food Allergies (highlighted as alerts)
      if (dietaryRequirements.food_allergies?.length) {
        dietaryItems.push({ 
          label: '⚠️ Food Allergies', 
          value: dietaryRequirements.food_allergies.join(', '),
          isAlert: true
        });
      }
      
      // Dietary Restrictions
      if (dietaryRequirements.dietary_restrictions?.length) {
        dietaryItems.push({ 
          label: 'Dietary Restrictions', 
          value: dietaryRequirements.dietary_restrictions.join(', ')
        });
      }
      
      // Texture Modifications
      if (dietaryRequirements.texture_modifications) {
        dietaryItems.push({ 
          label: 'Texture Modifications', 
          value: dietaryRequirements.texture_modifications
        });
      }
      
      // Fluid Restrictions
      if (dietaryRequirements.fluid_restrictions) {
        dietaryItems.push({ 
          label: 'Fluid Restrictions', 
          value: dietaryRequirements.fluid_restrictions
        });
      }
      
      // Feeding Assistance
      if (dietaryRequirements.feeding_assistance_required) {
        dietaryItems.push({ 
          label: 'Feeding Assistance', 
          value: dietaryRequirements.eating_assistance || 'Required'
        });
      }
      
      // Hydration Needs
      if (dietaryRequirements.hydration_needs) {
        dietaryItems.push({ 
          label: 'Hydration Needs', 
          value: dietaryRequirements.hydration_needs
        });
      }
      
      // Supplements
      if (dietaryRequirements.supplements?.length) {
        dietaryItems.push({ 
          label: 'Supplements', 
          value: dietaryRequirements.supplements.join(', ')
        });
      }
      
      // Render dietary info in a two-column box
      const boxHeight = Math.ceil(dietaryItems.length / 2) * 8 + 6;
      doc.setFillColor(SECTION_BG.dietary.r, SECTION_BG.dietary.g, SECTION_BG.dietary.b);
      doc.roundedRect(margin, currentY, pageWidth - (margin * 2), boxHeight, 1, 1, 'F');
      
      const col1X = margin + 3;
      const col2X = pageWidth / 2 + 3;
      
      dietaryItems.forEach((item, idx) => {
        const isLeftCol = idx % 2 === 0;
        const rowIdx = Math.floor(idx / 2);
        const x = isLeftCol ? col1X : col2X;
        const y = currentY + 6 + (rowIdx * 8);
        
        doc.setFontSize(6);
        doc.setFont(undefined, 'bold');
        
        if (item.isAlert) {
          doc.setTextColor(220, 38, 38);
        } else {
          doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
        }
        doc.text(`${item.label}:`, x, y);
        
        doc.setFont(undefined, 'normal');
        doc.setTextColor(PDF_COLORS.gray[600].r, PDF_COLORS.gray[600].g, PDF_COLORS.gray[600].b);
        const valueText = item.value.length > 35 ? item.value.substring(0, 35) + '...' : item.value;
        doc.text(valueText, x + 35, y);
      });
      
      currentY += boxHeight + 3;
    }
  }

  // === VISIT PHOTOS SECTION (NEW) ===
  const photoUrls = visitPhotos || visitRecord?.visit_photos || [];
  if (photoUrls && photoUrls.length > 0) {
    currentY += 5;
    // Check for page break before Photos section (requires ~50mm)
    currentY = checkPageBreak(doc, currentY, 50, orgSettings, branchName, logoBase64, clientName, visitDate, reportId);
    currentY = addCompactSectionHeader(doc, 'VISIT PHOTOS', currentY, SECTION_BG.photos);
    
    doc.setFillColor(SECTION_BG.photos.r, SECTION_BG.photos.g, SECTION_BG.photos.b);
    
    const photoWidth = 40;
    const photoHeight = 30;
    const photosPerRow = 4;
    const photoSpacing = (pageWidth - (margin * 2) - (photosPerRow * photoWidth)) / (photosPerRow - 1);
    
    // Simple placeholder boxes for photos (actual image loading would require async)
    const numRows = Math.ceil(photoUrls.length / photosPerRow);
    const photosBoxHeight = numRows * (photoHeight + 8) + 6;
    
    doc.roundedRect(margin, currentY, pageWidth - (margin * 2), photosBoxHeight, 1, 1, 'F');
    
    photoUrls.slice(0, 8).forEach((photoUrl: string, idx: number) => {
      const row = Math.floor(idx / photosPerRow);
      const col = idx % photosPerRow;
      const x = margin + 5 + col * (photoWidth + photoSpacing);
      const y = currentY + 4 + row * (photoHeight + 8);
      
      // Draw photo placeholder with border
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(200, 200, 200);
      doc.roundedRect(x, y, photoWidth, photoHeight, 1, 1, 'FD');
      
      // Try to add the actual image
      try {
        // Note: For base64 images stored in visit_photos
        if (typeof photoUrl === 'string' && photoUrl.startsWith('data:image')) {
          const format = photoUrl.includes('data:image/png') ? 'PNG' : 'JPEG';
          doc.addImage(photoUrl, format, x + 1, y + 1, photoWidth - 2, photoHeight - 2);
        } else {
          // For URL-based photos, show placeholder text
          doc.setFontSize(5);
          doc.setTextColor(150, 150, 150);
          doc.text('Photo', x + photoWidth / 2, y + photoHeight / 2, { align: 'center' });
        }
      } catch (e) {
        // If image fails, show placeholder
        doc.setFontSize(5);
        doc.setTextColor(150, 150, 150);
        doc.text('Photo', x + photoWidth / 2, y + photoHeight / 2, { align: 'center' });
      }
      
      // Photo number label
      doc.setFontSize(5);
      doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
      doc.text(`Photo ${idx + 1}`, x + photoWidth / 2, y + photoHeight + 4, { align: 'center' });
    });
    
    currentY += photosBoxHeight + 3;
  }

  // === EVENTS & INCIDENTS (Enhanced with Action Taken) ===
  currentY += 5;
  // Check for page break before Events section (requires ~40mm)
  currentY = checkPageBreak(doc, currentY, 40, orgSettings, branchName, logoBase64, clientName, visitDate, reportId);
  const hasEvents = (incidents?.length > 0) || (accidents?.length > 0);
  
  currentY = addCompactSectionHeader(doc, 'INCIDENTS / EVENTS', currentY, { r: 254, g: 226, b: 226 });
  
  if (hasEvents) {
    const allIncidents = [...(incidents || []), ...(accidents || [])];
    
    const incidentData = allIncidents.map(inc => [
      inc.event_time ? format(new Date(inc.event_time), 'dd/MM HH:mm') : '-',
      inc.event_type === 'accident' ? 'Accident' : 'Incident',
      (inc.event_description || inc.event_title || 'No description').substring(0, 40),
      inc.severity || 'Low',
      (inc.immediate_action_taken || 'None documented').substring(0, 30),
    ]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Date/Time', 'Type', 'Description', 'Severity', 'Action Taken']],
      body: incidentData,
      theme: 'grid',
      headStyles: { 
        fillColor: [239, 68, 68], 
        fontSize: 7, 
        fontStyle: 'bold', 
        textColor: [255, 255, 255],
        cellPadding: 1.5
      },
      styles: { fontSize: 6, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 18 },
        2: { cellWidth: 50 },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 'auto' }
      },
      margin: { left: margin, right: margin, bottom: FOOTER_HEIGHT + 5, top: 45 },
      alternateRowStyles: { fillColor: [254, 226, 226] },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          addFullPageHeader(doc, orgSettings, logoBase64, branchName, clientName, visitDate, reportId);
        }
      }
    });
    currentY = (doc as any).lastAutoTable.finalY + 3;
  } else {
    doc.setFontSize(7);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
    doc.text('No data available', margin + 2, currentY + 3);
    currentY += 8;
  }

  // === SERVICE NOTES & OBSERVATIONS (Combined Text Block) ===
  currentY += 5;
  // Check for page break before Notes section (requires ~50mm)
  currentY = checkPageBreak(doc, currentY, 50, orgSettings, branchName, logoBase64, clientName, visitDate, reportId);
  const hasNotes = report.carer_observations || report.client_mood || 
                   report.client_feedback || report.next_visit_preparations;
  
  currentY = addCompactSectionHeader(doc, 'SERVICE NOTES & OBSERVATIONS', currentY, SECTION_BG.notes);
  
  if (hasNotes || observations?.length > 0) {
    doc.setFillColor(SECTION_BG.notes.r, SECTION_BG.notes.g, SECTION_BG.notes.b);
    
    doc.setFontSize(7);
    doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
    
    const noteItems: string[] = [];
    if (report.client_mood) noteItems.push(`Client Mood: ${report.client_mood}`);
    if (report.carer_observations) noteItems.push(`Observations: ${report.carer_observations.substring(0, 80)}`);
    if (report.client_feedback) noteItems.push(`Feedback: ${report.client_feedback.substring(0, 60)}`);
    if (report.next_visit_preparations) noteItems.push(`Next Visit: ${report.next_visit_preparations.substring(0, 50)}`);
    
    observations?.slice(0, 2).forEach(obs => {
      noteItems.push(`Observation: ${(obs.event_description || '').substring(0, 60)}`);
    });
    
    if (noteItems.length > 0) {
      const boxHeight = noteItems.length * 5 + 4;
      doc.roundedRect(margin, currentY, pageWidth - (margin * 2), boxHeight, 1, 1, 'F');
      
      noteItems.forEach((note, i) => {
        doc.text(`• ${note}`, margin + 3, currentY + 4 + (i * 5));
      });
      currentY += boxHeight + 3;
    } else {
      doc.setFont(undefined, 'italic');
      doc.text('No data available', margin + 2, currentY + 3);
      currentY += 8;
    }
  } else {
    doc.setFontSize(7);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
    doc.text('No data available', margin + 2, currentY + 3);
    currentY += 8;
  }

  // === SIGNATURES (Side-by-Side) ===
  if (visitRecord?.staff_signature_data || visitRecord?.client_signature_data) {
    currentY += 5;
    // Check for page break before Signatures section (requires ~35mm)
    currentY = checkPageBreak(doc, currentY, 35, orgSettings, branchName, logoBase64, clientName, visitDate, reportId);
    currentY = addCompactSectionHeader(doc, 'SIGNATURES', currentY, SECTION_BG.signatures);
    
    const sigBoxWidth = (pageWidth - (margin * 2) - 5) / 2;
    const sigBoxHeight = 25;
    
    // Staff signature box (left)
    doc.setFillColor(SECTION_BG.signatures.r, SECTION_BG.signatures.g, SECTION_BG.signatures.b);
    doc.roundedRect(margin, currentY, sigBoxWidth, sigBoxHeight, 1, 1, 'F');
    
    doc.setFontSize(6);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
    doc.text('STAFF SIGNATURE', margin + 2, currentY + 4);
    
    if (visitRecord?.staff_signature_data) {
      try {
        doc.addImage(visitRecord.staff_signature_data, 'PNG', margin + 5, currentY + 6, 40, 12);
      } catch (e) { console.error('Error adding staff signature:', e); }
    }
    
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${carerName}`, margin + 2, currentY + 21);
    doc.text(`Date: ${visitDate}`, margin + 50, currentY + 21);
    
    // Client signature box (right)
    const rightBoxX = margin + sigBoxWidth + 5;
    doc.roundedRect(rightBoxX, currentY, sigBoxWidth, sigBoxHeight, 1, 1, 'F');
    
    doc.setFont(undefined, 'bold');
    doc.text('CLIENT / REP SIGNATURE', rightBoxX + 2, currentY + 4);
    
    if (visitRecord?.client_signature_data) {
      try {
        doc.addImage(visitRecord.client_signature_data, 'PNG', rightBoxX + 5, currentY + 6, 40, 12);
      } catch (e) { console.error('Error adding client signature:', e); }
    }
    
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${clientName}`, rightBoxX + 2, currentY + 21);
    doc.text(`Date: ${visitDate}`, rightBoxX + 50, currentY + 21);
    
    currentY += sigBoxHeight + 3;
  }

  // === ADMIN REVIEW (Compact - only if exists) ===
  if (report.reviewed_at && report.review_notes) {
    // Check for page break before Admin Review section (requires ~20mm)
    currentY = checkPageBreak(doc, currentY, 20, orgSettings, branchName, logoBase64, clientName, visitDate, reportId);
    currentY = addCompactSectionHeader(doc, 'ADMIN REVIEW', currentY, SECTION_BG.light);
    
    doc.setFillColor(SECTION_BG.light.r, SECTION_BG.light.g, SECTION_BG.light.b);
    doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 12, 1, 1, 'F');
    
    doc.setFontSize(6);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
    doc.text('Status:', margin + 2, currentY + 4);
    
    const statusColor = report.status === 'approved' ? PDF_COLORS.success : 
                       report.status === 'rejected' ? PDF_COLORS.danger : PDF_COLORS.warning;
    doc.setTextColor(statusColor.r, statusColor.g, statusColor.b);
    doc.text((report.status || 'pending').toUpperCase(), margin + 15, currentY + 4);
    
    doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
    doc.setFont(undefined, 'normal');
    const reviewNote = (report.review_notes || '').substring(0, 100);
    doc.text(`Notes: ${reviewNote}`, margin + 2, currentY + 9);
    
    currentY += 15;
  }

  // === ADD FOOTER ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addProfessionalFooter(doc, orgSettings, i, totalPages);
  }

  // === SAVE PDF ===
  doc.save(`Service_Report_${clientName.replace(/\s+/g, '_')}_${visitDate.replace(/\//g, '-')}.pdf`);
};

/**
 * Fetches all visit-related data and generates a PDF
 * This is a standalone function that can be called from anywhere
 */
export const generatePDFForServiceReport = async (
  reportInput: any,
  branchId?: string
) => {
  try {
    // CRITICAL FIX: Always fetch fresh report data from database to ensure latest edits are included
    let report = reportInput;
    
    if (reportInput?.id) {
    console.log('[PDF] Fetching fresh report data for ID:', reportInput.id);
    const { data: freshReport, error } = await supabase
      .from('client_service_reports')
      .select(`
        *,
        clients:client_id (first_name, last_name, email),
        staff:staff_id (first_name, last_name, email)
      `)
      .eq('id', reportInput.id)
      .maybeSingle();
    
    if (!error && freshReport) {
      console.log('[PDF] Using fresh report data from database');
      report = freshReport;
    } else if (error) {
      console.warn('[PDF] Could not fetch fresh data, using provided report:', error.message);
    }
  }

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

  // Fetch care plan goals for the client
  let carePlanGoals: any[] = [];
  if (safeReport.client_id) {
    const { data: carePlanData } = await supabase
      .from('client_care_plans')
      .select('id')
      .eq('client_id', safeReport.client_id)
      .eq('status', 'Active')
      .maybeSingle();

    if (carePlanData?.id) {
      const { data: goals } = await supabase
        .from('client_care_plan_goals')
        .select('description, status, progress, notes')
        .eq('care_plan_id', carePlanData.id);
      carePlanGoals = goals || [];
    }
  }

  // NOTE: Activities are now included in visit_tasks with task_category='Activity'
  // We no longer fetch client_activities separately to avoid duplication
  // The tasks table already contains activities when a service report is created

  // Fetch dietary requirements
  let dietaryRequirements: any = null;
  if (safeReport.client_id) {
    const { data: dietaryData } = await supabase
      .from('client_dietary_requirements')
      .select('*')
      .eq('client_id', safeReport.client_id)
      .maybeSingle();
    dietaryRequirements = dietaryData;
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
      carePlanGoals: carePlanGoals,
      activities: [], // Activities are now in tasks with category='Activity'
      branchId: branchId || safeReport.branch_id,
      fluidIntakeRecords: [],
      fluidOutputRecords: [],
      urinaryOutputRecords: [],
      fluidBalanceTarget: null,
      dietaryRequirements: dietaryRequirements,
      visitPhotos: [],
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
      carePlanGoals: carePlanGoals,
      activities: [], // Activities are now in tasks with category='Activity'
      branchId: branchId || safeReport.branch_id,
      fluidIntakeRecords: [],
      fluidOutputRecords: [],
      urinaryOutputRecords: [],
      fluidBalanceTarget: null,
      dietaryRequirements: dietaryRequirements,
      visitPhotos: [],
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

  // Fetch fluid intake records for the service date
  const { data: fluidIntakeRecords } = await supabase
    .from('fluid_intake_records')
    .select('time, fluid_type, amount_ml, method, comments')
    .eq('client_id', safeReport.client_id)
    .eq('record_date', safeReport.service_date)
    .order('time', { ascending: true });

  // Fetch fluid output records for the service date
  const { data: fluidOutputRecords } = await supabase
    .from('fluid_output_records')
    .select('time, output_type, amount_ml, amount_estimate, appearance, comments')
    .eq('client_id', safeReport.client_id)
    .eq('record_date', safeReport.service_date)
    .order('time', { ascending: true });

  // Fetch urinary output records for the service date
  const { data: urinaryOutputRecords } = await supabase
    .from('urinary_output_records')
    .select('time, collection_method, amount_ml, amount_estimate, colour, odour, discomfort_observations')
    .eq('client_id', safeReport.client_id)
    .eq('record_date', safeReport.service_date)
    .order('time', { ascending: true });

  // Fetch fluid balance target
  const { data: fluidBalanceTarget } = await supabase
    .from('fluid_balance_targets')
    .select('daily_intake_target_ml, daily_output_target_ml, alert_threshold_percentage, notes')
    .eq('client_id', safeReport.client_id)
    .maybeSingle();

  // Parse visit photos (handle JSON array)
  let visitPhotosArray: string[] = [];
  if (visitRecord?.visit_photos) {
    if (Array.isArray(visitRecord.visit_photos)) {
      visitPhotosArray = visitRecord.visit_photos as string[];
    } else if (typeof visitRecord.visit_photos === 'string') {
      try {
        visitPhotosArray = JSON.parse(visitRecord.visit_photos);
      } catch {
        visitPhotosArray = [];
      }
    }
  }

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
    carePlanGoals: carePlanGoals,
    activities: [], // Activities are now in tasks with category='Activity'
    branchId: branchId || safeReport.branch_id,
    fluidIntakeRecords: (fluidIntakeRecords as any[]) || [],
    fluidOutputRecords: (fluidOutputRecords as any[]) || [],
    urinaryOutputRecords: (urinaryOutputRecords as any[]) || [],
    fluidBalanceTarget: fluidBalanceTarget || undefined,
    dietaryRequirements: dietaryRequirements || undefined,
    visitPhotos: visitPhotosArray,
  });
  } catch (error) {
    console.error('[PDF Generation Error]:', error);
    throw new Error('Unable to generate PDF. Please try again later.');
  }
};
